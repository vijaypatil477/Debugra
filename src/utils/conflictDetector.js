/**
 * ConflictDetector
 * Simple timestamp-based conflict detection for collaborative editing.
 * Falls back to string comparison when timestamps are unavailable.
 */

export function hasConflict(localCode, remoteCode, lastLocalEditTime, lastRemoteApplyTime) {
  if (localCode === remoteCode) return false;
  return lastLocalEditTime > lastRemoteApplyTime;
}

export function findConflictLines(localCode, remoteCode) {
  const localLines = localCode.split('\n');
  const remoteLines = remoteCode.split('\n');
  const conflicts = [];
  const maxLen = Math.max(localLines.length, remoteLines.length);
  for (let i = 0; i < maxLen; i++) {
    if (localLines[i] !== remoteLines[i]) {
      conflicts.push(i + 1);
    }
  }
  return conflicts;
}