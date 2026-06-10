"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  type MotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

export function ContainerScroll({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });
  const shouldReduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const scaleDimensions = isMobile ? [0.86, 0.96] : [0.98, 1];
  const rotate = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? [0, 0] : [10, 0],
  );
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions);
  const translate = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? [0, 0] : [0, -100],
  );

  return (
    <div
      className="relative flex min-h-[38rem] items-start justify-center overflow-hidden px-4 pb-16 pt-8 md:min-h-[50rem] md:px-10 md:pb-20 md:pt-10 lg:min-h-[56rem]"
      ref={containerRef}
    >
      <div
        className="relative w-full"
        style={{ perspective: "1000px" }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
}

export function Header({
  translate,
  titleComponent,
}: {
  translate: MotionValue<number>;
  titleComponent: string | React.ReactNode;
}) {
  return (
    <motion.div
      style={{ translateY: translate }}
      className="mx-auto max-w-5xl text-center"
    >
      {titleComponent}
    </motion.div>
  );
}

export function Card({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 10px 24px rgba(16, 24, 25, 0.18), 0 42px 60px rgba(16, 24, 25, 0.16), 0 120px 80px rgba(16, 24, 25, 0.08)",
      }}
      className="mx-auto mt-6 h-[22rem] w-full max-w-5xl rounded-lg border border-white/10 bg-[var(--color-surface-dark)] p-2 shadow-2xl md:mt-8 md:h-[32rem] md:p-4 lg:h-[36rem]"
    >
      <div className="h-full w-full overflow-hidden rounded-md bg-[var(--color-surface-card)]">
        {children}
      </div>
    </motion.div>
  );
}
