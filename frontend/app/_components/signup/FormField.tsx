"use client";

import { useId, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, Check, Eye, EyeOff } from "lucide-react";

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  icon: LucideIcon;
  error?: string | null;
  valid?: boolean;
  autoComplete?: string;
  isPassword?: boolean;
  hint?: string;
}

/**
 * Shared floating-label input used across the signup form. Leading
 * lucide icon, trailing validation icon (or a show/hide toggle for
 * password fields), animated label + border, inline error text wired
 * up for screen readers via aria-describedby.
 */
export function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  onBlur,
  icon: Icon,
  error,
  valid,
  autoComplete,
  isPassword,
  hint,
}: FormFieldProps) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const errorId = `${id}-error`;
  const hasError = Boolean(error);
  const resolvedType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={`group relative flex items-center rounded-xl border bg-white/[0.02] transition-colors duration-200 ${
          hasError
            ? "border-red-500/50"
            : focused
              ? "border-blue-400/60"
              : "border-white/10 hover:border-white/20"
        }`}
      >
        <Icon
          className={`ml-3.5 h-4 w-4 shrink-0 transition-colors duration-200 ${
            hasError ? "text-red-400" : focused ? "text-blue-400" : "text-zinc-500"
          }`}
        />

        <div className="relative flex-1">
          <label
            htmlFor={id}
            className={`pointer-events-none absolute left-3 origin-left transition-all duration-200 ${
              focused || value
                ? "top-1.5 text-[10px] font-medium tracking-wide text-zinc-500 uppercase"
                : "top-1/2 -translate-y-1/2 text-sm text-zinc-500"
            }`}
          >
            {label}
          </label>
          <input
            id={id}
            name={name}
            type={resolvedType}
            value={value}
            autoComplete={autoComplete}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              onBlur?.();
            }}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : undefined}
            className="w-full bg-transparent px-3 pt-4 pb-1.5 text-sm text-white outline-none placeholder:text-transparent"
          />
        </div>

        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            tabIndex={-1}
            className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:text-white"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        ) : null}

        {!isPassword && (hasError || valid) ? (
          <span className="mr-3.5 shrink-0">
            {hasError ? (
              <AlertCircle className="h-4 w-4 text-red-400" />
            ) : (
              <Check className="h-4 w-4 text-emerald-400" />
            )}
          </span>
        ) : null}
      </div>

      {hasError ? (
        <p id={errorId} role="alert" className="pl-1 text-xs text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p className="pl-1 text-xs text-zinc-600">{hint}</p>
      ) : null}
    </div>
  );
}
