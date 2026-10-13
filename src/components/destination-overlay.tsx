"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { bySlug, destinations, regions } from "@/data/destinations";
import { sceneState } from "@/lib/scene-state";
import { DestinationScene } from "./scenes";
import { useApp } from "./providers";
import { canUseWebGL, useOnScreen } from "./three/common";
import { Arrow, Close, Magnetic, PlaceMark } from "./ui";

const WorldsCanvas = dynamic(() => import("./three/worlds"), { ssr: false });

const ease = [0.16, 1, 0.3, 1] as const;

/** The live 3D world for the chosen destination, with an SVG scene as the fallback. */
function WorldStage({ slug }: { slug: string }) {
  const reduce = useReducedMotion();
  const [stageRef, onScreen] = useOnScreen<HTMLDivElement>();
  const [mode, setMode] = useState<"svg" | "3d" | "lite">("svg");
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(true);
  const { theme } = useApp();

  useEffect(() => {
    if (reduce || !canUseWebGL()) return setMode("svg");
    setMode(window.matchMedia("(max-width: 767px), (pointer: coarse)").matches ? "lite" : "3d");
  }, [reduce]);

  // keep the SVG underneath until the canvas has finished fading in
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setFallback(false), 1100);
    return () => clearTimeout(t);
  }, [ready]);

  useEffect(() => {
    sceneState.nightTarget = theme === "night" ? 1 : 0;
  }, [theme]);

  return (
    <div ref={stageRef} className="absolute inset-0">
      {(mode === "svg" || fallback) && (
        <AnimatePresence initial={false}>
          <motion.div key={slug} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
            <DestinationScene slug={slug} className="absolute inset-0" />
          </motion.div>
        </AnimatePresence>
      )}
      {mode !== "svg" && (
        <div className={`absolute inset-0 transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}>
          <WorldsCanvas slug={slug} lite={mode === "lite"} active={onScreen} onReady={() => setReady(true)} />
        </div>
      )}
    </div>
  );
}

export function DestinationOverlay() {
  const { openSlug, origin, closeDestination, openDestination, isSaved, toggleSaved } = useApp();
  const d = openSlug ? bySlug(openSlug) : undefined;
  const panel = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const isOpen = Boolean(d);

  // lock page scroll, remember opener, restore focus
  useEffect(() => {
    if (!isOpen) return;
    opener.current = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = prev;
      opener.current?.focus?.({ preventScroll: true });
    };
  }, [isOpen]);

  // reset scroll when moving between destinations
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [openSlug]);

  const step = useCallback(
    (dir: 1 | -1) => {
      if (!openSlug) return;
      const i = destinations.findIndex((x) => x.slug === openSlug);
      openDestination(destinations[(i + dir + destinations.length) % destinations.length].slug);
    },
    [openSlug, openDestination],
  );

  // Escape closes, Tab stays inside the dialog
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDestination();
        return;
      }
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeDestination]);

  const saved = d ? isSaved(d.slug) : false;
  const region = d ? regions.find((r) => r.id === d.region) : undefined;
  const idx = d ? destinations.findIndex((x) => x.slug === d.slug) : 0;
  const prev = destinations[(idx - 1 + destinations.length) % destinations.length];
  const next = destinations[(idx + 1) % destinations.length];

  // the portal grows out of the card that was clicked
  const vw = typeof window === "undefined" ? 1440 : window.innerWidth;
  const vh = typeof window === "undefined" ? 900 : window.innerHeight;
  const ox = origin?.x ?? vw / 2;
  const oy = origin?.y ?? vh / 2;
  const R = Math.hypot(Math.max(ox, vw - ox), Math.max(oy, vh - oy)) + 40;
  const closed = `circle(0px at ${ox}px ${oy}px)`;
  const opened = `circle(${R}px at ${ox}px ${oy}px)`;

  return (
    <AnimatePresence>
      {d && (
        <motion.div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dest-title"
          className="fixed inset-0 z-[80] bg-deep text-sand"
          initial={{ clipPath: closed }}
          animate={{ clipPath: opened }}
          exit={{ clipPath: closed }}
          transition={{ duration: 0.95, ease: [0.7, 0, 0.2, 1] }}
        >
          <div ref={scroller} className="h-full overflow-y-auto overscroll-contain">
            <div className="veil relative h-[72svh] min-h-[460px] overflow-hidden">
              <WorldStage slug={d.slug} />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,var(--deep)_0%,rgba(10,16,42,0.3)_35%,rgba(10,16,42,0)_65%,rgba(10,16,42,0.25)_100%)]" />
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={d.slug}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.6, ease }}
                  className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-5 pb-10 sm:px-8"
                >
                  <p className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.7rem] font-semibold uppercase tracking-[0.28em]">
                    <span>No. {d.number} / 06</span>
                    <span aria-hidden className="h-px w-8 bg-sunset" />
                    <span>{d.atmosphere}</span>
                  </p>
                  <h2 id="dest-title" className="font-serif text-[clamp(3.4rem,11vw,9rem)] leading-[0.88] tracking-[-0.02em] text-[#FFF1DA] [text-shadow:0_2px_40px_rgba(10,16,42,0.5)]">
                    {d.name}
                  </h2>
                </motion.div>
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={d.slug} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <div className="mx-auto grid max-w-6xl gap-14 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-12">
                  <div className="lg:col-span-7">
                    <p className="font-serif text-[clamp(1.6rem,3vw,2.4rem)] italic leading-snug text-sunset">“{d.poem}”</p>
                    <div className="mt-8 space-y-5 text-[1.05rem] leading-[1.75] text-sand/90">
                      {d.story.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>

                    <h3 className="mt-14 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-sand/70">Highlights</h3>
                    <ul className="mt-4 divide-y divide-sand/15 border-y border-sand/15">
                      {d.highlights.map((h, i) => (
                        <li key={h.title} className="grid gap-1 py-5 sm:grid-cols-[3rem_1fr] sm:gap-4">
                          <span className="font-serif text-2xl text-sunset">{String(i + 1).padStart(2, "0")}</span>
                          <div>
                            <p className="font-serif text-2xl text-[#FFF1DA]">{h.title}</p>
                            <p className="mt-1 text-[0.95rem] leading-relaxed text-sand/80">{h.text}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <aside className="lg:col-span-5">
                    <div className="rounded-3xl border border-sand/15 bg-white/[0.04] p-6 sm:p-8">
                      <dl className="space-y-5 text-sm">
                        {[
                          ["Coordinates", d.coordinates],
                          ["Region", region?.name ?? ""],
                          ["Best time to arrive", d.season],
                          ["Atmosphere", d.atmosphere],
                        ].map(([k, v]) => (
                          <div key={k} className="flex flex-col gap-1 border-b border-sand/10 pb-4 last:border-0 last:pb-0">
                            <dt className="text-[0.66rem] font-semibold uppercase tracking-[0.26em] text-sand/60">{k}</dt>
                            <dd className="font-serif text-xl text-[#FFF1DA]">{v}</dd>
                          </div>
                        ))}
                      </dl>
                      <button
                        type="button"
                        onClick={() => toggleSaved(d.slug)}
                        aria-pressed={saved}
                        className={`mt-8 flex w-full items-center justify-center gap-3 rounded-full px-6 py-4 text-sm font-semibold transition-colors ${
                          saved ? "bg-sand/10 text-sand ring-1 ring-sand/40 hover:bg-sand/20" : "bg-sunset text-midnight hover:bg-sand"
                        }`}
                      >
                        <PlaceMark filled={saved} />
                        {saved ? "Saved to your journal — remove" : "Save to my journal"}
                      </button>
                      {saved && (
                        <a href="#journal" onClick={closeDestination} className="mt-3 block text-center text-sm text-sand/80 underline-offset-4 hover:underline">
                          Open my journal
                        </a>
                      )}
                    </div>
                  </aside>
                </div>

                <div className="mx-auto grid max-w-6xl gap-4 px-5 pb-20 sm:grid-cols-2 sm:px-8">
                  {[
                    { to: prev, label: "Travel to the previous world", dir: -1 as const },
                    { to: next, label: "Travel to the next world", dir: 1 as const },
                  ].map(({ to, label, dir }) => (
                    <button key={dir} type="button" onClick={() => step(dir)} className="group veil relative h-40 overflow-hidden rounded-2xl text-left">
                      <DestinationScene slug={to.slug} className="absolute inset-0 transition-transform duration-1000 group-hover:scale-105" />
                      <span aria-hidden className="absolute inset-0 bg-midnight/55 transition-colors group-hover:bg-midnight/40" />
                      <span className="absolute inset-0 flex flex-col justify-end p-5">
                        <span className="text-[0.66rem] font-semibold uppercase tracking-[0.26em] text-sand/80">{label}</span>
                        <span className="flex items-center gap-3 font-serif text-3xl text-[#FFF1DA]">
                          {to.name}
                          <Arrow className={dir === -1 ? "rotate-180" : ""} />
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="absolute right-4 top-4 z-10 sm:right-8 sm:top-6">
            <Magnetic strength={0.4}>
              <button
                ref={closeBtn}
                type="button"
                onClick={closeDestination}
                aria-label="Close destination"
                className="grid h-12 w-12 place-items-center rounded-full bg-midnight/80 text-sand transition-colors hover:bg-sunset hover:text-midnight"
              >
                <Close />
              </button>
            </Magnetic>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
