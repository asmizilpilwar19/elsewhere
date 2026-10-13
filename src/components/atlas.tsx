"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { blob, rng } from "@/lib/svg";
import { destinations, regions, type RegionId } from "@/data/destinations";
import { DestinationScene } from "./scenes";
import { useApp } from "./providers";
import { SaveButton } from "./destinations";
import { Arrow, Eyebrow, Magnetic, Reveal } from "./ui";

const W = 1200;
const H = 700;

const landColor: Record<RegionId, string> = {
  "ember-reach": "#F28C62",
  "pale-highlands": "#D9A0A4",
  "hush-sea": "#788DAD",
  "far-reaches": "#F5D9B5",
};

/** Each land mass is tagged with the region it belongs to. */
const land: { region: RegionId; d: string }[] = [
  { region: "ember-reach", d: blob(215, 350, 200, 175, 3, 11) },
  { region: "ember-reach", d: blob(110, 545, 80, 50, 14, 8) },
  { region: "pale-highlands", d: blob(540, 195, 250, 110, 8, 12) },
  { region: "pale-highlands", d: blob(330, 110, 70, 40, 21, 8) },
  { region: "hush-sea", d: blob(440, 510, 150, 85, 5, 10) },
  { region: "hush-sea", d: blob(690, 430, 55, 28, 17, 8) },
  { region: "hush-sea", d: blob(770, 480, 40, 22, 23, 8) },
  { region: "hush-sea", d: blob(610, 500, 34, 18, 27, 8) },
  { region: "hush-sea", d: blob(740, 380, 26, 14, 31, 7) },
  { region: "far-reaches", d: blob(1010, 400, 105, 80, 2, 10) },
  { region: "far-reaches", d: blob(1110, 540, 38, 22, 35, 7) },
];

function routePath() {
  const pts = destinations.map((d) => d.map);
  let path = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const bend = i % 2 ? -70 : 70;
    path += ` Q${mx},${my + bend} ${b.x},${b.y}`;
  }
  return path;
}

export function Atlas() {
  const { openDestination } = useApp();
  const [selected, setSelected] = useState(destinations[0].slug);
  const [region, setRegion] = useState<RegionId | "all">("all");
  const mapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(mapRef, { once: true, margin: "0px 0px -20% 0px" });
  const route = useMemo(routePath, []);
  const grid = useMemo(() => {
    const r = rng(3);
    return Array.from({ length: 70 }, () => ({ x: r() * W, y: r() * H, o: 0.2 + r() * 0.5 }));
  }, []);

  const current = destinations.find((d) => d.slug === selected) ?? destinations[0];
  const activeRegion = regions.find((r) => r.id === region);

  const pickRegion = (id: RegionId | "all") => {
    setRegion(id);
    if (id !== "all") {
      const first = destinations.find((d) => d.region === id);
      if (first && current.region !== id) setSelected(first.slug);
    }
  };

  return (
    <section id="atlas" className="below-fold relative overflow-hidden bg-deep px-5 py-24 text-sand sm:px-8 sm:py-36">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_20%,rgba(242,140,98,0.14),transparent_70%),radial-gradient(50%_50%_at_10%_90%,rgba(217,160,164,0.1),transparent_70%)]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Reveal>
              <Eyebrow className="text-sunset">The Dream Atlas</Eyebrow>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="mt-6 font-serif text-[clamp(2.8rem,7vw,6rem)] leading-[0.92]">
                A map of places
                <br />
                that <em className="text-sunset">refuse</em> to hold still.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.2} className="lg:col-span-5">
            <p className="max-w-md leading-relaxed text-sand/80">
              Choose a region, follow the wandering route, or select any marker to preview a destination before you step inside.
            </p>
          </Reveal>
        </div>

        <div role="group" aria-label="Filter by region" className="no-scrollbar mt-12 flex gap-2 overflow-x-auto pb-2">
          {[{ id: "all" as const, name: "All regions" }, ...regions].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => pickRegion(r.id)}
              aria-pressed={region === r.id}
              className={`shrink-0 rounded-full border px-5 py-2.5 text-[0.78rem] font-semibold uppercase tracking-[0.16em] transition-colors ${
                region === r.id ? "border-sunset bg-sunset text-midnight" : "border-sand/30 text-sand hover:border-sand"
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
        <p className="mt-4 min-h-[3rem] max-w-2xl font-serif text-xl italic text-sand/85" aria-live="polite">
          {activeRegion ? activeRegion.text : "Six places, one wandering route. Nobody has ever travelled it the same way twice."}
        </p>

        <div className="mt-6 grid gap-8 lg:grid-cols-12">
          <div className="no-scrollbar -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0 lg:col-span-8">
            <div
              ref={mapRef}
              className="relative aspect-[12/7] min-w-[720px] overflow-hidden rounded-[1.75rem] border border-sand/15 bg-[#0e1a38]"
            >
              <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" role="img" aria-label="Illustrated map of the Dream Atlas showing six fictional destinations joined by a wandering route." focusable="false">
                <defs>
                  <radialGradient id="seaglow" cx="0.5" cy="0.45" r="0.7">
                    <stop offset="0" stopColor="#2a4274" />
                    <stop offset="1" stopColor="#0c1730" />
                  </radialGradient>
                </defs>
                <rect width={W} height={H} fill="url(#seaglow)" />
                {/* graticule */}
                <g stroke="#F5D9B5" strokeOpacity="0.07" strokeWidth="1">
                  {Array.from({ length: 11 }, (_, i) => (
                    <line key={`v${i}`} x1={(i + 1) * 100} y1="0" x2={(i + 1) * 100} y2={H} />
                  ))}
                  {Array.from({ length: 6 }, (_, i) => (
                    <line key={`h${i}`} x1="0" y1={(i + 1) * 100} x2={W} y2={(i + 1) * 100} />
                  ))}
                </g>
                {grid.map((g, i) => (
                  <circle key={i} cx={g.x} cy={g.y} r="1.2" fill="#F5D9B5" opacity={g.o * 0.5} />
                ))}
                {/* wave marks */}
                <g stroke="#788DAD" strokeOpacity="0.35" fill="none" strokeLinecap="round">
                  {[[330, 640], [620, 610], [860, 600], [900, 250], [1090, 220], [130, 190], [760, 300], [330, 400]].map(([x, y]) => (
                    <path key={`${x}${y}`} d={`M${x},${y} q10,-8 20,0 t20,0 t20,0`} />
                  ))}
                </g>

                {/* land */}
                {land.map((l, i) => {
                  const on = region === "all" || region === l.region;
                  return (
                    <path
                      key={i}
                      d={l.d}
                      fill={landColor[l.region]}
                      fillOpacity={on ? 0.78 : 0.14}
                      stroke="#F5D9B5"
                      strokeOpacity={on ? 0.8 : 0.2}
                      strokeWidth="1.5"
                      style={{ transition: "fill-opacity .6s, stroke-opacity .6s", cursor: "pointer" }}
                      onClick={() => pickRegion(region === l.region ? "all" : l.region)}
                    />
                  );
                })}
                {/* contour lines */}
                <g fill="none" stroke="#17294C" strokeOpacity="0.25" strokeWidth="1.2" pointerEvents="none">
                  <path d={blob(215, 350, 140, 115, 3, 11)} />
                  <path d={blob(215, 350, 80, 60, 3, 11)} />
                  <path d={blob(540, 195, 170, 70, 8, 12)} />
                  <path d={blob(440, 510, 90, 50, 5, 10)} />
                  <path d={blob(1010, 400, 62, 46, 2, 10)} />
                </g>
                {/* reef ring around Velora */}
                <circle cx="1010" cy="400" r="128" fill="none" stroke="#9AF3E1" strokeOpacity="0.5" strokeDasharray="2 7" strokeWidth="2" />
                {/* floating city */}
                <g pointerEvents="none">
                  <ellipse cx="790" cy="140" rx="64" ry="14" fill="#F5D9B5" opacity="0.18" />
                  <circle cx="790" cy="125" r="46" fill="none" stroke="#F5D9B5" strokeOpacity="0.5" strokeDasharray="3 6" />
                </g>

                {/* route */}
                <motion.path
                  d={route}
                  fill="none"
                  stroke="#F5D9B5"
                  strokeOpacity="0.45"
                  strokeWidth="1.6"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: inView ? 1 : 0 }}
                  transition={{ duration: 3.2, ease: [0.45, 0, 0.2, 1] }}
                />
                <path d={route} fill="none" stroke="#F28C62" strokeWidth="2.4" strokeDasharray="4 16" strokeLinecap="round" className="anim-flow" opacity={inView ? 0.95 : 0} style={{ transition: "opacity 1s 2.4s" }} />

                {/* atmospheric labels */}
                <g fontFamily="var(--font-instrument), serif" fontStyle="italic" fill="#F5D9B5" textAnchor="middle" pointerEvents="none">
                  <text x="215" y="250" fontSize="26" opacity="0.9">The Ember Reach</text>
                  <text x="540" y="262" fontSize="26" opacity="0.9">The Pale Highlands</text>
                  <text x="590" y="590" fontSize="34" opacity="0.5" letterSpacing="6">THE HUSH SEA</text>
                  <text x="1010" y="520" fontSize="24" opacity="0.9">The Far Reaches</text>
                  <text x="130" y="650" fontSize="18" opacity="0.45">here, the maps agree</text>
                  <text x="790" y="62" fontSize="17" opacity="0.6">drifting, never charted</text>
                </g>

                {/* compass */}
                <g transform="translate(1100 100)" stroke="#F5D9B5" strokeOpacity="0.7" fill="none" pointerEvents="none">
                  <circle r="34" strokeOpacity="0.35" />
                  <path d="M0,-44 L7,0 L0,44 L-7,0Z" fill="#F5D9B5" fillOpacity="0.15" />
                  <path d="M-44,0 L0,-7 L44,0 L0,7Z" strokeOpacity="0.4" />
                  <text y="-52" textAnchor="middle" fontSize="13" fill="#F5D9B5" stroke="none">N</text>
                </g>
              </svg>

              {/* markers */}
              {destinations.map((d) => {
                const on = region === "all" || region === d.region;
                const sel = selected === d.slug;
                return (
                  <button
                    key={d.slug}
                    type="button"
                    onClick={() => setSelected(d.slug)}
                    aria-pressed={sel}
                    aria-label={`${d.name}, ${d.coordinates}`}
                    className={`group absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500 ${on ? "opacity-100" : "opacity-40"}`}
                    style={{ left: `${(d.map.x / W) * 100}%`, top: `${(d.map.y / H) * 100}%` }}
                  >
                    <span className="relative grid h-11 w-11 place-items-center">
                      {sel && <span aria-hidden className="anim-ping absolute h-6 w-6 rounded-full bg-sunset" />}
                      <span
                        className={`relative grid h-7 w-7 place-items-center rounded-full border-2 text-[0.7rem] font-bold transition-all duration-500 group-hover:scale-125 ${
                          sel ? "scale-110 border-sand bg-sunset text-midnight" : "border-sand bg-midnight text-sand"
                        }`}
                      >
                        {d.number}
                      </span>
                    </span>
                    <span
                      className={`pointer-events-none absolute left-1/2 top-full -mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-midnight/90 px-3 py-1 font-serif text-lg text-sand transition-opacity duration-300 ${
                        sel ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                      }`}
                    >
                      {d.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current.slug}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden rounded-[1.75rem] border border-sand/15 bg-white/[0.04]"
              >
                <div className="veil relative aspect-[16/10]">
                  <DestinationScene slug={current.slug} className="absolute inset-0" />
                  <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgba(10,16,42,0.7),transparent_60%)]" />
                  <SaveButton slug={current.slug} name={current.name} className="absolute right-3 top-3" />
                  <p className="absolute bottom-3 left-4 text-[0.66rem] font-semibold uppercase tracking-[0.26em]">
                    No. {current.number} · {current.coordinates}
                  </p>
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-4xl text-[#FFF1DA]">{current.name}</h3>
                  <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-sunset">{current.atmosphere}</p>
                  <p className="mt-4 text-[0.95rem] leading-relaxed text-sand/85">{current.intro}</p>
                  <Magnetic>
                  <button
                    type="button"
                    onClick={() => openDestination(current.slug)}
                    className="group mt-6 inline-flex items-center gap-3 rounded-full bg-sand px-6 py-3 text-sm font-semibold text-midnight transition-colors hover:bg-sunset"
                  >
                    Open destination
                    <Arrow className="transition-transform duration-500 group-hover:translate-x-1" />
                  </button>
                  </Magnetic>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
