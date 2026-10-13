/** Small seeded RNG so every landscape is identical on server and client. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

type Pt = [number, number];

/** Catmull-Rom → cubic bezier through points. */
function smooth(pts: Pt[]): string {
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/** A filled ridge line: smooth mountains across [x0,x1], closed down to `bottom`. */
export function ridge(opts: {
  seed: number;
  y: number;
  amp: number;
  steps?: number;
  x0?: number;
  x1?: number;
  bottom?: number;
  sharp?: number;
}): string {
  const { seed, y, amp, steps = 9, x0 = -50, x1 = 1250, bottom = 900, sharp = 0 } = opts;
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps;
    const peak = i % 2 === 0 ? 1 : 0.35;
    const yy = y - amp * (0.25 + r() * 0.75) * (sharp ? peak : 1);
    pts.push([x, yy]);
  }
  return `${smooth(pts)}L${x1},${bottom}L${x0},${bottom}Z`;
}

/** A closed organic blob. */
export function blob(cx: number, cy: number, rx: number, ry: number, seed: number, n = 9): string {
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 0.68 + r() * 0.5;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  // close the loop smoothly
  const loop: Pt[] = [pts[n - 1], ...pts, pts[0], pts[1]];
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i <= n; i++) {
    const p0 = loop[i - 1];
    const p1 = loop[i];
    const p2 = loop[i + 1];
    const p3 = loop[i + 2];
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + "Z";
}

/** Floating-rock silhouette: flat top, tapering underside. */
export function floatingRock(cx: number, top: number, w: number, depth: number, seed: number): string {
  const r = rng(seed);
  const l = cx - w / 2;
  const rr = cx + w / 2;
  const pts: Pt[] = [
    [rr, top],
    [rr - w * 0.08, top + depth * (0.25 + r() * 0.1)],
    [cx + w * 0.22, top + depth * (0.55 + r() * 0.1)],
    [cx + w * (0.04 + r() * 0.06), top + depth],
    [cx - w * 0.2, top + depth * (0.6 + r() * 0.1)],
    [l + w * 0.08, top + depth * (0.28 + r() * 0.1)],
    [l, top],
  ];
  return `M${l},${top - 4}Q${cx},${top - 18} ${rr},${top - 4}L${pts[0][0]},${pts[0][1]}` +
    smooth(pts).replace(/^M[^C]*/, "") + "Z";
}
