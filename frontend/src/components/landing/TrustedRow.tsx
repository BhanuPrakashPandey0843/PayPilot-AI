const AVATAR_GRADIENTS = [
  "from-[#DDD3FF] to-[#B9A6FF]",
  "from-[#FFF4B8] to-[#FFD98A]",
  "from-[#F3F7D8] to-[#CFE8A8]",
  "from-[#FFD9D9] to-[#FFB3B3]",
  "from-[#C9E8FF] to-[#9FCBFF]",
];

export function TrustedRow() {
  return (
    <div className="mt-8 flex flex-col items-center gap-2 sm:mt-9 sm:flex-row sm:gap-2.5">
      <ul className="flex -space-x-2" aria-hidden="true">
        {AVATAR_GRADIENTS.map((gradient, index) => (
          <li
            key={index}
            className={`h-6 w-6 rounded-full border-2 border-[#FAFAF8] bg-gradient-to-br ${gradient}`}
          />
        ))}
      </ul>
      <p className="text-[11px] font-medium text-[#62636A] sm:text-[12px]">
        Designed for AI-first commerce
      </p>
    </div>
  );
}
