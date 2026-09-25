import * as THREE from "three";

const vermilion = new THREE.MeshPhysicalMaterial({ color: 0xd04029, roughness: 0.54, clearcoat: 0.14, clearcoatRoughness: 0.55 });
const vermilionShade = new THREE.MeshStandardMaterial({ color: 0x7a1d10, roughness: 0.68 });
const charcoal = new THREE.MeshStandardMaterial({ color: 0x272020, roughness: 0.64 });
const stone = new THREE.MeshStandardMaterial({ color: 0x777878, roughness: 0.91 });

function crownGeometry(width: number, height: number, depth: number, lift: number) {
  const half = width / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-half, lift);
  shape.quadraticCurveTo(-half * 0.62, 0, 0, 0);
  shape.quadraticCurveTo(half * 0.62, 0, half, lift);
  shape.lineTo(half, lift + height * 0.55);
  shape.quadraticCurveTo(half * 0.58, height, 0, height * 0.76);
  shape.quadraticCurveTo(-half * 0.58, height, -half, lift + height * 0.55);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.045,
    bevelThickness: 0.035,
    curveSegments: 12,
  });
  geometry.translate(0, -height / 2, -depth / 2);
  return geometry;
}

function beam(width: number, height: number, depth: number, material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth, 8, 2, 2), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Action-ready torii reconstructed from the admitted img2threejs reference. */
export function createRoamlyTorii(): THREE.Group {
  const root = new THREE.Group();
  root.name = "torii-root";
  root.userData.source = "img2threejs:torii/spec.json";

  const postParts: THREE.Object3D[] = [];
  const foundationParts: THREE.Object3D[] = [];
  const joineryParts: THREE.Object3D[] = [];
  [-1.04, 1.04].forEach((x, index) => {
    const post = new THREE.Group();
    post.name = index === 0 ? "torii-post-left" : "torii-post-right";
    post.position.x = x;
    root.add(post);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.23, 2.92, 20, 5), vermilion);
    shaft.name = `torii-post-shaft-${index}`;
    shaft.position.y = 1.74;
    shaft.castShadow = true;
    post.add(shaft);
    postParts.push(shaft);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.31, 0.3, 8), stone);
    collar.name = `torii-foundation-collar-${index}`;
    collar.position.y = 0.26;
    collar.castShadow = true;
    post.add(collar);
    foundationParts.push(collar);
    const plinthLower = beam(0.72, 0.18, 0.7, stone);
    plinthLower.name = `torii-foundation-lower-${index}`;
    plinthLower.position.y = 0.09;
    post.add(plinthLower);
    foundationParts.push(plinthLower);
    const plinthUpper = beam(0.53, 0.14, 0.54, stone);
    plinthUpper.name = `torii-foundation-upper-${index}`;
    plinthUpper.position.y = 0.22;
    post.add(plinthUpper);
    foundationParts.push(plinthUpper);
    const tie = beam(0.54, 0.31, 0.52, charcoal);
    tie.name = `torii-joinery-block-${index}`;
    tie.position.y = 3.08;
    post.add(tie);
    joineryParts.push(tie);
  });

  const nuki = beam(3.04, 0.27, 0.36, vermilion);
  nuki.name = "torii-nuki";
  nuki.position.y = 2.7;
  root.add(nuki);
  const nukiShadow = beam(2.64, 0.075, 0.38, vermilionShade);
  nukiShadow.position.y = 2.54;
  root.add(nukiShadow);
  const gakuzuka = beam(0.25, 0.61, 0.3, charcoal);
  gakuzuka.name = "torii-gakuzuka";
  gakuzuka.position.y = 3.08;
  root.add(gakuzuka);
  const shimagi = new THREE.Mesh(crownGeometry(3.28, 0.24, 0.42, 0.085), vermilion);
  shimagi.name = "torii-shimagi";
  shimagi.position.y = 3.48;
  shimagi.castShadow = true;
  root.add(shimagi);
  const kasagi = new THREE.Mesh(crownGeometry(3.68, 0.32, 0.56, 0.17), charcoal);
  kasagi.name = "torii-kasagi";
  kasagi.position.y = 3.71;
  kasagi.castShadow = true;
  root.add(kasagi);
  const accent = beam(2.35, 0.065, 0.44, vermilionShade);
  accent.position.set(0, 3.33, 0);
  root.add(accent);
  root.userData.sculptRuntime = {
    nodes: { root, posts: postParts, kasagi, shimagi, nuki, crossBeams: gakuzuka, joinery: joineryParts, foundations: foundationParts },
    clickParts: ["torii-post-left", "torii-post-right", kasagi.name, shimagi.name, nuki.name, gakuzuka.name],
  };
  return root;
}
