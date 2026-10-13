"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { rng } from "@/lib/svg";
import { sceneState } from "@/lib/scene-state";
import {
  ease,
  getGlowTexture,
  lerpPalette,
  newPalette,
  pal,
  Sky,
  useFogSync,
  useNightEase,
  usePointerState,
  Water,
  type WaterColors,
} from "./common";

const DAY = pal({ top: "#2a3466", mid: "#c0789a", hor: "#f9b98a", glow: "#f28c62", sun: "#ffe7c2", light: "#ffc48f", ambient: "#8a6fa0", lightI: 2.4, ambI: 1.5 });
const NIGHT = pal({ top: "#030818", mid: "#13224a", hor: "#4a5c8c", glow: "#788dad", sun: "#f6ead2", light: "#9db4e6", ambient: "#2a3f78", lightI: 0.9, ambI: 0.9 });

const C = (h: string) => new THREE.Color(h);
const pair = (day: string, night: string) => ({ day: C(day), night: C(night) });
const col = {
  deep: pair("#3a3f7a", "#040a1e"),
  shallow: pair("#8e5e98", "#0f1d44"),
  mtNear: pair("#4a3470", "#0b1432"),
  mtMid: pair("#7a528c", "#122049"),
  mtFar: pair("#b07ba0", "#1b2b58"),
  grass: pair("#ebc08f", "#6d7ba6"),
  rock: pair("#6a4f86", "#16224a"),
  tower: pair("#f5d9b5", "#8d9bc4"),
  cloud: pair("#ffd2b0", "#4b5c8c"),
  fore: pair("#14183c", "#050816"),
};
const mixInto = (out: THREE.Color, p: { day: THREE.Color; night: THREE.Color }, m: number) => out.lerpColors(p.day, p.night, m);

/** Shared per-frame state so every child reads the same eased values. */
interface Frame {
  m: number; // night mix 0..1
  s: number; // scroll 0..1
}

/* ------------------------------------------------------------------ */

function Mountains({ frame, lite }: { frame: Frame; lite: boolean }) {
  const layers = useMemo(() => {
    const r = rng(11);
    const defs = [
      { z: -55, n: lite ? 6 : 9, h: [5, 11], rad: [5, 9], span: 170, key: "mtNear" as const, dx: -7, dy: 2, gap: 24 },
      { z: -90, n: lite ? 8 : 13, h: [8, 17], rad: [8, 14], span: 240, key: "mtMid" as const, dx: 3, dy: 1.6, gap: 30 },
      { z: -135, n: lite ? 8 : 14, h: [10, 22], rad: [10, 18], span: 360, key: "mtFar" as const, dx: 9, dy: 1 , gap: 0 },
    ];
    return defs.map((d) => ({
      ...d,
      // keep a clearing in front of the sun so the sunset sphere reads
      ...{},
      mat: new THREE.MeshStandardMaterial({ flatShading: true, roughness: 1, metalness: 0 }),
      peaks: Array.from({ length: d.n }, (_, i) => {
        let x = -d.span / 2 + (d.span * (i + r() * 0.8)) / d.n;
        if (d.gap && Math.abs(x - 10) < d.gap) x += x < 10 ? -d.gap : d.gap;
        return { x,
        h: d.h[0] + r() * (d.h[1] - d.h[0]),
        r: d.rad[0] + r() * (d.rad[1] - d.rad[0]),
        rot: r() * 3 };
      }),
    }));
  }, [lite]);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const geo = useMemo(() => new THREE.ConeGeometry(1, 1, 6, 1), []);

  useFrame(() => {
    layers.forEach((l, i) => {
      mixInto(l.mat.color, col[l.key], frame.m);
      const g = groups.current[i];
      if (g) {
        // layers separate as you scroll: each slides sideways and sinks at its own rate
        g.position.x = frame.s * l.dx - sceneState.px * (1.2 + i * 0.5);
        g.position.y = -frame.s * l.dy;
      }
    });
  });

  return (
    <>
      {layers.map((l, i) => (
        <group key={l.key} ref={(el) => void (groups.current[i] = el)} position={[0, 0, l.z]}>
          {l.peaks.map((p, j) => (
            <mesh key={j} geometry={geo} material={l.mat} position={[p.x, p.h / 2 - 2, 0]} scale={[p.r, p.h, p.r * 0.9]} rotation={[0, p.rot, 0]} receiveShadow />
          ))}
        </group>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */

const ISLANDS = [
  { p: [-26, 14, -30], r: 6.2, sp: 0.16, arch: true },
  { p: [24, 23, -52], r: 8.4, sp: 0.1, arch: true },
  { p: [5, 8.5, -16], r: 2.4, sp: 0.3, arch: false },
  { p: [-52, 29, -84], r: 9.5, sp: 0.08, arch: true },
  { p: [54, 12, -74], r: 6, sp: 0.14, arch: false },
  { p: [-6, 33, -100], r: 5.5, sp: 0.12, arch: false },
] as const;

function Islands({ frame }: { frame: Frame }) {
  const mats = useMemo(
    () => ({
      grass: new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.9 }),
      rock: new THREE.MeshStandardMaterial({ flatShading: true, roughness: 1 }),
      tower: new THREE.MeshStandardMaterial({ roughness: 0.7, emissive: new THREE.Color("#ffb070"), emissiveIntensity: 0.25 }),
    }),
    [],
  );
  const spin = useRef<(THREE.Group | null)[]>([]);
  const shift = useRef<(THREE.Group | null)[]>([]);

  useFrame((_, dt) => {
    mixInto(mats.grass.color, col.grass, frame.m);
    mixInto(mats.rock.color, col.rock, frame.m);
    mixInto(mats.tower.color, col.tower, frame.m);
    mats.tower.emissiveIntensity = 0.25 + frame.m * 0.5;
    ISLANDS.forEach((isl, i) => {
      const s = spin.current[i];
      if (s) s.rotation.y += dt * isl.sp * (1 + frame.s * 4);
      const sh = shift.current[i];
      if (sh) {
        // scroll shifts them sideways/up; the pointer nudges nearer ones more
        const depth = 1 + (isl.p[2] / -100) * -0.5;
        const tx = frame.s * (isl.p[0] > 0 ? 9 : -9) - sceneState.px * 2.2 * depth;
        const ty = frame.s * 4 + sceneState.py * 0.9 * depth;
        sh.position.x = THREE.MathUtils.damp(sh.position.x, tx, 3, dt);
        sh.position.y = THREE.MathUtils.damp(sh.position.y, ty, 3, dt);
      }
    });
  });

  return (
    <>
      {ISLANDS.map((isl, i) => {
        const r = isl.r;
        return (
          <group key={i} position={[isl.p[0], isl.p[1], isl.p[2]]}>
            <group ref={(el) => void (shift.current[i] = el)}>
              <Float speed={0.8 + i * 0.12} rotationIntensity={0.06} floatIntensity={1.4} floatingRange={[-0.8, 0.8]}>
                <group ref={(el) => void (spin.current[i] = el)}>
                  <mesh material={mats.grass} castShadow receiveShadow>
                    <cylinderGeometry args={[r, r * 0.92, r * 0.22, 9]} />
                  </mesh>
                  <mesh material={mats.rock} position={[0, -r * 0.77, 0]} rotation={[Math.PI, 0.3, 0]} castShadow>
                    <coneGeometry args={[r * 0.92, r * 1.3, 8]} />
                  </mesh>
                  <mesh material={mats.rock} position={[r * 0.35, -r * 1.1, r * 0.1]} rotation={[Math.PI, 0.8, 0.2]} scale={0.5} castShadow>
                    <coneGeometry args={[r * 0.5, r * 0.9, 6]} />
                  </mesh>
                  <mesh material={mats.tower} position={[0, r * 0.11 + r * 0.35, 0]} castShadow>
                    <cylinderGeometry args={[r * 0.07, r * 0.09, r * 0.7, 8]} />
                  </mesh>
                  <mesh material={mats.tower} position={[0, r * 0.11 + r * 0.85, 0]} castShadow>
                    <coneGeometry args={[r * 0.13, r * 0.32, 8]} />
                  </mesh>
                  <mesh material={mats.tower} position={[r * 0.38, r * 0.11 + r * 0.22, 0]} castShadow>
                    <cylinderGeometry args={[r * 0.05, r * 0.06, r * 0.44, 8]} />
                  </mesh>
                  {isl.arch && (
                    <mesh material={mats.tower} position={[-r * 0.38, r * 0.11 + r * 0.04, 0]} castShadow>
                      <torusGeometry args={[r * 0.2, r * 0.045, 6, 18, Math.PI]} />
                    </mesh>
                  )}
                </group>
              </Float>
            </group>
          </group>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------ */

function Clouds({ frame, lite }: { frame: Frame; lite: boolean }) {
  const map = useMemo(getGlowTexture, []);
  const data = useMemo(() => {
    const r = rng(77);
    const clusters = Array.from({ length: lite ? 9 : 16 }, (_, i) => {
      const low = i % 3 === 0;
      const s = low ? 26 + r() * 20 : 12 + r() * 14;
      return {
        x: -170 + r() * 340,
        y: low ? 2.5 + r() * 4 : 8 + r() * 26,
        z: -25 - r() * 120,
        speed: 0.25 + r() * 0.6,
        puffs: Array.from({ length: lite ? 4 : 6 }, () => ({
          ox: (r() - 0.5) * s * 1.6,
          oy: (r() - 0.35) * s * 0.35,
          s: s * (0.7 + r() * 0.6),
          lum: 0.72 + r() * 0.4,
          mat: new THREE.SpriteMaterial({ map, transparent: true, opacity: low ? 0.5 : 0.62, depthWrite: false }),
        })),
        stretch: low ? 2.6 : 1.7,
      };
    });
    return clusters;
  }, [lite, map]);
  const refs = useRef<(THREE.Group | null)[]>([]);
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame((_, dt) => {
    mixInto(tmp, col.cloud, frame.m);
    data.forEach((c, i) => {
      const g = refs.current[i];
      if (g) {
        g.position.x += dt * c.speed;
        if (g.position.x > 190) g.position.x = -190;
      }
      c.puffs.forEach((p) => p.mat.color.copy(tmp).multiplyScalar(p.lum));
    });
  });

  return (
    <>
      {data.map((c, i) => (
        <group key={i} ref={(el) => void (refs.current[i] = el)} position={[c.x, c.y, c.z]}>
          {c.puffs.map((p, j) => (
            <sprite key={j} position={[p.ox, p.oy, j * 0.2]} scale={[p.s * c.stretch, p.s * 0.8, 1]} material={p.mat} />
          ))}
        </group>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */

function Stars({ frame }: { frame: Frame }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const r = rng(5);
    const n = 700;
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const th = r() * Math.PI * 2;
      const ph = Math.acos(0.12 + r() * 0.88);
      a[i * 3] = 450 * Math.sin(ph) * Math.cos(th);
      a[i * 3 + 1] = 450 * Math.cos(ph);
      a[i * 3 + 2] = 450 * Math.sin(ph) * Math.sin(th);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(a, 3));
    return g;
  }, []);
  useFrame(({ camera }) => {
    const p = ref.current;
    if (!p) return;
    p.position.copy(camera.position);
    (p.material as THREE.PointsMaterial).opacity = Math.pow(frame.m, 1.5);
  });
  return (
    <points ref={ref} geometry={geo} renderOrder={-9} frustumCulled={false}>
      <pointsMaterial color="#f5e6cc" size={1.9} sizeAttenuation={false} transparent opacity={0} depthWrite={false} fog={false} />
    </points>
  );
}

/* ------------------------------------------------------------------ */

function World({ lite, onReady }: { lite: boolean; onReady: () => void }) {
  const cur = useMemo(newPalette, []);
  const sunDir = useMemo(() => new THREE.Vector3(0.2, 0.1, -1), []);
  const frame = useMemo<Frame>(() => ({ m: 0, s: 0 }), []);
  const wc = useMemo<WaterColors>(() => ({ deep: new THREE.Color(), shallow: new THREE.Color(), sky: cur.mid, fog: cur.hor, sunColor: cur.sun }), [cur]);
  const sun = useRef<THREE.Group>(null);
  const sunMat = useRef<THREE.MeshBasicMaterial>(null);
  const amb = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const dir = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const sunGlow = useRef<THREE.Sprite>(null);
  const fore = useRef<THREE.MeshStandardMaterial>(null);
  const camTarget = useMemo(() => new THREE.Vector3(), []);
  const frames = useRef(0);
  const glowMap = useMemo(getGlowTexture, []);
  const { camera } = useThree();

  usePointerState();
  useNightEase();
  useFogSync(cur, 60, 340);

  useFrame((_, dt) => {
    const s = sceneState.scroll;
    const sn = ease.smooth(0.3, 0.92, s);
    const m = 1 - (1 - sceneState.night) * (1 - sn);
    frame.m = m;
    frame.s = s;
    lerpPalette(cur, DAY, NIGHT, m);
    mixInto(wc.deep, col.deep, m);
    mixInto(wc.shallow, col.shallow, m);

    // the sun sinks and swells as you scroll
    const sink = ease.smooth(0.12, 0.95, s);
    if (sun.current) {
      sun.current.position.set(28 - 18 * s, 13 - 44 * sink, -130);
      sun.current.scale.setScalar(1 + 0.6 * s);
      sunDir.copy(sun.current.position).sub(camera.position).normalize();
    }
    if (sunMat.current) sunMat.current.color.copy(cur.sun).lerp(cur.glow, 0.22 * (1 - m));
    if (sunGlow.current) {
      (sunGlow.current.material as THREE.SpriteMaterial).color.copy(cur.glow);
      (sunGlow.current.material as THREE.SpriteMaterial).opacity = 0.62 - sink * 0.3;
    }
    if (amb.current) {
      amb.current.color.copy(cur.ambient);
      amb.current.intensity = cur.ambI;
    }
    if (hemi.current) {
      hemi.current.color.copy(cur.mid);
      hemi.current.intensity = 1.1;
    }
    if (dir.current) {
      dir.current.color.copy(cur.light);
      dir.current.intensity = cur.lightI * (1 - sink * 0.6);
    }
    if (fill.current) {
      fill.current.color.copy(cur.mid).lerp(cur.hor, 0.4);
      fill.current.intensity = 0.7 + (1 - m) * 0.7;
    }
    if (fore.current) mixInto(fore.current.color, col.fore, m);

    // camera: cursor-driven perspective shift + a slow push through the world as you scroll
    const tx = sceneState.px * 3.4;
    const ty = 3 + sceneState.py * 1.2 + s * 5;
    const tz = 18 - s * 24;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, tx, 2.2, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, ty, 2.2, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, tz, 3, dt);
    camTarget.set(sceneState.px * 7, 7 + s * 5 + sceneState.py * 2, -60);
    camera.lookAt(camTarget);

    if (++frames.current === 3) onReady();
  });

  useEffect(() => {
    if (dir.current) dir.current.target.position.set(0, 0, -30);
  }, []);

  return (
    <>
      <Sky palette={cur} sunDir={sunDir} />
      <Stars frame={frame} />

      <ambientLight ref={amb} />
      <hemisphereLight ref={hemi} args={["#d9a0a4", "#17294c", 0.5]} />
      <directionalLight ref={fill} position={[-30, 25, 60]} intensity={1.1} />
      <directionalLight
        ref={dir}
        position={[30, 42, -90]}
        castShadow={!lite}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-110}
        shadow-camera-right={110}
        shadow-camera-top={110}
        shadow-camera-bottom={-110}
        shadow-camera-near={1}
        shadow-camera-far={320}
        shadow-bias={-0.0006}
      />

      {/* the sunset sphere */}
      <group ref={sun}>
        <mesh>
          <sphereGeometry args={[16, 48, 32]} />
          <meshBasicMaterial ref={sunMat} fog={false} toneMapped={false} />
        </mesh>
        <sprite ref={sunGlow} scale={[150, 150, 1]}>
          <spriteMaterial map={glowMap} transparent depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
        </sprite>
      </group>

      <Water colors={wc} sunDir={sunDir} position={[0, 0, -150]} fog={[60, 340]} amp={0.32} glint={1} />
      {!lite && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, -60]} receiveShadow>
          <planeGeometry args={[260, 260]} />
          <shadowMaterial opacity={0.28} />
        </mesh>
      )}

      <Mountains frame={frame} lite={lite} />
      <Islands frame={frame} />
      <Clouds frame={frame} lite={lite} />

      {/* foreground rocks give the near plane some weight */}
      {[
        { p: [-15, -1, 4], s: [5, 7, 4.5], r: 0.4 },
        { p: [17, -1.5, 2], s: [4.2, 5, 4], r: 1.2 },
      ].map((rk, i) => (
        <mesh key={i} position={rk.p as [number, number, number]} scale={rk.s as [number, number, number]} rotation={[0, rk.r, 0]}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial ref={i === 0 ? fore : undefined} color="#14183c" flatShading roughness={1} />
        </mesh>
      ))}

      <Sparkles count={lite ? 30 : 90} scale={[100, 40, 70]} position={[0, 14, -30]} size={5} speed={0.25} opacity={0.7} color="#ffe2bc" />
    </>
  );
}

export default function HeroScene({ lite, active, onReady }: { lite: boolean; active: boolean; onReady: () => void }) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={lite ? 1 : [1, 1.75]}
      shadows={!lite}
      camera={{ fov: 42, position: [0, 3, 18], near: 0.5, far: 1000 }}
      gl={{ antialias: !lite, powerPreference: "high-performance" }}
      className="!absolute inset-0"
      aria-hidden
    >
      <World lite={lite} onReady={onReady} />
    </Canvas>
  );
}
