"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";

type FaqItem = {
  question: string;
  answer: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Is PayPilot replacing my team?",
    answer:
      "No. PayPilot handles repetitive, high-volume work so your team can focus on judgment calls, exceptions, and relationships — not busywork.",
  },
  {
    question: "How is this different from a typical AI wrapper?",
    answer:
      "PayPilot is an end-to-end commerce agent — it discovers intent, recommends, and completes a secure, explainable payment, not just a chatbot bolted onto checkout.",
  },
  {
    question: "Will I have control and visibility over my operation?",
    answer:
      "Yes. Every decision PayPilot makes is logged and explainable, with configurable guardrails so you always know what happened and why.",
  },
  {
    question: "Can it handle complex pricing and collections interactions?",
    answer:
      "PayPilot is built for nuanced, multi-step commerce flows — from dynamic bundles to retries and collections — not just simple one-click purchases.",
  },
  {
    question: "How quickly can we deploy and integrate?",
    answer:
      "Most teams are live within days using our SDK and pre-built connectors, with no need to rebuild your existing checkout or payment stack.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative overflow-hidden bg-[#FAFAF8] px-5 py-20 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[320px]"
        style={{
          background:
            "radial-gradient(38% 60% at 50% 0%, rgba(140,123,224,0.10) 0%, rgba(140,123,224,0) 70%)",
        }}
      />

      <div className="relative mx-auto max-w-2xl text-center">
        <h2 className="text-[28px] font-extrabold leading-[1.15] tracking-[-0.03em] text-[#111217] sm:text-[34px] lg:text-[40px]">
          Questions from Operational
          <br />
          Leaders —{" "}
          <span className="font-serif italic text-[#111217]">FAQ</span>
        </h2>

        <div className="mx-auto mt-10 max-w-[640px] divide-y divide-black/[0.08] border-y border-black/[0.08] text-left sm:mt-12">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div key={item.question}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left outline-none sm:py-5"
                >
                  <span className="text-[13px] font-medium text-[#111217] sm:text-[14px]">
                    {item.question}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-black/[0.08] text-[#111217]"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 pr-9 text-[13px] leading-[1.55] text-[#5F6067] sm:pb-6 sm:text-[14px]">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
