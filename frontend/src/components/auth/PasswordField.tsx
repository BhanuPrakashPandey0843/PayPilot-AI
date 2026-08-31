"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

import { authInputClasses } from "./AuthField";
import { cn } from "@/lib/utils";

type PasswordFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

/** Password input with a visibility toggle — used by login, register and reset-password. */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div>
        <label htmlFor={id} className="text-[12.5px] font-medium text-[#111217]">
          {label}
        </label>
        <div className="relative mt-1.5">
          <input
            id={id}
            ref={ref}
            type={visible ? "text" : "password"}
            className={cn(authInputClasses, "pr-10", className)}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[#8A8B92] outline-none transition-colors hover:text-[#111217] focus-visible:text-[#111217]"
          >
            {visible ? (
              <EyeOff className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <Eye className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>
        </div>
        {error && <p className="mt-1 text-[11.5px] text-[#E14F55]">{error}</p>}
      </div>
    );
  }
);

PasswordField.displayName = "PasswordField";
