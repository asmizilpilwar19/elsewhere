"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { moods, recommend, terrains, type Mood, type Terrain } from "@/data/destinations";
import { DestinationScene } from "./scenes";
import { useApp } from "./providers";
import { SaveButton } from "./destinations";
import { Arrow, Eyebrow, Magnetic, Reveal } from "./ui";

export function Quiz() {
  const { openDestination } = useApp();
  const [mood, setMood] = useState<Mood | null>(null);
  const [terrain, setTerrain] = useState<Terrain | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const touched = useRef(false);

  const step = !mood ? 0 : !terrain ? 1 : 2;
  const result = mood && terrain ? recommend(mood, terrain) : null;
  const m = moods.find((x) => x.id === mood);
  const t = terrains.find((x) => x.id === terrain);

  // after the visitor answers, move focus to the new step's heading
  useEffect(() => {
    if (touched.current) heading.current?.focus({ preventScroll: true });
  }, [step]);

  const retake = () => {
    touched.current = true;
    setMood(null);
    setTerrain(null);
  };

  return (
    <section id="find" className="below-fold relative overflow-hidden bg-deep px-5 py-24 text-sand sm:px-8 sm:py-36">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_110%,rgba(242,140,98,0.35),transparent_70%),radial-gradient(40%_40%_at_90%_0%,rgba(120,141,173,0.25),transparent_70%)]" />
      <div className="relative mx-auto max-w-5xl">
        <div className="text-center">
          <Reveal className="flex justify-center">
            <Eyebrow className="text-sunset">Find your Elsewhere</Eyebrow>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-6 font-serif text-[clamp(2.8rem,7vw,6rem)] leading-[0.92]">
              Which world is <em className="text-sunset">looking</em> for you?
            </h2>
          </Reveal>
        </div>

        <div className="mt-14 rounded-[2rem] border border-sand/15 bg-midnight/50 p-6 sm:p-10 lg:p-12">
          <div className="flex items-center justify-between text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-sand/70">
            <span>{step < 2 ? `Question ${step + 1} of 2` : "Your destination"}</span>
            <div className="flex gap-2" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span key={i} className={`h-1 w-10 rounded-full transition-colors duration-500 ${i <= step ? "bg-sunset" : "bg-sand/20"}`} />
              ))}
            </div>
          </div>

          <div aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              {step === 0 && (
                <motion.div key="q1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.45 }}>
                  <h3 ref={heading} tabIndex={-1} className="mt-8 font-serif text-4xl outline-none sm:text-5xl">
                    What are you searching for?
                  </h3>
                  <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {moods.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => {
                          touched.current = true;
                          setMood(o.id);
                        }}
                        className="group rounded-2xl border border-sand/25 p-5 text-left transition-colors hover:border-sunset hover:bg-sunset/10 sm:min-h-[150px]"
                      >
                        <span className="block font-serif text-3xl text-[#FFF1DA]">{o.label}</span>
                        <span className="mt-2 block text-[0.85rem] leading-snug text-sand/75">{o.line}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div key="q2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.45 }}>
                  <h3 ref={heading} tabIndex={-1} className="mt-8 font-serif text-4xl outline-none sm:text-5xl">
                    Which landscape calls to you?
                  </h3>
                  <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {terrains.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setTerrain(o.id)}
                        className="group rounded-2xl border border-sand/25 p-5 text-left transition-colors hover:border-sunset hover:bg-sunset/10 sm:min-h-[150px]"
                      >
                        <span className="block font-serif text-3xl text-[#FFF1DA]">{o.label}</span>
                        <span className="mt-2 block text-[0.85rem] leading-snug text-sand/75">{o.line}</span>
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => setMood(null)} className="mt-8 text-sm text-sand/80 underline-offset-4 hover:underline">
                    ← Back to question 1
                  </button>
                </motion.div>
              )}

              {step === 2 && result && m && t && (
                <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-12">
                  <div className="veil relative aspect-[4/3] overflow-hidden rounded-3xl lg:aspect-auto lg:min-h-[420px]">
                    <DestinationScene slug={result.slug} className="absolute inset-0" />
                    <SaveButton slug={result.slug} name={result.name} className="absolute right-4 top-4" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-sunset">
                      Your Elsewhere · No. {result.number}
                    </p>
                    <h3 ref={heading} tabIndex={-1} className="mt-3 font-serif text-[clamp(3rem,6vw,5rem)] leading-[0.92] text-[#FFF1DA] outline-none">
                      {result.name}
                    </h3>
                    <p className="mt-6 leading-[1.75] text-sand/90">
                      You are searching for <strong className="font-semibold text-sand">{m.label.toLowerCase()}</strong> — {m.line} — and you picture{" "}
                      <strong className="font-semibold text-sand">{t.label.toLowerCase()}</strong>: {t.line}. {result.name} answers both. {result.intro}
                    </p>
                    <p className="mt-4 font-serif text-2xl italic text-sunset">“{result.poem}”</p>
                    <div className="mt-8 flex flex-wrap gap-3">
                      <Magnetic>
                      <button
                        type="button"
                        onClick={() => openDestination(result.slug)}
                        className="group inline-flex items-center gap-3 rounded-full bg-sunset px-7 py-4 text-sm font-semibold text-midnight transition-colors hover:bg-sand"
                      >
                        Explore {result.name}
                        <Arrow className="transition-transform duration-500 group-hover:translate-x-1" />
                      </button>
                      </Magnetic>
                      <button type="button" onClick={retake} className="rounded-full border border-sand/50 px-7 py-4 text-sm font-semibold transition-colors hover:bg-sand/10">
                        Retake the quiz
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
