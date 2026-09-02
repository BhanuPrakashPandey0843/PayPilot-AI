import { ArrowRight } from "lucide-react";
import { Button } from "./Button";

/**
 * Closing conversion section — sits directly above the footer on the home
 * page. Single high-emphasis blue CTA (Book a Demo) paired with a lower-
 * emphasis secondary action (See Pricing).
 */
export function FinalCta() {
  return (
    <section className="bg-black px-6 py-24 text-center">
      <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        Find the revenue you&apos;re already losing
      </h2>
      <p className="mx-auto mt-4 max-w-md text-base text-zinc-400 sm:text-lg">
        Point PayPilot AI at your Razorpay catalog and see failed payments,
        abandoned checkouts, and missed upsells surfaced as ranked,
        explainable actions — policy-checked before anything runs.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Button href="/demo" variant="accent">
          Book a Demo
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button href="/pricing" variant="secondary">
          See Pricing
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
