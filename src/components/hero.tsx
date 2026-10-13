"use client";

import dynamic from "next/dynamic";
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { floatingRock, ridge, rng } from "@/lib/svg";
import { sceneState } from "@/lib/scene-state";
import { useApp } from "./providers";
import { canUseWebGL, useOnScreen } from "./three/common";
import { smoothScroll, Arrow, Magnetic } from "./ui";

const HeroScene = dynamic(() => import("./three/hero-scene"), { ssr: false });

const SUN_X = 930;
const stop = (v: string): CSSProperties => ({ stopColor: `var(${v})` });

/* ------------------------------------------------------------------ */
/*  SVG fallback (reduced motion, no WebGL, or while the 3D loads)     */
/* ------------------------------------------------------------------ */

function Layer({
  depth,
  lift,
  mx,
  my,
  scrollY,
  children,
  z,
}: {
  depth: number;
  lift: number;
  mx: MotionValue<number>;
  my: MotionValue<number>;
  scrollY: MotionValue<number>;
  children: ReactNode;
  z: number;
}) {
  const x = useTransform(mx, (v) => v * depth);
  const yMouse = useTransform(my, (v) => v * depth * 0.5);
  const yScroll = useTransform(scrollY, (v) => v * lift);
  const y = useTransform([yMouse, yScroll], ([a, b]: number[]) => a + b);
  return (
    <motion.div aria-hidden className="absolute -inset-x-[5%] -inset-y-[4%] will-change-transform" style={{ x, y, zIndex: z }}>
      {children}
    </motion.div>
  );
}

const SVG = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="h-full w-full" focusable="false">
    {children}
  </svg>
);

function Islands() {
  const items = [
    { x: 430, t: 250, w: 300, d: 150, s: 4, dur: 11, delay: 0, tower: true },
    { x: 1190, t: 190, w: 210, d: 110, s: 9, dur: 13, delay: -4, tower: true },
    { x: 770, t: 360, w: 120, d: 70, s: 2, dur: 9, delay: -2, tower: false },
    { x: 1430, t: 400, w: 150, d: 80, s: 12, dur: 12, delay: -6, tower: false },
    { x: 150, t: 400, w: 110, d: 60, s: 7, dur: 10, delay: -3, tower: false },
  ];
  return (
    <>
      {items.map((it) => (
        <g key={it.s} className="anim-bob" style={{ animationDuration: `${it.dur}s`, animationDelay: `${it.delay}s` }}>
          <path d={floatingRock(it.x, it.t, it.w, it.d, it.s)} fill="var(--mid)" />
          <path
            d={`M${it.x - it.w / 2 + 6},${it.t - 3} Q${it.x},${it.t - 16} ${it.x + it.w / 2 - 6},${it.t - 3} L${it.x + it.w / 2 - 12},${it.t + 8} Q${it.x},${it.t + 2} ${it.x - it.w / 2 + 12},${it.t + 8}Z`}
            fill="var(--sky-4)"
            opacity="0.85"
          />
          {it.tower && (
            <g fill="var(--fore)" opacity="0.92">
              <rect x={it.x - 6} y={it.t - 80} width="12" height="74" />
              <path d={`M${it.x - 10},${it.t - 80} L${it.x},${it.t - 108} L${it.x + 10},${it.t - 80}Z`} />
              <path d={`M${it.x + 34},${it.t - 6} v-34 q18,-26 36,0 v34 h-9 v-30 q-9,-14 -18,0 v30z`} />
              <rect x={it.x - 44} y={it.t - 36} width="9" height="32" />
            </g>
          )}
        </g>
      ))}
    </>
  );
}

function Sea() {
  const bars = Array.from({ length: 14 }, (_, i) => ({ y: 556 + i * 21, w: 300 - i * 14, o: 0.6 - i * 0.03, a: i % 2 }));
  const r = rng(5);
  return (
    <>
      <rect y="540" width="1600" height="400" fill="url(#hseas)" />
      {bars.map((b, i) => (
        <rect
          key={i}
          x={SUN_X - b.w / 2}
          y={b.y}
          width={b.w}
          height="3.5"
          rx="2"
          fill="var(--sun-core)"
          opacity={b.o}
          className={b.a ? "anim-shimmer" : undefined}
          style={{ animationDelay: `${-i * 0.6}s` }}
        />
      ))}
      {Array.from({ length: 22 }, (_, i) => {
        const y = 575 + r() * 300;
        const w = 40 + r() * 160;
        return <rect key={`l${i}`} x={r() * 1600} y={y} width={w} height="1.6" fill="var(--sky-4)" opacity="0.22" />;
      })}
    </>
  );
}

/* ------------------------------------------------------------------ */

type Mode = "svg" | "3d" | "lite";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { theme } = useApp();
  const [mode, setMode] = useState<Mode>("svg");
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(true);
  const [stageRef, onScreen] = useOnScreen<HTMLDivElement>();

  // SVG fallback pointer values
  const mxRaw = useMotionValue(0);
  const myRaw = useMotionValue(0);
  const mx = useSpring(mxRaw, { stiffness: 40, damping: 18, mass: 0.8 });
  const my = useSpring(myRaw, { stiffness: 40, damping: 18, mass: 0.8 });
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const scrollY = useTransform(p, [0, 1], [0, 160]);
  const textY = useTransform(p, [0, 0.5], reduce ? [0, 0] : [0, -90]);
  const textO = useTransform(p, [0, 0.38], [1, 0]);
  const hintO = useTransform(p, [0, 0.12], [1, 0]);

  // choose the renderer once on the client
  useEffect(() => {
    if (reduce || !canUseWebGL()) {
      setMode("svg");
      return;
    }
    const small = window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
    setMode(small ? "lite" : "3d");
  }, [reduce]);

  // keep the SVG underneath until the canvas has finished fading in
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setFallback(false), 1100);
    return () => clearTimeout(t);
  }, [ready]);

  // scroll + theme feed the 3D scene
  useMotionValueEvent(p, "change", (v) => {
    sceneState.scroll = v;
  });
  useEffect(() => {
    sceneState.scroll = p.get();
  }, [p]);
  useEffect(() => {
    sceneState.nightTarget = theme === "night" ? 1 : 0;
  }, [theme]);

  // pointer for the SVG fallback
  useEffect(() => {
    if (reduce || mode !== "svg") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const el = ref.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      mxRaw.set(e.clientX / window.innerWidth - 0.5);
      myRaw.set(e.clientY / window.innerHeight - 0.5);
    };
    const leave = () => {
      mxRaw.set(0);
      myRaw.set(0);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [reduce, mode, mxRaw, myRaw]);

  const f = reduce ? 0 : 1;
  const common = { mx, my, scrollY };
  const stars = rng(31);
  const showSvg = mode === "svg" || fallback;

  return (
    <section ref={ref} id="top" className="relative h-[185svh] bg-midnight text-sand">
      <div ref={stageRef} className="sticky top-0 isolate h-[100svh] min-h-[640px] overflow-hidden">
        {mode !== "svg" && (
          <div className={`absolute inset-0 z-[1] transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}>
            <HeroScene lite={mode === "lite"} active={onScreen} onReady={() => setReady(true)} />
          </div>
        )}

        {showSvg && (
          <>
            {/* shared gradient defs, themed by CSS variables */}
            <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
              <defs>
                <linearGradient id="hsky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" style={stop("--sky-0")} />
                  <stop offset="0.32" style={stop("--sky-1")} />
                  <stop offset="0.5" style={stop("--sky-2")} />
                  <stop offset="0.6" style={stop("--sky-3")} />
                  <stop offset="0.66" style={stop("--sky-4")} />
                </linearGradient>
                <linearGradient id="hseas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" style={stop("--sea-0")} />
                  <stop offset="0.28" style={stop("--sea-1")} />
                  <stop offset="1" style={stop("--sea-2")} />
                </linearGradient>
                <radialGradient id="hglow">
                  <stop offset="0" style={stop("--sun-glow")} stopOpacity="0.85" />
                  <stop offset="0.4" style={stop("--sun-glow")} stopOpacity="0.28" />
                  <stop offset="1" style={stop("--sun-glow")} stopOpacity="0" />
                </radialGradient>
                <linearGradient id="hmist" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" style={stop("--sky-4")} stopOpacity="0" />
                  <stop offset="1" style={stop("--sky-4")} stopOpacity="0.75" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0" style={{ perspective: 1400 }}>
              <Layer {...common} depth={6 * f} lift={0.32 * f} z={0}>
                <SVG>
                  <rect width="1600" height="900" fill="url(#hsky)" />
                  <g style={{ opacity: "var(--stars)", transition: "opacity 1.2s ease" }} fill="var(--sun-core)">
                    {Array.from({ length: 110 }, (_, i) => {
                      const big = i % 14 === 0;
                      return (
                        <circle
                          key={i}
                          cx={stars() * 1600}
                          cy={stars() * 480}
                          r={big ? 1.8 : 0.6 + stars() * 0.9}
                          opacity={0.3 + stars() * 0.6}
                          className={big ? "anim-twinkle" : undefined}
                          style={big ? { animationDelay: `${-i * 0.3}s` } : undefined}
                        />
                      );
                    })}
                  </g>
                  <circle cx={SUN_X} cy="540" r="620" fill="url(#hglow)" />
                  <circle cx={SUN_X} cy="540" r="190" fill="var(--sun-core)" />
                  <circle cx={SUN_X} cy="540" r="190" fill="var(--sun-glow)" opacity="0.18" />
                  <g className="anim-drift" fill="var(--sky-4)" opacity="0.4">
                    <ellipse cx="420" cy="470" rx="330" ry="9" />
                    <ellipse cx="1280" cy="420" rx="260" ry="7" />
                    <ellipse cx="760" cy="330" rx="190" ry="5" />
                  </g>
                </SVG>
              </Layer>
              <Layer {...common} depth={12 * f} lift={0.26 * f} z={1}>
                <SVG>
                  <path d={ridge({ seed: 14, y: 550, amp: 120, steps: 14, x0: -60, x1: 1660, bottom: 600, sharp: 1 })} fill="var(--far)" />
                  <rect y="470" width="1600" height="90" fill="url(#hmist)" />
                </SVG>
              </Layer>
              <Layer {...common} depth={26 * f} lift={0.18 * f} z={2}>
                <SVG>
                  <Islands />
                </SVG>
              </Layer>
              <Layer {...common} depth={34 * f} lift={0.12 * f} z={3}>
                <SVG>
                  <path d={ridge({ seed: 52, y: 590, amp: 90, steps: 10, x0: -60, x1: 1660, bottom: 620 })} fill="var(--mid)" />
                </SVG>
              </Layer>
              <Layer {...common} depth={18 * f} lift={0.06 * f} z={4}>
                <SVG>
                  <Sea />
                </SVG>
              </Layer>
              <Layer {...common} depth={58 * f} lift={0} z={5}>
                <SVG>
                  <path d="M-80,900 L-80,640 Q60,590 190,650 Q300,700 340,790 Q370,860 460,900Z" fill="var(--fore)" />
                  <path d="M-80,900 L-80,730 Q30,700 120,760 Q200,810 230,900Z" fill="var(--fore)" />
                  <path d="M1680,900 L1680,760 Q1560,720 1450,780 Q1380,830 1360,900Z" fill="var(--fore)" />
                  <path d="M120,660 q10,-70 40,-110 M160,646 q30,-62 70,-84" stroke="var(--fore)" strokeWidth="5" fill="none" strokeLinecap="round" />
                </SVG>
              </Layer>
            </div>
          </>
        )}

        {/* legibility scrims keep the headline readable above the scene */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-[6] bg-[linear-gradient(to_top,rgba(10,16,42,0.78)_0%,rgba(10,16,42,0.35)_32%,transparent_60%),linear-gradient(to_right,rgba(10,16,42,0.35),transparent_55%),linear-gradient(to_bottom,rgba(10,16,42,0.45),transparent_22%)]" />

        <motion.div style={{ y: textY, opacity: textO }} className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-6xl px-5 pb-24 sm:px-8 sm:pb-28 lg:pb-32">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="mb-5 flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-sand/90"
          >
            <span aria-hidden className="h-px w-10 bg-sunset" />
            Dispatch No. 001 — an atlas of impossible places
          </motion.p>
          <h1 className="font-serif text-[clamp(3.4rem,10.5vw,9.5rem)] leading-[0.88] tracking-[-0.02em] text-[#FFF1DA] [text-shadow:0_2px_40px_rgba(10,16,42,0.45)]">
            <span className="block overflow-hidden pb-[0.08em]">
              <motion.span className="block" initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ duration: 1.4, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}>
                The world
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.1em]">
              <motion.span className="block" initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ duration: 1.4, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                is <em className="text-sunset">not</em> enough.
              </motion.span>
            </span>
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1 }}
            className="mt-6 max-w-md text-base leading-relaxed text-sand sm:text-lg"
          >
            Somewhere beyond the familiar, another world is waiting.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1.15 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
          >
            <Magnetic>
              <a
                href="#destinations"
                onClick={(e) => {
                  e.preventDefault();
                  smoothScroll("destinations");
                }}
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-sunset px-7 py-4 text-sm font-semibold tracking-wide text-midnight transition-colors hover:bg-sand"
              >
                Explore the unknown
                <Arrow className="transition-transform duration-500 group-hover:translate-x-1" />
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href="#find"
                onClick={(e) => {
                  e.preventDefault();
                  smoothScroll("find");
                }}
                className="inline-flex items-center justify-center rounded-full border border-sand/60 px-7 py-4 text-sm font-semibold tracking-wide text-sand transition-colors hover:border-sand hover:bg-sand/10"
              >
                Discover your destination
              </a>
            </Magnetic>
          </motion.div>
        </motion.div>

        <motion.div style={{ opacity: hintO }} className="pointer-events-none absolute inset-x-0 bottom-6 z-10 mx-auto flex max-w-6xl items-end justify-between px-5 text-[0.66rem] font-medium uppercase tracking-[0.26em] text-sand/80 sm:px-8">
          <p className="hidden sm:block">
            Now viewing
            <br />
            <span className="text-sand">18.4° N · 112.9° E</span>
          </p>
          <div className="mx-auto flex flex-col items-center gap-3 sm:mx-0">
            <span>Scroll</span>
            <span aria-hidden className="relative h-10 w-px overflow-hidden bg-sand/25">
              <span className="anim-cue absolute inset-0 bg-sand" />
            </span>
          </div>
          <p className="hidden text-right sm:block">
            Local time
            <br />
            <span className="text-sand">Always golden hour</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
