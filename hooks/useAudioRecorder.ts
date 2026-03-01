/**
 * Reusable audio recording hook — MediaRecorder → Blob.
 * Use with assessPronunciation for voice assessment.
 *
 * Usage:
 *   const { recording, startRecording, stopRecording, error } = useAudioRecorder();
 *   const blob = await stopRecording();
 *   if (blob) await assessPronunciation(blob, targetIast);
 */

import { useState, useRef, useCallback } from "react";

export interface UseAudioRecorderResult {
  recording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  error: string | null;
  clearError: () => void;
}

export function useAudioRecorder(): UseAudioRecorderResult {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const resolveRef = useRef<((blob: Blob | null) => void) | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.start(100);
      setRecording(true);
    } catch (e) {
      console.error("Microphone error:", e);
      setError("Microphone access denied or unavailable. Allow microphone permission and try again.");
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mr = mediaRecorderRef.current;
      if (!mr || mr.state !== "recording") {
        resolve(null);
        return;
      }
      resolveRef.current = resolve;
      mr.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
        setRecording(false);
        const blob = chunksRef.current.length
          ? new Blob(chunksRef.current, { type: mr.mimeType })
          : null;
        chunksRef.current = [];
        resolveRef.current?.(blob);
        resolveRef.current = null;
      };
      mr.stop();
    });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    recording,
    startRecording,
    stopRecording,
    error,
    clearError,
  };
}
