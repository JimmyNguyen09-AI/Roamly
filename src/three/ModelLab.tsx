"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createRoamlySuitcase, createRoamlyTorii } from "@/three/models";

const VIEW_ANGLES: Record<string, number> = {
  front: 0,
  right: Math.PI / 2,
  rear: Math.PI,
  left: -Math.PI / 2,
  threequarter: -Math.PI / 5,
};

export default function ModelLab() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const query = new URLSearchParams(window.location.search);
    const modelName = query.get("model") === "torii" ? "torii" : "suitcase";
    const view = query.get("view") ?? "threequarter";
    const clean = query.get("clean") === "1";
    const priorHtmlBackground = document.documentElement.style.background;
    const priorBodyBackground = document.body.style.background;
    if (clean) {
      document.documentElement.style.background = "transparent";
      document.body.style.background = "transparent";
    }
    const model = modelName === "torii" ? createRoamlyTorii() : createRoamlySuitcase();
    model.rotation.y = view === "reference"
      ? (modelName === "suitcase" ? -Math.PI / 7 : -0.07)
      : (VIEW_ANGLES[view] ?? VIEW_ANGLES.threequarter);

    const scene = new THREE.Scene();
    scene.background = clean ? null : new THREE.Color(0xf4f1eb);
    scene.add(model);
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    model.position.sub(center);

    const camera = new THREE.PerspectiveCamera(36, host.clientWidth / host.clientHeight, 0.1, 100);
    camera.position.set(0, size.y * 0.12, Math.max(size.x, size.y) * (modelName === "torii" ? 1.72 : 1.65));
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: clean, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xfff4e8, 0x26324a, 2.25));
    const key = new THREE.DirectionalLight(0xffead6, 4.4);
    key.position.set(-4, 7, 6);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x8aa8ff, 2.1);
    rim.position.set(5, 3, -5);
    scene.add(rim);

    if (!clean) {
      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(Math.max(size.x, size.z) * 1.25, 64),
        new THREE.ShadowMaterial({ color: 0x1c2230, opacity: 0.16 }),
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -size.y / 2 - 0.03;
      ground.receiveShadow = true;
      scene.add(ground);
    }

    renderer.render(scene, camera);
    host.dataset.ready = "true";
    return () => {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) child.geometry.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
      document.documentElement.style.background = priorHtmlBackground;
      document.body.style.background = priorBodyBackground;
    };
  }, []);

  return <div ref={hostRef} style={{ width: "100vw", height: "100vh", overflow: "hidden" }} aria-label="Procedural model review" />;
}
