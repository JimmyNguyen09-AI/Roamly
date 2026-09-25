"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStoryWorld } from "@/three/storyWorld";

interface StoryCanvasProps {
  scrollProgress: number;
  activeChapter: number;
  chapterProgress: number;
}

interface CameraBeat {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  fov: number;
  roll: number;
  ambient: THREE.Color;
  key: THREE.Color;
  exposure: number;
}

const CAMERA_BEATS: CameraBeat[] = [
  { position: new THREE.Vector3(2.8, 2.15, 12.35), lookAt: new THREE.Vector3(0.15, 1.68, 0), fov: 39, roll: -0.015, ambient: new THREE.Color(0xffd8b7), key: new THREE.Color(0xffa27e), exposure: 1.08 },
  { position: new THREE.Vector3(1.4, 1.95, 5.25), lookAt: new THREE.Vector3(0.15, 1.68, -0.5), fov: 42, roll: 0.008, ambient: new THREE.Color(0x8589ff), key: new THREE.Color(0xff7865), exposure: 1.16 },
  { position: new THREE.Vector3(0.1, 1.65, -4.45), lookAt: new THREE.Vector3(0, 0.45, -11.5), fov: 48, roll: -0.012, ambient: new THREE.Color(0xa4bec1), key: new THREE.Color(0xdfe9dd), exposure: 1.06 },
  { position: new THREE.Vector3(-1.7, 2.4, -13.65), lookAt: new THREE.Vector3(1.25, 1.34, -20), fov: 42, roll: 0.018, ambient: new THREE.Color(0xf3cfaa), key: new THREE.Color(0xff876f), exposure: 1.12 },
  { position: new THREE.Vector3(-3.05, 2.15, -24), lookAt: new THREE.Vector3(0, 1.18, -28.5), fov: 43, roll: -0.02, ambient: new THREE.Color(0xffb47c), key: new THREE.Color(0xff7a5e), exposure: 1.1 },
  { position: new THREE.Vector3(0.8, 1.9, -34), lookAt: new THREE.Vector3(0, 1.18, -40), fov: 44, roll: 0.012, ambient: new THREE.Color(0xa4afff), key: new THREE.Color(0x7983ff), exposure: 1.08 },
  { position: new THREE.Vector3(-0.2, 2.4, -48), lookAt: new THREE.Vector3(0, 1.05, -57), fov: 46, roll: -0.008, ambient: new THREE.Color(0xffb093), key: new THREE.Color(0xff765f), exposure: 1.1 },
  { position: new THREE.Vector3(-0.45, 3.1, -44.5), lookAt: new THREE.Vector3(0, 0.85, -59), fov: 50, roll: 0, ambient: new THREE.Color(0xffc1a4), key: new THREE.Color(0xff7e67), exposure: 1.02 },
];

const ease = (value: number) => {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

function sampleBeat(phase: number) {
  const index = Math.min(Math.floor(phase), CAMERA_BEATS.length - 2);
  const rawLocal = phase - index;
  // Hold the product camera in front of the suitcase, then travel to the
  // memory gallery late in the beat instead of crossing the prop halfway.
  const local = ease(index === 3 ? Math.pow(rawLocal, 2.2) : rawLocal);
  const current = CAMERA_BEATS[index];
  const next = CAMERA_BEATS[index + 1];
  return {
    position: current.position.clone().lerp(next.position, local),
    lookAt: current.lookAt.clone().lerp(next.lookAt, local),
    fov: THREE.MathUtils.lerp(current.fov, next.fov, local),
    roll: THREE.MathUtils.lerp(current.roll, next.roll, local),
    ambient: current.ambient.clone().lerp(next.ambient, local),
    key: current.key.clone().lerp(next.key, local),
    exposure: THREE.MathUtils.lerp(current.exposure, next.exposure, local),
  };
}

export default function StoryCanvas({ activeChapter, chapterProgress }: StoryCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetPhaseRef = useRef(0);
  const currentPhaseRef = useRef(0);
  const pointerTargetRef = useRef(new THREE.Vector2());
  const pointerRef = useRef(new THREE.Vector2());
  const wakeRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    targetPhaseRef.current = THREE.MathUtils.clamp(activeChapter + chapterProgress, 0, 7);
    wakeRef.current();
  }, [activeChapter, chapterProgress]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      container.dataset.webgl = "failed";
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    container.dataset.webgl = "ready";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 140);
    camera.position.copy(CAMERA_BEATS[0].position);
    const world = createStoryWorld();
    scene.add(world.root);

    const hemisphere = new THREE.HemisphereLight(0xffead8, 0x17213b, 1.75);
    scene.add(hemisphere);
    const keyLight = new THREE.DirectionalLight(0xff9c77, 3.2);
    keyLight.position.set(5, 9, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);
    const cameraLight = new THREE.PointLight(0xbcc5ff, 13, 22, 1.6);
    scene.add(cameraLight);

    const clock = new THREE.Clock();
    const lightOffset = new THREE.Vector3(-1.4, 1.1, -1.2);
    let frameId = 0;
    let running = false;
    let intersecting = true;
    let visible = !document.hidden;

    const render = () => {
      if (!running) return;
      if (!intersecting || !visible) {
        running = false;
        container.dataset.rendering = "paused";
        return;
      }

      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;
      const phaseDamping = 1 - Math.exp(-delta * 5.8);
      const pointerDamping = 1 - Math.exp(-delta * 4.2);
      currentPhaseRef.current = THREE.MathUtils.lerp(currentPhaseRef.current, targetPhaseRef.current, phaseDamping);
      pointerRef.current.lerp(pointerTargetRef.current, pointerDamping);

      const phase = currentPhaseRef.current;
      const beat = sampleBeat(phase);
      beat.position.x += pointerRef.current.x * 0.14;
      beat.position.y += pointerRef.current.y * 0.08;
      beat.lookAt.x += pointerRef.current.x * 0.08;
      camera.position.lerp(beat.position, 1 - Math.exp(-delta * 7));
      camera.fov = THREE.MathUtils.lerp(camera.fov, beat.fov, 1 - Math.exp(-delta * 5));
      camera.updateProjectionMatrix();
      camera.lookAt(beat.lookAt);
      camera.rotateZ(beat.roll + pointerRef.current.x * 0.003);

      hemisphere.color.lerp(beat.ambient, 1 - Math.exp(-delta * 3.4));
      keyLight.color.lerp(beat.key, 1 - Math.exp(-delta * 3.4));
      keyLight.position.set(camera.position.x + 4.5, camera.position.y + 7, camera.position.z + 7);
      cameraLight.position.copy(camera.position).add(lightOffset);
      renderer.toneMappingExposure = THREE.MathUtils.lerp(renderer.toneMappingExposure, beat.exposure, 0.06);

      world.update(phase, elapsed, pointerRef.current);
      container.style.setProperty("--scene-phase", phase.toFixed(3));
      renderer.render(scene, camera);

      const phaseSettled = Math.abs(targetPhaseRef.current - phase) < 0.0005;
      const pointerSettled = pointerRef.current.distanceTo(pointerTargetRef.current) < 0.001;
      if (targetPhaseRef.current > 6.98 && phaseSettled && pointerSettled) {
        running = false;
        container.dataset.rendering = "paused";
        return;
      }
      frameId = requestAnimationFrame(render);
    };

    const start = () => {
      if (running || !intersecting || !visible) return;
      running = true;
      clock.getDelta();
      container.dataset.rendering = "running";
      frameId = requestAnimationFrame(render);
    };
    const stop = () => {
      running = false;
      container.dataset.rendering = "paused";
      cancelAnimationFrame(frameId);
    };
    wakeRef.current = start;

    const observer = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting;
      if (intersecting) start(); else stop();
    });
    observer.observe(container);

    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) start(); else stop();
    };
    const onResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      start();
    };
    const onPointerMove = (event: PointerEvent) => {
      pointerTargetRef.current.set(
        THREE.MathUtils.clamp((event.clientX / window.innerWidth) * 2 - 1, -1, 1),
        THREE.MathUtils.clamp(-((event.clientY / window.innerHeight) * 2 - 1), -1, 1),
      );
      start();
    };
    const onPointerLeave = () => {
      pointerTargetRef.current.set(0, 0);
      start();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    start();

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      wakeRef.current = () => undefined;
      world.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="three-canvas-container" aria-hidden="true" />;
}
