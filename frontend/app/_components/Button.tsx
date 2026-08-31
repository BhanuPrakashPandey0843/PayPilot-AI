import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "accent";
type ButtonSize = "sm" | "md" | "lg";

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  className?: string;
}

interface ButtonAsButton
  extends BaseProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  href?: undefined;
}

interface ButtonAsLink
  extends BaseProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children" | "href"> {
  href: string;
}

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-[15px]",
};

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-black text-white ring-1 ring-white/10 shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset,0_8px_24px_-8px_rgba(0,0,0,0.7)] hover:ring-white/20",
  secondary:
    "bg-zinc-900 text-white ring-1 ring-white/10 hover:ring-white/20",
  outline:
    "bg-transparent text-white ring-1 ring-white/15 hover:bg-white/[0.03] hover:ring-white/30",
  accent:
    "bg-blue-600 text-white ring-1 ring-blue-400/30 shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_8px_24px_-6px_rgba(37,99,235,0.6)] hover:bg-blue-500",
};

/**
 * Diagonal light streak that sweeps left -> right across the button on
 * hover. Pure Tailwind (no keyframes needed): starts fully off-canvas to
 * the left and translates fully past the right edge, clipped by the
 * button's own `overflow-hidden`.
 */
function ShineSweep() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -translate-x-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[350%] motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
    />
  );
}

/**
 * Shared luxury button used across the whole app (marketing CTAs, dashboard
 * actions, etc.) — solid black by default with a soft inner ring, a subtle
 * hover lift, and a one-shot diagonal shine sweep on hover. `accent` is the
 * blue high-emphasis variant reserved for a page's single strongest CTA
 * (e.g. the closing "Book a Demo"). Renders a Next.js <Link> when `href` is
 * passed, otherwise a native <button>.
 */
export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const classes = [
    "group relative isolate inline-flex items-center justify-center gap-2",
    "overflow-hidden rounded-full font-medium tracking-tight whitespace-nowrap",
    "transition-all duration-300 ease-out",
    "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
    "disabled:pointer-events-none disabled:opacity-40",
    SIZE_STYLES[size],
    VARIANT_STYLES[variant],
    className,
  ].join(" ");

  const content = (
    <>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      <ShineSweep />
    </>
  );

  if (props.href) {
    const { href, ...anchorProps } = props as ButtonAsLink;
    return (
      <Link href={href} className={classes} {...anchorProps}>
        {content}
      </Link>
    );
  }

  const buttonProps = props as ButtonAsButton;
  return (
    <button className={classes} {...buttonProps}>
      {content}
    </button>
  );
}
