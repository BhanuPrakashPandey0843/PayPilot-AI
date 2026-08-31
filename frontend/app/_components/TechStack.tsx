import {
  Atom,
  Braces,
  Component,
  CreditCard,
  Database,
  MemoryStick,
  Wind,
  Zap,
} from "lucide-react";
import type { ComponentType } from "react";

interface StackItem {
  name: string;
  icon: ComponentType<{ className?: string }>;
}

/**
 * The stack PayPilot AI is actually built on (see
 * documentation/Tech_stack.md). Icons are generic/conceptual (lucide-react)
 * rather than reproductions of each project's real trademarked logo.
 */
const STACK: StackItem[] = [
  { name: "Next.js", icon: Component },
  { name: "React", icon: Atom },
  { name: "TypeScript", icon: Braces },
  { name: "Tailwind CSS", icon: Wind },
  { name: "Fastify", icon: Zap },
  { name: "PostgreSQL", icon: Database },
  { name: "Redis", icon: MemoryStick },
  { name: "Razorpay", icon: CreditCard },
];

/**
 * "Trusted by" style strip, reused to show the stack instead of client
 * logos — sits directly below the hero, same dark/luxury surface, muted
 * marks that brighten on hover.
 */
export function TechStack() {
  return (
    <section className="border-t border-white/5 bg-black px-6 py-14">
      <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
        Built on a modern, production-grade stack
      </p>

      <div className="mx-auto mt-8 flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-6">
        {STACK.map(({ name, icon: Icon }) => (
          <div
            key={name}
            className="flex items-center gap-2 text-zinc-500 transition-colors duration-300 hover:text-white"
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium tracking-tight">{name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
