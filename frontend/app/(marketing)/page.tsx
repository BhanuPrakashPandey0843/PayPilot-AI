import { Blogs } from "../_components/Blogs";
import { CaseStudies } from "../_components/CaseStudies";
import { Faq } from "../_components/Faq";
import { FinalCta } from "../_components/FinalCta";
import { Hero } from "../_components/Hero";
import { HowWeWork } from "../_components/HowWeWork";
import { Pricing } from "../_components/Pricing";
import { Solutions } from "../_components/Solutions";
import { TechStack } from "../_components/TechStack";
import { Testimonials } from "../_components/Testimonials";
import { WhoWeAre } from "../_components/WhoWeAre";

export default function HomePage() {
  return (
    <>
      <Hero />

      <WhoWeAre />
      <Solutions />
      <TechStack />
      <CaseStudies />
      <Testimonials />
      <Pricing />
      <HowWeWork />
      <Blogs />
      <Faq />
      <FinalCta />
    </>
  );
}
