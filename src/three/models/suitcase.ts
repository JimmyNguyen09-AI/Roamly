import * as THREE from "three";

function roundedRectGeometry(width: number, height: number, radius: number, depth: number) {
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: Math.min(radius * 0.34, 0.055),
    bevelThickness: 0.035,
    curveSegments: 8,
    steps: 1,
  });
}

function roundedBar(width: number, height: number, depth: number, radius = height * 0.4) {
  const geometry = roundedRectGeometry(width, height, radius, depth);
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

function makeMaterial(color: number, roughness: number, metalness = 0, clearcoat = 0) {
  return new THREE.MeshPhysicalMaterial({ color, roughness, metalness, clearcoat, clearcoatRoughness: 0.32 });
}

let sharedMaterials: ReturnType<typeof createMaterials> | null = null;
function createMaterials() {
  return {
    shell: makeMaterial(0x334464, 0.36, 0.03, 0.68),
    shellShadow: makeMaterial(0x253450, 0.49, 0.02, 0.32),
    trim: makeMaterial(0x121620, 0.7),
    rubber: makeMaterial(0x171b22, 0.88),
    metal: makeMaterial(0xb8bec8, 0.26, 0.86),
    coral: makeMaterial(0xc9847d, 0.62, 0, 0.2),
  };
}
function getMaterials() {
  sharedMaterials ??= createMaterials();
  return sharedMaterials;
}

function makeWheel(materials: ReturnType<typeof getMaterials>, index: number) {
  const pivot = new THREE.Group();
  pivot.name = `suitcase-wheel-${index}`;
  const fork = new THREE.Mesh(roundedBar(0.22, 0.25, 0.12, 0.07), materials.trim);
  fork.position.y = 0.08;
  pivot.add(fork);
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.105, 24, 2), materials.rubber);
  tire.name = `suitcase-wheel-tire-${index}`;
  tire.rotation.z = Math.PI / 2;
  tire.position.y = -0.08;
  pivot.add(tire);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.112, 20), materials.metal);
  hub.rotation.z = Math.PI / 2;
  hub.position.y = -0.08;
  pivot.add(hub);
  return pivot;
}

/**
 * Action-ready carry-on reconstructed through the img2threejs evidence/spec
 * pipeline. Rear and underside details are stylized because the source is one
 * front three-quarter image.
 */
export function createRoamlySuitcase(): THREE.Group {
  const materials = getMaterials();
  const root = new THREE.Group();
  root.name = "suitcase-root";
  root.userData.source = "img2threejs:suitcase/spec.json";

  const body = new THREE.Group();
  body.name = "suitcase-body";
  body.position.y = 1.18;
  root.add(body);

  const rearShell = new THREE.Mesh(roundedRectGeometry(1.46, 2.02, 0.18, 0.48), materials.shellShadow);
  rearShell.name = "suitcase-rear-shell";
  rearShell.geometry.translate(0, 0, -0.24);
  rearShell.castShadow = true;
  rearShell.receiveShadow = true;
  body.add(rearShell);

  const frontShell = new THREE.Mesh(roundedRectGeometry(1.38, 1.92, 0.17, 0.16), materials.shell);
  frontShell.name = "suitcase-front-shell";
  frontShell.position.z = 0.27;
  frontShell.castShadow = true;
  body.add(frontShell);

  const zipCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.61, -0.9, 0.24), new THREE.Vector3(0, -0.96, 0.24),
    new THREE.Vector3(0.61, -0.9, 0.24), new THREE.Vector3(0.69, 0, 0.24),
    new THREE.Vector3(0.61, 0.9, 0.24), new THREE.Vector3(0, 0.96, 0.24),
    new THREE.Vector3(-0.61, 0.9, 0.24), new THREE.Vector3(-0.69, 0, 0.24),
  ], true, "catmullrom", 0.22);
  const zipper = new THREE.Mesh(new THREE.TubeGeometry(zipCurve, 96, 0.025, 6, true), materials.trim);
  zipper.name = "suitcase-zipper";
  body.add(zipper);

  for (let index = 0; index < 6; index += 1) {
    const rib = new THREE.Mesh(roundedBar(1.13, 0.075, 0.065, 0.034), materials.shellShadow);
    rib.name = `suitcase-rib-${index + 1}`;
    rib.position.set(0, 0.66 - index * 0.265, 0.465);
    rib.scale.x = 1 - Math.abs(index - 2.5) * 0.018;
    body.add(rib);
  }

  for (const [index, x] of [-0.56, 0.56].entries()) {
    const guard = new THREE.Mesh(roundedBar(0.28, 0.25, 0.09, 0.08), materials.trim);
    guard.name = `suitcase-corner-guard-${index}`;
    guard.position.set(x, -0.82, 0.45);
    body.add(guard);
  }

  const handle = new THREE.Group();
  handle.name = "suitcase-handle";
  handle.position.y = 2.14;
  root.add(handle);
  for (const x of [-0.22, 0.22]) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 14), materials.metal);
    rail.position.set(x, 0.36, -0.08);
    handle.add(rail);
    const stop = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 10), materials.trim);
    stop.position.set(x, -0.03, -0.08);
    handle.add(stop);
  }
  const grip = new THREE.Mesh(roundedBar(0.61, 0.13, 0.16, 0.06), materials.trim);
  grip.name = "suitcase-handle-grip";
  grip.position.set(0, 0.79, -0.08);
  handle.add(grip);

  const tagPivot = new THREE.Group();
  tagPivot.name = "suitcase-tag";
  tagPivot.position.set(0.34, 2.7, 0.06);
  tagPivot.rotation.z = -0.16;
  root.add(tagPivot);
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 24, Math.PI * 1.55), materials.coral);
  strap.rotation.z = 0.35;
  tagPivot.add(strap);
  const tag = new THREE.Mesh(roundedBar(0.34, 0.48, 0.045, 0.07), materials.coral);
  tag.position.set(0.08, -0.34, 0.08);
  tagPivot.add(tag);
  const stitch = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.12, -0.19, 0.108), new THREE.Vector3(0.12, -0.19, 0.108),
      new THREE.Vector3(0.14, 0.18, 0.108), new THREE.Vector3(-0.14, 0.18, 0.108),
    ]),
    new THREE.LineDashedMaterial({ color: 0xf4d0c6, dashSize: 0.025, gapSize: 0.018 }),
  );
  stitch.computeLineDistances();
  stitch.position.copy(tag.position);
  tagPivot.add(stitch);

  const wheelPositions: [number, number, number][] = [
    [-0.55, 0.13, 0.22], [0.55, 0.13, 0.22], [-0.55, 0.13, -0.22], [0.55, 0.13, -0.22],
  ];
  wheelPositions.forEach((position, index) => {
    const wheel = makeWheel(materials, index);
    wheel.position.set(...position);
    root.add(wheel);
  });

  const sideHandle = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.045, 10, 28, Math.PI), materials.trim);
  sideHandle.name = "suitcase-side-handle";
  sideHandle.position.set(0.76, 1.35, 0);
  sideHandle.rotation.set(0, Math.PI / 2, -Math.PI / 2);
  root.add(sideHandle);
  root.scale.set(1, 0.92, 0.92);
  root.userData.sculptRuntime = {
    nodes: { root, body, frontShell, gusset: zipper, handle, tag: tagPivot, sideHandle },
    wheels: wheelPositions.map((_, index) => root.getObjectByName(`suitcase-wheel-${index}`)),
    clickParts: [body.name, frontShell.name, zipper.name, handle.name, tagPivot.name, sideHandle.name],
  };
  return root;
}
