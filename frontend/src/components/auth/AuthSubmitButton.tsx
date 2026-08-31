import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AuthSubmitButton({
  loading,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading || props.disabled}
      className={cn(
        "inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-[13px] bg-[#111217] px-6 text-sm font-medium text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#111217]/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
      {children}
    </button>
  );
}
