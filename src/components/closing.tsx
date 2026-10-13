"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { DestinationScene } from "./scenes";
import { Arrow, Magnetic, Reveal } from "./ui";

const social = [
  { label: "Instagram", href: "https://www.instagram.com/" },
  { label: "Pinterest", href: "https://www.pinterest.com/" },
  { label: "YouTube", href: "https://www.youtube.com/" },
];

const explore = [
  { label: "Explore", href: "#destinations" },
  { label: "Dream Atlas", href: "#atlas" },
  { label: "Our Story", href: "#story" },
  { label: "Find your Elsewhere", href: "#find" },
  { label: "Travel Journal", href: "#journal" },
];

export function Closing() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <>
      <section ref={ref} className="veil relative isolate flex min-h-[100svh] items-center overflow-hidden bg-midnight text-sand">
        <motion.div aria-hidden style={{ y }} className="absolute -inset-y-[8%] inset-x-0 will-change-transform">
          <DestinationScene slug="the-lost-meridian" className="absolute inset-0" />
        </motion.div>
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(10,16,42,0.55),rgba(10,16,42,0.1)_40%,rgba(10,16,42,0.6))]" />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-32 sm:px-8">
          <Reveal>
            <p className="mb-6 text-[0.7rem] font-semibold uppercase tracking-[0.3em]">The last page of the atlas is blank</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-serif text-[clamp(3.6rem,12vw,11rem)] leading-[0.88] tracking-[-0.025em] text-[#FFF1DA] [text-shadow:0_2px_50px_rgba(10,16,42,0.5)]">
              Your next world
              <br />
              is <em className="text-sunset">waiting.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.25}>
            <Magnetic>
            <a
              href="#destinations"
              className="group mt-10 inline-flex items-center gap-3 rounded-full bg-sunset px-8 py-4 text-sm font-semibold text-midnight transition-colors hover:bg-sand"
            >
              Explore destinations
              <Arrow className="transition-transform duration-500 group-hover:translate-x-1" />
            </a>
            </Magnetic>
          </Reveal>
        </div>
      </section>
    </>
  );
}

export function Footer() {
  return (
    <>
      <footer className="relative overflow-hidden bg-deep px-5 pt-20 text-sand sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-12 pb-16 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="font-serif text-3xl leading-tight">
              Somewhere beyond the familiar,
              <br />
              <em className="text-sunset">another world is waiting.</em>
            </p>
          </div>
          <nav aria-label="Footer" className="md:col-span-4 md:col-start-7">
            <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-sand/60">Navigate</h3>
            <ul className="mt-4 space-y-2.5">
              {explore.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="font-serif text-2xl transition-colors hover:text-sunset">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="md:col-span-2">
            <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-sand/60">Follow</h3>
            <ul className="mt-4 space-y-2.5">
              {social.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium transition-colors hover:text-sunset">
                    {s.label} <span aria-hidden>â†—</span>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p aria-hidden className="select-none text-center font-serif text-[clamp(3rem,15.5vw,15rem)] leading-[0.8] tracking-[0.04em] text-sand/90 [mask-image:linear-gradient(to_bottom,black_40%,transparent)]">
          ELSEWHERE
        </p>
        <div className="mx-auto flex max-w-6xl flex-col gap-2 border-t border-sand/15 py-6 text-xs text-sand/60 sm:flex-row sm:justify-between">
          <p>Â© {new Date().getFullYear()} ELSEWHERE. All destinations are imaginary.</p>
          <p>Made for wandering minds.</p>
        </div>
      </footer>
    </>
  );
}

