"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import type { ReceiptCaptureResult } from "@/lib/types";
import { cn } from "@/lib/utils";

import { CameraCapture } from "./CameraCapture";

type ReceiptUploadError = {
  error?: string;
};

type ReceiptUploaderProps = {
  onComplete?: (result: ReceiptCaptureResult) => void;
};

export function ReceiptUploader({ onComplete }: ReceiptUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [captureId, setCaptureId] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [cameraOpen, setCameraOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const statusLabel = useMemo(() => {
    if (isUploading) {
      return "Uploading receipt photo...";
    }

    if (errorMessage) {
      return errorMessage;
    }

    if (captureId) {
      return "Receipt captured and ready for extraction.";
    }

    return "Snap a receipt in the van or drop a photo here.";
  }, [captureId, errorMessage, isUploading]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  async function handleFile(file: File | null) {
    if (!file) {
      return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setErrorMessage("Use a JPG or PNG receipt photo.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("That photo is too large. Keep receipt images under 10MB.");
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);
    setCaptureId(null);
    setUploadedImageUrl(null);

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const localPreview = URL.createObjectURL(file);
    previewUrlRef.current = localPreview;
    setPreviewUrl(localPreview);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/capture/receipt", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as
        | ReceiptCaptureResult
        | ReceiptUploadError;

      if (!response.ok) {
        const errorPayload = payload as ReceiptUploadError;
        throw new Error(errorPayload.error ?? "Receipt upload failed.");
      }

      const result = payload as ReceiptCaptureResult;

      setCaptureId(result.capture_id);
      setUploadedImageUrl(result.image_url);
      onComplete?.(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "We couldn't upload that receipt image.",
      );
      setRetryCount((count) => count + 1);
    } finally {
      setIsUploading(false);
    }
  }

  function clearReceiptState() {
    setErrorMessage(null);
    setCaptureId(null);
    setUploadedImageUrl(null);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    void handleFile(event.target.files?.[0] ?? null);
    event.target.value = "";
  }

  return (
    <section className="capture-card rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="capture-panel-body space-y-5">
        <div className="space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Receipt Scanner
          </p>
          <h2 className="text-2xl font-semibold text-slate-950">
            Snap the receipt before it disappears
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

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          style={{ display: "none" }}
          disabled={isUploading}
          onChange={handleInputChange}
        />
        <CameraCapture
          open={cameraOpen}
          disabled={isUploading}
          onCapture={(file) => void handleFile(file)}
          onClose={() => setCameraOpen(false)}
        />

        <div
          className={cn(
            "capture-dropzone rounded-[1.75rem] border-2 border-dashed p-5 transition-colors",
            dragActive ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-slate-50",
          )}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            void handleFile(event.dataTransfer.files?.[0] ?? null);
          }}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Receipt preview"
              className="capture-preview h-56 w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="capture-placeholder flex h-56 items-center justify-center rounded-2xl bg-white text-center">
              <p className="max-w-xs text-sm leading-6 text-slate-500">
                Drag a receipt image here, choose from files, or open the camera.
              </p>
            </div>
          )}
        </div>

        <div className="capture-action-grid grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="min-h-14 rounded-2xl bg-slate-950 px-6 py-4 text-base font-semibold text-white"
          >
            {isUploading ? "Uploading..." : "Choose Photo"}
          </Button>
          <Button
            type="button"
            disabled={isUploading}
            onClick={() => setCameraOpen(true)}
            className="capture-secondary-button min-h-14 rounded-2xl bg-emerald-600 px-6 py-4 text-base font-semibold text-white"
          >
            Open Camera
          </Button>
        </div>

        {(previewUrl || errorMessage) && !isUploading ? (
          <div className="flex justify-center gap-3">
            {errorMessage ? (
              <Button
                type="button"
                onClick={() => setCameraOpen(true)}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
              >
                Try Camera Again
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={clearReceiptState}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Clear
            </Button>
          </div>
        ) : null}

        {(captureId || uploadedImageUrl) && !errorMessage ? (
          <div className="capture-metrics rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            {captureId ? (
              <div className="capture-row flex items-center justify-between gap-4">
                <span>Capture ID</span>
                <span className="truncate text-right">{captureId}</span>
              </div>
            ) : null}
            {uploadedImageUrl ? (
              <div className="capture-row mt-2 flex items-center justify-between gap-4">
                <span>Image URL</span>
                <span className="truncate text-right">{uploadedImageUrl}</span>
              </div>
            ) : null}
            {retryCount > 0 ? (
              <div className="capture-row mt-2 flex items-center justify-between gap-4">
                <span>Retries</span>
                <span>{retryCount}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        <p className="capture-help text-center text-xs leading-5 text-slate-500">
          Best on mobile: keep the receipt flat, fill the frame, and avoid harsh glare.
        </p>
      </div>
    </section>
  );
}
