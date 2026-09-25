"use client";

import { useEffect, useRef, useCallback } from "react";

interface WordRevealProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  staggerMs?: number;
  isVisible?: boolean;
}

/**
 * Accessible word-by-word text reveal.
 * The full text is available to assistive technology via sr-only span.
 * Visual word spans are aria-hidden. Reduced motion shows final state immediately.
 */
export default function WordReveal({
  text,
  as: Tag = "h1",
  className = "",
  staggerMs = 45,
  isVisible = false,
}: WordRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const animateWords = useCallback(() => {
    if (!containerRef.current || hasAnimated.current) return;
    hasAnimated.current = true;

    const spans = containerRef.current.querySelectorAll<HTMLSpanElement>(".word-reveal-span");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    spans.forEach((span, i) => {
      if (reducedMotion) {
        span.classList.add("revealed");
      } else {
        const delay = i * staggerMs;
        setTimeout(() => {
          span.classList.add("revealed");
        }, delay);
      }
    });
  }, [staggerMs]);

  useEffect(() => {
    if (isVisible) {
      animateWords();
    }
  }, [isVisible, animateWords]);

  const words = text.split(" ");

  return (
    <Tag className={className}>
      {/* Screen reader accessible full text */}
      <span className="sr-only" style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}>
        {text}
      </span>
      {/* Visual animated words */}
      <span ref={containerRef} aria-hidden="true" className="word-reveal-container">
        {words.map((word, i) => (
          <span key={i} className="word-reveal-span">
            {word}
          </span>
        ))}
      </span>
    </Tag>
  );
}
