"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type SparklesProps = {
  className?: string;
  size?: number;
  minSize?: number | null;
  density?: number;
  speed?: number;
  minSpeed?: number | null;
  opacity?: number;
  opacitySpeed?: number;
  minOpacity?: number | null;
  color?: string;
  background?: string;
  options?: Record<string, unknown>;
};

type Particle = {
  opacity: number;
  pulseOffset: number;
  pulseSpeed: number;
  radius: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createSeededRandom(seed: number) {
  let value = seed % 2147483647;

  if (value <= 0) {
    value += 2147483646;
  }

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

export function Sparkles({
  className,
  size = 1,
  minSize = null,
  density = 800,
  speed = 1,
  minSpeed = null,
  opacity = 1,
  opacitySpeed = 3,
  minOpacity = null,
  color = "currentColor",
  background = "transparent",
  options: _options = {},
}: SparklesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const seedRef = useRef<number>(Math.floor(Math.random() * 2147483646));

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const minParticleSize = minSize ?? size / 2.5;
    const minParticleSpeed = minSpeed ?? speed / 10;
    const minParticleOpacity = minOpacity ?? opacity / 10;
    const rng = createSeededRandom(seedRef.current);
    const particles: Particle[] = [];

    let animationFrame = 0;
    let height = 0;
    let lastFrame = 0;
    let width = 0;

    const createParticle = (): Particle => {
      const radius = minParticleSize + rng() * Math.max(size - minParticleSize, 0.1);
      const velocity = (minParticleSpeed + rng() * Math.max(speed - minParticleSpeed, 0.05)) * 14;
      const angle = rng() * Math.PI * 2;

      return {
        x: rng() * width,
        y: rng() * height,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        radius,
        opacity: minParticleOpacity + rng() * Math.max(opacity - minParticleOpacity, 0.08),
        pulseOffset: rng() * Math.PI * 2,
        pulseSpeed: (0.35 + rng() * 0.9) * Math.max(opacitySpeed, 0.2),
      };
    };

    const resetCanvas = () => {
      const nextWidth = canvas.clientWidth;
      const nextHeight = canvas.clientHeight;

      width = nextWidth;
      height = nextHeight;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(nextWidth * dpr));
      canvas.height = Math.max(1, Math.floor(nextHeight * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const area = nextWidth * nextHeight;
      const targetCount = clamp(
        Math.round((density * area) / 1_000_000),
        area <= 1024 ? 4 : 10,
        180,
      );

      particles.length = targetCount;

      for (let index = 0; index < targetCount; index += 1) {
        particles[index] = createParticle();
      }
    };

    const draw = (timestamp: number) => {
      if (width === 0 || height === 0) {
        animationFrame = window.requestAnimationFrame(draw);
        return;
      }

      const deltaSeconds = lastFrame === 0 ? 1 / 60 : Math.min((timestamp - lastFrame) / 1000, 0.05);
      lastFrame = timestamp;

      context.clearRect(0, 0, width, height);

      if (background !== "transparent") {
        context.fillStyle = background;
        context.fillRect(0, 0, width, height);
      }

      for (const particle of particles) {
        particle.x += particle.vx * deltaSeconds;
        particle.y += particle.vy * deltaSeconds;

        const margin = particle.radius * 2;

        if (particle.x < -margin) particle.x = width + margin;
        if (particle.x > width + margin) particle.x = -margin;
        if (particle.y < -margin) particle.y = height + margin;
        if (particle.y > height + margin) particle.y = -margin;

        const pulse = 0.55 + 0.45 * Math.sin(timestamp * 0.001 * particle.pulseSpeed + particle.pulseOffset);
        context.globalAlpha = clamp(particle.opacity * pulse, 0, 1);
        context.fillStyle = color;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      }

      context.globalAlpha = 1;
      animationFrame = window.requestAnimationFrame(draw);
    };

    resetCanvas();

    const resizeObserver = new ResizeObserver(() => {
      resetCanvas();
    });

    resizeObserver.observe(canvas);
    animationFrame = window.requestAnimationFrame(draw);

    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(animationFrame);
    };
  }, [
    background,
    color,
    density,
    minOpacity,
    minSize,
    minSpeed,
    opacity,
    opacitySpeed,
    size,
    speed,
  ]);

  return (
    <div aria-hidden="true" className={cn("pointer-events-none relative block overflow-hidden", className)}>
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
