"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { sceneState } from "@/lib/scene-state";

/* ------------------------------------------------------------------ */
/*  Environment hooks                                                  */
/* ------------------------------------------------------------------ */

export function canUseWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** True while the element is on screen and the tab is visible. */
export function useOnScreen<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let inView = true;
    let tabVisible = !document.hidden;
    const apply = () => setVisible(inView && tabVisible);
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      apply();
    });
    io.observe(el);
    const onVis = () => {
      tabVisible = !document.hidden;
      apply();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  return [ref, visible] as const;
}

/** Writes the pointer into sceneState (desktop only). */
export function usePointerState() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const move = (e: PointerEvent) => {
      sceneState.px = (e.clientX / window.innerWidth) * 2 - 1;
      sceneState.py = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);
}

/** Eases sceneState.night toward its target; call from one place per canvas. */
export function useNightEase() {
  useFrame((_, dt) => {
    sceneState.night = THREE.MathUtils.damp(sceneState.night, sceneState.nightTarget, 2.4, dt);
  });
}

/* ------------------------------------------------------------------ */
/*  Palette                                                            */
/* ------------------------------------------------------------------ */

export interface Palette {
  top: THREE.Color;
  mid: THREE.Color;
  hor: THREE.Color;
  glow: THREE.Color;
  sun: THREE.Color;
  light: THREE.Color;
  ambient: THREE.Color;
  lightI: number;
  ambI: number;
}

export const pal = (o: {
  top: string; mid: string; hor: string; glow: string; sun: string; light: string; ambient: string; lightI: number; ambI: number;
}): Palette => ({
  top: new THREE.Color(o.top),
  mid: new THREE.Color(o.mid),
  hor: new THREE.Color(o.hor),
  glow: new THREE.Color(o.glow),
  sun: new THREE.Color(o.sun),
  light: new THREE.Color(o.light),
  ambient: new THREE.Color(o.ambient),
  lightI: o.lightI,
  ambI: o.ambI,
});

export const newPalette = (): Palette => pal({ top: "#000", mid: "#000", hor: "#000", glow: "#000", sun: "#000", light: "#000", ambient: "#000", lightI: 1, ambI: 1 });

export function lerpPalette(out: Palette, a: Palette, b: Palette, t: number) {
  out.top.lerpColors(a.top, b.top, t);
  out.mid.lerpColors(a.mid, b.mid, t);
  out.hor.lerpColors(a.hor, b.hor, t);
  out.glow.lerpColors(a.glow, b.glow, t);
  out.sun.lerpColors(a.sun, b.sun, t);
  out.light.lerpColors(a.light, b.light, t);
  out.ambient.lerpColors(a.ambient, b.ambient, t);
  out.lightI = a.lightI + (b.lightI - a.lightI) * t;
  out.ambI = a.ambI + (b.ambI - a.ambI) * t;
  return out;
}

export function dampPalette(out: Palette, target: Palette, lambda: number, dt: number) {
  const k = 1 - Math.exp(-lambda * dt);
  for (const key of ["top", "mid", "hor", "glow", "sun", "light", "ambient"] as const) out[key].lerp(target[key], k);
  out.lightI += (target.lightI - out.lightI) * k;
  out.ambI += (target.ambI - out.ambI) * k;
}

/* ------------------------------------------------------------------ */
/*  Soft glow texture (used for sun halos, clouds, mist)               */
/* ------------------------------------------------------------------ */

let glowTex: THREE.CanvasTexture | null = null;
export function getGlowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.55)");
  grad.addColorStop(0.7, "rgba(255,255,255,0.14)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  glowTex = new THREE.CanvasTexture(c);
  glowTex.colorSpace = THREE.SRGBColorSpace;
  return glowTex;
}

export function Glow({ color, scale, position, opacity = 1, additive = true }: { color: THREE.Color | string; scale: number; position: [number, number, number]; opacity?: number; additive?: boolean }) {
  const map = useMemo(getGlowTexture, []);
  return (
    <sprite position={position} scale={[scale, scale, 1]}>
      <spriteMaterial map={map} color={color} transparent opacity={opacity} depthWrite={false} blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending} fog={false} />
    </sprite>
  );
}

/* ------------------------------------------------------------------ */
/*  Sky dome                                                           */
/* ------------------------------------------------------------------ */

const skyVert = /* glsl */ `
varying vec3 vDir;
void main(){
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const skyFrag = /* glsl */ `
uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHor; uniform vec3 uGlow; uniform vec3 uSunDir;
varying vec3 vDir;
void main(){
  float h = clamp(vDir.y, 0.0, 1.0);
  vec3 c = mix(uHor, uMid, smoothstep(0.0, 0.3, h));
  c = mix(c, uTop, smoothstep(0.22, 0.85, h));
  float g = max(dot(normalize(vDir), uSunDir), 0.0);
  c += uGlow * (pow(g, 6.0) * 0.55 + pow(g, 40.0) * 0.5);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

export function Sky({ palette, sunDir }: { palette: Palette; sunDir: THREE.Vector3 }) {
  const mesh = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uTop: { value: palette.top },
      uMid: { value: palette.mid },
      uHor: { value: palette.hor },
      uGlow: { value: palette.glow },
      uSunDir: { value: sunDir },
    }),
    [palette, sunDir],
  );
  useFrame(({ camera }) => mesh.current?.position.copy(camera.position));
  return (
    <mesh ref={mesh} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[500, 32, 20]} />
      <shaderMaterial vertexShader={skyVert} fragmentShader={skyFrag} uniforms={uniforms} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated water                                                     */
/* ------------------------------------------------------------------ */

const waterVert = /* glsl */ `
uniform float uTime; uniform float uAmp;
varying vec3 vWorld; varying vec3 vN;
void main(){
  vec3 p = position; float t = uTime;
  vec2 q = p.xz;
  float a1 = q.x*0.35 + t*1.1, a2 = q.y*0.5 + t*0.9, a3 = (q.x+q.y)*0.8 + t*1.7;
  float h = sin(a1)*0.5 + sin(a2)*0.35 + sin(a3)*0.15;
  float dx = cos(a1)*0.175 + cos(a3)*0.12;
  float dz = cos(a2)*0.175 + cos(a3)*0.12;
  p.y += h * uAmp;
  vN = normalize(vec3(-dx*uAmp, 1.0, -dz*uAmp));
  vec4 w = modelMatrix * vec4(p, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const waterFrag = /* glsl */ `
uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uSky; uniform vec3 uFog; uniform vec3 uSunDir; uniform vec3 uSunColor;
uniform float uFogNear; uniform float uFogFar; uniform float uGlint; uniform vec2 uCenter; uniform float uRadius;
varying vec3 vWorld; varying vec3 vN;
void main(){
  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vWorld);
  float fres = pow(1.0 - max(dot(V, N), 0.0), 3.0);
  float d = length(vWorld.xz - uCenter);
  vec3 base = mix(uShallow, uDeep, smoothstep(uRadius*0.25, uRadius, d));
  vec3 col = mix(base, uSky, clamp(fres*0.9, 0.0, 1.0));
  vec3 R = reflect(-V, N);
  float s = pow(max(dot(R, normalize(uSunDir)), 0.0), 120.0);
  col += uSunColor * s * uGlint * 2.2;
  float dist = length(cameraPosition - vWorld);
  col = mix(col, uFog, smoothstep(uFogNear, uFogFar, dist));
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

export interface WaterColors {
  deep: THREE.Color;
  shallow: THREE.Color;
  sky: THREE.Color;
  fog: THREE.Color;
  sunColor: THREE.Color;
}

export function Water({
  colors,
  sunDir,
  size = [800, 600],
  segments = [140, 100],
  amp = 0.3,
  glint = 1,
  center = [0, -9999],
  radius = 60,
  fog = [60, 320],
  position = [0, 0, 0],
  speed = 1,
}: {
  colors: WaterColors;
  sunDir: THREE.Vector3;
  size?: [number, number];
  segments?: [number, number];
  amp?: number;
  glint?: number;
  center?: [number, number];
  radius?: number;
  fog?: [number, number];
  position?: [number, number, number];
  speed?: number;
}) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(size[0], size[1], segments[0], segments[1]);
    g.rotateX(-Math.PI / 2);
    return g;
  }, [size, segments]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: amp },
      uDeep: { value: colors.deep },
      uShallow: { value: colors.shallow },
      uSky: { value: colors.sky },
      uFog: { value: colors.fog },
      uSunDir: { value: sunDir },
      uSunColor: { value: colors.sunColor },
      uFogNear: { value: fog[0] },
      uFogFar: { value: fog[1] },
      uGlint: { value: glint },
      uCenter: { value: new THREE.Vector2(center[0], center[1]) },
      uRadius: { value: radius },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colors, sunDir],
  );
  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime * speed;
  });
  return (
    <mesh geometry={geo} position={position} frustumCulled={false}>
      <shaderMaterial vertexShader={waterVert} fragmentShader={waterFrag} uniforms={uniforms} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

export const ease = {
  outCubic: (t: number) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3),
  smooth: (a: number, b: number, x: number) => {
    const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
    return t * t * (3 - 2 * t);
  },
};

/** Keeps the scene's fog colour in sync with a palette. */
export function useFogSync(palette: Palette, near: number, far: number) {
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    scene.fog = new THREE.Fog(palette.hor.clone(), near, far);
    return () => {
      scene.fog = null;
    };
  }, [scene, palette, near, far]);
  useFrame(() => {
    if (scene.fog) (scene.fog as THREE.Fog).color.copy(palette.hor);
  });
}
