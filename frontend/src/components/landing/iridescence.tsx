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

  // Keep the iridescent motion but constrain the palette to white/black/gold.
  float wave = cos(uv.x * (1.7 + d * 0.08) + a * 0.22) * 0.5 + 0.5;
  float grain = sin((uv.x + uv.y) * 5.4 + d * 0.35) * 0.5 + 0.5;
  float intensity = clamp(wave * 0.72 + grain * 0.28, 0.0, 1.0);
  float glow = smoothstep(0.58, 0.92, intensity);

  vec3 base = mix(vec3(0.02), vec3(0.97), intensity);
  vec3 gold = vec3(0.83, 0.69, 0.23);
  vec3 col = mix(base, gold, glow * 0.42) * uColor;

  gl_FragColor = vec4(col, 1.0);
}
`;

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
    gl.clearColor(1, 1, 1, 1);

    let program: Program;
    const geometry = new Triangle(gl);

    function resize() {
      const scale = 1;
      renderer.setSize(containerEl.offsetWidth * scale, containerEl.offsetHeight * scale);
      if (!program) return;
      program.uniforms.uResolution.value = new Color(
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height
      );
    }

    program = new Program(gl, {
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
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    resize();

    const handleResize = () => resize();
    window.addEventListener("resize", handleResize);

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
