"use client";

import { AnimatePresence, motion } from "motion/react";
import { bySlug, destinations } from "@/data/destinations";
import { DestinationScene } from "./scenes";
import { useApp } from "./providers";
import { Arrow, Close, Eyebrow, PlaceMark, Reveal } from "./ui";

export function Journal() {
  const { saved, toggleSaved, clearSaved, openDestination, isSaved } = useApp();
  const items = saved.map(bySlug).filter((d): d is NonNullable<typeof d> => Boolean(d));
  const unsaved = destinations.filter((d) => !isSaved(d.slug));

  return (
    <section id="journal" className="below-fold relative bg-paper px-5 py-24 sm:px-8 sm:py-36">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Reveal>
              <Eyebrow className="text-accent">Travel journal</Eyebrow>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="mt-6 font-serif text-[clamp(2.8rem,7vw,6rem)] leading-[0.92]">
                Places you <em className="text-accent">kept</em>.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.2}>
            <p className="max-w-sm leading-relaxed opacity-85">
              Your collection lives in this browser, so it will still be here when you return. No account needed.
            </p>
          </Reveal>
        </div>

        <div className="mt-6 flex items-center justify-between text-sm" aria-live="polite">
          <p className="font-semibold uppercase tracking-[0.2em] text-[0.72rem]">
            {items.length} of {destinations.length} saved
          </p>
          {items.length > 0 && (
            <button type="button" onClick={clearSaved} className="underline underline-offset-4 opacity-80 hover:opacity-100">
              Clear journal
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <Reveal>
            <div className="mt-6 grid place-items-center rounded-[2rem] border border-dashed border-ink/30 px-6 py-20 text-center">
              <PlaceMark size={44} />
              <p className="mt-6 font-serif text-4xl">Your journal is empty.</p>
              <p className="mt-3 max-w-md opacity-80">
                Save a destination with the pin icon on any card, or add one below to begin your collection.
              </p>
              <a href="#destinations" className="mt-8 rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-paper transition-colors hover:bg-sunset hover:text-midnight">
                Browse destinations
              </a>
            </div>
          </Reveal>
        ) : (
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {items.map((d) => (
                <motion.li
                  key={d.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="veil group relative aspect-[4/5] overflow-hidden rounded-3xl bg-midnight text-sand"
                >
                  <DestinationScene slug={d.slug} className="absolute inset-0 transition-transform duration-[1200ms] group-hover:scale-105" />
                  <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgba(10,16,42,0.9),transparent_60%)]" />
                  <button
                    type="button"
                    onClick={() => toggleSaved(d.slug)}
                    aria-label={`Remove ${d.name} from your journal`}
                    className="absolute right-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-full bg-midnight/70 transition-colors hover:bg-sunset hover:text-midnight"
                  >
                    <Close />
                  </button>
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <p className="text-[0.66rem] font-semibold uppercase tracking-[0.26em] opacity-80">No. {d.number} · {d.coordinates}</p>
                    <h3 className="mt-2 font-serif text-4xl text-[#FFF1DA]">{d.name}</h3>
                    <p className="mt-2 text-sm leading-snug opacity-85">{d.poem}</p>
                    <button
                      type="button"
                      onClick={() => openDestination(d.slug)}
                      aria-label={`Revisit ${d.name}`}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold after:absolute after:inset-0 after:z-10 after:content-['']"
                    >
                      Revisit <Arrow />
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}

        {unsaved.length > 0 && (
          <div className="mt-12">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] opacity-70">Add to your journal</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {unsaved.map((d) => (
                <li key={d.slug}>
                  <button
                    type="button"
                    onClick={() => toggleSaved(d.slug)}
                    aria-label={`Save ${d.name} to your journal`}
                    className="inline-flex items-center gap-2 rounded-full border border-ink/35 px-4 py-2.5 text-sm font-medium transition-colors hover:border-ink hover:bg-ink hover:text-paper"
                  >
                    <span aria-hidden className="text-lg leading-none">+</span>
                    {d.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
