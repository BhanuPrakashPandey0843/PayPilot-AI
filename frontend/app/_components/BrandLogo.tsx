import Image from "next/image";
import navlogo from "@/app/assets/Navlogo.png";

interface BrandLogoProps {
  /** Sizes the crop box. Should keep roughly the mark's own ~2.24:1
   * aspect ratio (e.g. "h-8 w-[72px]") — see the component doc comment
   * for why. */
  className?: string;
  /** Drop the invert filter for use on a light surface. Every surface in
   * this app is dark today (see globals.css), so this defaults to on. */
  invert?: boolean;
  priority?: boolean;
}

/**
 * The real PayPilot AI mark (app/assets/Navlogo.png), used everywhere a
 * logo appears — Navbar, Footer, and the auth screens' brand panels.
 * Replaces the placeholder Zap-icon-in-a-box that stood in for it
 * before a real asset existed.
 *
 * Two things the source file needs help with:
 *
 * 1. It's pure black ink on a transparent background. Every surface in
 *    this product is dark (#050810 etc.), so a plain black mark would
 *    be invisible — `invert` (on by default) flips it to white via a
 *    CSS filter rather than needing a second exported asset.
 *
 * 2. The mark itself only occupies the vertical center ~35% of the
 *    500x500 source canvas (the rest is transparent padding), so
 *    rendering it "as-is" at a small height makes it look tiny with
 *    huge empty margins. `object-cover` on a container sized to the
 *    mark's actual ~2.24:1 aspect ratio scales it up until that
 *    transparent padding is cropped out of frame — pass a className
 *    that keeps close to that ratio (default below already does).
 */
export function BrandLogo({ className = "h-8 w-[72px]", invert = true, priority }: BrandLogoProps) {
  return (
    <span className={`relative block shrink-0 overflow-hidden ${className}`}>
      <Image
        src={navlogo}
        alt="PayPilot AI"
        fill
        priority={priority}
        sizes="160px"
        className={`object-cover ${invert ? "invert" : ""}`}
      />
    </span>
  );
}
