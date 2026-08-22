import { Hero } from "@/components/landing/Hero";
import { OperationalLeaders } from "@/components/landing/OperationalLeaders";
import { SecurityCompliance } from "@/components/landing/SecurityCompliance";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <OperationalLeaders />
      <SecurityCompliance />
      <FAQ />
      <Footer />
    </main>
  );
}
