"use client";

import { useRef, useEffect, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: "left" | "right" | "up";
  delay?: number;
  className?: string;
}

/**
 * Wrapper that reveals its children when scrolled into view
 * using IntersectionObserver. Supports left/right/up entry.
 */
export default function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  className = "",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const directionClass =
    direction === "left"
      ? "side-entry-left"
      : direction === "right"
      ? "side-entry-right"
      : "scroll-reveal";

  return (
    <div
      ref={ref}
      className={`${directionClass} ${visible ? "visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
