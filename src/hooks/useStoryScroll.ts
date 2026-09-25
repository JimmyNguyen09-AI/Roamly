"use client";

import { useEffect, useRef, useCallback, useState, useSyncExternalStore } from "react";

/**
 * Scroll progress hook: returns a value [0, 1] based on how far through the page the user has scrolled.
 */
export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          setProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0);
          ticking = false;
        });
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return progress;
}

/**
 * Parallax scroll offset hook for depth layers:
 * Foreground: 0.15×, Midground: 0.08×, Background: 0.03× relative to scroll
 */
export function useParallax(disabled = false) {
  const [offsets, setOffsets] = useState({ fg: 0, mg: 0, bg: 0 });

  useEffect(() => {
    if (disabled) {
      return;
    }

    let ticking = false;

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          const y = window.scrollY;
          setOffsets({
            fg: y * -0.15,
            mg: y * -0.08,
            bg: y * -0.03,
          });
          ticking = false;
        });
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [disabled]);

  return disabled ? { fg: 0, mg: 0, bg: 0 } : offsets;
}

/**
 * IntersectionObserver-based visibility hook.
 */
export function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.15, ...options }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [options]);

  return { ref, isInView };
}

// ── External store subscriptions to satisfy React 19 rules (no setState inside useEffect) ──

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Detect reduced motion preference using useSyncExternalStore
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    () => false
  );
}

function subscribeDataSaver(callback: () => void) {
  if (typeof window === "undefined" || !("connection" in navigator)) return () => {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conn = (navigator as any).connection;
  conn?.addEventListener?.("change", callback);
  return () => conn?.removeEventListener?.("change", callback);
}

function getDataSaverSnapshot(): boolean {
  if (typeof window === "undefined" || !("connection" in navigator)) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Boolean((navigator as any).connection?.saveData);
}

/**
 * Detect data saver using useSyncExternalStore
 */
export function useDataSaver(): boolean {
  return useSyncExternalStore(
    subscribeDataSaver,
    getDataSaverSnapshot,
    () => false
  );
}

let cachedWebGL: boolean | null = null;
function getWebGLSnapshot(): boolean {
  if (typeof window === "undefined") return true;
  if (cachedWebGL !== null) return cachedWebGL;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    cachedWebGL = Boolean(gl);
    return cachedWebGL;
  } catch {
    cachedWebGL = false;
    return false;
  }
}

/**
 * Detect WebGL availability using useSyncExternalStore
 */
export function useWebGLAvailable(): boolean {
  return useSyncExternalStore(
    () => () => {},
    getWebGLSnapshot,
    () => true
  );
}

/**
 * Chapter progress from scroll position – determines which chapter is active
 * based on the positions of chapter elements.
 */
export function useChapterProgress(chapterCount: number) {
  const [activeChapter, setActiveChapter] = useState(0);
  const [chapterProgress, setChapterProgress] = useState(0);
  const chapterRefs = useRef<(HTMLElement | null)[]>([]);

  const setChapterRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      chapterRefs.current[index] = el;
    },
    []
  );

  useEffect(() => {
    let ticking = false;

    function update() {
      const chapters = chapterRefs.current;
      const marker = window.scrollY + window.innerHeight * 0.35;

      for (let i = chapters.length - 1; i >= 0; i--) {
        const el = chapters[i];
        if (el && marker >= el.offsetTop) {
          setActiveChapter(i);
          const availableBeforePageEnd = document.documentElement.scrollHeight - window.innerHeight - el.offsetTop;
          const travel = Math.max(1, Math.min(el.offsetHeight * 0.65, Math.max(1, availableBeforePageEnd)));
          const progress = Math.min(
            Math.max((window.scrollY - el.offsetTop) / travel, 0),
            1
          );
          setChapterProgress(progress);
          break;
        }
      }
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          update();
          ticking = false;
        });
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, [chapterCount]);

  return { activeChapter, chapterProgress, setChapterRef };
}
