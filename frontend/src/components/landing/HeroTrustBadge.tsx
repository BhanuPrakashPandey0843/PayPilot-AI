import { Sparkles } from "lucide-react";

export function HeroTrustBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-white/70 px-[10px] py-[6px] text-[10px] font-medium text-[#55565D] backdrop-blur-sm sm:text-[11px]">
      <Sparkles className="h-3 w-3 text-[#8C7BE0]" strokeWidth={2} />
      <span>Built for Agentic Commerce</span>
    </div>
  );
}
