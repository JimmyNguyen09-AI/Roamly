import * as THREE from "three";
import { createRoamlySuitcase, createRoamlyTorii } from "@/three/models";

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const FORWARD = new THREE.Vector3(0, 0, -1);
const tempMatrix = new THREE.Matrix4();
const tempQuaternion = new THREE.Quaternion();
const tempScale = new THREE.Vector3();
const tempPosition = new THREE.Vector3();

const clamp01 = (value: number) => THREE.MathUtils.clamp(value, 0, 1);
const smooth = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const between = (phase: number, start: number, end: number) => smooth((phase - start) / (end - start));
const bell = (phase: number, start: number, peak: number, end: number) => (
  phase < peak ? between(phase, start, peak) : 1 - between(phase, peak, end)
);

function seeded(index: number) {
  return ((Math.sin(index * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1;
}

function createPortalMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uFlash: { value: 0 },
      uCoral: { value: new THREE.Color(0xff806e) },
      uIndigo: { value: new THREE.Color(0x7777ff) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uIntensity;
      uniform float uFlash;
      uniform vec3 uCoral;
      uniform vec3 uIndigo;

      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 345.45));
        p += dot(p, p + 34.345);
        return fract(p.x * p.y);
      }

      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float rounded = length(p * vec2(.82, .62));
        float mask = 1.0 - smoothstep(.72, 1.02, rounded);
        float rim = smoothstep(.57, .93, rounded) * (1.0 - smoothstep(.93, 1.03, rounded));
        float rings = .5 + .5 * sin(rounded * 34.0 - uTime * 3.2 + p.y * 4.0);
        float grain = hash(floor((p + uTime * .012) * 52.0));
        vec3 colour = mix(uIndigo, uCoral, vUv.y + sin(uTime + p.x * 3.0) * .12);
        float alpha = mask * (.05 + rings * .11 + grain * .035) * uIntensity;
        alpha += rim * (.28 + uFlash * .55) * uIntensity;
        alpha += mask * uFlash * .32;
        gl_FragColor = vec4(colour, alpha);
      }
    `,
  });
}

function makeCanvasCard(kicker: string, title: string, detail: string, accent: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 456;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.CanvasTexture(canvas);

  const gradient = context.createLinearGradient(0, 0, 768, 456);
  gradient.addColorStop(0, "#fbfbff");
  gradient.addColorStop(1, "#e8ebf7");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 768, 456);
  context.fillStyle = accent;
  context.fillRect(0, 0, 18, 456);
  context.fillStyle = "#6366f1";
  context.beginPath();
  context.arc(675, 78, 36, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#475569";
  context.font = "700 25px Arial";
  context.fillText(kicker.toUpperCase(), 62, 82);
  context.fillStyle = "#0f172a";
  context.font = "700 58px Arial";
  context.fillText(title, 62, 176);
  context.fillStyle = "#64748b";
  context.font = "30px Arial";
  context.fillText(detail, 62, 230);
  context.strokeStyle = "#cbd5e1";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(62, 292);
  context.lineTo(706, 292);
  context.stroke();
  context.fillStyle = "#4338ca";
  context.font = "700 25px Arial";
  context.fillText("ROAMLY / JAPAN", 62, 364);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createStoryCard(kicker: string, title: string, detail: string, accent: string) {
  const group = new THREE.Group();
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.82, 1.72),
    new THREE.MeshBasicMaterial({ color: 0x11182c, transparent: true, opacity: 0.28, depthWrite: false }),
  );
  shadow.position.set(0.08, -0.08, -0.04);
  group.add(shadow);

  const surface = new THREE.Mesh(
    new THREE.PlaneGeometry(2.72, 1.62),
    new THREE.MeshBasicMaterial({ map: makeCanvasCard(kicker, title, detail, accent), transparent: true }),
  );
  surface.name = `story-card-${title}`;
  group.add(surface);
  return group;
}

function createPhotoFrame(source: string, caption: string) {
  const group = new THREE.Group();
  const backing = new THREE.Mesh(
    new THREE.BoxGeometry(3.25, 2.18, 0.09),
    new THREE.MeshPhysicalMaterial({ color: 0xf8f3e9, roughness: 0.48, clearcoat: 0.2 }),
  );
  backing.castShadow = true;
  group.add(backing);

  const texture = new THREE.TextureLoader().load(source);
  texture.colorSpace = THREE.SRGBColorSpace;
  const photo = new THREE.Mesh(
    new THREE.PlaneGeometry(2.92, 1.7),
    new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
  );
  photo.position.set(0, 0.12, 0.051);
  group.add(photo);

  const labelTexture = makeCanvasCard("MEMORY", caption, "Saved from the plan", "#f26f5f");
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(1.55, 0.48),
    new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, toneMapped: false }),
  );
  label.position.set(0.65, -0.73, 0.059);
  label.scale.setScalar(0.48);
  group.add(label);
  return group;
}

function createRouteWorld() {
  const group = new THREE.Group();
  group.name = "route-world";
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-5.2, -0.15, -7.6),
    new THREE.Vector3(-3.7, 0.35, -9.4),
    new THREE.Vector3(-1.5, 0.05, -10.7),
    new THREE.Vector3(0.1, 0.58, -12.0),
    new THREE.Vector3(2.6, 0.12, -13.2),
    new THREE.Vector3(4.9, 0.46, -15.8),
  ], false, "catmullrom", 0.3);

  const count = 84;
  const segmentGeometry = new THREE.CylinderGeometry(0.027, 0.027, 1, 7, 1);
  const routeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff8a78,
    emissive: 0xff4934,
    emissiveIntensity: 2.1,
    roughness: 0.32,
    transparent: true,
    opacity: 0,
  });
  const route = new THREE.InstancedMesh(segmentGeometry, routeMaterial, count);
  route.name = "route-light-ribbon";
  for (let index = 0; index < count; index += 1) {
    const start = curve.getPoint(index / count);
    const end = curve.getPoint((index + 1) / count);
    const direction = end.clone().sub(start);
    tempPosition.copy(start).add(end).multiplyScalar(0.5);
    tempQuaternion.setFromUnitVectors(Y_AXIS, direction.clone().normalize());
    tempScale.set(1, direction.length(), 1);
    tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
    route.setMatrixAt(index, tempMatrix);
  }
  route.instanceMatrix.needsUpdate = true;
  route.count = 0;
  group.add(route);

  const nodes = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.105, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xffd4ca, emissive: 0xff6d59, emissiveIntensity: 2.7 }),
    7,
  );
  for (let index = 0; index < 7; index += 1) {
    const point = curve.getPoint(index / 6);
    tempMatrix.makeTranslation(point.x, point.y, point.z);
    nodes.setMatrixAt(index, tempMatrix);
  }
  nodes.instanceMatrix.needsUpdate = true;
  group.add(nodes);

  const mountains = new THREE.InstancedMesh(
    new THREE.ConeGeometry(1, 1, 5),
    new THREE.MeshStandardMaterial({ color: 0x52666a, roughness: 1, transparent: true, opacity: 0 }),
    34,
  );
  for (let index = 0; index < 34; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const x = side * (4.5 + seeded(index) * 4.2);
    const z = -8.8 - seeded(index + 52) * 10;
    const height = 0.7 + seeded(index + 91) * 2.2;
    tempPosition.set(x, -0.62 + height * 0.5, z);
    tempQuaternion.setFromAxisAngle(Y_AXIS, seeded(index + 13) * Math.PI);
    tempScale.set(0.58 + seeded(index + 7) * 0.72, height, 0.58 + seeded(index + 9) * 0.72);
    tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
    mountains.setMatrixAt(index, tempMatrix);
  }
  mountains.instanceMatrix.needsUpdate = true;
  group.add(mountains);

  const train = new THREE.Group();
  train.name = "story-train";
  const trainBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.34, 1.45),
    new THREE.MeshPhysicalMaterial({ color: 0xf1eee8, roughness: 0.36, clearcoat: 0.42 }),
  );
  trainBody.position.y = 0.21;
  train.add(trainBody);
  const windowMaterial = new THREE.MeshBasicMaterial({ color: 0x192b48 });
  [-0.351, 0.351].forEach((x) => {
    const windows = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.13), windowMaterial);
    windows.position.set(x, 0.27, 0.08);
    windows.rotation.y = x < 0 ? -Math.PI / 2 : Math.PI / 2;
    train.add(windows);
  });
  group.add(train);

  return { group, curve, route, routeMaterial, nodes, mountains, train };
}

export interface StoryWorld {
  root: THREE.Group;
  portalMaterial: THREE.ShaderMaterial;
  update: (phase: number, elapsed: number, pointer: THREE.Vector2) => void;
  dispose: () => void;
}

export function createStoryWorld(): StoryWorld {
  const root = new THREE.Group();
  root.name = "roamly-continuous-world";

  const torii = createRoamlyTorii();
  torii.scale.setScalar(1.42);
  torii.position.set(2.15, -0.28, 0);
  root.add(torii);
  const toriiBase = new Map<THREE.Object3D, THREE.Vector3>();
  torii.children.forEach((child) => toriiBase.set(child, child.position.clone()));
  const toriiMaterials = new Set<THREE.Material>();
  torii.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => toriiMaterials.add(material));
    }
  });

  const portal = new THREE.Group();
  portal.name = "torii-portal";
  portal.position.set(2.15, 1.83, 0.06);
  const portalMaterial = createPortalMaterial();
  const membrane = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 3.0, 1, 1), portalMaterial);
  portal.add(membrane);
  const portalRingMaterial = new THREE.MeshBasicMaterial({
    color: 0xff8a78,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const rings: THREE.Mesh[] = [];
  for (let index = 0; index < 3; index += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1 + index * 0.24, 0.012, 8, 96), portalRingMaterial.clone());
    ring.scale.y = 1.22;
    ring.position.z = -0.04 - index * 0.06;
    portal.add(ring);
    rings.push(ring);
  }
  root.add(portal);

  const dustCount = 280;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustColours = new Float32Array(dustCount * 3);
  const coral = new THREE.Color(0xffa08f);
  const indigo = new THREE.Color(0x7f86ff);
  for (let index = 0; index < dustCount; index += 1) {
    dustPositions[index * 3] = (seeded(index) - 0.5) * 15;
    dustPositions[index * 3 + 1] = seeded(index + 29) * 7 - 1.5;
    dustPositions[index * 3 + 2] = 8 - seeded(index + 71) * 70;
    const colour = coral.clone().lerp(indigo, seeded(index + 117));
    colour.toArray(dustColours, index * 3);
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  dustGeometry.setAttribute("color", new THREE.BufferAttribute(dustColours, 3));
  const dust = new THREE.Points(
    dustGeometry,
    new THREE.PointsMaterial({ size: 0.045, transparent: true, opacity: 0.55, depthWrite: false, vertexColors: true }),
  );
  root.add(dust);

  const routeWorld = createRouteWorld();
  root.add(routeWorld.group);

  const suitcase = createRoamlySuitcase();
  suitcase.position.set(1.45, -0.42, -20);
  suitcase.scale.setScalar(1.42);
  suitcase.visible = false;
  root.add(suitcase);
  const body = suitcase.getObjectByName("suitcase-body");
  const handle = suitcase.getObjectByName("suitcase-handle");
  const tag = suitcase.getObjectByName("suitcase-tag");
  const ribs = Array.from({ length: 6 }, (_, index) => suitcase.getObjectByName(`suitcase-rib-${index + 1}`));
  const wheels = Array.from({ length: 4 }, (_, index) => suitcase.getObjectByName(`suitcase-wheel-${index}`));
  const bodyBase = body?.position.clone() ?? new THREE.Vector3();
  const handleBase = handle?.position.clone() ?? new THREE.Vector3();
  const tagBase = tag?.position.clone() ?? new THREE.Vector3();
  const ribBases = ribs.map((rib) => rib?.position.clone() ?? new THREE.Vector3());
  const wheelBases = wheels.map((wheel) => wheel?.position.clone() ?? new THREE.Vector3());

  const itineraryCards = [
    createStoryCard("06:10", "Fushimi Inari", "Sunrise walk · Free", "#f26f5f"),
    createStoryCard("11:30", "Nishiki Market", "Lunch trail · ¥2,500", "#6366f1"),
    createStoryCard("16:00", "Garden check-in", "Hakone · Confirmed", "#f59e0b"),
  ];
  itineraryCards.forEach((card) => {
    card.position.set(1.45, 1.2, -19.7);
    card.scale.setScalar(0.001);
    root.add(card);
  });

  const photoFrames = [
    createPhotoFrame("/media/01-kyoto-dawn.webp", "Kyoto dawn"),
    createPhotoFrame("/media/04-ryokan-stay.webp", "The quiet room"),
    createPhotoFrame("/media/05-street-food.webp", "One more round"),
  ];
  photoFrames.forEach((frame) => {
    frame.position.set(0, 1.2, -28);
    frame.scale.setScalar(0.001);
    root.add(frame);
  });

  const sharedCards = [
    createStoryCard("DAY 01", "Tokyo", "Electric arrival", "#6366f1"),
    createStoryCard("DAY 02", "Hakone", "Mountain pause", "#f59e0b"),
    createStoryCard("DAY 04", "Kyoto", "Lanterns & lanes", "#f26f5f"),
    createStoryCard("DAY 06", "Nara", "A slower morning", "#14b8a6"),
    createStoryCard("DAY 07", "Osaka", "The last night", "#8b5cf6"),
  ];
  const sharedGroup = new THREE.Group();
  sharedGroup.name = "shared-plan-constellation";
  sharedGroup.position.z = -40;
  sharedCards.forEach((card) => {
    card.scale.setScalar(0.72);
    sharedGroup.add(card);
  });
  root.add(sharedGroup);

  const horizon = new THREE.Group();
  horizon.position.set(0, 1.1, -57);
  const horizonMaterials: THREE.MeshBasicMaterial[] = [];
  for (let index = 0; index < 4; index += 1) {
    const material = new THREE.MeshBasicMaterial({
      color: index % 2 ? 0xff806e : 0x7c83ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    horizonMaterials.push(material);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.2 + index * 1.35, 0.018, 8, 128), material);
    ring.scale.y = 0.48;
    ring.position.z = -index * 1.2;
    horizon.add(ring);
  }
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffae86, transparent: true, opacity: 0 });
  const sun = new THREE.Mesh(new THREE.CircleGeometry(1.05, 64), sunMaterial);
  sun.position.z = -2.2;
  horizon.add(sun);
  root.add(horizon);

  const finalCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.2, -0.8, -39),
    new THREE.Vector3(2.8, -0.3, -45),
    new THREE.Vector3(-1.7, -0.45, -50),
    new THREE.Vector3(0, -0.2, -58),
  ]);
  const finalTrailMaterial = new THREE.MeshBasicMaterial({
    color: 0xff8a78,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const finalTrail = new THREE.Mesh(new THREE.TubeGeometry(finalCurve, 90, 0.025, 7, false), finalTrailMaterial);
  root.add(finalTrail);

  const warmLight = new THREE.PointLight(0xff806e, 0, 22, 1.7);
  warmLight.position.set(0, 2, -19);
  root.add(warmLight);
  const coolLight = new THREE.PointLight(0x7178ff, 0, 24, 1.8);
  coolLight.position.set(-2, 3, -31);
  root.add(coolLight);

  const introTargets = itineraryCards.map((_, index) => [
    new THREE.Vector3(-1.25 + index * 1.85, 2.6 - Math.abs(index - 1) * 0.52, -20.3 - index * 0.25),
    new THREE.Euler((index - 1) * -0.08, (index - 1) * 0.14, (index - 1) * 0.07),
  ] as const);
  const photoTargets = [
    new THREE.Vector3(-2.9, 2.15, -28.6),
    new THREE.Vector3(-0.25, 2.82, -30.6),
    new THREE.Vector3(-2.05, -0.18, -28.8),
  ];

  function update(phase: number, elapsed: number, pointer: THREE.Vector2) {
    const toriiArrival = 0.28 + between(phase, 0.0, 0.72) * 0.72;
    const toriiX = THREE.MathUtils.lerp(2.15, 0, between(phase, 0.15, 1.18));
    torii.position.x = toriiX;
    torii.position.y = -0.28 + Math.sin(elapsed * 0.55) * 0.016;
    torii.rotation.y = pointer.x * 0.025 + Math.sin(elapsed * 0.32) * 0.012;
    torii.children.forEach((child, index) => {
      const base = toriiBase.get(child);
      if (!base) return;
      const horizontal = index % 2 === 0 ? -1 : 1;
      child.position.x = base.x + horizontal * (1 - toriiArrival) * (0.42 + index * 0.04);
      child.position.y = base.y + (1 - toriiArrival) * (index < 2 ? -0.7 : 1.15 + index * 0.08);
    });
    const toriiFade = 1 - between(phase, 1.72, 2.22);
    torii.visible = toriiFade > 0.002;
    toriiMaterials.forEach((material) => {
      material.transparent = toriiFade < 0.995;
      material.opacity = toriiFade;
    });

    portal.position.x = toriiX;
    const portalPower = Math.max(bell(phase, 0.18, 1.18, 2.18), 0.08 * toriiFade);
    portal.visible = portalPower > 0.002;
    portalMaterial.uniforms.uTime.value = elapsed;
    portalMaterial.uniforms.uIntensity.value = portalPower;
    portalMaterial.uniforms.uFlash.value = bell(phase, 1.38, 1.78, 2.04);
    rings.forEach((ring, index) => {
      ring.rotation.z = elapsed * (0.08 + index * 0.028) * (index % 2 ? -1 : 1);
      ring.scale.setScalar(1 + Math.sin(elapsed * 0.7 + index) * 0.018);
      ring.scale.y *= 1.22;
      const material = ring.material as THREE.MeshBasicMaterial;
      material.opacity = portalPower * (0.2 - index * 0.035);
    });

    dust.rotation.z = Math.sin(elapsed * 0.08) * 0.015;
    dust.position.x = pointer.x * 0.16;
    dust.position.y = Math.sin(elapsed * 0.23) * 0.08 + pointer.y * 0.08;

    const routeReveal = between(phase, 1.76, 2.72);
    const routeFade = 1 - between(phase, 3.08, 3.56);
    routeWorld.group.visible = routeReveal * routeFade > 0.001;
    routeWorld.route.count = Math.max(0, Math.floor(routeReveal * 84));
    routeWorld.routeMaterial.opacity = routeReveal * routeFade;
    (routeWorld.mountains.material as THREE.MeshStandardMaterial).opacity = routeReveal * routeFade * 0.42;
    (routeWorld.nodes.material as THREE.MeshStandardMaterial).opacity = routeReveal * routeFade;
    (routeWorld.nodes.material as THREE.MeshStandardMaterial).transparent = true;
    const trainT = clamp01(0.02 + routeReveal * 0.92);
    routeWorld.train.position.copy(routeWorld.curve.getPointAt(trainT));
    const tangent = routeWorld.curve.getTangentAt(trainT).normalize();
    routeWorld.train.quaternion.setFromUnitVectors(FORWARD, tangent);
    routeWorld.train.scale.setScalar(0.5 + routeReveal * 0.28);

    const assembly = between(phase, 2.62, 3.32);
    const suitcaseExit = between(phase, 4.02, 4.42);
    suitcase.visible = assembly > 0.002 && suitcaseExit < 0.999;
    suitcase.position.y = -0.42 + Math.sin(elapsed * 0.75) * 0.045 * assembly;
    suitcase.position.z = -20 - suitcaseExit * 2.4;
    suitcase.rotation.y = THREE.MathUtils.lerp(-0.72, 0.34, assembly) + pointer.x * 0.07;
    suitcase.rotation.x = THREE.MathUtils.lerp(-0.18, 0.02, assembly) + pointer.y * 0.025;
    suitcase.scale.setScalar(THREE.MathUtils.lerp(0.15, 1.42, assembly) * (1 - suitcaseExit * 0.38));
    if (body) {
      body.position.y = THREE.MathUtils.lerp(bodyBase.y - 2.1, bodyBase.y, assembly);
      body.rotation.z = (1 - assembly) * -0.42;
    }
    if (handle) {
      const handleArrival = between(phase, 2.82, 3.42);
      handle.position.y = THREE.MathUtils.lerp(handleBase.y - 1.25, handleBase.y + handleArrival * 0.32, handleArrival);
    }
    if (tag) {
      const tagArrival = between(phase, 3.02, 3.52);
      tag.position.lerpVectors(tagBase.clone().add(new THREE.Vector3(1.6, 1.8, 0.8)), tagBase, tagArrival);
      tag.rotation.z = -0.16 + Math.sin(elapsed * 2.2) * 0.1 * assembly;
      tag.rotation.y = Math.sin(elapsed * 1.7) * 0.08;
    }
    ribs.forEach((rib, index) => {
      if (!rib) return;
      const ribArrival = between(phase, 2.7 + index * 0.045, 3.13 + index * 0.045);
      rib.position.x = ribBases[index].x + (index % 2 ? 1 : -1) * (1 - ribArrival) * 1.3;
      rib.position.y = ribBases[index].y + (1 - ribArrival) * (index - 2.5) * 0.28;
      rib.position.z = THREE.MathUtils.lerp(2.1 + index * 0.09, ribBases[index].z, ribArrival);
    });
    wheels.forEach((wheel, index) => {
      if (!wheel) return;
      const wheelArrival = between(phase, 2.88 + index * 0.035, 3.22 + index * 0.035);
      wheel.position.x = THREE.MathUtils.lerp((index % 2 ? 1 : -1) * 1.7, wheelBases[index].x, wheelArrival);
      wheel.position.y = THREE.MathUtils.lerp(-1.15, wheelBases[index].y, wheelArrival);
      wheel.position.z = THREE.MathUtils.lerp(1.2 - index * 0.3, wheelBases[index].z, wheelArrival);
      const tire = wheel.getObjectByName(`suitcase-wheel-tire-${index}`);
      if (tire) tire.rotation.x = elapsed * 1.8 + phase * 2;
    });
    warmLight.intensity = assembly * (1 - suitcaseExit) * 24;

    const cardsEmerge = between(phase, 3.08, 3.72);
    const cardsExit = between(phase, 3.82, 4.22);
    itineraryCards.forEach((card, index) => {
      const target = introTargets[index];
      card.visible = cardsEmerge > 0.002 && cardsExit < 0.999;
      card.position.lerpVectors(new THREE.Vector3(1.45, 1.22, -19.65), target[0], cardsEmerge);
      card.position.z -= cardsExit * 6.5;
      card.rotation.set(
        target[1].x * cardsEmerge,
        target[1].y * cardsEmerge + pointer.x * 0.025,
        target[1].z * cardsEmerge,
      );
      const scale = Math.max(0.001, cardsEmerge * (1 - cardsExit));
      card.scale.setScalar(scale * (0.52 + index * 0.03));
    });

    const memoriesIn = between(phase, 3.72, 4.24);
    const memoriesOut = between(phase, 4.82, 5.18);
    photoFrames.forEach((frame, index) => {
      const start = new THREE.Vector3(1.45, 1.2, -21.2 - index * 0.3);
      const target = photoTargets[index];
      frame.visible = memoriesIn > 0.002 && memoriesOut < 0.999;
      frame.position.lerpVectors(start, target, memoriesIn);
      frame.position.z -= memoriesOut * 4.2;
      frame.rotation.set(
        (index - 1) * 0.055 + pointer.y * 0.02,
        (index - 1) * -0.17 + pointer.x * 0.04,
        (index - 1) * 0.075 + Math.sin(elapsed * 0.55 + index) * 0.012,
      );
      const frameScale = index === 0 ? 0.7 : index === 1 ? 0.57 : 0.73;
      const scale = memoriesIn * (1 - memoriesOut * 0.55) * frameScale;
      frame.scale.setScalar(Math.max(0.001, scale));
    });
    coolLight.intensity = memoriesIn * (1 - memoriesOut) * 18;

    const sharedIn = between(phase, 4.72, 5.18);
    const gather = between(phase, 5.08, 5.82);
    const sharedOut = between(phase, 5.88, 6.28);
    sharedGroup.visible = sharedIn > 0.002 && sharedOut < 0.999;
    sharedCards.forEach((card, index) => {
      const angle = (index / sharedCards.length) * Math.PI * 2 - Math.PI / 2;
      const scatter = new THREE.Vector3(Math.cos(angle) * 5.35, 1.25 + Math.sin(angle) * 2.55, (index - 2) * -0.8);
      const stack = new THREE.Vector3((index - 2) * 0.13, 1.25 + (2 - index) * 0.09, -index * 0.12);
      card.position.lerpVectors(scatter, stack, gather);
      card.position.z -= sharedOut * 3;
      card.rotation.set(
        Math.sin(angle) * 0.1 * (1 - gather),
        -Math.cos(angle) * 0.18 * (1 - gather) + pointer.x * 0.025,
        Math.sin(angle) * 0.16 * (1 - gather),
      );
      card.scale.setScalar(Math.max(0.001, sharedIn * (1 - sharedOut) * THREE.MathUtils.lerp(0.48, 0.6, gather)));
    });

    const horizonIn = between(phase, 5.62, 6.35);
    horizon.visible = horizonIn > 0.001;
    horizon.rotation.z = Math.sin(elapsed * 0.18) * 0.02;
    horizonMaterials.forEach((material, index) => {
      material.opacity = horizonIn * (0.32 - index * 0.045);
    });
    sunMaterial.opacity = horizonIn * 0.58;
    sun.scale.setScalar(0.65 + horizonIn * 0.35);
    finalTrailMaterial.opacity = horizonIn * 0.72;
  }

  function dispose() {
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line)) return;
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        for (const value of Object.values(material)) {
          if (value instanceof THREE.Texture) value.dispose();
        }
        material.dispose();
      });
    });
  }

  return { root, portalMaterial, update, dispose };
}
