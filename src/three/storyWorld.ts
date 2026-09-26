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

function createCloudMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uWarm: { value: new THREE.Color(0xffddd0) },
      uCool: { value: new THREE.Color(0xaeb7ff) },
    },
    vertexShader: `
      varying vec2 vUv;
      varying float vSeed;
      void main() {
        vUv = uv;
        vec4 localPosition = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          vSeed = instanceMatrix[3].x * .17 + instanceMatrix[3].y * .31;
          localPosition = instanceMatrix * localPosition;
        #else
          vSeed = 0.0;
        #endif
        gl_Position = projectionMatrix * modelViewMatrix * localPosition;
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vSeed;
      uniform float uTime;
      uniform float uOpacity;
      uniform vec3 uWarm;
      uniform vec3 uCool;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = .55;
        for (int i = 0; i < 5; i++) {
          value += amplitude * noise(p);
          p = p * 2.03 + vec2(8.1, 3.7);
          amplitude *= .48;
        }
        return value;
      }

      void main() {
        vec2 centred = vUv * 2.0 - 1.0;
        vec2 flow = vec2(uTime * .018 + vSeed, sin(uTime * .11 + vSeed) * .05);
        float body = fbm(vUv * vec2(3.4, 2.25) + flow);
        body += fbm(vUv * vec2(6.6, 4.1) - flow * .65) * .28;
        float edge = smoothstep(1.08, .24, length(centred * vec2(.78, 1.08)));
        float density = smoothstep(.47, .86, body) * edge;
        vec3 colour = mix(uCool, uWarm, clamp(vUv.y + body * .22, 0.0, 1.0));
        float alpha = density * uOpacity * .34;
        if (alpha < .006) discard;
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

function loadPhotoTexture(source: string) {
  const texture = new THREE.TextureLoader().load(source);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createProjectedSuitcase() {
  const group = new THREE.Group();
  group.name = "projected-suitcase";
  const texture = loadPhotoTexture("/media/12-indigo-suitcase.png");
  const width = 1.42;
  const height = 2.13;
  const sliceCount = 6;
  const sliceHeight = height / sliceCount;
  const materials: THREE.MeshBasicMaterial[] = [];
  const strips: THREE.Mesh[] = [];

  const shadowMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    color: 0x1b2038,
    transparent: true,
    opacity: 0,
    alphaTest: 0.045,
    depthWrite: false,
    toneMapped: false,
  });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(width * 1.035, height * 1.025), shadowMaterial);
  shadow.name = "projected-suitcase-depth-shadow";
  shadow.position.set(0.055, -0.035, -0.07);
  group.add(shadow);

  for (let index = 0; index < sliceCount; index += 1) {
    const geometry = new THREE.PlaneGeometry(width, sliceHeight + 0.006);
    const uv = geometry.getAttribute("uv") as THREE.BufferAttribute;
    for (let vertex = 0; vertex < uv.count; vertex += 1) {
      uv.setY(vertex, (uv.getY(vertex) + index) / sliceCount);
    }
    uv.needsUpdate = true;
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      alphaTest: 0.045,
      depthWrite: false,
      toneMapped: false,
    });
    const strip = new THREE.Mesh(geometry, material);
    strip.name = `projected-suitcase-slice-${index + 1}`;
    strip.position.y = -height * 0.5 + sliceHeight * (index + 0.5);
    strip.position.z = index * 0.002;
    materials.push(material);
    strips.push(strip);
    group.add(strip);
  }

  return { group, strips, materials, shadowMaterial, height };
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

  return { group, curve, route, routeMaterial, nodes, train };
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
  torii.scale.setScalar(0.001);
  torii.position.set(1.3, -0.18, 0);
  torii.visible = false;
  root.add(torii);
  const toriiBase = new Map<THREE.Object3D, THREE.Vector3>();
  const toriiRotationBase = new Map<THREE.Object3D, THREE.Euler>();
  torii.children.forEach((child) => toriiBase.set(child, child.position.clone()));
  torii.children.forEach((child) => toriiRotationBase.set(child, child.rotation.clone()));
  const toriiMaterials = new Set<THREE.Material>();
  torii.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => toriiMaterials.add(material));
    }
  });

  const portal = new THREE.Group();
  portal.name = "torii-portal";
  portal.position.set(1.3, 1.68, 0.06);
  const portalMaterial = createPortalMaterial();
  const portalRingMaterial = new THREE.MeshBasicMaterial({
    color: 0xff8a78,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const rings: THREE.Mesh[] = [];
  for (let index = 0; index < 6; index += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.08 - index * 0.045, 0.012, 8, 96), portalRingMaterial.clone());
    ring.scale.y = 1.24;
    ring.position.z = -0.22 - index * 0.56;
    portal.add(ring);
    rings.push(ring);
  }
  root.add(portal);

  // Procedural WebGL mist replaces the old full-screen cloud GIF. These
  // sparse planes stay in the right-hand stage and retain real scene depth.
  const cloudMaterial = createCloudMaterial();
  const cloudField = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), cloudMaterial, 8);
  cloudField.name = "procedural-cloud-field";
  cloudField.renderOrder = -2;
  const cloudTransforms: [number, number, number, number, number, number][] = [
    [0.5, 3.45, -1.8, 5.4, 1.65, -0.08],
    [3.1, 3.15, -1.2, 5.9, 1.9, 0.05],
    [5.0, 2.35, -2.1, 4.7, 1.5, -0.12],
    [0.75, 1.25, -1.6, 5.1, 1.55, 0.08],
    [3.65, 0.72, -2.5, 6.3, 1.7, -0.04],
    [5.5, 4.2, -3.2, 5.2, 1.45, 0.11],
    [2.0, 4.65, -3.6, 6.8, 1.55, -0.02],
    [1.9, -0.05, -3.1, 5.8, 1.35, 0.03],
  ];
  cloudTransforms.forEach(([x, y, z, width, height, rotation], index) => {
    tempPosition.set(x, y, z);
    tempQuaternion.setFromAxisAngle(FORWARD, rotation);
    tempScale.set(width, height, 1);
    tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
    cloudField.setMatrixAt(index, tempMatrix);
  });
  cloudField.instanceMatrix.needsUpdate = true;
  root.add(cloudField);

  // Before the first scroll the visitor sees a quiet destination beacon. It
  // hands its orbit/light directly to the gate portal as the torii arrives.
  const beacon = new THREE.Group();
  beacon.name = "opening-destination-beacon";
  beacon.position.set(2.2, 1.58, 0.24);
  const beaconRings: THREE.Mesh[] = [];
  const beaconMaterials: THREE.MeshBasicMaterial[] = [];
  for (let index = 0; index < 4; index += 1) {
    const material = new THREE.MeshBasicMaterial({
      color: index % 2 === 0 ? 0xe85b47 : 0xe2b66f,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    beaconMaterials.push(material);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.5 + index * 0.29, 0.018 - index * 0.002, 8, 96, Math.PI * (1.58 + index * 0.08)),
      material,
    );
    ring.rotation.z = index * 1.27;
    ring.scale.y = 0.72 + index * 0.08;
    beacon.add(ring);
    beaconRings.push(ring);
  }
  const beaconCoreMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffeee4,
    emissive: 0xc73b2f,
    emissiveIntensity: 0.42,
    roughness: 0.2,
    clearcoat: 0.8,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const beaconCore = new THREE.Mesh(new THREE.SphereGeometry(0.235, 32, 24), beaconCoreMaterial);
  beacon.add(beaconCore);
  const petalMaterial = new THREE.MeshBasicMaterial({ color: 0xffa89a, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const petalShape = new THREE.Shape();
  petalShape.moveTo(0, -0.08);
  petalShape.bezierCurveTo(0.12, -0.02, 0.12, 0.12, 0, 0.18);
  petalShape.bezierCurveTo(-0.12, 0.12, -0.12, -0.02, 0, -0.08);
  const beaconPetals = new THREE.Group();
  for (let index = 0; index < 5; index += 1) {
    const petal = new THREE.Mesh(new THREE.ShapeGeometry(petalShape), petalMaterial);
    const angle = index / 5 * Math.PI * 2;
    petal.position.set(Math.cos(angle) * 0.44, Math.sin(angle) * 0.3, 0.04 + index * 0.002);
    petal.rotation.z = angle - Math.PI / 2;
    petal.scale.setScalar(0.62);
    beaconPetals.add(petal);
  }
  beacon.add(beaconPetals);
  const beaconSparkPositions = new Float32Array(42 * 3);
  for (let index = 0; index < 42; index += 1) {
    const angle = (index / 42) * Math.PI * 2;
    const radius = 0.72 + seeded(index + 221) * 1.05;
    beaconSparkPositions[index * 3] = Math.cos(angle) * radius;
    beaconSparkPositions[index * 3 + 1] = Math.sin(angle) * radius * 0.62;
    beaconSparkPositions[index * 3 + 2] = (seeded(index + 242) - 0.5) * 0.5;
  }
  const beaconSparkGeometry = new THREE.BufferGeometry();
  beaconSparkGeometry.setAttribute("position", new THREE.BufferAttribute(beaconSparkPositions, 3));
  const beaconSparkMaterial = new THREE.PointsMaterial({
    color: 0xffd3c7,
    size: 0.035,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const beaconSparks = new THREE.Points(beaconSparkGeometry, beaconSparkMaterial);
  beacon.add(beaconSparks);
  root.add(beacon);

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
  suitcase.position.set(1.35, 0.05, -20);
  suitcase.scale.setScalar(0.82);
  suitcase.visible = false;
  root.add(suitcase);
  const suitcaseMaterials = new Set<THREE.Material>();
  suitcase.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => suitcaseMaterials.add(material));
    }
  });
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

  const projectedSuitcase = createProjectedSuitcase();
  projectedSuitcase.group.position.set(1.35, 1.78, -19.92);
  projectedSuitcase.group.visible = false;
  root.add(projectedSuitcase.group);

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
    new THREE.Vector3(0.05 + index * 1.18, 2.4 - Math.abs(index - 1) * 0.26, -20.36 - index * 0.12),
    new THREE.Euler((index - 1) * -0.02, (index - 1) * 0.04, (index - 1) * 0.018),
  ] as const);
  const photoTargets = [
    new THREE.Vector3(-1.25, 1.55, -35.2),
    new THREE.Vector3(0.15, 2.3, -36.1),
    new THREE.Vector3(-0.8, 0.08, -35.72),
  ];

  function update(phase: number, elapsed: number, pointer: THREE.Vector2) {
    const toriiArrival = between(phase, 0.018, 0.44);
    const toriiX = THREE.MathUtils.lerp(1.3, 0, between(phase, 0.48, 1.24));
    torii.position.x = toriiX;
    torii.position.y = -0.18 + Math.sin(elapsed * 0.55) * 0.012 * toriiArrival;
    torii.rotation.y = pointer.x * 0.025 + Math.sin(elapsed * 0.32) * 0.012;
    torii.scale.setScalar(THREE.MathUtils.lerp(0.76, 1.02, toriiArrival));
    torii.children.forEach((child, index) => {
      const base = toriiBase.get(child);
      const baseRotation = toriiRotationBase.get(child);
      if (!base || !baseRotation) return;
      const childStart = index < 2 ? 0.015 + index * 0.012 : 0.055 + (index - 2) * 0.018;
      const childEnd = index < 2 ? 0.29 + index * 0.025 : 0.35 + (index - 2) * 0.018;
      const childArrival = between(phase, childStart, childEnd);
      if (index < 2) {
        const side = index === 0 ? -1 : 1;
        child.position.x = base.x + side * (1 - childArrival) * 5.8;
        child.position.y = base.y - (1 - childArrival) * 1.45;
        child.position.z = base.z + (1 - childArrival) * 1.2;
        child.rotation.z = baseRotation.z + side * (1 - childArrival) * 0.2;
      } else {
        const side = index % 2 === 0 ? -1 : 1;
        child.position.x = base.x + side * (1 - childArrival) * (3.9 + index * 0.18);
        child.position.y = base.y + (1 - childArrival) * (3.8 + index * 0.18);
        child.position.z = base.z + (1 - childArrival) * 0.8;
        child.rotation.z = baseRotation.z + side * (1 - childArrival) * 0.15;
      }
    });
    // The camera crosses the gate plane around phase 1.6. Keep the physical
    // torii present until the viewer is behind it, then release it cleanly.
    const toriiFade = 1 - between(phase, 1.7, 2.04);
    const toriiOpacity = toriiArrival * toriiFade;
    torii.visible = toriiOpacity > 0.002;
    toriiMaterials.forEach((material) => {
      material.transparent = toriiOpacity < 0.995;
      material.opacity = toriiOpacity;
    });

    const beaconFade = 1 - between(phase, 0.018, 0.34);
    beacon.visible = beaconFade > 0.002;
    beacon.position.x = 2.2 + pointer.x * 0.08;
    beacon.position.y = 1.58 + pointer.y * 0.05 + Math.sin(elapsed * 0.7) * 0.025;
    beacon.rotation.z = Math.sin(elapsed * 0.18) * 0.04;
    beaconRings.forEach((ring, index) => {
      ring.rotation.z = index * 1.27 + elapsed * (0.08 + index * 0.026) * (index % 2 ? -1 : 1);
      const pulse = 1 + Math.sin(elapsed * 0.85 + index * 0.9) * 0.025;
      ring.scale.x = pulse;
      ring.scale.y = (0.72 + index * 0.08) * pulse;
      beaconMaterials[index].opacity = beaconFade * (0.38 - index * 0.055);
    });
    beaconCore.rotation.x = elapsed * 0.18;
    beaconCore.rotation.y = elapsed * 0.26;
    beaconCore.scale.setScalar(0.9 + Math.sin(elapsed * 1.2) * 0.08);
    beaconCoreMaterial.opacity = beaconFade * 0.62;
    petalMaterial.opacity = beaconFade * 0.78;
    beaconPetals.rotation.z = elapsed * 0.15;
    beaconSparks.rotation.z = -elapsed * 0.045;
    beaconSparkMaterial.opacity = beaconFade * 0.58;

    const cloudFade = 1 - between(phase, 1.12, 1.92);
    cloudField.visible = cloudFade > 0.002;
    cloudField.position.x = Math.sin(elapsed * 0.055) * 0.16 + pointer.x * 0.06;
    cloudField.position.y = Math.sin(elapsed * 0.09) * 0.035;
    cloudMaterial.uniforms.uTime.value = elapsed;
    cloudMaterial.uniforms.uOpacity.value = cloudFade * 0.76;

    portal.position.x = toriiX;
    portal.position.y = 1.68;
    const portalPower = Math.max(bell(phase, 0.16, 1.42, 2.12), 0.045 * toriiOpacity);
    portal.visible = portalPower > 0.002;
    portalMaterial.uniforms.uTime.value = elapsed;
    portalMaterial.uniforms.uIntensity.value = portalPower;
    portalMaterial.uniforms.uFlash.value = bell(phase, 1.42, 1.64, 1.9) * 0.62;
    rings.forEach((ring, index) => {
      ring.rotation.z = elapsed * (0.08 + index * 0.028) * (index % 2 ? -1 : 1);
      ring.scale.setScalar(1 + Math.sin(elapsed * 0.7 + index) * 0.018);
      ring.scale.y *= 1.22;
      const material = ring.material as THREE.MeshBasicMaterial;
      material.opacity = portalPower * (0.18 - index * 0.018);
    });

    dust.rotation.z = Math.sin(elapsed * 0.08) * 0.015;
    dust.position.x = pointer.x * 0.16;
    dust.position.y = Math.sin(elapsed * 0.23) * 0.08 + pointer.y * 0.08;

    const routeReveal = between(phase, 1.76, 2.72);
    const routeFade = 1 - between(phase, 2.84, 3.06);
    routeWorld.group.visible = routeReveal * routeFade > 0.001;
    routeWorld.route.count = Math.max(0, Math.floor(routeReveal * 84));
    routeWorld.routeMaterial.opacity = routeReveal * routeFade;
    (routeWorld.nodes.material as THREE.MeshStandardMaterial).opacity = routeReveal * routeFade;
    (routeWorld.nodes.material as THREE.MeshStandardMaterial).transparent = true;
    const trainT = clamp01(0.02 + routeReveal * 0.92);
    routeWorld.train.position.copy(routeWorld.curve.getPointAt(trainT));
    const tangent = routeWorld.curve.getTangentAt(trainT).normalize();
    routeWorld.train.quaternion.setFromUnitVectors(FORWARD, tangent);
    routeWorld.train.scale.setScalar(0.5 + routeReveal * 0.28);

    const assembly = between(phase, 3.015, 3.2);
    const projectionIn = between(phase, 3.08, 3.22);
    const suitcaseExit = between(phase, 3.8, 4.04);
    suitcase.visible = assembly > 0.002 && projectionIn < 0.96 && suitcaseExit < 0.999;
    suitcase.position.y = 0.05 + Math.sin(elapsed * 0.75) * 0.032 * assembly;
    suitcase.position.z = -20 - suitcaseExit * 1.2;
    suitcase.rotation.y = THREE.MathUtils.lerp(-0.58, 0.18, assembly) + pointer.x * 0.035;
    suitcase.rotation.x = THREE.MathUtils.lerp(-0.18, 0.02, assembly) + pointer.y * 0.025;
    suitcase.scale.setScalar(THREE.MathUtils.lerp(0.12, 0.82, assembly) * (1 - suitcaseExit * 0.5));
    suitcaseMaterials.forEach((material) => {
      material.transparent = true;
      material.opacity = 1 - projectionIn;
    });
    if (body) {
      body.position.y = THREE.MathUtils.lerp(bodyBase.y - 2.1, bodyBase.y, assembly);
      body.rotation.z = (1 - assembly) * -0.42;
    }
    if (handle) {
      const handleArrival = between(phase, 3.035, 3.18);
      handle.position.y = THREE.MathUtils.lerp(handleBase.y - 1.25, handleBase.y + handleArrival * 0.32, handleArrival);
    }
    if (tag) {
      const tagArrival = between(phase, 3.07, 3.2);
      tag.position.lerpVectors(tagBase.clone().add(new THREE.Vector3(1.6, 1.8, 0.8)), tagBase, tagArrival);
      tag.rotation.z = -0.16 + Math.sin(elapsed * 2.2) * 0.1 * assembly;
      tag.rotation.y = Math.sin(elapsed * 1.7) * 0.08;
    }
    ribs.forEach((rib, index) => {
      if (!rib) return;
      const ribArrival = between(phase, 3.025 + index * 0.012, 3.14 + index * 0.01);
      rib.position.x = ribBases[index].x + (index % 2 ? 1 : -1) * (1 - ribArrival) * 1.3;
      rib.position.y = ribBases[index].y + (1 - ribArrival) * (index - 2.5) * 0.28;
      rib.position.z = THREE.MathUtils.lerp(2.1 + index * 0.09, ribBases[index].z, ribArrival);
    });
    wheels.forEach((wheel, index) => {
      if (!wheel) return;
      const wheelArrival = between(phase, 3.045 + index * 0.012, 3.17 + index * 0.008);
      wheel.position.x = THREE.MathUtils.lerp((index % 2 ? 1 : -1) * 1.7, wheelBases[index].x, wheelArrival);
      wheel.position.y = THREE.MathUtils.lerp(-1.15, wheelBases[index].y, wheelArrival);
      wheel.position.z = THREE.MathUtils.lerp(1.2 - index * 0.3, wheelBases[index].z, wheelArrival);
      const tire = wheel.getObjectByName(`suitcase-wheel-tire-${index}`);
      if (tire) tire.rotation.x = elapsed * 1.8 + phase * 2;
    });
    warmLight.intensity = assembly * (1 - suitcaseExit) * 24;

    projectedSuitcase.group.visible = projectionIn > 0.002 && suitcaseExit < 0.999;
    projectedSuitcase.group.position.y = 1.78 + Math.sin(elapsed * 0.65) * 0.018 * projectionIn - suitcaseExit * 0.55;
    projectedSuitcase.group.position.z = -19.92 - suitcaseExit * 1.8;
    projectedSuitcase.group.rotation.y = 0.08 + pointer.x * 0.035;
    projectedSuitcase.group.rotation.x = pointer.y * 0.012;
    projectedSuitcase.group.scale.setScalar(0.88 * (1 - suitcaseExit * 0.18));
    projectedSuitcase.strips.forEach((strip, index) => {
      const settledY = -projectedSuitcase.height * 0.5 + (projectedSuitcase.height / 6) * (index + 0.5);
      const side = index % 2 ? 1 : -1;
      strip.position.x = side * (1 - assembly) * (1.5 + index * 0.12);
      strip.position.y = settledY + (1 - assembly) * (index - 2.5) * 0.3;
      strip.position.z = index * 0.002 + (1 - assembly) * (0.5 + index * 0.09);
      strip.rotation.z = side * (1 - assembly) * (0.16 + index * 0.025);
      projectedSuitcase.materials[index].opacity = projectionIn * (1 - suitcaseExit);
    });
    projectedSuitcase.shadowMaterial.opacity = projectionIn * (1 - suitcaseExit) * 0.24;

    const cardsEmerge = between(phase, 3.34, 3.58);
    const cardsExit = between(phase, 3.82, 4.04);
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
      card.scale.setScalar(scale * (0.34 + index * 0.018));
    });

    // Memory chapter: enter slowly, hold the complete composition, then make
    // a short handoff to sharing. Per-frame staggering prevents a fast wheel
    // gesture from turning the gallery into one unreadable burst.
    const memoriesOut = between(phase, 4.9, 5.08);
    const memoryDolly = between(phase, 4.58, 4.92);
    photoFrames.forEach((frame, index) => {
      const memoriesIn = between(phase, 4.04 + index * 0.055, 4.48 + index * 0.045);
      const start = new THREE.Vector3(1.15, 1.2, -27.2 - index * 0.25);
      const target = photoTargets[index];
      frame.visible = memoriesIn > 0.002 && memoriesOut < 0.999;
      frame.position.lerpVectors(start, target, memoriesIn);
      frame.position.y += Math.sin(elapsed * 0.34 + index * 1.4) * 0.018 * memoriesIn * (1 - memoriesOut);
      frame.position.z -= memoryDolly * 4.5 + memoriesOut * 3.2;
      frame.rotation.set(
        (index - 1) * 0.018 + pointer.y * 0.008,
        (index - 1) * -0.045 + pointer.x * 0.012,
        (index - 1) * 0.022 + Math.sin(elapsed * 0.34 + index) * 0.003,
      );
      const frameScale = index === 0 ? 0.44 : index === 1 ? 0.36 : 0.4;
      const scale = memoriesIn * (1 - memoriesOut * 0.55) * frameScale;
      frame.scale.setScalar(Math.max(0.001, scale));
    });
    const memoryField = between(phase, 4.04, 4.62);
    const memoryGlint = bell(phase, 4.32, 4.56, 4.8);
    coolLight.intensity = memoryField * (1 - memoriesOut) * 15 + memoryGlint * 5;

    const sharedIn = between(phase, 5.02, 5.24);
    const gather = between(phase, 5.58, 5.9);
    const sharedOut = between(phase, 5.94, 6.22);
    sharedGroup.visible = sharedIn > 0.002 && sharedOut < 0.999;
    sharedCards.forEach((card, index) => {
      const angle = (index / sharedCards.length) * Math.PI * 2 - Math.PI / 2;
      const centredArc = [
        new THREE.Vector3(-2.3, -0.28, -0.28),
        new THREE.Vector3(-1.45, -0.46, -0.04),
        new THREE.Vector3(1.05, 2.55, 0.08),
        new THREE.Vector3(1.28, 1.5, -0.04),
        new THREE.Vector3(2.3, 2.08, -0.28),
      ];
      const scatter = centredArc[index];
      const stack = new THREE.Vector3((index - 2) * 0.13, 1.25 + (2 - index) * 0.09, -index * 0.12);
      card.position.lerpVectors(scatter, stack, gather);
      card.position.z -= sharedOut * 3;
      card.rotation.set(
        Math.sin(angle) * 0.025 * (1 - gather),
        -Math.cos(angle) * 0.055 * (1 - gather) + pointer.x * 0.01,
        Math.sin(angle) * 0.035 * (1 - gather),
      );
      card.scale.setScalar(Math.max(0.001, sharedIn * (1 - sharedOut) * THREE.MathUtils.lerp(0.36, 0.48, gather)));
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
    portalMaterial.dispose();
  }

  return { root, portalMaterial, update, dispose };
}
