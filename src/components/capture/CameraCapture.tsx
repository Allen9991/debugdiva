"use client";

import { forwardRef, type ChangeEvent } from "react";

type CameraCaptureProps = {
  accept?: string;
  disabled?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export const CameraCapture = forwardRef<HTMLInputElement, CameraCaptureProps>(
  function CameraCapture({ accept = "image/jpeg,image/png", disabled, onChange }, ref) {
    return (
      <input
        ref={ref}
        type="file"
        accept={accept}
        capture="environment"
        disabled={disabled}
        onChange={onChange}
        className="hidden"
      />
    );
  },
);
