import { useState, useCallback, useEffect } from 'react';
import { executeCode } from '../services/api';
import { LANGUAGES } from '../utils/languageConfig';
import { EXEC_STATUS, OUTPUT_TABS } from '../config/constants';
import toast from 'react-hot-toast';

/**
 * useExecution
 * Encapsulates all logic for running code against the Judge0 API.
 * Intercepts triggers to launch democratic votes if inside active collaborative rooms.
 *
 * @param {string} language - the current language key (e.g. 'python')
 * @param {string} code     - the current editor code
 * @param {string} stdin    - user-supplied stdin string
 * @param {boolean} isMobile
 * @param {Function} setMobileTab - to switch mobile tab to output on run
 * @param {Object} audioFeedback - prepares and plays execution outcome sounds
 * @param {Object} user - current Firebase user state
 * @param {Object} room - active collaboration room state
 */
export function useExecution({
  language,
  code,
  stdin,
  isMobile,
  setMobileTab,
  audioFeedback,
  user,
  room,
}) {
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');
  const [execStatus, setExecStatus] = useState(EXEC_STATUS.IDLE);
  const [execTime, setExecTime] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeOutputTab, setActiveOutputTab] = useState(OUTPUT_TABS.STDOUT);
  const [lastProcessedExecutionId, setLastProcessedExecutionId] = useState(null);
  const [lastProcessedVoteId, setLastProcessedVoteId] = useState(null);

  // Helper UUID generator fallback
  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  // Helper to compile code directly (bypassing vote check when vote is already approved)
  const executeVotedCode = useCallback(
    async (voteId) => {
      // Fetch full code execution payload from the separate Firestore document to avoid size limit
      const payload = await room.fetchFullVotePayload(voteId);
      if (!payload) {
        toast.error("Failed to retrieve code payload for this vote.");
        await room.clearVote();
        return;
      }

      const { code: voteCode, language: voteLanguage, stdin: voteStdin } = payload;

      audioFeedback?.prepare?.();
      setIsRunning(true);
      setActiveOutputTab(OUTPUT_TABS.STDOUT);
      if (isMobile) setMobileTab?.('output');
      setExecStatus(EXEC_STATUS.RUNNING);
      setStdout('');
      setStderr('');
      setExecTime(null);

      const startTime = performance.now();
      try {
        const langConfig = LANGUAGES[voteLanguage];
        const result = await executeCode(voteCode, langConfig.id, voteStdin);
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);

        const isSuccess = result.status?.id === 3;
        const executionResult = {
          executionId: generateUUID(),
          stdout: result.stdout || '(No output)',
          stderr: result.stderr || '',
          execTime: elapsed + 's',
          execStatus: isSuccess ? EXEC_STATUS.SUCCESS : EXEC_STATUS.ERROR,
        };

        // Broadcast compilation results to room (capped inside syncExecutionResult)
        await room.syncExecutionResult(executionResult);
      } catch (err) {
        const executionResult = {
          executionId: generateUUID(),
          stdout: '',
          stderr: err.message || 'Execution failed',
          execTime: null,
          execStatus: EXEC_STATUS.FAILED,
        };
        await room.syncExecutionResult(executionResult);
      } finally {
        setIsRunning(false);
        // Clean active vote state
        await room.clearVote();
      }
    },
    [audioFeedback, isMobile, setMobileTab, room]
  );

  const run = useCallback(async () => {
    if (isRunning) return;

    // Check if we are inside collaborative room with active users
    if (room?.roomId && room.activeUsers?.length > 1) {
      if (room.roomData?.activeVote) {
        toast.error('A code execution vote is already in progress!');
        return;
      }
      // Start real-time democratic vote
      await room.startExecutionVote(code, language, stdin);
      return;
    }

    audioFeedback?.prepare?.();
    setIsRunning(true);
    setActiveOutputTab(OUTPUT_TABS.STDOUT);
    if (isMobile) setMobileTab?.('output');
    setExecStatus(EXEC_STATUS.RUNNING);
    setStdout('');
    setStderr('');
    setExecTime(null);

    const startTime = performance.now();
    try {
      const langConfig = LANGUAGES[language];
      const result = await executeCode(code, langConfig.id, stdin);
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
      setExecTime(elapsed + 's');
      setStdout(result.stdout || '(No output)');
      setStderr(result.stderr || '');

      if (result.status?.id === 3) {
        setExecStatus(EXEC_STATUS.SUCCESS);
        audioFeedback?.playOutcome?.('success');
      } else {
        setExecStatus({ type: 'error', text: result.status?.description || 'Error' });
        audioFeedback?.playOutcome?.('error');
        if (result.stderr) setActiveOutputTab(OUTPUT_TABS.STDERR);
      }
    } catch (err) {
      setStderr(err.message || 'Execution failed');
      setExecStatus(EXEC_STATUS.FAILED);
      audioFeedback?.playOutcome?.('error');
      setActiveOutputTab(OUTPUT_TABS.STDERR);
    } finally {
      setIsRunning(false);
    }
  }, [audioFeedback, code, language, isRunning, stdin, isMobile, setMobileTab, room]);

  const clear = useCallback(() => {
    setStdout('');
    setStderr('');
    setExecStatus(EXEC_STATUS.IDLE);
    setExecTime(null);
    setActiveOutputTab(OUTPUT_TABS.STDOUT);
  }, []);

  // Effect: Watch for vote approval and trigger compile if current user is the initiator (atomic transition check)
  useEffect(() => {
    if (!room?.roomId || !room.roomData?.activeVote || !user) return;
    const vote = room.roomData.activeVote;
    if (
      vote.status === 'approved' &&
      vote.initiatorUid === user.uid &&
      vote.voteId !== lastProcessedVoteId
    ) {
      setLastProcessedVoteId(vote.voteId);
      // Double locks execution atomically using a transaction to avoid duplicate executing threads
      room.transitionVoteToExecuting(vote.voteId).then((transitioned) => {
        if (transitioned) {
          executeVotedCode(vote.voteId);
        }
      });
    }
  }, [room?.roomId, room?.roomData?.activeVote, user, executeVotedCode, lastProcessedVoteId, room]);

  // Effect: Watch for vote rejections
  useEffect(() => {
    if (!room?.roomId || !room.roomData?.activeVote || !user) return;
    const vote = room.roomData.activeVote;
    if (vote.status === 'rejected') {
      toast.error(`Execution vote rejected by the team.`);
      if (vote.initiatorUid === user.uid) {
        room.clearVote();
      }
    }
  }, [room?.roomId, room?.roomData?.activeVote, user, room]);

  // Effect: Sync remote compilation outcomes in real-time
  useEffect(() => {
    if (!room?.roomId || !room.roomData?.executionResult) return;
    const result = room.roomData.executionResult;

    if (result.executionId && result.executionId !== lastProcessedExecutionId) {
      setStdout(result.stdout);
      setStderr(result.stderr);
      setExecTime(result.execTime);
      setExecStatus(result.execStatus);
      setLastProcessedExecutionId(result.executionId);

      const isSuccess = result.execStatus?.type === 'success';

      if (isSuccess) {
        audioFeedback?.playOutcome?.('success');
      } else {
        audioFeedback?.playOutcome?.('error');
        if (result.stderr) setActiveOutputTab(OUTPUT_TABS.STDERR);
      }

      if (isMobile) setMobileTab?.('output');
    }
  }, [
    room?.roomId,
    room?.roomData?.executionResult,
    lastProcessedExecutionId,
    audioFeedback,
    isMobile,
    setMobileTab,
  ]);

  return {
    stdout,
    stderr,
    execStatus,
    execTime,
    isRunning,
    activeOutputTab,
    setActiveOutputTab,
    run,
    clear,
  };
}

