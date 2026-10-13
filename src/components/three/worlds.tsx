"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { destinations } from "@/data/destinations";
import { rng } from "@/lib/svg";
import { sceneState } from "@/lib/scene-state";
import {
  dampPalette,
  ease,
  getGlowTexture,
  Glow,
  lerpPalette,
  newPalette,
  pal,
  Sky,
  useFogSync,
  useNightEase,
  usePointerState,
  Water,
  type Palette,
} from "./common";

/** Worlds sit side by side along X; the camera glides between them. */
const SPACING = 240;
const worldX = (i: number) => i * SPACING;

const NIGHT = pal({ top: "#030818", mid: "#13224a", hor: "#4a5c8c", glow: "#788dad", sun: "#f6ead2", light: "#9db4e6", ambient: "#2a3f78", lightI: 0.9, ambI: 0.9 });

const PALETTES: Palette[] = [
  pal({ top: "#7a2f4a", mid: "#e07a58", hor: "#f8c08a", glow: "#ffb070", sun: "#fff0d2", light: "#ffc48f", ambient: "#b0705a", lightI: 2.2, ambI: 1.3 }), // solara
  pal({ top: "#6f6a9a", mid: "#d9a0a4", hor: "#f5d9b5", glow: "#ffe0c8", sun: "#fff3df", light: "#ffe0d0", ambient: "#a88aa8", lightI: 1.6, ambI: 1.5 }), // coast
  pal({ top: "#030818", mid: "#13224a", hor: "#4a5c8c", glow: "#6fe3d1", sun: "#f6ead2", light: "#9db4e6", ambient: "#3a5088", lightI: 1, ambI: 1.1 }), // blue hour
  pal({ top: "#3a3678", mid: "#9a86b8", hor: "#e3b3b3", glow: "#d9a0e0", sun: "#f8ebd3", light: "#cbb8f0", ambient: "#8c7ab8", lightI: 1.4, ambI: 1.4 }), // moonflower
  pal({ top: "#17294c", mid: "#a46f9a", hor: "#f7b58a", glow: "#f28c62", sun: "#fff0d4", light: "#ffc48f", ambient: "#8a6fa0", lightI: 2, ambI: 1.3 }), // meridian
  pal({ top: "#5fb4d8", mid: "#9fd6dc", hor: "#f5e3c0", glow: "#fff0c8", sun: "#fff6df", light: "#fff0d0", ambient: "#a8c8d0", lightI: 2.4, ambI: 1.4 }), // velora
];

/** where each world's sun hangs, relative to the world's origin */
const SUNS: [number, number, number][] = [
  [0, 16, -170],
  [24, 24, -170],
  [30, 50, -160],
  [35, 38, -150],
  [35, 10, -150],
  [40, 50, -140],
];

const C = (h: string) => new THREE.Color(h);

interface WorldProps {
  lite: boolean;
  cur: Palette;
  sunDir: THREE.Vector3;
}

/* ------------------------------------------------------------------ */
/*  Shared pieces                                                      */
/* ------------------------------------------------------------------ */

function Sun({ position, r, color = "#fff0d2", glow = "#ffb070" }: { position: [number, number, number]; r: number; color?: string; glow?: string }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[r, 40, 24]} />
        <meshBasicMaterial color={color} fog={false} toneMapped={false} />
      </mesh>
      <Glow color={glow} scale={r * 9} position={[0, 0, 0]} opacity={0.6} />
    </group>
  );
}

function StarField({ opacity = 1 }: { opacity?: number }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const r = rng(8);
    const n = 600;
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const th = r() * Math.PI * 2;
      const ph = Math.acos(0.1 + r() * 0.9);
      a[i * 3] = 450 * Math.sin(ph) * Math.cos(th);
      a[i * 3 + 1] = 450 * Math.cos(ph);
      a[i * 3 + 2] = 450 * Math.sin(ph) * Math.sin(th);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(a, 3));
    return g;
  }, []);
  useFrame(({ camera }) => ref.current?.position.copy(camera.position));
  return (
    <points ref={ref} geometry={geo} renderOrder={-9} frustumCulled={false}>
      <pointsMaterial color="#f5e6cc" size={1.9} sizeAttenuation={false} transparent opacity={opacity} depthWrite={false} fog={false} />
    </points>
  );
}

function Mist({ count, y, z, color, opacity, scale, seed }: { count: number; y: [number, number]; z: [number, number]; color: string; opacity: number; scale: [number, number]; seed: number }) {
  const map = useMemo(getGlowTexture, []);
  const items = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, () => ({
      x: -160 + r() * 320,
      y: y[0] + r() * (y[1] - y[0]),
      z: z[0] - r() * (z[0] - z[1]),
      s: scale[0] + r() * (scale[1] - scale[0]),
      sp: 0.3 + r() * 0.7,
    }));
  }, [count, y, z, scale, seed]);
  const refs = useRef<(THREE.Sprite | null)[]>([]);
  useFrame((_, dt) => {
    items.forEach((it, i) => {
      const s = refs.current[i];
      if (!s) return;
      s.position.x += dt * it.sp;
      if (s.position.x > 170) s.position.x = -170;
    });
  });
  return (
    <>
      {items.map((it, i) => (
        <sprite key={i} ref={(el) => void (refs.current[i] = el)} position={[it.x, it.y, it.z]} scale={[it.s * 2, it.s * 0.55, 1]}>
          <spriteMaterial map={map} color={color} transparent opacity={opacity} depthWrite={false} />
        </sprite>
      ))}
    </>
  );
}

function FloatingRock({ position, r, color = "#4a4a80", top = "#8c7bb2", emissive, speed = 1 }: { position: [number, number, number]; r: number; color?: string; top?: string; emissive?: string; speed?: number }) {
  return (
    <Float speed={speed} rotationIntensity={0.1} floatIntensity={1.5} floatingRange={[-0.6, 0.6]} position={position}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[r, r * 0.9, r * 0.2, 8]} />
        <meshStandardMaterial color={top} flatShading roughness={0.9} emissive={emissive ?? "#000"} emissiveIntensity={emissive ? 0.4 : 0} />
      </mesh>
      <mesh position={[0, -r * 0.75, 0]} rotation={[Math.PI, 0.4, 0]}>
        <coneGeometry args={[r * 0.9, r * 1.3, 7]} />
        <meshStandardMaterial color={color} flatShading roughness={1} emissive={emissive ?? "#000"} emissiveIntensity={emissive ? 0.25 : 0} />
      </mesh>
    </Float>
  );
}

function Spin({ speed, children, position, rotation }: { speed: number; children: React.ReactNode; position?: [number, number, number]; rotation?: [number, number, number] }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y += dt * speed;
  });
  return (
    <group ref={g} position={position} rotation={rotation}>
      {children}
    </group>
  );
}

function Cone({ position, r, h, color, seg = 6, emissive, rot = 0 }: { position: [number, number, number]; r: number; h: number; color: string; seg?: number; emissive?: string; rot?: number }) {
  return (
    <mesh position={position} rotation={[0, rot, 0]}>
      <coneGeometry args={[r, h, seg]} />
      <meshStandardMaterial color={color} flatShading roughness={1} emissive={emissive ?? "#000"} emissiveIntensity={emissive ? 0.35 : 0} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  01 · Solara                                                        */
/* ------------------------------------------------------------------ */

function Dunes() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(520, 380, 110, 80);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    const col = new Float32Array(p.count * 3);
    const lo = C("#b84a3e");
    const hi = C("#f8ad6e");
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      const y = Math.sin(x * 0.045 + 1) * 3.4 + Math.sin(z * 0.07 + x * 0.02) * 2.6 + Math.sin(x * 0.13 + z * 0.1) * 0.5;
      p.setY(i, y);
      c.copy(lo).lerp(hi, THREE.MathUtils.clamp((y + 5) / 10, 0, 1));
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} position={[0, -2, -80]}>
      <meshStandardMaterial vertexColors roughness={1} />
    </mesh>
  );
}

function Arch({ position, s, speed }: { position: [number, number, number]; s: number; speed: number }) {
  const mat = <meshStandardMaterial color="#e0804f" emissive="#8a3320" emissiveIntensity={0.5} flatShading roughness={0.95} />;
  return (
    <Spin speed={speed} position={position}>
      <group scale={s}>
        <mesh position={[-5, 6, 0]}>
          <boxGeometry args={[2.6, 12, 3.2]} />
          {mat}
        </mesh>
        <mesh position={[5, 6, 0]}>
          <boxGeometry args={[2.6, 12, 3.2]} />
          {mat}
        </mesh>
        <mesh position={[0, 12, 0]} scale={[1, 1, 1.4]}>
          <torusGeometry args={[5, 1.4, 8, 24, Math.PI]} />
          {mat}
        </mesh>
      </group>
    </Spin>
  );
}

function SolaraWorld({ lite }: Partial<WorldProps>) {
  return (
    <>
      <Dunes />
      <Sun position={[0, 16, -170]} r={16} />
      <Sun position={[-70, 45, -190]} r={7} color="#ffe2b8" />
      <Sun position={[85, 36, -200]} r={5} color="#ffd9a6" />
      <Arch position={[-20, -1, -28]} s={1.1} speed={0.12} />
      <Arch position={[24, -1, -56]} s={1.5} speed={-0.09} />
      <Arch position={[-2, -1, -92]} s={2} speed={0.06} />
      {[
        [48, 4, -70, 8, 15],
        [-64, 6, -104, 10, 20],
        [92, 6, -118, 12, 22],
        [-100, 3, -60, 6, 11],
      ].map(([x, y, z, r, h], i) => (
        <mesh key={i} position={[x, y, z]}>
          <cylinderGeometry args={[r * 0.8, r, h, 7]} />
          <meshStandardMaterial color="#d9673f" emissive="#7a2a1a" emissiveIntensity={0.35} flatShading roughness={1} />
        </mesh>
      ))}
      <Sparkles count={lite ? 60 : 150} scale={[130, 14, 100]} position={[0, 5, -40]} size={4} speed={0.9} opacity={0.8} color="#ffcf9a" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  02 · The Sleeping Coast                                            */
/* ------------------------------------------------------------------ */

function Cliff({ position, h, r, seed }: { position: [number, number, number]; h: number; r: number; seed: number }) {
  const parts = useMemo(() => {
    const g = rng(seed);
    const cols = ["#c98093", "#d98f9e", "#e9a8ac", "#f0b9b4"];
    return Array.from({ length: 4 }, (_, i) => ({ y: (h * i) / 4 + h / 8, r: r * (1 - i * 0.2) * (0.9 + g() * 0.2), h: h / 3.4, c: cols[i], rot: g() * 3, dx: (g() - 0.5) * r * 0.25 }));
  }, [h, r, seed]);
  return (
    <group position={position}>
      {parts.map((p, i) => (
        <mesh key={i} position={[p.dx, p.y, 0]} rotation={[0, p.rot, 0]}>
          <cylinderGeometry args={[p.r * 0.82, p.r, p.h, 6]} />
          <meshStandardMaterial color={p.c} flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function Boat() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (g.current) {
      g.current.position.y = 0.25 + Math.sin(t * 0.9) * 0.12;
      g.current.rotation.z = Math.sin(t * 0.7) * 0.04;
    }
  });
  return (
    <group ref={g} position={[7, 0.25, -12]}>
      <mesh>
        <boxGeometry args={[3.4, 0.5, 1]} />
        <meshStandardMaterial color="#6e4a78" flatShading />
      </mesh>
      <mesh position={[0, 2.4, 0]} scale={[1, 1, 0.05]}>
        <coneGeometry args={[1.3, 4, 3]} />
        <meshStandardMaterial color="#fff3df" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function CoastWorld({ cur, sunDir }: WorldProps) {
  const wc = useMemo(() => ({ deep: C("#9a7aa6"), shallow: C("#e9b9ae"), sky: cur.mid, fog: cur.hor, sunColor: cur.sun }), [cur]);
  return (
    <>
      <Water colors={wc} sunDir={sunDir} position={[0, 0, -150]} amp={0.1} glint={0.7} speed={0.5} fog={[40, 300]} />
      <Sun position={[22, 22, -170]} r={8} color="#fff3df" glow="#ffe0c8" />
      <Cliff position={[-30, -1, -22]} h={22} r={9} seed={1} />
      <Cliff position={[-52, -1, -56]} h={30} r={13} seed={2} />
      <Cliff position={[36, -1, -34]} h={26} r={10} seed={3} />
      <Cliff position={[56, -1, -78]} h={34} r={14} seed={4} />
      <Cliff position={[-14, -1, -112]} h={24} r={12} seed={5} />
      <Cliff position={[22, -1, -138]} h={30} r={15} seed={6} />
      <Mist count={18} y={[1.5, 9]} z={[-15, -130]} color="#fff0e6" opacity={0.42} scale={[22, 44]} seed={3} />
      <Boat />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  03 · The Blue Hour                                                 */
/* ------------------------------------------------------------------ */

function BlueHourWorld({ cur, lite, sunDir }: WorldProps) {
  const wc = useMemo(() => ({ deep: C("#040a1f"), shallow: C("#0f2350"), sky: cur.mid, fog: cur.hor, sunColor: cur.sun }), [cur]);
  const lantern = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.25;
    if (lantern.current) {
      lantern.current.position.set(Math.sin(t) * 9, 0.3 + Math.sin(t * 3) * 0.08, -12 + Math.cos(t) * 4);
      lantern.current.rotation.y = -t;
    }
  });
  const islands = useMemo(() => [
    [-34, -40, 9, 6], [30, -58, 12, 8], [-8, -90, 14, 10], [62, -96, 10, 7], [-70, -108, 13, 9], [4, -26, 4, 3],
  ], []);
  return (
    <>
      <StarField />
      <Water colors={wc} sunDir={sunDir} position={[0, 0, -150]} amp={0.14} glint={0.6} speed={0.6} fog={[40, 300]} />
      <Sun position={[30, 50, -160]} r={9} color="#f6ead2" glow="#6fe3d1" />
      {islands.map(([x, z, r, h], i) => (
        <Cone key={i} position={[x, h / 2 - 1, z]} r={r} h={h} color="#0f1b3a" seg={7} emissive="#0d6a63" rot={i} />
      ))}
      <FloatingRock position={[-18, 16, -60]} r={5} color="#101b3a" top="#1d3560" emissive="#0d6a63" speed={0.8} />
      <FloatingRock position={[26, 24, -80]} r={7} color="#101b3a" top="#1d3560" emissive="#0d6a63" speed={0.6} />
      <FloatingRock position={[2, 12, -34]} r={2.8} color="#101b3a" top="#1d3560" emissive="#0d6a63" speed={1.1} />
      <Sparkles count={lite ? 70 : 170} scale={[150, 2.2, 110]} position={[0, 0.7, -50]} size={7} speed={0.25} opacity={0.9} color="#6fe3d1" />
      <Sparkles count={lite ? 20 : 50} scale={[100, 30, 80]} position={[0, 18, -50]} size={4} speed={0.2} opacity={0.6} color="#bff5ea" />
      <group ref={lantern}>
        <mesh>
          <boxGeometry args={[3, 0.5, 1]} />
          <meshStandardMaterial color="#070d1f" flatShading />
        </mesh>
        <mesh position={[0, 1, 0]}>
          <sphereGeometry args={[0.35, 12, 8]} />
          <meshBasicMaterial color="#f5d9b5" toneMapped={false} />
        </mesh>
        <pointLight position={[0, 1.2, 0]} color="#ffd9a8" intensity={60} distance={30} decay={2} />
      </group>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  04 · Moonflower Valley                                             */
/* ------------------------------------------------------------------ */

function Bloom({ position, h, size, a, b, lean, speed, seed }: { position: [number, number, number]; h: number; size: number; a: string; b: string; lean: number; speed: number; seed: number }) {
  const head = useRef<THREE.Group>(null);
  const stem = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, -1, 0), new THREE.Vector3(lean * 0.2, h * 0.5, 0), new THREE.Vector3(lean, h, 0)]), 18, Math.max(0.3, size * 0.045), 6, false), [h, lean, size]);
  const n = 11;
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (head.current) {
      head.current.rotation.z = t * speed + seed;
      head.current.rotation.x = -0.35 + Math.sin(t * 0.4 + seed) * 0.06;
    }
  });
  return (
    <group position={position}>
      <mesh geometry={stem}>
        <meshStandardMaterial color="#4c5b8c" roughness={0.9} />
      </mesh>
      <group position={[lean, h, 0]} rotation={[-0.35, 0, 0]}>
        <group ref={head}>
          {Array.from({ length: n }, (_, i) => {
            const ang = (i / n) * Math.PI * 2;
            const d = size * 0.5;
            return (
              <mesh key={i} position={[Math.cos(ang) * d, Math.sin(ang) * d, Math.sin(i * 1.7) * 0.15 * size]} rotation={[0, 0, ang - Math.PI / 2]} scale={[size * 0.19, size * 0.52, size * 0.05]}>
                <sphereGeometry args={[1, 14, 10]} />
                <meshStandardMaterial color={i % 2 ? a : b} emissive={i % 2 ? a : b} emissiveIntensity={0.18} roughness={0.7} />
              </mesh>
            );
          })}
          <mesh position={[0, 0, size * 0.04]}>
            <sphereGeometry args={[size * 0.17, 16, 12]} />
            <meshStandardMaterial color="#f5d9b5" emissive="#f5d9b5" emissiveIntensity={0.9} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function FallingPetals({ count }: { count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const data = useMemo(() => {
    const r = rng(14);
    return Array.from({ length: count }, () => ({ x: (r() - 0.5) * 90, y: r() * 36, z: -6 - r() * 70, sp: 1 + r() * 1.6, ph: r() * 6, rs: 0.4 + r() * 1.2 }));
  }, [count]);
  useFrame(({ clock }, dt) => {
    const m = mesh.current;
    if (!m) return;
    const t = clock.elapsedTime;
    data.forEach((p, i) => {
      p.y -= dt * p.sp;
      if (p.y < -1) p.y = 36;
      dummy.position.set(p.x + Math.sin(t * 0.5 + p.ph) * 3, p.y, p.z);
      dummy.rotation.set(t * p.rs + p.ph, t * p.rs * 0.7, p.ph);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <planeGeometry args={[0.9, 1.7]} />
      <meshStandardMaterial color="#f0c2c0" emissive="#f0c2c0" emissiveIntensity={0.25} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

function MoonflowerWorld({ lite }: Partial<WorldProps>) {
  const ground = useMemo(() => {
    const g = new THREE.PlaneGeometry(520, 360, 90, 60);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    const col = new Float32Array(p.count * 3);
    const lo = C("#2d2d63");
    const hi = C("#6a5fa4");
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      const y = Math.sin(x * 0.05) * 1.6 + Math.sin(z * 0.06 + x * 0.03) * 1.4;
      p.setY(i, y);
      c.copy(lo).lerp(hi, THREE.MathUtils.clamp((y + 3) / 6, 0, 1));
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  const peaks = useMemo(() => {
    const r = rng(33);
    return Array.from({ length: 16 }, (_, i) => ({ x: -190 + i * 25 + r() * 14, z: -130 - r() * 40, h: 30 + r() * 38, rad: 18 + r() * 14, c: i % 2 ? "#8c7db9" : "#a79bc9" }));
  }, []);
  return (
    <>
      <StarField opacity={0.5} />
      <mesh geometry={ground} position={[0, -1, -80]}>
        <meshStandardMaterial vertexColors roughness={1} />
      </mesh>
      {peaks.map((p, i) => (
        <Cone key={i} position={[p.x, p.h / 2 - 2, p.z]} r={p.rad} h={p.h} color={p.c} seg={6} rot={i} />
      ))}
      <Sun position={[35, 38, -150]} r={11} color="#f8ebd3" glow="#d9a0e0" />
      <Bloom position={[-24, 0, -16]} h={13} size={9} a="#d9a0a4" b="#e9bcbd" lean={2} speed={0.08} seed={1} />
      <Bloom position={[-6, 0, -34]} h={22} size={15} a="#f28c62" b="#f5a98a" lean={-3} speed={-0.06} seed={2} />
      <Bloom position={[20, 0, -22]} h={16} size={11} a="#c6a2d6" b="#ddb9e2" lean={3} speed={0.1} seed={3} />
      <Bloom position={[40, 0, -52]} h={28} size={19} a="#d9a0a4" b="#f0c2c0" lean={-4} speed={0.05} seed={4} />
      <Bloom position={[-46, 0, -56]} h={26} size={17} a="#f28c62" b="#f7b08f" lean={4} speed={-0.07} seed={5} />
      <Bloom position={[4, 0, -80]} h={34} size={24} a="#d9a0a4" b="#e9bcbd" lean={-2} speed={0.04} seed={6} />
      <FallingPetals count={lite ? 30 : 70} />
      <Sparkles count={lite ? 30 : 80} scale={[100, 26, 80]} position={[0, 12, -40]} size={5} speed={0.2} opacity={0.8} color="#ffe6a8" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  05 · The Lost Meridian                                             */
/* ------------------------------------------------------------------ */

function Tower({ x, z, h, r, tone }: { x: number; z: number; h: number; r: number; tone: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[r * 0.85, r, h, 8]} />
        <meshStandardMaterial color={tone} emissive="#ffb070" emissiveIntensity={0.18} roughness={0.8} />
      </mesh>
      <mesh position={[0, h + r * 1.1, 0]}>
        <coneGeometry args={[r * 1.25, r * 2.6, 8]} />
        <meshStandardMaterial color="#d9a0a4" emissive="#ff8a6a" emissiveIntensity={0.2} flatShading />
      </mesh>
    </group>
  );
}

function City() {
  const lift = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Group>(null);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    if (lift.current) lift.current.position.y = 3 + (Math.sin(t * 0.5) * 0.5 + 0.5) * 18;
    if (ring.current) ring.current.rotation.y += dt * 0.18;
  });
  return (
    <group position={[0, 8, -48]}>
      <Float speed={0.7} floatIntensity={1} rotationIntensity={0.03} floatingRange={[-0.5, 0.5]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[16, 14.5, 1.8, 10]} />
          <meshStandardMaterial color="#8c7bb2" flatShading roughness={0.9} />
        </mesh>
        <mesh position={[0, -12, 0]} rotation={[Math.PI, 0.3, 0]}>
          <coneGeometry args={[14.5, 24, 9]} />
          <meshStandardMaterial color="#4a4a80" flatShading roughness={1} />
        </mesh>
        <mesh position={[6, -18, 3]} rotation={[Math.PI, 1, 0.2]}>
          <coneGeometry args={[6, 12, 6]} />
          <meshStandardMaterial color="#3b3b6e" flatShading roughness={1} />
        </mesh>
        <group position={[0, 0.9, 0]}>
          <Tower x={-9} z={-2} h={11} r={1.4} tone="#f5d9b5" />
          <Tower x={-3.5} z={3} h={17} r={1.8} tone="#f0c8b0" />
          <Tower x={3} z={0} h={24} r={2.2} tone="#f5d9b5" />
          <Tower x={9.5} z={-3} h={13} r={1.5} tone="#f0c8b0" />
          <Tower x={0} z={-7} h={9} r={1.2} tone="#f5d9b5" />
          <Tower x={-12} z={5} h={7} r={1.1} tone="#f0c8b0" />
          <mesh position={[7, 0, 6]}>
            <sphereGeometry args={[3.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#f5d9b5" emissive="#ffb070" emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[-6, 16, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[4.6, 0.45, 8, 24, Math.PI]} />
            <meshStandardMaterial color="#f5d9b5" emissive="#ffb070" emissiveIntensity={0.3} />
          </mesh>
          <mesh ref={lift} position={[-0.2, 3, 3.3]}>
            <boxGeometry args={[2.4, 0.4, 2.4]} />
            <meshStandardMaterial color="#d9a0a4" emissive="#ff8a6a" emissiveIntensity={0.4} />
          </mesh>
        </group>
        {/* moving architecture: a ring of blocks circling the city */}
        <group ref={ring} position={[0, 7, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[23, 0.18, 6, 80]} />
            <meshStandardMaterial color="#f5d9b5" emissive="#f5d9b5" emissiveIntensity={0.5} />
          </mesh>
          {Array.from({ length: 9 }, (_, i) => {
            const a = (i / 9) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 23, Math.sin(i * 2) * 1.2, Math.sin(a) * 23]} rotation={[0, -a, 0.2]}>
                <boxGeometry args={[2.4, 1.1, 1.1]} />
                <meshStandardMaterial color="#d9a0a4" emissive="#ff8a6a" emissiveIntensity={0.3} />
              </mesh>
            );
          })}
        </group>
      </Float>
      <FloatingRock position={[-34, 4, 8]} r={4.5} speed={0.9} />
      <FloatingRock position={[36, 12, -6]} r={5.5} speed={0.7} />
      <FloatingRock position={[24, -6, 18]} r={2.4} speed={1.2} />
    </group>
  );
}

function MeridianWorld({ lite }: Partial<WorldProps>) {
  const map = useMemo(getGlowTexture, []);
  const clouds = useMemo(() => {
    const r = rng(19);
    return Array.from({ length: lite ? 26 : 46 }, (_, i) => ({ x: -200 + r() * 400, y: -4 + r() * 5, z: -10 - r() * 170, s: 36 + r() * 50, c: i % 3 ? "#f9d2b4" : "#d9a0a4", sp: 0.3 + r() * 0.6 }));
  }, [lite]);
  const refs = useRef<(THREE.Sprite | null)[]>([]);
  useFrame((_, dt) => {
    clouds.forEach((c, i) => {
      const s = refs.current[i];
      if (!s) return;
      s.position.x += dt * c.sp;
      if (s.position.x > 210) s.position.x = -210;
    });
  });
  return (
    <>
      <StarField opacity={0.35} />
      <Sun position={[35, 10, -150]} r={14} color="#fff0d4" glow="#f28c62" />
      {clouds.map((c, i) => (
        <sprite key={i} ref={(el) => void (refs.current[i] = el)} position={[c.x, c.y, c.z]} scale={[c.s * 1.9, c.s * 0.5, 1]}>
          <spriteMaterial map={map} color={c.c} transparent opacity={0.85} depthWrite={false} />
        </sprite>
      ))}
      <City />
      <Sparkles count={lite ? 30 : 70} scale={[110, 36, 90]} position={[0, 14, -40]} size={4} speed={0.2} opacity={0.6} color="#ffe2bc" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  06 · Velora                                                        */
/* ------------------------------------------------------------------ */

function Palm({ position, h, lean, s = 1, seed }: { position: [number, number, number]; h: number; lean: number; s?: number; seed: number }) {
  const g = useRef<THREE.Group>(null);
  const fronds = useRef<(THREE.Mesh | null)[]>([]);
  const trunk = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(lean * 0.25, h * 0.55, 0), new THREE.Vector3(lean, h, 0)]), 14, 0.38 * s, 6, false), [h, lean, s]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (g.current) g.current.rotation.z = Math.sin(t * 0.7 + seed) * 0.045;
    fronds.current.forEach((f, i) => {
      if (f) f.rotation.x = 0.55 + Math.sin(t * 1.4 + i + seed) * 0.12;
    });
  });
  return (
    <group position={position} ref={g}>
      <mesh geometry={trunk}>
        <meshStandardMaterial color="#6b4a5c" roughness={1} />
      </mesh>
      <group position={[lean, h, 0]}>
        {Array.from({ length: 8 }, (_, i) => (
          <group key={i} rotation={[0, (i / 8) * Math.PI * 2, 0]}>
            <mesh ref={(el) => void (fronds.current[i] = el)} position={[0, 0, 2.6 * s]} rotation={[0.55, 0, 0]} scale={[0.7 * s, 0.07 * s, 3.2 * s]}>
              <sphereGeometry args={[1, 10, 6]} />
              <meshStandardMaterial color={i % 2 ? "#2e8f78" : "#3aa688"} roughness={0.8} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function VeloraWorld({ cur, sunDir }: WorldProps) {
  const wc = useMemo(() => ({ deep: C("#0b6f8c"), shallow: C("#7ff0dc"), sky: cur.mid, fog: cur.hor, sunColor: cur.sun }), [cur]);
  return (
    <>
      <Water colors={wc} sunDir={sunDir} position={[0, 0, -150]} amp={0.12} glint={0.9} speed={0.7} center={[0, -60]} radius={70} fog={[50, 300]} />
      <Sun position={[40, 50, -140]} r={9} color="#fff6df" glow="#fff0c8" />
      {/* island */}
      <mesh position={[0, 0.3, -60]} scale={[1, 0.16, 0.8]}>
        <sphereGeometry args={[26, 28, 14]} />
        <meshStandardMaterial color="#f5d9b5" roughness={1} />
      </mesh>
      <mesh position={[-34, 0.2, -78]} scale={[1, 0.18, 0.8]}>
        <sphereGeometry args={[9, 18, 10]} />
        <meshStandardMaterial color="#f5d9b5" roughness={1} />
      </mesh>
      {/* sculpted rock */}
      <Cone position={[-12, 11, -66]} r={3} h={22} color="#d9a0a4" seg={6} rot={0.4} />
      <Cone position={[-5, 8, -70]} r={2.1} h={16} color="#b9738a" seg={6} />
      <Cone position={[16, 14, -64]} r={3.6} h={28} color="#d9a0a4" seg={6} rot={1} />
      <Cone position={[24, 7, -58]} r={2} h={14} color="#e9b4b0" seg={5} />
      <group position={[3, 0, -62]}>
        <mesh position={[-6, 5, 0]}>
          <boxGeometry args={[3.2, 11, 4]} />
          <meshStandardMaterial color="#d9a0a4" flatShading roughness={1} />
        </mesh>
        <mesh position={[6, 5, 0]}>
          <boxGeometry args={[3.2, 11, 4]} />
          <meshStandardMaterial color="#d9a0a4" flatShading roughness={1} />
        </mesh>
        <mesh position={[0, 10.5, 0]} scale={[1, 1, 0.9]}>
          <torusGeometry args={[6, 1.7, 8, 24, Math.PI]} />
          <meshStandardMaterial color="#e9b4b0" flatShading roughness={1} />
        </mesh>
      </group>
      <Palm position={[-20, 1, -56]} h={13} lean={-3} seed={1} />
      <Palm position={[-8, 1, -52]} h={9} lean={2} s={0.85} seed={2} />
      <Palm position={[10, 1, -52]} h={12} lean={3} seed={3} />
      <Palm position={[24, 1, -62]} h={15} lean={-3} s={1.1} seed={4} />
      <Palm position={[-34, 1, -78]} h={10} lean={2} s={0.9} seed={5} />
      <Sparkles count={30} scale={[80, 1.5, 60]} position={[0, 0.6, -50]} size={4} speed={0.3} opacity={0.7} color="#ffffff" />
    </>
  );
}

const WORLDS = [SolaraWorld, CoastWorld, BlueHourWorld, MoonflowerWorld, MeridianWorld, VeloraWorld];

/* ------------------------------------------------------------------ */
/*  Controller                                                         */
/* ------------------------------------------------------------------ */

function Worlds({ slug, lite, onReady }: { slug: string; lite: boolean; onReady: () => void }) {
  const index = Math.max(0, destinations.findIndex((d) => d.slug === slug));
  const cur = useMemo(() => newPalette(), []);
  const tmp = useMemo(() => newPalette(), []);
  const sunDir = useMemo(() => new THREE.Vector3(0, 0.2, -1), []);
  const sunTarget = useMemo(() => new THREE.Vector3(), []);
  const lookAt = useMemo(() => new THREE.Vector3(), []);
  const lightTarget = useMemo(() => new THREE.Object3D(), []);
  const amb = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const dir = useRef<THREE.DirectionalLight>(null);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const state = useRef({ opened: performance.now(), switched: -1e9, last: index, frames: 0, initialised: false });
  const { camera } = useThree();

  usePointerState();
  useNightEase();
  useFogSync(cur, 40, 270);

  useFrame((_, dt) => {
    const st = state.current;
    const now = performance.now();
    if (!st.initialised) {
      // first frame: start in the chosen world, palette already set, camera pulled far back
      camera.position.set(worldX(index), 7, 26);
      lerpPalette(cur, PALETTES[index], NIGHT, sceneState.night * 0.55);
      st.initialised = true;
    }
    if (st.last !== index) {
      st.last = index;
      st.switched = now;
    }

    // palette eases toward the selected world (and toward night when the switch is on)
    lerpPalette(tmp, PALETTES[index], NIGHT, sceneState.night * 0.55);
    dampPalette(cur, tmp, 2.6, dt);

    const wx = worldX(index);
    const open = ease.outCubic((now - st.opened) / 2600);
    const warp = Math.exp(-(now - st.switched) / 700);
    const cam = camera as THREE.PerspectiveCamera;

    // glide between worlds, drift with the cursor, and fly in on first entry
    camera.position.x = THREE.MathUtils.damp(camera.position.x, wx + sceneState.px * 4, 1.5, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 7 + sceneState.py * 1.6, 2.5, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, 26 + (1 - open) * 70, 6, dt);
    lookAt.set(camera.position.x + sceneState.px * 5, 8 + sceneState.py * 2, -40);
    camera.lookAt(lookAt);
    const fov = 46 + (1 - open) * 26 + warp * 12;
    if (Math.abs(cam.fov - fov) > 0.05) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }

    // sun direction follows the selected world's sun
    const s = SUNS[index];
    sunTarget.set(wx + s[0], s[1], s[2]).sub(camera.position).normalize();
    sunDir.lerp(sunTarget, 1 - Math.exp(-3 * dt)).normalize();

    if (amb.current) {
      amb.current.color.copy(cur.ambient);
      amb.current.intensity = cur.ambI;
    }
    if (hemi.current) {
      hemi.current.color.copy(cur.mid);
      hemi.current.intensity = 0.9;
    }
    if (dir.current) {
      dir.current.color.copy(cur.light);
      dir.current.intensity = cur.lightI;
      dir.current.position.set(camera.position.x + 20, 38, -30);
      lightTarget.position.set(camera.position.x, 0, -60);
    }
    groups.current.forEach((g, i) => {
      if (g) g.visible = Math.abs(worldX(i) - camera.position.x) < 300;
    });

    if (++st.frames === 3) onReady();
  });

  return (
    <>
      <Sky palette={cur} sunDir={sunDir} />
      <ambientLight ref={amb} />
      <hemisphereLight ref={hemi} args={["#d9a0a4", "#17294c", 0.9]} />
      <primitive object={lightTarget} />
      <directionalLight ref={dir} target={lightTarget} />
      {(WORLDS as React.ComponentType<WorldProps>[]).map((W, i) => (
        <group key={i} ref={(el) => void (groups.current[i] = el)} position={[worldX(i), 0, 0]}>
          <W lite={lite} cur={cur} sunDir={sunDir} />
        </group>
      ))}
    </>
  );
}

export default function WorldsCanvas({ slug, lite, active, onReady }: { slug: string; lite: boolean; active: boolean; onReady: () => void }) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={lite ? 1 : [1, 1.6]}
      camera={{ fov: 46, position: [0, 7, 96], near: 0.5, far: 1000 }}
      gl={{ antialias: !lite, powerPreference: "high-performance" }}
      className="!absolute inset-0"
      aria-hidden
    >
      <Worlds slug={slug} lite={lite} onReady={onReady} />
    </Canvas>
  );
}
