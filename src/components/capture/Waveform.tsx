import { cn } from "@/lib/utils";

type WaveformProps = {
  active?: boolean;
  uploading?: boolean;
};

const BAR_HEIGHTS = [20, 36, 28, 48, 24, 40, 30, 44, 22];

export function Waveform({ active = false, uploading = false }: WaveformProps) {
  return (
    <div className="flex h-16 items-end justify-center gap-2" aria-hidden="true">
      {BAR_HEIGHTS.map((height, index) => (
        <span
          key={`${height}-${index}`}
          className={cn(
            "w-2 rounded-full bg-slate-300 transition-all duration-300",
            active && "animate-pulse bg-emerald-500/80",
            uploading && "bg-amber-400/80",
          )}
          style={{
            height,
            animationDelay: `${index * 90}ms`,
            opacity: active || uploading ? 1 : 0.55,
            transform:
              active || uploading
                ? `scaleY(${1 + ((index % 3) + 1) * 0.08})`
                : "scaleY(1)",
          }}
        />
      ))}
    </div>
  );
}
