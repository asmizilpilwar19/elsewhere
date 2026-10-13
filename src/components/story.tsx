"use client";

import { Eyebrow, Reveal } from "./ui";

const principles = [
  { n: "I", t: "We map feeling, not distance", d: "Every coordinate in our atlas is measured in how a place makes you slow down." },
  { n: "II", t: "Every place is true somewhere", d: "None of these worlds can be visited by plane. All of them have been visited by someone, in some way." },
  { n: "III", t: "Leave room for the unknown", d: "A good map leaves its edges blank. We keep ours open, and we keep adding to them." },
];

export function Story() {
  return (
    <section id="story" className="below-fold relative overflow-hidden bg-[var(--story)] px-5 py-24 text-ink sm:px-8 sm:py-36" style={{ transition: "background-color .9s" }}>
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <Eyebrow>Our story</Eyebrow>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="mt-6 font-serif text-[clamp(2.8rem,7vw,6rem)] leading-[0.92]">
                We built a travel agency for <em>places that do not exist</em>.
              </h2>
            </Reveal>
          </div>
          <div className="space-y-6 text-[1.05rem] leading-[1.75] lg:col-span-5 lg:pt-16">
            <Reveal>
              <p>
                ELSEWHERE began with a simple question: what if the most memorable journey was one you could only take with your imagination?
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <p>
                So we gathered a small team of cartographers, painters and daydreamers, and asked them to chart the worlds they kept returning to — the desert with too many suns, the coast that never wakes, the city with no ground.
              </p>
            </Reveal>
          </div>
        </div>

        <ol className="mt-20 grid gap-px overflow-hidden rounded-3xl bg-ink/15 md:grid-cols-3">
          {principles.map((p, i) => (
            <Reveal as="li" key={p.n} delay={i * 0.12} className="bg-[var(--story)] p-8 sm:p-10">
              <span className="font-serif text-5xl opacity-70">{p.n}</span>
              <h3 className="mt-6 font-serif text-3xl leading-tight">{p.t}</h3>
              <p className="mt-4 text-[0.95rem] leading-relaxed opacity-80">{p.d}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
