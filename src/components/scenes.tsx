import { useId, type ReactNode } from "react";
import { blob, floatingRock, rng, ridge } from "@/lib/svg";

/* ------------------------------------------------------------------ */
/*  Shared bits                                                        */
/* ------------------------------------------------------------------ */

function useUid() {
  return "s" + useId().replace(/[^a-zA-Z0-9]/g, "");
}

function Svg({ children, label, className }: { children: ReactNode; label: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 900"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={label}
      className={className}
      focusable="false"
    >
      {children}
    </svg>
  );
}

function Grad({
  id,
  stops,
  x2 = 0,
  y2 = 1,
}: {
  id: string;
  stops: [number, string, number?][];
  x2?: number;
  y2?: number;
}) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
      {stops.map(([o, c, op]) => (
        <stop key={o + c} offset={o} stopColor={c} stopOpacity={op ?? 1} />
      ))}
    </linearGradient>
  );
}

function Glow({ id, color, inner = 0.9 }: { id: string; color: string; inner?: number }) {
  return (
    <radialGradient id={id}>
      <stop offset="0" stopColor={color} stopOpacity={inner} />
      <stop offset="0.45" stopColor={color} stopOpacity={inner * 0.28} />
      <stop offset="1" stopColor={color} stopOpacity="0" />
    </radialGradient>
  );
}

function Stars({ seed, count, maxY, color = "#F5D9B5" }: { seed: number; count: number; maxY: number; color?: string }) {
  const r = rng(seed);
  return (
    <g fill={color}>
      {Array.from({ length: count }, (_, i) => {
        const big = r() > 0.9;
        return (
          <circle
            key={i}
            cx={r() * 1200}
            cy={r() * maxY}
            r={big ? 1.9 : 0.5 + r() * 0.9}
            opacity={0.25 + r() * 0.7}
          />
        );
      })}
    </g>
  );
}

function Cloud({ x, y, w, color, opacity = 1 }: { x: number; y: number; w: number; color: string; opacity?: number }) {
  const h = w * 0.16;
  return (
    <g fill={color} opacity={opacity}>
      <ellipse cx={x} cy={y} rx={w / 2} ry={h / 2} />
      <ellipse cx={x - w * 0.18} cy={y - h * 0.35} rx={w * 0.22} ry={h * 0.55} />
      <ellipse cx={x + w * 0.12} cy={y - h * 0.5} rx={w * 0.26} ry={h * 0.7} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  01 · Solara                                                        */
/* ------------------------------------------------------------------ */

function Solara() {
  const u = useUid();
  const arch = (x: number, w: number, top: number, base: number) => {
    const m = w * 0.22;
    return `M${x},${base}L${x},${top + w * 0.5}Q${x},${top} ${x + w / 2},${top}Q${x + w},${top} ${x + w},${top + w * 0.5}L${x + w},${base}L${x + w - m},${base}L${x + w - m},${top + w * 0.55}Q${x + w - m},${top + m * 1.2} ${x + w / 2},${top + m * 1.2}Q${x + m},${top + m * 1.2} ${x + m},${top + w * 0.55}L${x + m},${base}Z`;
  };
  return (
    <Svg label="An orange desert under three enormous suns, with glowing sandstone arches in the distance.">
      <defs>
        <Grad id={`${u}sky`} stops={[[0, "#B8505A"], [0.45, "#F28C62"], [0.78, "#F7C089"], [1, "#F5D9B5"]]} />
        <Glow id={`${u}g`} color="#FFE9C2" />
        <radialGradient id={`${u}sun`}>
          <stop offset="0" stopColor="#FFF3DA" />
          <stop offset="0.7" stopColor="#FBD79B" />
          <stop offset="1" stopColor="#F7B574" />
        </radialGradient>
        <Grad id={`${u}stone`} x2={1} y2={0} stops={[[0, "#FFC58A"], [0.5, "#E27B55"], [1, "#8E3B49"]]} />
        <Grad id={`${u}d1`} stops={[[0, "#EE9262"], [1, "#D9694F"]]} />
        <Grad id={`${u}d2`} stops={[[0, "#D9694F"], [1, "#A9444A"]]} />
        <Grad id={`${u}d3`} stops={[[0, "#8E3B49"], [1, "#4A1F3C"]]} />
      </defs>
      <rect width="1200" height="900" fill={`url(#${u}sky)`} />
      <circle cx="600" cy="470" r="520" fill={`url(#${u}g)`} opacity="0.7" />
      <circle cx="205" cy="300" r="170" fill={`url(#${u}g)`} opacity="0.55" />
      <circle cx="985" cy="230" r="120" fill={`url(#${u}g)`} opacity="0.55" />
      <circle cx="600" cy="470" r="190" fill={`url(#${u}sun)`} />
      <circle cx="205" cy="300" r="64" fill={`url(#${u}sun)`} />
      <circle cx="985" cy="230" r="40" fill={`url(#${u}sun)`} />
      <Cloud x={330} y={180} w={300} color="#FFD6A8" opacity={0.35} />
      <Cloud x={880} y={420} w={260} color="#FFD6A8" opacity={0.3} />

      <path d={ridge({ seed: 11, y: 560, amp: 60, steps: 7 })} fill={`url(#${u}d1)`} />
      {/* mesas */}
      <path d="M820,620 L835,510 L930,500 L965,530 L990,620Z" fill={`url(#${u}stone)`} />
      <path d="M980,620 L990,560 L1060,552 L1085,620Z" fill={`url(#${u}stone)`} opacity="0.9" />
      <path d={ridge({ seed: 5, y: 640, amp: 70, steps: 8 })} fill={`url(#${u}d2)`} />
      <path d={arch(250, 190, 450, 700)} fill={`url(#${u}stone)`} fillRule="evenodd" />
      <path d={arch(520, 90, 590, 712)} fill={`url(#${u}stone)`} fillRule="evenodd" opacity="0.92" />
      <path d={ridge({ seed: 21, y: 760, amp: 70, steps: 6 })} fill={`url(#${u}d3)`} />
      <path d={ridge({ seed: 3, y: 900, amp: 85, steps: 5 })} fill="#2B1636" />
      {/* a lone wanderer */}
      <g fill="#2B1636" transform="translate(690 736)">
        <circle cx="0" cy="-26" r="4.5" />
        <path d="M-6,0 L-3,-20 L3,-20 L6,0Z" />
      </g>
      <path d="M690,736 l-70,10" stroke="#F7B574" strokeOpacity="0.2" strokeWidth="2" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/*  02 · The Sleeping Coast                                            */
/* ------------------------------------------------------------------ */

function Coast() {
  const u = useUid();
  const cliffL = "M-20,900 L-20,210 Q80,190 150,250 Q220,300 260,420 Q300,520 380,560 L470,560 L470,900Z";
  const cliffR = "M1220,900 L1220,300 Q1130,290 1060,360 Q1000,420 940,500 Q900,550 840,560 L760,560 L760,900Z";
  const reflect = (
    <>
      <path d={cliffL} />
      <path d={cliffR} />
      <path d={ridge({ seed: 8, y: 540, amp: 70, steps: 9, bottom: 560 })} />
    </>
  );
  return (
    <Svg label="Pink sea cliffs rising from perfectly still water under a pale, misty sky.">
      <defs>
        <Grad id={`${u}sky`} stops={[[0, "#8D78A0"], [0.5, "#D9A0A4"], [1, "#F5D9B5"]]} />
        <Glow id={`${u}g`} color="#FFF0D6" inner={0.85} />
        <Grad id={`${u}sea`} stops={[[0, "#E9B9AE"], [0.4, "#C99AA6"], [1, "#788DAD"]]} />
        <Grad id={`${u}c1`} x2={1} y2={0.4} stops={[[0, "#F0B3B0"], [1, "#B9738A"]]} />
        <Grad id={`${u}c2`} x2={-1} y2={0.4} stops={[[0, "#E9A8AC"], [1, "#9A6384"]]} />
        <Grad id={`${u}mist`} stops={[[0, "#F5D9B5", 0], [0.5, "#F8E3C8", 0.75], [1, "#F5D9B5", 0]]} />
        <Grad id={`${u}far`} stops={[[0, "#C9A2B6"], [1, "#E9C7C0"]]} />
      </defs>
      <rect width="1200" height="560" fill={`url(#${u}sky)`} />
      <circle cx="760" cy="400" r="290" fill={`url(#${u}g)`} />
      <circle cx="760" cy="400" r="58" fill="#FFF3DF" />
      <Cloud x={300} y={160} w={380} color="#F5D9B5" opacity={0.45} />
      <Cloud x={930} y={130} w={300} color="#F5D9B5" opacity={0.4} />
      <path d={ridge({ seed: 8, y: 540, amp: 70, steps: 9, bottom: 570 })} fill={`url(#${u}far)`} />
      <rect y="470" width="1200" height="100" fill={`url(#${u}mist)`} />

      <rect y="560" width="1200" height="340" fill={`url(#${u}sea)`} />
      {/* mirrored world */}
      <clipPath id={`${u}clip`}>
        <rect y="560" width="1200" height="340" />
      </clipPath>
      <g clipPath={`url(#${u}clip)`}>
        <g transform="translate(0 1120) scale(1 -1)" opacity="0.28" fill="#8D6C93">
          {reflect}
        </g>
      </g>
      <circle cx="760" cy="720" r="58" fill="#FFF3DF" opacity="0.22" transform="translate(0 0)" />
      <g stroke="#FFF3DF" strokeOpacity="0.35" strokeWidth="1.2">
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1={640 + (i % 3) * 20} x2={880 - (i % 4) * 20} y1={590 + i * 22} y2={590 + i * 22} />
        ))}
      </g>

      <path d={cliffL} fill={`url(#${u}c1)`} />
      <path d={cliffR} fill={`url(#${u}c2)`} />
      <g stroke="#8D4F72" strokeOpacity="0.22" strokeWidth="2">
        {[60, 120, 190, 250, 320].map((x, i) => (
          <line key={x} x1={x} y1={260 + i * 20} x2={x - 6} y2={560 + i * 40} />
        ))}
        {[1080, 1020, 960, 900].map((x, i) => (
          <line key={x} x1={x} y1={360 + i * 30} x2={x + 8} y2={560 + i * 30} />
        ))}
      </g>
      <rect y="520" width="1200" height="120" fill={`url(#${u}mist)`} opacity="0.8" />
      {/* small sailboat */}
      <g transform="translate(580 640)">
        <path d="M-26,0 L26,0 L18,9 L-18,9Z" fill="#6E4A78" />
        <path d="M0,-4 L0,-48 L22,-6Z" fill="#FFF3DF" />
        <path d="M-3,-8 L-3,-40 L-18,-8Z" fill="#F5D9B5" opacity="0.85" />
      </g>
      <path d="M552,652 h56" stroke="#FFF3DF" strokeOpacity="0.4" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/*  03 · The Blue Hour                                                 */
/* ------------------------------------------------------------------ */

function BlueHour() {
  const u = useUid();
  const r = rng(77);
  const glow = Array.from({ length: 120 }, () => {
    const x = r() * 1200;
    const y = 600 + r() * 280;
    return { x, y, rx: 1.5 + r() * 5 * ((y - 590) / 290), o: 0.2 + r() * 0.75 };
  });
  return (
    <Svg label="A midnight-blue archipelago under a starry sky, the water glowing with teal bioluminescence.">
      <defs>
        <Grad id={`${u}sky`} stops={[[0, "#080F25"], [0.45, "#17294C"], [0.8, "#4A5E8E"], [1, "#9A9DB8"]]} />
        <Grad id={`${u}sea`} stops={[[0, "#27406E"], [0.25, "#17294C"], [1, "#0A1228"]]} />
        <Glow id={`${u}moon`} color="#F5D9B5" inner={0.55} />
        <Glow id={`${u}teal`} color="#6FE3D1" inner={0.7} />
        <Grad id={`${u}hz`} stops={[[0, "#D9A0A4", 0], [1, "#D9A0A4", 0.55]]} />
      </defs>
      <rect width="1200" height="900" fill={`url(#${u}sky)`} />
      <Stars seed={9} count={130} maxY={400} />
      <rect y="400" width="1200" height="190" fill={`url(#${u}hz)`} />
      <circle cx="860" cy="190" r="210" fill={`url(#${u}moon)`} />
      <circle cx="860" cy="190" r="46" fill="#F5E6CC" />
      <circle cx="878" cy="180" r="42" fill="#17294C" opacity="0.18" />
      <Cloud x={280} y={330} w={420} color="#788DAD" opacity={0.28} />
      <Cloud x={1000} y={400} w={320} color="#D9A0A4" opacity={0.22} />

      <path d={ridge({ seed: 31, y: 595, amp: 60, steps: 8, bottom: 600 })} fill="#26365F" />
      <rect y="590" width="1200" height="310" fill={`url(#${u}sea)`} />
      {/* island silhouettes */}
      {[
        { d: blob(210, 585, 190, 50, 4), c: "#101B3A" },
        { d: blob(620, 590, 160, 36, 6), c: "#142243" },
        { d: blob(1010, 588, 210, 56, 12), c: "#101B3A" },
      ].map((b, i) => (
        <g key={i}>
          <path d={b.d} fill={b.c} />
          <path d={b.d} fill="none" stroke="#6FE3D1" strokeOpacity="0.55" strokeWidth="1.4" />
        </g>
      ))}
      <ellipse cx="860" cy="660" rx="14" ry="60" fill="#F5D9B5" opacity="0.14" />
      <ellipse cx="860" cy="680" rx="60" ry="3" fill="#F5D9B5" opacity="0.18" />
      {glow.map((g, i) => (
        <ellipse key={i} cx={g.x} cy={g.y} rx={g.rx * 2.2} ry={g.rx * 0.45} fill="#6FE3D1" opacity={g.o * 0.7} />
      ))}
      <ellipse cx="400" cy="800" rx="260" ry="46" fill={`url(#${u}teal)`} opacity="0.35" />
      <ellipse cx="900" cy="760" rx="240" ry="40" fill={`url(#${u}teal)`} opacity="0.3" />
      {/* foreground island, tree and boat */}
      <path d="M-30,900 L-30,790 Q90,730 210,790 Q290,830 330,900Z" fill="#070D1F" />
      <path d="M95,775 Q100,720 92,670 M92,690 q-24,-14 -40,-4 M92,690 q22,-18 42,-8 M96,715 q-20,-10 -30,2" stroke="#070D1F" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M-30,896 Q90,860 210,896" stroke="#6FE3D1" strokeOpacity="0.5" fill="none" />
      <g transform="translate(560 790)">
        <path d="M-34,0 L34,0 L22,11 L-22,11Z" fill="#070D1F" />
        <circle cx="0" cy="-4" r="9" fill="#F5D9B5" opacity="0.9" />
        <circle cx="0" cy="-4" r="26" fill="#F5D9B5" opacity="0.12" />
        <ellipse cx="0" cy="22" rx="70" ry="5" fill="#6FE3D1" opacity="0.5" />
      </g>
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/*  04 · Moonflower Valley                                             */
/* ------------------------------------------------------------------ */

function Bloom({ x, base, h, size, hue, seed, lean = 0 }: { x: number; base: number; h: number; size: number; hue: [string, string]; seed: number; lean?: number }) {
  const r = rng(seed);
  const topX = x + lean;
  const topY = base - h;
  const petals = 9;
  return (
    <g>
      <path d={`M${x},${base + 20} Q${x + lean * 0.2},${base - h * 0.5} ${topX},${topY}`} stroke="#4C5B8C" strokeWidth={Math.max(3, size * 0.07)} fill="none" strokeLinecap="round" />
      <path d={`M${x + lean * 0.15},${base - h * 0.28} q${size * 0.6},-${size * 0.25} ${size * 0.9},-${size * 0.5} q-${size * 0.15},${size * 0.4} -${size * 0.9},${size * 0.5}Z`} fill="#4C5B8C" />
      <g transform={`translate(${topX} ${topY})`}>
        {Array.from({ length: petals }, (_, i) => {
          const a = (i / petals) * 360 + r() * 10;
          return (
            <ellipse key={i} cx="0" cy={-size * 0.52} rx={size * 0.2} ry={size * 0.52} fill={i % 2 ? hue[0] : hue[1]} transform={`rotate(${a})`} opacity="0.94" />
          );
        })}
        <circle r={size * 0.2} fill="#F5D9B5" />
        <circle r={size * 0.42} fill="#F5D9B5" opacity="0.18" />
      </g>
    </g>
  );
}

function Moonflower() {
  const u = useUid();
  const r = rng(404);
  return (
    <Svg label="Enormous pink flowers growing in a valley beneath lavender mountains and a pale moon.">
      <defs>
        <Grad id={`${u}sky`} stops={[[0, "#4A4585"], [0.45, "#9A86B8"], [0.85, "#E3B3B3"], [1, "#F5D9B5"]]} />
        <Glow id={`${u}moon`} color="#F5E6CC" inner={0.6} />
        <Grad id={`${u}m1`} stops={[[0, "#B7A8D6"], [1, "#D6BFD0"]]} />
        <Grad id={`${u}m2`} stops={[[0, "#8C7DB9"], [1, "#B79CC4"]]} />
        <Grad id={`${u}m3`} stops={[[0, "#6C5FA0"], [1, "#8A74A8"]]} />
        <Grad id={`${u}vl`} stops={[[0, "#5A4F95"], [1, "#2D2D63"]]} />
      </defs>
      <rect width="1200" height="900" fill={`url(#${u}sky)`} />
      <Stars seed={5} count={50} maxY={300} />
      <circle cx="880" cy="230" r="250" fill={`url(#${u}moon)`} />
      <circle cx="880" cy="230" r="86" fill="#F8EBD3" />
      <g fill="#E3CFB4" opacity="0.5">
        <circle cx="858" cy="212" r="14" />
        <circle cx="905" cy="252" r="9" />
        <circle cx="880" cy="190" r="6" />
      </g>
      <path d={ridge({ seed: 17, y: 520, amp: 220, steps: 8, sharp: 1, bottom: 700 })} fill={`url(#${u}m1)`} />
      <path d={ridge({ seed: 23, y: 580, amp: 200, steps: 9, sharp: 1, bottom: 740 })} fill={`url(#${u}m2)`} />
      <rect y="560" width="1200" height="140" fill="#E9C7D0" opacity="0.22" />
      <path d={ridge({ seed: 29, y: 640, amp: 150, steps: 7, sharp: 1, bottom: 800 })} fill={`url(#${u}m3)`} />
      <path d={ridge({ seed: 2, y: 720, amp: 50, steps: 6, bottom: 900 })} fill={`url(#${u}vl)`} />
      <Bloom x={160} base={760} h={330} size={190} hue={["#D9A0A4", "#E9BCBD"]} seed={1} lean={30} />
      <Bloom x={420} base={780} h={200} size={120} hue={["#F28C62", "#F5A98A"]} seed={2} lean={-20} />
      <Bloom x={640} base={760} h={430} size={250} hue={["#D9A0A4", "#F0C2C0"]} seed={3} lean={-30} />
      <Bloom x={930} base={790} h={260} size={150} hue={["#C6A2D6", "#DDB9E2"]} seed={4} lean={25} />
      <Bloom x={1110} base={800} h={400} size={210} hue={["#F28C62", "#F7B08F"]} seed={5} lean={-35} />
      <path d={ridge({ seed: 99, y: 850, amp: 40, steps: 6, bottom: 900 })} fill="#1B1A47" />
      {Array.from({ length: 36 }, (_, i) => (
        <circle key={i} cx={r() * 1200} cy={380 + r() * 420} r={1 + r() * 2.4} fill="#F5D9B5" opacity={0.3 + r() * 0.6} />
      ))}
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/*  05 · The Lost Meridian                                             */
/* ------------------------------------------------------------------ */

function Tower({ x, base, w, h, roof, c1, c2 }: { x: number; base: number; w: number; h: number; roof: number; c1: string; c2: string }) {
  return (
    <g>
      <rect x={x} y={base - h} width={w} height={h} fill={c1} />
      <rect x={x + w / 2} y={base - h} width={w / 2} height={h} fill={c2} />
      <path d={`M${x - 4},${base - h} L${x + w / 2},${base - h - roof} L${x + w + 4},${base - h}Z`} fill={c2} />
      <path d={`M${x - 4},${base - h} L${x + w / 2},${base - h - roof} L${x + w / 2},${base - h}Z`} fill={c1} />
      {Array.from({ length: Math.floor(h / 34) }, (_, i) => (
        <rect key={i} x={x + w / 2 - 3} y={base - h + 14 + i * 34} width="6" height="12" rx="3" fill="#FFE2A8" opacity="0.9" />
      ))}
    </g>
  );
}

function Meridian() {
  const u = useUid();
  const lit = "#F5D9B5";
  const shade = "#C7889A";
  return (
    <Svg label="A city of towers and arches floating on rock above a sea of pink and orange clouds.">
      <defs>
        <Grad id={`${u}sky`} stops={[[0, "#17294C"], [0.35, "#5C5A8E"], [0.65, "#D9A0A4"], [0.85, "#F28C62"], [1, "#F7B58A"]]} />
        <Glow id={`${u}sun`} color="#FFE2B8" inner={0.9} />
        <Grad id={`${u}rock`} stops={[[0, "#5B5A8D"], [1, "#1A2750"]]} />
        <Grad id={`${u}cl`} stops={[[0, "#F9D2B4"], [1, "#D9A0A4"]]} />
        <Grad id={`${u}cl2`} stops={[[0, "#E7A0A4"], [1, "#8D78A8"]]} />
      </defs>
      <rect width="1200" height="900" fill={`url(#${u}sky)`} />
      <Stars seed={21} count={60} maxY={300} />
      <circle cx="930" cy="610" r="320" fill={`url(#${u}sun)`} />
      <circle cx="930" cy="610" r="82" fill="#FFF0D4" />
      <Cloud x={200} y={330} w={300} color="#F5D9B5" opacity={0.25} />

      {/* far floating rocks */}
      {[
        { x: 140, t: 300, w: 130, d: 70, s: 2 },
        { x: 1040, t: 260, w: 110, d: 60, s: 6 },
        { x: 960, t: 420, w: 70, d: 40, s: 8 },
      ].map((p) => (
        <g key={p.s}>
          <path d={floatingRock(p.x, p.t, p.w, p.d, p.s)} fill="#4A4A80" />
          <rect x={p.x - 8} y={p.t - 36} width="14" height="36" fill={shade} />
          <path d={`M${p.x - 12},${p.t - 36} L${p.x - 1},${p.t - 56} L${p.x + 10},${p.t - 36}Z`} fill={lit} />
        </g>
      ))}

      {/* bridges */}
      <path d="M255,430 Q330,395 400,425" stroke={lit} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M255,430 Q330,395 400,425" stroke="#FFE2A8" strokeWidth="1.5" fill="none" strokeDasharray="2 8" />
      <path d="M770,420 Q880,380 985,435" stroke={lit} strokeWidth="5" fill="none" strokeLinecap="round" />

      {/* main rock */}
      <path d={floatingRock(560, 470, 460, 270, 3)} fill={`url(#${u}rock)`} />
      <path d="M335,470 Q560,445 785,470 L785,480 Q560,458 335,480Z" fill="#8C7BB2" />
      <path d="M470,500 L450,560 M600,490 L590,610 M690,500 L720,570" stroke="#8C7BB2" strokeOpacity="0.4" strokeWidth="3" />

      {/* city */}
      <Tower x={382} base={462} w={34} h={90} roof={36} c1={lit} c2={shade} />
      <Tower x={430} base={462} w={26} h={140} roof={50} c1={lit} c2={shade} />
      <Tower x={500} base={462} w={40} h={190} roof={64} c1={lit} c2={shade} />
      <path d="M552,462 L552,420 Q580,350 608,420 L608,462 L592,462 L592,424 Q580,394 568,424 L568,462Z" fill={lit} />
      <Tower x={620} base={462} w={30} h={230} roof={80} c1={lit} c2={shade} />
      <path d="M672,462 Q710,360 748,462Z" fill={shade} />
      <circle cx="710" cy="388" r="5" fill={lit} />
      <Tower x={690} base={462} w={22} h={110} roof={34} c1={lit} c2={shade} />
      <Tower x={738} base={462} w={30} h={74} roof={28} c1={lit} c2={shade} />
      {/* arch bridge between towers */}
      <path d="M456,330 Q520,290 590,320" stroke={lit} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M652,300 Q690,280 720,310" stroke={lit} strokeWidth="5" fill="none" strokeLinecap="round" />

      {/* cloud sea */}
      <g fill={`url(#${u}cl2)`}>
        <ellipse cx="180" cy="720" rx="360" ry="70" />
        <ellipse cx="1000" cy="730" rx="380" ry="80" />
        <ellipse cx="560" cy="690" rx="300" ry="50" opacity="0.8" />
      </g>
      <g fill={`url(#${u}cl)`}>
        <ellipse cx="400" cy="800" rx="460" ry="90" />
        <ellipse cx="1040" cy="830" rx="420" ry="100" />
        <ellipse cx="80" cy="860" rx="260" ry="80" />
      </g>
      <rect y="860" width="1200" height="40" fill="#F5D9B5" opacity="0.8" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/*  06 · Velora                                                        */
/* ------------------------------------------------------------------ */

function Palm({ x, y, h, lean, s = 1 }: { x: number; y: number; h: number; lean: number; s?: number }) {
  const top: [number, number] = [x + lean, y - h];
  const frond = (a: number, len: number) => {
    const rad = (a * Math.PI) / 180;
    const ex = top[0] + Math.cos(rad) * len;
    const ey = top[1] + Math.sin(rad) * len * 0.6 + len * 0.28;
    const cx = top[0] + Math.cos(rad) * len * 0.5;
    const cy = top[1] + Math.sin(rad) * len * 0.5 - len * 0.2;
    return `M${top[0]},${top[1]} Q${cx},${cy - 6} ${ex},${ey} Q${cx},${cy + 8} ${top[0]},${top[1]}Z`;
  };
  return (
    <g>
      <path d={`M${x},${y} Q${x + lean * 0.1},${y - h * 0.5} ${top[0]},${top[1]}`} stroke="#6B4A5C" strokeWidth={6 * s} fill="none" strokeLinecap="round" />
      {[-165, -130, -90, -50, -15, 15, 165].map((a) => (
        <path key={a} d={frond(a, 74 * s)} fill="#2E8F78" />
      ))}
    </g>
  );
}

function Velora() {
  const u = useUid();
  const needle = (x: number, base: number, w: number, h: number, bend: number) =>
    `M${x - w / 2},${base} Q${x - w * 0.25 + bend * 0.4},${base - h * 0.55} ${x + bend},${base - h} Q${x + w * 0.25 + bend * 0.4},${base - h * 0.55} ${x + w / 2},${base}Z`;
  return (
    <Svg label="A tropical island with turquoise lagoons, palm trees and sculpted rock spires beneath a bright sun.">
      <defs>
        <Grad id={`${u}sky`} stops={[[0, "#78C1D8"], [0.6, "#BFE3DC"], [1, "#F5D9B5"]]} />
        <Glow id={`${u}sun`} color="#FFF0C8" inner={0.9} />
        <Grad id={`${u}lag`} stops={[[0, "#8FF0DC"], [0.5, "#2DB5B0"], [1, "#0F7C93"]]} />
        <Grad id={`${u}deep`} stops={[[0, "#1B98A7"], [1, "#0B5E7C"]]} />
        <Grad id={`${u}rock`} x2={1} y2={0.3} stops={[[0, "#F2B4AE"], [0.55, "#D9A0A4"], [1, "#8A5C80"]]} />
        <Grad id={`${u}sand`} stops={[[0, "#FBE9C8"], [1, "#F5D9B5"]]} />
      </defs>
      <rect width="1200" height="900" fill={`url(#${u}sky)`} />
      <circle cx="900" cy="190" r="260" fill={`url(#${u}sun)`} />
      <circle cx="900" cy="190" r="62" fill="#FFF6DF" />
      <Cloud x={300} y={170} w={320} color="#FFFFFF" opacity={0.55} />
      <Cloud x={620} y={280} w={200} color="#FFFFFF" opacity={0.4} />
      <path d={ridge({ seed: 61, y: 450, amp: 60, steps: 8, bottom: 470 })} fill="#788DAD" opacity="0.6" />
      <rect y="440" width="1200" height="460" fill={`url(#${u}deep)`} />
      {/* reef ring */}
      <path d={blob(600, 640, 700, 250, 14, 8)} fill={`url(#${u}lag)`} />
      <path d={blob(600, 650, 520, 190, 9, 8)} fill="#9AF3E1" opacity="0.5" />
      <g stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="1.6" fill="none">
        <path d="M-40,470 q60,-10 120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0" />
      </g>
      {/* island */}
      <path d={blob(600, 640, 330, 120, 3, 9)} fill={`url(#${u}sand)`} />
      <path d={needle(430, 650, 66, 330, -18)} fill={`url(#${u}rock)`} />
      <path d={needle(500, 660, 44, 230, 12)} fill={`url(#${u}rock)`} />
      <path d={needle(870, 650, 80, 290, 24)} fill={`url(#${u}rock)`} />
      {/* natural arch */}
      <path d="M580,660 L580,520 Q580,420 680,420 Q780,420 780,520 L780,660 L735,660 L735,530 Q735,468 680,468 Q625,468 625,530 L625,660Z" fill={`url(#${u}rock)`} fillRule="evenodd" />
      <path d="M580,660 L580,520 Q580,420 680,420" stroke="#FBD6C9" strokeOpacity="0.5" strokeWidth="3" fill="none" />
      <Palm x={370} y={668} h={150} lean={-30} />
      <Palm x={540} y={682} h={110} lean={26} s={0.85} />
      <Palm x={820} y={672} h={170} lean={34} s={1.1} />
      <path d="M0,900 L0,820 Q200,770 380,830 Q460,860 500,900Z" fill="#0B5E7C" opacity="0.65" />
      <path d="M1200,900 L1200,810 Q1030,780 900,850 Q860,870 840,900Z" fill="#0B5E7C" opacity="0.65" />
      <g transform="translate(250 790)">
        <path d="M-30,0 L30,0 L20,10 L-20,10Z" fill="#F28C62" />
        <ellipse cx="0" cy="18" rx="50" ry="4" fill="#fff" opacity="0.35" />
      </g>
    </Svg>
  );
}

/* ------------------------------------------------------------------ */

const map: Record<string, () => ReactNode> = {
  solara: Solara,
  "the-sleeping-coast": Coast,
  "the-blue-hour": BlueHour,
  "moonflower-valley": Moonflower,
  "the-lost-meridian": Meridian,
  velora: Velora,
};

export function DestinationScene({ slug, className }: { slug: string; className?: string }) {
  const C = map[slug] ?? Solara;
  return (
    <div className={className} data-scene={slug}>
      <C />
    </div>
  );
}
