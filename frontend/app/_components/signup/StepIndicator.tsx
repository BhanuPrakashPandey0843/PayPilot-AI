interface StepIndicatorProps {
  step: number;
  total: number;
}

/** Tiny "Step X of Y" progress line at the top of the signup card. */
export function StepIndicator({ step, total }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 font-mono text-[11px] tracking-wide text-zinc-500">
        Step {step} of {total}
      </span>
      <div className="flex flex-1 gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
              i < step ? "bg-blue-500" : "bg-white/10"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
