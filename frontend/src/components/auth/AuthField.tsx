import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const authInputClasses =
  "w-full rounded-[12px] border border-black/[0.1] bg-white px-3.5 py-2.5 text-[13.5px] text-[#111217] outline-none transition-colors placeholder:text-[#A9AAB1] focus:border-[#111217]/30 focus-visible:ring-2 focus-visible:ring-[#111217]/15";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

/** Labelled text input with an inline error message — the standard row used across every auth form. */
export function AuthField({ label, error, id, className, ...props }: AuthFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-[12.5px] font-medium text-[#111217]">
        {label}
      </label>
      <input id={id} className={cn(authInputClasses, "mt-1.5", className)} {...props} />
      {error && <p className="mt-1 text-[11.5px] text-[#E14F55]">{error}</p>}
    </div>
  );
}
