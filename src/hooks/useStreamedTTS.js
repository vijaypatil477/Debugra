import { useState, useCallback, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

const TTS_API_URL = 'https://api.groq.com/openai/v1/audio/speech';

/**
 * useStreamedTTS
 * Manages streamed text-to-speech playback for AI responses.
 * Streams audio as text is being generated, creating a podcast-like experience.
 *
 * @param {string} apiKey - Groq API key for TTS
 * @returns {Object} TTS control methods and state
 */
export function useStreamedTTS(apiKey) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const audioContextRef = useRef(null);
  const audioBufferRef = useRef([]);
  const sourceNodeRef = useRef(null);
  const isStreamingRef = useRef(false);
  const abortControllerRef = useRef(null);

  // Initialize Web Audio API
  const initAudioContext = useCallback(() => {
    if (audioContextRef.current) return audioContextRef.current;
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      return audioContext;
    } catch (err) {
      setError('Web Audio API not supported');
      return null;
    }
  }, []);

  // Stream text-to-speech from Groq
  const streamTTS = useCallback(
    async (text, onChunk) => {
      if (!apiKey) {
        setError('API key not configured');
        return;
      }

      if (!text || text.trim().length === 0) {
        setError('No text to speak');
        return;
      }

      setError(null);
      setIsPlaying(true);
      setIsSpeaking(true);
      isStreamingRef.current = true;
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(TTS_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'tts-1',
            input: text,
            voice: 'alloy',
            response_format: 'mp3',
            speed: 1.0,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`TTS API error: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const audioContext = initAudioContext();
        if (!audioContext) return;

        let totalBytes = 0;
        const chunks = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          chunks.push(value);
          totalBytes += value.length;
          audioBufferRef.current.push(value);

          // Calculate progress
          const contentLength = response.headers.get('content-length');
          if (contentLength) {
            setProgress(Math.round((totalBytes / parseInt(contentLength)) * 100));
          }

          // Callback for UI updates
          if (onChunk) {
            onChunk(totalBytes);
          }
        }

        // Combine all chunks
        const audioData = new Uint8Array(totalBytes);
        let offset = 0;
        for (const chunk of chunks) {
          audioData.set(chunk, offset);
          offset += chunk.length;
        }

        // Decode and play audio
        await playAudioBuffer(audioData, audioContext);
        setProgress(100);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
          toast.error(`TTS Error: ${err.message}`);
        }
      } finally {
        isStreamingRef.current = false;
        setIsPlaying(false);
        setIsSpeaking(false);
      }
    },
    [apiKey, initAudioContext]
  );

  // Play decoded audio buffer
  const playAudioBuffer = useCallback(async (audioData, audioContext) => {
    try {
      const arrayBuffer = audioData.buffer.slice(
        audioData.byteOffset,
        audioData.byteOffset + audioData.byteLength
      );

      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      sourceNodeRef.current = source;

      source.onended = () => {
        setIsPlaying(false);
        setIsSpeaking(false);
      };

      source.start(0);
    } catch (err) {
      setError(`Failed to decode audio: ${err.message}`);
    }
  }, []);

  // Pause playback
  const pause = useCallback(() => {
    if (sourceNodeRef.current && isPlaying) {
      const audioContext = audioContextRef.current;
      if (audioContext) {
        audioContext.suspend();
        setIsPaused(true);
      }
    }
  }, [isPlaying]);

  // Resume playback
  const resume = useCallback(() => {
    if (sourceNodeRef.current && isPaused) {
      const audioContext = audioContextRef.current;
      if (audioContext) {
        audioContext.resume();
        setIsPaused(false);
      }
    }
  }, [isPaused]);

  // Stop playback
  const stop = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (err) {
        // Already stopped
      }
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setIsSpeaking(false);
    setProgress(0);
    audioBufferRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stop]);

  return {
    isPlaying,
    isPaused,
    isSpeaking,
    progress,
    error,
    streamTTS,
    pause,
    resume,
    stop,
    setCurrentText,
    currentText,
  };
}
