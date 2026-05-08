"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { VoiceCaptureResult } from "@/lib/types";
import { cn } from "@/lib/utils";

import { Waveform } from "./Waveform";

type TranscriptionError = {
  error?: string;
};

type VoiceRecorderProps = {
  onComplete?: (result: VoiceCaptureResult) => void;
};

type RecorderState = "idle" | "recording" | "uploading" | "error";

function describeMicrophoneError(error: unknown) {
  if (!(error instanceof Error)) {
    return "Microphone access was denied.";
  }

  if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
    return "Microphone permission is blocked. Allow mic access in the browser and try again.";
  }

  if (error.name === "NotFoundError") {
    return "No microphone was found on this device.";
  }

  if (error.name === "NotReadableError") {
    return "The microphone is already in use by another app or tab.";
  }

  return error.message || "Microphone access was denied.";
}

function preferredMimeType() {
  if (typeof MediaRecorder === "undefined") {
    return "audio/webm";
  }

  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  const supported = candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));

  return supported ?? "audio/webm";
}

function formatDuration(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function VoiceRecorder({ onComplete }: VoiceRecorderProps) {
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [captureId, setCaptureId] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const isRecording = recorderState === "recording";
  const isUploading = recorderState === "uploading";

  const statusLabel = useMemo(() => {
    if (isRecording) {
      return "Listening for job notes...";
    }

    if (isUploading) {
      return "Transcribing your voice note...";
    }

    if (errorMessage) {
      return errorMessage;
    }

    if (transcript) {
      return "Transcript ready for handoff.";
    }

    return "Tap once, speak naturally, then tap again to finish.";
  }, [errorMessage, isRecording, isUploading, transcript]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function resetRecorder() {
    setRecorderState("idle");
    setErrorMessage(null);
    setTranscript("");
    setCaptureId(null);
    setConfidence(null);
    setDurationMs(0);
  }

  async function startRecording() {
    resetRecorder();

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setRecorderState("error");
      setErrorMessage("This device does not support in-browser audio recording.");
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      setRecorderState("error");
      setErrorMessage("MediaRecorder is not available in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = preferredMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });

      streamRef.current = stream;
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.start();
      recordingStartedAtRef.current = Date.now();
      setRecorderState("recording");

      timerRef.current = window.setInterval(() => {
        if (recordingStartedAtRef.current) {
          setDurationMs(Date.now() - recordingStartedAtRef.current);
        }
      }, 250);
    } catch (error) {
      setRecorderState("error");
      setErrorMessage(describeMicrophoneError(error));
    }
  }

  async function stopRecording() {
    const recorder = mediaRecorderRef.current;

    if (!recorder) {
      return;
    }

    setRecorderState("uploading");

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        resolve(new Blob(chunksRef.current, { type: "audio/webm" }));
      };

      recorder.stop();
    });

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;

    if (blob.size === 0) {
      setRecorderState("error");
      setErrorMessage("That recording came through empty. Please try one more time.");
      return;
    }

    const audioFile = new File([blob], `voice-note-${Date.now()}.webm`, {
      type: blob.type || "audio/webm",
    });

    const formData = new FormData();
    formData.append("audio", audioFile);

    try {
      const response = await fetch("/api/capture/transcribe", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as
        | VoiceCaptureResult
        | TranscriptionError;

      if (!response.ok) {
        const errorPayload = payload as TranscriptionError;
        throw new Error(errorPayload.error ?? "Transcription failed.");
      }

      const result = payload as VoiceCaptureResult;

      setTranscript(result.text);
      setCaptureId(result.capture_id);
      setConfidence(result.confidence);
      setDurationMs(result.duration_ms);
      setRecorderState("idle");
      onComplete?.(result);
    } catch (error) {
      setRecorderState("error");
      setErrorMessage(
        error instanceof Error ? error.message : "We couldn't transcribe that recording.",
      );
      setRetryCount((count) => count + 1);
    }
  }

  async function handlePrimaryAction() {
    if (isUploading) {
      return;
    }

    if (isRecording) {
      await stopRecording();
      return;
    }

    await startRecording();
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-5">
        <div className="space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Voice to Invoice
          </p>
          <h2 className="text-2xl font-semibold text-slate-950">
            Speak the job note out loud
          </h2>
          <p
            className={cn(
              "mx-auto max-w-sm text-sm leading-6",
              errorMessage ? "text-rose-600" : "text-slate-600",
            )}
          >
            {statusLabel}
          </p>
        </div>

        <Waveform active={isRecording} uploading={isUploading} />

        <div className="flex justify-center">
          <Button
            type="button"
            onClick={handlePrimaryAction}
            disabled={isUploading}
            className={cn(
              "min-h-36 min-w-36 rounded-full px-8 py-8 text-lg font-semibold text-white shadow-lg transition-transform duration-200",
              isRecording
                ? "bg-rose-500 hover:scale-[1.01]"
                : "bg-slate-950 hover:scale-[1.01]",
              isUploading && "cursor-not-allowed bg-slate-400 hover:scale-100",
            )}
          >
            {isRecording ? "Stop" : isUploading ? "Uploading..." : "Record"}
          </Button>
        </div>

        {(errorMessage || transcript) && !isRecording ? (
          <div className="flex justify-center gap-3">
            {errorMessage ? (
              <Button
                type="button"
                onClick={() => void startRecording()}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              >
                Try Again
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={resetRecorder}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Clear
            </Button>
          </div>
        ) : null}

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Duration</span>
            <span>{formatDuration(durationMs)}</span>
          </div>

          {confidence !== null ? (
            <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
              <span>Confidence</span>
              <span>{Math.round(confidence * 100)}%</span>
            </div>
          ) : null}

          {captureId ? (
            <div className="mt-2 flex items-center justify-between gap-4 text-sm text-slate-600">
              <span>Capture ID</span>
              <span className="truncate text-right">{captureId}</span>
            </div>
          ) : null}

          {retryCount > 0 ? (
            <div className="mt-2 flex items-center justify-between gap-4 text-sm text-slate-600">
              <span>Retries</span>
              <span>{retryCount}</span>
            </div>
          ) : null}
        </div>

        {transcript ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Transcript
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{transcript}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
