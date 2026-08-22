import Image from "next/image";

import heroBg from "@/assets/herobg.png";

export function HeroBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base warm-white canvas + soft radial color glows */}
      <div className="absolute inset-0 bg-[#FAFAF8]" />
      <div className="hero-glows absolute inset-0" />

      {/* Fine dotted texture */}
      <Image
        src={heroBg}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      {/* Large translucent arch behind the hero content */}
      <div className="hero-arch" />

      {/* Fade the decorative glows to a flat, solid tone at the very bottom of the
          section so the handoff into the next section's background is seamless
          instead of cutting off mid-glow. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#FAFAF8] sm:h-48"
      />
    </div>
  );
}
