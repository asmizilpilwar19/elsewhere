"use client";

import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { destinations, type Destination } from "@/data/destinations";
import { DestinationScene } from "./scenes";
import { useApp } from "./providers";
import { Arrow, Eyebrow, PlaceMark, Reveal } from "./ui";

export function SaveButton({ slug, name, className = "" }: { slug: string; name: string; className?: string }) {
  const { isSaved, toggleSaved } = useApp();
  const saved = isSaved(slug);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggleSaved(slug);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from your journal` : `Save ${name} to your journal`}
      title={saved ? "Remove from journal" : "Save to journal"}
      className={`grid h-11 w-11 place-items-center rounded-full bg-midnight/70 text-sand transition-colors hover:bg-midnight ${saved ? "text-sunset" : ""} ${className}`}
    >
      <PlaceMark filled={saved} />
    </button>
  );
}

const layout: string[] = [
  "lg:col-span-7 lg:h-[600px]",
  "lg:col-span-5 lg:h-[600px] lg:mt-24",
  "lg:col-span-4 lg:h-[540px] lg:-mt-4",
  "lg:col-span-8 lg:h-[540px] lg:mt-20",
  "lg:col-span-6 lg:h-[640px]",
  "lg:col-span-6 lg:h-[500px] lg:mt-32",
];

const motes = [
  { l: "14%", t: "26%", s: 6, d: 7 },
  { l: "78%", t: "18%", s: 4, d: 9 },
  { l: "62%", t: "46%", s: 5, d: 8 },
  { l: "30%", t: "58%", s: 3, d: 10 },
  { l: "88%", t: "62%", s: 5, d: 6 },
  { l: "46%", t: "12%", s: 3, d: 11 },
];

function Card({ d, i }: { d: Destination; i: number }) {
  const { openDestination } = useApp();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [entering, setEntering] = useState(false);

  // pointer position inside the card, −0.5 … 0.5
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const k = reduce ? 0 : 1;
  const spring = { stiffness: 140, damping: 20, mass: 0.6 };
  const rx = useSpring(useTransform(py, (v) => v * -9 * k), spring);
  const ry = useSpring(useTransform(px, (v) => v * 11 * k), spring);
  // each depth layer slides at its own rate
  const backX = useSpring(useTransform(px, (v) => v * -22 * k), spring);
  const backY = useSpring(useTransform(py, (v) => v * -16 * k), spring);
  const frontX = useSpring(useTransform(px, (v) => v * 34 * k), spring);
  const frontY = useSpring(useTransform(py, (v) => v * 22 * k), spring);
  const moteX = useSpring(useTransform(px, (v) => v * 70 * k), spring);
  const moteY = useSpring(useTransform(py, (v) => v * 46 * k), spring);
  // a soft light that follows the pointer
  const lx = useTransform(px, (v) => `${(v + 0.5) * 100}%`);
  const ly = useTransform(py, (v) => `${(v + 0.5) * 100}%`);
  const light = useMotionTemplate`radial-gradient(380px circle at ${lx} ${ly}, rgba(255,236,205,0.34), transparent 62%)`;
  const lightO = useMotionValue(0);

  const enter = () => {
    const r = ref.current?.getBoundingClientRect();
    setEntering(true);
    openDestination(d.slug, r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined);
    window.setTimeout(() => setEntering(false), 1200);
  };

  return (
    <Reveal delay={(i % 2) * 0.1} className={`h-[500px] sm:h-[560px] ${layout[i]}`}>
      <div className="h-full" style={{ perspective: 1100 }}>
        <motion.article
          ref={ref}
          style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
          animate={entering && !reduce ? { scale: 1.1, z: 140 } : { scale: 1, z: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
          onPointerMove={(e) => {
            if (e.pointerType !== "mouse") return;
            const r = e.currentTarget.getBoundingClientRect();
            px.set((e.clientX - r.left) / r.width - 0.5);
            py.set((e.clientY - r.top) / r.height - 0.5);
            lightO.set(1);
          }}
          onPointerLeave={() => {
            px.set(0);
            py.set(0);
            lightO.set(0);
          }}
          className="group relative h-full text-sand"
        >
          {/* depth layers, clipped to the card shape */}
          <div className="veil absolute inset-0 overflow-hidden rounded-[1.75rem] bg-midnight shadow-[0_40px_70px_-30px_rgba(10,16,42,0.75)]">
            <motion.div style={{ x: backX, y: backY }} className="absolute -inset-[9%]">
              <DestinationScene slug={d.slug} className="absolute inset-0 transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]" />
            </motion.div>
            {/* foreground copy: only the lower third is visible, and it travels further */}
            <motion.div
              aria-hidden
              style={{ x: frontX, y: frontY, maskImage: "linear-gradient(to top, #000 0%, #000 24%, transparent 40%)", WebkitMaskImage: "linear-gradient(to top, #000 0%, #000 24%, transparent 40%)" }}
              className="pointer-events-none absolute -inset-[16%]"
            >
              <DestinationScene slug={d.slug} className="absolute inset-0 transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]" />
            </motion.div>
            <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgba(10,16,42,0.92)_0%,rgba(10,16,42,0.6)_34%,transparent_72%)]" />
            <motion.div aria-hidden style={{ background: light, opacity: lightO }} className="pointer-events-none absolute inset-0 mix-blend-soft-light transition-opacity duration-500" />
          </div>

          {/* floating motes hover in front of the art */}
          <motion.div aria-hidden style={{ x: moteX, y: moteY, z: 90 }} className="pointer-events-none absolute inset-0">
            {motes.map((m, n) => (
              <span
                key={n}
                className="anim-bob absolute rounded-full bg-sand/80 shadow-[0_0_12px_3px_rgba(245,217,181,0.55)]"
                style={{ left: m.l, top: m.t, width: m.s, height: m.s, animationDuration: `${m.d}s`, animationDelay: `${-n * 1.3}s` }}
              />
            ))}
          </motion.div>

          {/* type sits closest to the viewer */}
          <div className="absolute inset-0" style={{ transform: "translateZ(60px)", transformStyle: "preserve-3d" }}>
            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-5 sm:p-6">
              <p className="font-serif text-4xl leading-none text-[#FFF1DA]">
                <span className="mr-1 align-top font-sans text-xs font-semibold uppercase tracking-[0.25em] opacity-80">No.</span>
                {d.number}
              </p>
              <SaveButton slug={d.slug} name={d.name} className="relative z-20" />
            </div>

            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
              <p className="mb-3 inline-block rounded-full border border-sand/40 bg-midnight/30 px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.22em]">{d.atmosphere}</p>
              <h3 className="font-serif text-[clamp(2.4rem,4.4vw,3.8rem)] leading-[0.95] text-[#FFF1DA]">{d.name}</h3>
              <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-sand/95">{d.poem}</p>
              <button
                type="button"
                onClick={enter}
                aria-label={`Explore ${d.name}`}
                className="mt-5 inline-flex items-center gap-3 rounded-full bg-sand px-6 py-3 text-sm font-semibold text-midnight transition-colors group-hover:bg-sunset after:absolute after:inset-0 after:z-10 after:content-['']"
              >
                Explore
                <Arrow className="transition-transform duration-500 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </motion.article>
      </div>
    </Reveal>
  );
}

export function Destinations() {
  return (
    <section id="destinations" className="below-fold relative bg-paper px-5 pb-24 pt-40 sm:px-8 sm:pb-36 sm:pt-52">
      {/* the hero ends at midnight; this eases the page back into daylight */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[linear-gradient(to_bottom,var(--hero-end,#0a1228),transparent)]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-16 grid gap-8 lg:mb-24 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <Reveal>
              <Eyebrow className="text-accent">Featured destinations</Eyebrow>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="mt-6 font-serif text-[clamp(2.8rem,7.5vw,6.5rem)] leading-[0.92] tracking-[-0.015em]">
                Six worlds,
                <br />
                <em className="text-accent">gently</em> charted.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.2} className="lg:col-span-4">
            <p className="max-w-sm text-base leading-relaxed opacity-85">
              Each place below was found by someone who was looking for something else. Choose one, step inside, and save the ones you cannot stop thinking about.
            </p>
          </Reveal>
        </div>

        <div className="grid gap-6 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-10">
          {destinations.map((d, i) => (
            <Card key={d.slug} d={d} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
