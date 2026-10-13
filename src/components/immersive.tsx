"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { DestinationScene } from "./scenes";

function Phrase({
  p,
  range,
  children,
  caption,
  reduce,
}: {
  p: MotionValue<number>;
  range: [number, number, number, number];
  children: React.ReactNode;
  caption: string;
  reduce: boolean;
}) {
  const opacity = useTransform(p, range, [0, 1, 1, 0]);
  const y = useTransform(p, range, reduce ? [0, 0, 0, 0] : [60, 0, 0, -60]);
  return (
    <motion.div style={{ opacity, y }} className="absolute inset-0 flex flex-col justify-center px-5 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <p className="mb-6 flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-sand">
          <span aria-hidden className="h-px w-10 bg-sunset" />
          {caption}
        </p>
        <p className="font-serif text-[clamp(3.6rem,13vw,12rem)] leading-[0.88] tracking-[-0.025em] text-[#FFF1DA] [text-shadow:0_2px_40px_rgba(10,16,42,0.45)]">
          {children}
        </p>
      </div>
    </motion.div>
  );
}

export function Immersive() {
  const ref = useRef<HTMLElement>(null);
  const reduce = !!useReducedMotion();
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const aO = useTransform(p, [0, 0.28, 0.42], [1, 1, 0]);
  const bO = useTransform(p, [0.22, 0.4, 0.6, 0.74], [0, 1, 1, 0]);
  const cO = useTransform(p, [0.58, 0.76, 1], [0, 1, 1]);
  const sA = useTransform(p, [0, 1], reduce ? [1.04, 1.04] : [1.22, 1.1]);
  const yA = useTransform(p, [0, 1], reduce ? [0, 0] : [0, -40]);
  const rail = useTransform(p, [0, 1], ["0%", "100%"]);

  return (
    <section ref={ref} aria-labelledby="immersive-title" className="relative h-[420svh] bg-deep">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <h2 id="immersive-title" className="sr-only">
          Some places exist only when you look for them.
        </h2>

        <motion.div aria-hidden style={{ opacity: aO, scale: sA, y: yA }} className="veil absolute inset-0 will-change-transform">
          <DestinationScene slug="solara" className="absolute inset-0" />
        </motion.div>
        <motion.div aria-hidden style={{ opacity: bO, scale: sA, y: yA }} className="veil absolute inset-0 will-change-transform">
          <DestinationScene slug="the-sleeping-coast" className="absolute inset-0" />
        </motion.div>
        <motion.div aria-hidden style={{ opacity: cO, scale: sA, y: yA }} className="veil absolute inset-0 will-change-transform">
          <DestinationScene slug="the-blue-hour" className="absolute inset-0" />
        </motion.div>
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,16,42,0.1),rgba(10,16,42,0.55))]" />

        <div aria-hidden>
          <Phrase p={p} range={[0, 0.06, 0.26, 0.36]} caption="I · Sunset" reduce={reduce}>
            Some places
            <br />
            <em className="text-sunset">exist</em>
          </Phrase>
          <Phrase p={p} range={[0.3, 0.42, 0.58, 0.68]} caption="II · Dusk" reduce={reduce}>
            only when
            <br />
            <em className="text-blush">you</em>
          </Phrase>
          <Phrase p={p} range={[0.62, 0.74, 0.97, 1]} caption="III · Midnight" reduce={reduce}>
            look for
            <br />
            them<em className="text-sand">.</em>
          </Phrase>
        </div>

        <div aria-hidden className="absolute inset-x-5 bottom-8 mx-auto flex max-w-6xl items-center gap-4 text-[0.66rem] font-semibold uppercase tracking-[0.26em] text-sand sm:inset-x-8">
          <span>Sunset</span>
          <span className="relative h-px flex-1 bg-sand/25">
            <motion.span style={{ width: rail }} className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,#F28C62,#D9A0A4,#788DAD)] [height:2px] -translate-y-px" />
          </span>
          <span>Midnight</span>
        </div>
      </div>
    </section>
  );
}
