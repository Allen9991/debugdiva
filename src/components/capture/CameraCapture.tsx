"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CameraCaptureProps = {
  open: boolean;
  disabled?: boolean;
  onCapture: (file: File) => void;
  onClose: () => void;
};

function describeCameraError(error: unknown) {
  if (!(error instanceof Error)) {
    return "Camera access was blocked.";
  }

  if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
    return "Camera permission is blocked. Allow camera access in the browser and try again.";
  }

  if (error.name === "NotFoundError") {
    return "No camera was found on this device.";
  }

  if (error.name === "NotReadableError") {
    return "The camera is already in use by another app or tab.";
  }

  if (error.name === "OverconstrainedError") {
    return "The rear camera was not available, so try again with the default camera.";
  }

  return error.message || "Camera access was blocked.";
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function CameraCapture({
  open,
  disabled,
  onCapture,
  onClose,
}: CameraCaptureProps) {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) {
      stopStream(streamRef.current);
      streamRef.current = null;
      setCameraError(null);
      setIsStarting(false);
      setIsCapturing(false);
      return;
    }

    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("This browser does not support live camera capture.");
        return;
      }

      setIsStarting(true);
      setCameraError(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        });

        if (cancelled) {
          stopStream(stream);
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error) {
        if (!cancelled) {
          setCameraError(describeCameraError(error));
        }
      } finally {
        if (!cancelled) {
          setIsStarting(false);
        }
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, [open]);

  async function captureFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("Camera preview is not ready yet. Try again in a second.");
      return;
    }

    setIsCapturing(true);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setCameraError("Could not capture a frame from the camera.");
      setIsCapturing(false);
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/png", 0.92);
    });

    if (!blob) {
      setCameraError("Could not turn the camera frame into an image.");
      setIsCapturing(false);
      return;
    }

    onCapture(
      new File([blob], `receipt-camera-${Date.now()}.png`, {
        type: "image/png",
      }),
    );
    setIsCapturing(false);
    onClose();
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 px-4 py-6">
      <div className="mx-auto flex h-full max-w-xl flex-col gap-4">
        <div className="flex items-center justify-between gap-3 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Camera
            </p>
            <h2 className="mt-1 text-xl font-semibold">Capture receipt</h2>
          </div>
          <Button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
          >
            Close
          </Button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={cn(
              "h-full w-full object-cover",
              (isStarting || cameraError) && "opacity-30",
            )}
          />
          <canvas ref={canvasRef} className="hidden" />

          {isStarting ? (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm font-semibold text-white">
              Starting camera...
            </div>
          ) : null}

          {cameraError ? (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm font-semibold leading-6 text-white">
              {cameraError}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            onClick={onClose}
            className="min-h-14 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-base font-semibold text-white"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={disabled || isStarting || isCapturing || !!cameraError}
            onClick={() => void captureFrame()}
            className="min-h-14 rounded-2xl bg-emerald-500 px-5 py-4 text-base font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-500 disabled:text-slate-200"
          >
            {isCapturing ? "Capturing..." : "Take Photo"}
          </Button>
        </div>
      </div>
    </div>
  );
}
