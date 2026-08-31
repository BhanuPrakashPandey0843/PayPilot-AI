import { Button } from "../_components/Button";
import { FinalCta } from "../_components/FinalCta";
import { TechStack } from "../_components/TechStack";

export default function HomePage() {
  return (
    <>
      <section className="flex flex-1 flex-col items-center justify-center bg-black px-6 py-32 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
          AI-native payments for modern commerce
        </p>

        <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
          Payments that run themselves.
        </h1>

        <p className="mt-6 max-w-xl text-base text-zinc-400 sm:text-lg">
          PayPilot AI watches your revenue, catches what you&apos;d miss, and
          acts on it — so your team can focus on the business, not the
          spreadsheets.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Button href="/signup" size="lg">
            Explore PayPilot
          </Button>
          <Button href="/demo" size="lg" variant="outline">
            Book a Demo
          </Button>
        </div>
      </section>

      <TechStack />
      <FinalCta />
    </>
  );
}
