"use client";

import { Renderer, Program, Mesh, Color, Triangle } from "ogl";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface IridescenceProps {
  color?: [number, number, number];
  speed?: number;
  amplitude?: number;
  mouseReact?: boolean;
  className?: string;
}

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uSpeed;
uniform vec3 uBaseLow;
uniform vec3 uBaseHigh;
uniform vec3 uGold;
uniform float uGoldStrength;

varying vec2 vUv;

void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;

  uv += (uMouse - vec2(0.5)) * uAmplitude;

  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < 8.0; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;

  float wave = cos(uv.x * (1.7 + d * 0.08) + a * 0.22) * 0.5 + 0.5;
  float grain = sin((uv.x + uv.y) * 5.4 + d * 0.35) * 0.5 + 0.5;
  float intensity = clamp(wave * 0.72 + grain * 0.28, 0.0, 1.0);
  float glow = smoothstep(0.58, 0.92, intensity);

  vec3 base  = mix(uBaseLow, uBaseHigh, intensity);
  vec3 col   = mix(base, uGold, glow * uGoldStrength);
  col       *= uColor;

  gl_FragColor = vec4(col, 1.0);
}
`;

// Light mode: warm cream/brown base with rich gold iridescence
const LIGHT_PALETTE = {
  clearColor: [0.91, 0.88, 0.83] as [number, number, number],    // #e8e0d4 (warm cream bg)
  baseLow: [0.78, 0.72, 0.58],                                     // brighter warm brown
  baseHigh: [0.94, 0.91, 0.84],                                    // brighter warm cream
  gold: [0.90, 0.78, 0.32],                                        // brighter, lighter gold
  goldStrength: 0.72,
};

// Dark mode: deep warm brown base with gold glow
const DARK_PALETTE = {
  clearColor: [0.10, 0.086, 0.067] as [number, number, number],  // #1a1611 (warm dark)
  baseLow: [0.08, 0.067, 0.047],                                   // deep warm brown
  baseHigh: [0.18, 0.15, 0.10],                                    // dark brown
  gold: [0.90, 0.78, 0.32],                                        // brighter gold
  goldStrength: 0.6,
};

function getTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function Iridescence({
  color = [1, 1, 1],
  speed = 1.0,
  amplitude = 0.1,
  mouseReact = true,
  className,
}: IridescenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerEl: HTMLDivElement = container;

    const renderer = new Renderer();
    const gl = renderer.gl;

    const palette = getTheme() === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
    gl.clearColor(...palette.clearColor, 1);

    const geometry = new Triangle(gl);

    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(...color) },
        uResolution: {
          value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height),
        },
        uMouse: { value: new Float32Array([mouseRef.current.x, mouseRef.current.y]) },
        uAmplitude: { value: amplitude },
        uSpeed: { value: speed },
        uBaseLow: { value: new Color(...palette.baseLow) },
        uBaseHigh: { value: new Color(...palette.baseHigh) },
        uGold: { value: new Color(...palette.gold) },
        uGoldStrength: { value: palette.goldStrength },
      },
    });

    function resize() {
      const scale = 1;
      renderer.setSize(containerEl.offsetWidth * scale, containerEl.offsetHeight * scale);
      program.uniforms.uResolution.value = new Color(
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height
      );
    }

    const mesh = new Mesh(gl, { geometry, program });
    resize();

    const handleResize = () => resize();
    window.addEventListener("resize", handleResize);

    // Watch for theme changes via MutationObserver
    const observer = new MutationObserver(() => {
      const p = getTheme() === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
      gl.clearColor(...p.clearColor, 1);
      (program.uniforms.uBaseLow.value as Color).set(...p.baseLow);
      (program.uniforms.uBaseHigh.value as Color).set(...p.baseHigh);
      (program.uniforms.uGold.value as Color).set(...p.gold);
      program.uniforms.uGoldStrength.value = p.goldStrength;
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    let frame = 0;
    const animate = (time: number) => {
      frame = requestAnimationFrame(animate);
      program.uniforms.uTime.value = time * 0.001;
      renderer.render({ scene: mesh });
    };

    frame = requestAnimationFrame(animate);
    containerEl.appendChild(gl.canvas);

    const handleMouseMove = (event: MouseEvent) => {
      const rect = containerEl.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = 1.0 - (event.clientY - rect.top) / rect.height;
      mouseRef.current = { x, y };
      program.uniforms.uMouse.value[0] = x;
      program.uniforms.uMouse.value[1] = y;
    };

    if (mouseReact) {
      containerEl.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      if (mouseReact) {
        containerEl.removeEventListener("mousemove", handleMouseMove);
      }
      if (containerEl.contains(gl.canvas)) {
        containerEl.removeChild(gl.canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [color, speed, amplitude, mouseReact]);

  return <div ref={containerRef} className={cn("h-full w-full", className)} />;
}
