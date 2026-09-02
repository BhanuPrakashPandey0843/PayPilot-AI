import { Check, X } from "lucide-react";
import type { PasswordCheck } from "@/lib/validation/authValidation";

const RULES: { key: keyof PasswordCheck; label: string }[] = [
  { key: "minLength", label: "8+ characters" },
  { key: "hasLetter", label: "One letter" },
  { key: "hasNumber", label: "One number" },
  { key: "hasUpper", label: "One uppercase" },
  { key: "hasSymbol", label: "One symbol" },
];

const STRENGTH_LABELS = ["Very weak", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["bg-red-500", "bg-orange-500", "bg-amber-400", "bg-cyan-400", "bg-emerald-400"];

interface PasswordStrengthProps {
  password: string;
  check: PasswordCheck;
  score: number;
}

/**
 * Live strength meter shown under the password field. minLength /
 * hasLetter / hasNumber are what the backend actually requires (see
 * lib/validation/authValidation.ts); hasUpper / hasSymbol only push the
 * meter further, they never block submission.
 */
export function PasswordStrength({ password, check, score }: PasswordStrengthProps) {
  if (!password) return null;
  const idx = Math.max(0, score - 1);

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 gap-1">
          {STRENGTH_LABELS.map((label, i) => (
            <span
              key={label}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= idx ? STRENGTH_COLORS[idx] : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <span className="ml-3 text-[11px] font-medium text-zinc-400">{STRENGTH_LABELS[idx]}</span>
      </div>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {RULES.map((rule) => {
          const met = check[rule.key];
          return (
            <li key={rule.key} className="flex items-center gap-1.5 text-[11px]">
              <span
                className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
                  met ? "bg-emerald-400/20 text-emerald-400" : "bg-white/5 text-zinc-600"
                }`}
              >
                {met ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
              </span>
              <span className={met ? "text-zinc-300" : "text-zinc-600"}>{rule.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
