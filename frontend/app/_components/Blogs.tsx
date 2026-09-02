"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SectionBadge } from "./SectionBadge";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface BlogPost {
  category: string;
  title: string;
}

/**
 * PayPilot-specific placeholder posts. Swap freely — the marquee only cares
 * about category/title, and BlogCard derives its art purely from index so
 * new posts slot in without touching any visuals.
 */
const BLOG_POSTS: BlogPost[] = [
  {
    category: "Product",
    title: "Inside the Five Detectors Behind Every Revenue Opportunity",
  },
  {
    category: "ROI",
    title: "What a 25% Attachment Rate Means for Your Cross-Sells",
  },
  {
    category: "Strategy",
    title: "Making Your Catalog Readable by AI Shopping Agents",
  },
  {
    category: "Security",
    title: "Why AI Never Touches Money Directly in PayPilot AI",
  },
  {
    category: "Integrations",
    title: "Built on Razorpay: Checkout, Webhooks & Verification",
  },
  {
    category: "Compliance",
    title: "Every Recommendation, Check, and Outcome — Audited",
  },
  {
    category: "Support",
    title: "What the AI Copilot Can — and Can't — Do With Your Data",
  },
  {
    category: "Operations",
    title: "Turning Abandoned Checkouts Back Into Revenue",
  },
];

/**
 * Blogs / insights section — sits directly above Faq on the home page. A
 * full-bleed, seamless GSAP marquee (list rendered twice back to back,
 * tweened by exactly half its scroll width so the loop is invisible),
 * moving at a deliberately slow, luxurious pace. Pauses on hover/focus so
 * the cards are actually readable.
 */
export function Blogs() {
  const headerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-blogs-reveal]", {
        opacity: 0,
        y: 24,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: headerRef.current,
          start: "top 80%",
        },
      });
    }, headerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    const wrapper = wrapperRef.current;
    if (!track || !wrapper) return;

    let tween: gsap.core.Tween | undefined;

    const build = () => {
      tween?.kill();
      gsap.set(track, { x: 0 });
      const distance = track.scrollWidth / 2;
      // Slow, luxurious pace — bigger divisor = slower crawl.
      tween = gsap.to(track, {
        x: -distance,
        duration: distance / 55,
        ease: "none",
        repeat: -1,
      });
    };

    build();

    const handleEnter = () => tween?.pause();
    const handleLeave = () => tween?.play();
    wrapper.addEventListener("mouseenter", handleEnter);
    wrapper.addEventListener("mouseleave", handleLeave);
    wrapper.addEventListener("focusin", handleEnter);
    wrapper.addEventListener("focusout", handleLeave);

    const handleResize = () => build();
    window.addEventListener("resize", handleResize);

    return () => {
      tween?.kill();
      wrapper.removeEventListener("mouseenter", handleEnter);
      wrapper.removeEventListener("mouseleave", handleLeave);
      wrapper.removeEventListener("focusin", handleEnter);
      wrapper.removeEventListener("focusout", handleLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <section className="border-t border-white/5 bg-black py-24">
      <div ref={headerRef} className="mx-auto max-w-6xl px-6">
        <div data-blogs-reveal>
          <SectionBadge label="Blogs" />
        </div>
        <h2
          data-blogs-reveal
          className="mt-4 max-w-lg text-3xl font-semibold tracking-tight text-white sm:text-4xl"
        >
          Insights that actually help
        </h2>
      </div>

      <div
        ref={wrapperRef}
        data-blogs-reveal
        className="relative mt-12 overflow-hidden"
      >
        {/* Edge fades — same black as the page, so the loop point stays hidden */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-black to-transparent sm:w-24"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-black to-transparent sm:w-24"
        />

        <div ref={trackRef} className="flex w-max gap-6 px-6 sm:gap-8">
          {[...BLOG_POSTS, ...BLOG_POSTS].map((post, index) => (
            <BlogCard key={`${post.title}-${index}`} post={post} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

const BLOB_RADII = [
  "62% 38% 55% 45% / 55% 60% 40% 45%",
  "45% 55% 60% 40% / 42% 45% 58% 55%",
  "58% 42% 46% 54% / 48% 40% 60% 52%",
  "40% 60% 52% 48% / 58% 52% 48% 42%",
];

function BlogCard({ post, index }: { post: BlogPost; index: number }) {
  const rotation = ((index % 3) - 1) * 5;
  const radius = BLOB_RADII[index % BLOB_RADII.length];
  const delay = (index % 4) * 0.5;

  return (
    <article className="w-[260px] shrink-0 sm:w-[300px]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-200 via-zinc-300 to-zinc-400">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(rgba(0,0,0,0.15) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />

        <div
          aria-hidden="true"
          className="animate-float-slow absolute left-1/2 top-1/2 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)]"
          style={{
            borderRadius: radius,
            transform: `rotate(${rotation}deg)`,
            animationDelay: `${delay}s`,
          }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              borderRadius: "inherit",
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.16) 0%, transparent 45%)",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-[58%] h-1 w-10 -translate-x-1/2 rounded-full bg-blue-400 opacity-80 blur-[1.5px]"
          />
        </div>
      </div>

      <div className="mt-4">
        <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
          {post.category}
        </span>
      </div>

      <h3 className="mt-3 text-base font-medium leading-snug text-white sm:text-lg">
        {post.title}
      </h3>
    </article>
  );
}
