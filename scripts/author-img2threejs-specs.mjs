import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const write = (file, value) => fs.writeFileSync(path.join(root, file), `${JSON.stringify(value, null, 2)}\n`);
const clone = (value) => JSON.parse(JSON.stringify(value));

function rgba(hex) {
  const value = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
  return `rgba(${r}, ${g}, ${b}, 1.0)`;
}

function recipe(primary, secondary, materialClass, evidence = "full-object") {
  return {
    dominantAlbedo: rgba(primary),
    secondaryAlbedo: rgba(secondary),
    materialClass,
    materialClassConfidence: 0.82,
    evidence: [evidence],
    samplingNotes: "Color zones sampled from the admitted single-view reference; lighting falloff is treated separately.",
  };
}

function component(template, input) {
  const item = clone(template);
  const rootComponent = input.parent == null;
  item.id = input.id;
  item.name = input.name;
  item.level = input.level;
  item.role = input.role;
  item.importance = input.importance ?? 0.8;
  item.confidence = input.confidence ?? 0.82;
  item.primitive = input.primitive ?? "box";
  item.topologyClass = input.topologyClass ?? "assembled-solid";
  item.topologyRationale = input.topologyRationale ?? "A discrete rigid part with countable faces and stable assembly seams.";
  item.geometryDescriptor = {
    topologyIntent: input.topologyIntent ?? "bevel-ready hard-surface form",
    edgeTreatment: input.edgeTreatment ?? { type: "rounded", bevelRadius: 0.035, segments: 3 },
    deformationStack: input.deformations ?? [],
    uvStrategy: "generated procedural coordinates",
    normalStrategy: "weighted vertex normals from generated geometry",
  };
  item.parent = input.parent ?? null;
  item.attachment = rootComponent ? null : {
    parentId: input.parent,
    parentSocket: `${input.parent}-${input.id}-socket`,
    localStart: input.localStart ?? [0, 0, 0],
    localEnd: input.localEnd ?? [0, 0.2, 0],
    contactType: input.contactType ?? "embedded-joint",
    overlap: input.overlap ?? 0.025,
    gapTolerance: input.gapTolerance ?? 0.008,
    evidenceRefs: [input.evidence ?? "full-object"],
  };
  item.dimensions = { ...input.dimensions, units: "relative", confidence: input.confidence ?? 0.82 };
  item.transform = {
    position: input.position ?? [0, 0, 0],
    rotation: input.rotation ?? [0, 0, 0],
    scale: input.scale ?? [1, 1, 1],
  };
  item.material = input.material;
  item.materialLayers = input.materialLayers ?? [input.material];
  item.colorMaterialRecipe = input.colorRecipe;
  item.actionProfile.animationRole = input.animationRole ?? (rootComponent ? "root" : "static");
  item.actionProfile.pivot = {
    mode: "explicit",
    localPosition: input.pivot ?? [0, 0, 0],
    axis: input.axis ?? [0, 1, 0],
    confidence: input.confidence ?? 0.82,
  };
  item.actionProfile.transformChannels = {
    translate: rootComponent,
    rotate: rootComponent || Boolean(input.rotatable),
    scale: rootComponent,
    bend: false,
    twist: false,
    detach: Boolean(input.detachable),
    visibility: true,
    materialState: true,
  };
  item.actionProfile.sockets = input.sockets ?? [];
  item.actionProfile.collider = {
    type: input.collider ?? "box",
    offset: [0, 0, 0],
    scale: input.colliderScale ?? [1, 1, 1],
    isTrigger: false,
    notes: "Simplified runtime proxy attached to this semantic pivot.",
  };
  item.actionProfile.constraints = input.constraints ?? [];
  item.actionProfile.destruction = {
    breakable: false,
    fractureGroup: input.id,
    seamRefs: [],
    detachableFragments: [],
    breakImpulse: 0,
    debrisMaterial: input.material,
  };
  item.localFeatures = (input.features ?? []).map(([id, description, level = "meso"]) => ({
    id,
    description,
    confidence: input.confidence ?? 0.82,
    level,
    evidence: [input.evidence ?? "full-object"],
  }));
  item.evidenceRefs = [input.evidence ?? "full-object"];
  item.details = [];
  item.fidelityTier = input.fidelityTier ?? "refined";
  return item;
}

function materialFrom(base, { id, name, color, secondary, roughness, metalness, materialClass, override }) {
  const item = clone(base);
  item.id = id;
  item.name = name;
  item.baseColor = color;
  item.color = color;
  item.albedo = {
    dominant: color,
    secondary: [secondary, color],
    samplingNotes: "Palette is derived from the admitted source image; single-view inverse rendering remains approximate.",
  };
  item.colorVariation.palette = [color, secondary];
  item.colorVariation.pattern = "low-frequency directional mottle";
  item.roughness.base = roughness;
  item.roughness.variation = 0.11;
  item.metalness.base = metalness;
  item.materialClass = materialClass;
  item.localOverrides = override ? [override] : [{ id: `${id}-contact-variation`, description: "Subtle cavity darkening and edge highlight variation tied to the reference.", confidence: 0.78 }];
  item.notes = "Stylized PBR reconstruction from one reference view; rear/underside response is inferred and will be judged in multi-view renders.";
  return item;
}

function applyShared(spec, di, config) {
  const template = clone(spec.componentTree[0]);
  const sourceMaterial = clone(spec.materials[0]);
  spec.preSpecAssessment.unknownsToResolveBeforeImplementation = [];
  spec.preSpecAssessment.detailInventory = di.detailInventory;
  for (const detail of spec.preSpecAssessment.detailInventory.details) {
    detail.priority = detail.scale === "macro" ? "critical" : "important";
    detail.componentRef = String(detail.mapsTo.ref).split(".")[0];
    detail.evidenceRef = detail.evidenceRef || "full-object";
    detail.realization = detail.mapsTo.type;
    detail.mapsTo.ref = String(detail.mapsTo.ref).split(".").at(-1);
  }
  if (config.detailRefOverrides) {
    for (const detail of spec.preSpecAssessment.detailInventory.details) {
      if (config.detailRefOverrides[detail.id]) detail.mapsTo.ref = config.detailRefOverrides[detail.id];
    }
  }
  spec.componentTree = config.components(template);
  spec.materials = config.materials(sourceMaterial);
  spec.repetitionSystems = config.repetitions;
  spec.featureReviewTargets = config.featureTargets;
  spec.lightingFromPhoto = config.lighting;
  spec.silhouette = config.silhouette;
  spec.viewEvidence = [{
    id: "full-object",
    view: "primary-front-three-quarter",
    imageRegion: { x: 0, y: 0, width: 1, height: 1, units: "normalized" },
    observations: config.observations,
    confidence: 0.86,
  }];
  spec.assumptions = config.assumptions;
  spec.animationAnchors = config.animationAnchors;
  for (const pass of spec.buildPasses) pass.componentRefs = config.passComponents[pass.id] ?? ["root"];
  spec.visualEvidence = [{ id: "source-reference", type: "admitted-reference", ref: spec.sourceImage }];
  return spec;
}

const neutralLights = (warm = false) => [
  { role: "key", direction: "upper-left at 45 degrees", colorTemp: warm ? "warm daylight" : "neutral-cool studio", intensity: "moderate-high", evidence: ["full-object"] },
  { role: "fill", direction: "front-right bounce", colorTemp: "neutral", intensity: "low", evidence: ["full-object"] },
  { role: "rim/environment", direction: "rear and overhead environment", colorTemp: warm ? "cool sky contrast" : "neutral", intensity: "low", note: "ACES filmic tone mapping, exposure 1.0, soft contact shadow on ground plane.", evidence: ["full-object"] },
];

function authorSuitcase() {
  const file = ".img2threejs/suitcase/spec.json";
  const spec = read(file);
  const di = read(".img2threejs/suitcase/di.json");
  const authored = applyShared(spec, di, {
    components: (t) => [
      component(t, { id: "root", name: "Carry-on body", level: "macro", role: "body", parent: null, primitive: "box", dimensions: { width: 1.48, height: 2.02, depth: 0.64 }, material: "shell", materialLayers: ["shell", "trim"], colorRecipe: recipe("#334464", "#253450", "plastic"), topologyIntent: "rounded hard-shell carry-on with convex front face and softened corners", features: [["corner-guards", "Dark guards wrap both lower front corners.", "meso"], ["body-panel-break", "Front/rear shell separation remains visible around the perimeter.", "micro"]], sockets: [{ id: "top-handle-socket", position: [0, 1.01, 0] }, { id: "wheel-sockets", position: [0, -1, 0] }] }),
      component(t, { id: "front-shell", name: "Ribbed front shell", level: "macro", role: "outer-shell", parent: "root", primitive: "box", dimensions: { width: 1.38, height: 1.86, depth: 0.18 }, position: [0, 0, 0.31], material: "shell", materialLayers: ["shell", "trim"], colorRecipe: recipe("#334464", "#5C6986", "plastic"), topologyIntent: "convex bevelled face carrying six recessed horizontal channels", features: [["recessed-ribs", "Six broad horizontal recessed channels with eased transitions.", "meso"], ["highlight-rolloff", "Convex face rolls a vertical studio highlight.", "micro"]], evidence: "full-object" }),
      component(t, { id: "gusset", name: "Perimeter zipper gusset", level: "meso", role: "seam-band", parent: "root", primitive: "box", dimensions: { width: 1.44, height: 1.96, depth: 0.08 }, position: [0, 0, -0.32], material: "trim", colorRecipe: recipe("#121620", "#253450", "fabric"), features: [["zip-seam", "Continuous dark zipper line separates front and rear shells.", "meso"], ["zip-teeth", "Fine repeated teeth read along the right perimeter.", "micro"]] }),
      component(t, { id: "telescopic-handle", name: "Twin-rail telescopic handle", level: "macro", role: "articulated-handle", parent: "root", primitive: "box", dimensions: { width: 0.64, height: 0.88, depth: 0.12 }, position: [0, 1.34, -0.05], localStart: [0, 0.88, 0], localEnd: [0, 1.72, 0], material: "metal", materialLayers: ["metal", "trim"], colorRecipe: recipe("#B8BEC8", "#121620", "metal"), animationRole: "slider", rotatable: false, features: [["grip-bevel", "Rounded dark bridge grip with broad shoulder transitions.", "meso"], ["rail-fasteners", "Paired dark circular rail stops.", "micro"]], constraints: [{ type: "translation-limit", axis: [0, 1, 0], min: 0, max: 0.62 }] }),
      component(t, { id: "tag", name: "Coral luggage tag", level: "meso", role: "pendant", parent: "telescopic-handle", primitive: "box", dimensions: { width: 0.32, height: 0.47, depth: 0.035 }, position: [0.33, -0.25, 0.12], rotation: [0, 0, -0.16], localStart: [0.2, 0, 0], localEnd: [0.33, -0.46, 0.1], material: "tag", colorRecipe: recipe("#C69A95", "#E7B5A6", "fabric"), animationRole: "pendulum", rotatable: true, axis: [0, 0, 1], features: [["stitched-border", "Inset pale stitched border follows the rounded tag edge.", "micro"], ["buckle", "Small metal buckle connects the strap loop.", "micro"]] }),
      component(t, { id: "wheels", name: "Four spinner wheel assemblies", level: "meso", role: "repeated-running-gear", parent: "root", primitive: "cylinder", dimensions: { width: 1.26, height: 0.26, depth: 0.44 }, position: [0, -1.11, 0], material: "rubber", materialLayers: ["rubber", "trim"], colorRecipe: recipe("#171B22", "#424A57", "rubber"), animationRole: "wheel-array", rotatable: true, axis: [1, 0, 0], features: [["hub-discs", "Raised circular hub discs and fork silhouettes on four pivots.", "meso"], ["tire-groove", "Shallow central tire grooves break the rubber highlight.", "micro"]] }),
      component(t, { id: "side-handle", name: "Side carry handle", level: "meso", role: "secondary-handle", parent: "root", primitive: "capsule", dimensions: { width: 0.17, height: 0.54, depth: 0.12 }, position: [0.76, 0.2, 0], material: "trim", colorRecipe: recipe("#121620", "#334464", "plastic"), animationRole: "hinge", rotatable: true, axis: [0, 0, 1], features: [["mount-pocket", "Dark handle nests into a shallow right-side pocket.", "meso"], ["mount-caps", "Small top and bottom mount caps anchor the grip.", "micro"]] }),
    ],
    materials: (b) => [
      materialFrom(b, { id: "shell", name: "Navy polycarbonate shell", color: "#334464", secondary: "#5C6986", roughness: 0.38, metalness: 0, materialClass: "plastic", override: { id: "highlight-band", description: "Soft vertical highlight band with subtly lower roughness across the convex front shell.", confidence: 0.88 } }),
      materialFrom(b, { id: "trim", name: "Charcoal trim and zipper", color: "#121620", secondary: "#253450", roughness: 0.66, metalness: 0, materialClass: "fabric" }),
      materialFrom(b, { id: "metal", name: "Brushed handle rails", color: "#B8BEC8", secondary: "#606A78", roughness: 0.3, metalness: 0.88, materialClass: "metal" }),
      materialFrom(b, { id: "rubber", name: "Wheel rubber", color: "#171B22", secondary: "#424A57", roughness: 0.82, metalness: 0, materialClass: "rubber" }),
      materialFrom(b, { id: "tag", name: "Coral stitched tag", color: "#C69A95", secondary: "#E7B5A6", roughness: 0.7, metalness: 0, materialClass: "fabric" }),
    ],
    repetitions: [
      { id: "shell-rib-array", kind: "linear-array", count: 6, pitch: 0.25, axis: "+Y", target: "front-shell", realization: "Six shallow rounded groove inserts distributed vertically across the front shell.", evidence: ["full-object"], confidence: 0.96, buildsGeometry: true, instances: 6 },
      { id: "wheel-corner-array", kind: "corner-array", count: 4, pitch: 1.0, axis: "+/-X,+/-Z", target: "wheels", realization: "Four named wheel pivot groups occupy the lower corners and share geometry/materials.", evidence: ["full-object"], confidence: 0.9, buildsGeometry: true, instances: 4 },
    ],
    detailRefOverrides: { "corner-guards": "corner-guards" },
    featureTargets: [
      { id: "suitcase-shell-read", name: "Rounded ribbed navy shell silhouette", tier: "critical", passIds: ["blockout", "form-refinement"], minimumScore: 0.82, mustPass: true, componentRefs: ["root", "front-shell"], evidenceRefs: ["full-object"] },
      { id: "suitcase-travel-hardware", name: "Handle, tag and four spinner wheels", tier: "critical", passIds: ["structural-pass", "interaction-pass"], minimumScore: 0.8, mustPass: true, componentRefs: ["telescopic-handle", "tag", "wheels"], evidenceRefs: ["full-object"] },
      { id: "suitcase-material-story", name: "Navy shell, charcoal trim, metal rails and coral accent", tier: "important", passIds: ["material-pass", "surface-pass"], minimumScore: 0.76, mustPass: false, componentRefs: ["front-shell", "gusset", "tag"], evidenceRefs: ["full-object"] },
    ],
    lighting: neutralLights(false),
    silhouette: { boundingShape: "upright rounded rectangle with compact wheel protrusions and a tall U-shaped handle", aspectRatios: ["body width:height = 0.73", "depth:width = 0.43"], symmetry: "mostly bilateral; tag and side handle introduce intentional right-side asymmetry", dominantCurves: ["large corner radii", "convex front shell", "arched handle grip"], negativeSpaces: ["open rectangle inside telescopic handle", "wheel-to-body gaps", "tag strap loop"], landmarks: ["six front ribs", "coral tag", "four spinner wheels"] },
    observations: ["Front three-quarter studio view clearly exposes the shell, right gusset, wheels, handle and tag.", "Rear shell and underside remain inferred; no exact hidden-surface fidelity is claimed."],
    assumptions: ["Single-view reconstruction; rear and underside geometry use consistent industrial-design continuation.", "Dimensions are normalized proportions rather than measured physical units."],
    animationAnchors: ["root supports chapter-scale translation, yaw and tilt", "telescopic-handle slides upward independently", "tag pivots as a damped pendulum", "each wheel pivot can spin independently"],
    passComponents: { blockout: ["root", "front-shell"], "structural-pass": ["gusset", "telescopic-handle", "tag", "wheels", "side-handle"], "form-refinement": ["front-shell", "telescopic-handle", "tag", "wheels"], "material-pass": ["root", "front-shell", "gusset", "tag"], "surface-pass": ["front-shell", "gusset", "tag", "wheels"], "lighting-pass": ["root"], "interaction-pass": ["telescopic-handle", "tag", "wheels"], "optimization-pass": ["root", "wheels"] },
  });
  write(file, authored);
}

function authorTorii() {
  const file = ".img2threejs/torii/spec.json";
  const spec = read(file);
  const di = read(".img2threejs/torii/di.json");
  const authored = applyShared(spec, di, {
    components: (t) => [
      component(t, { id: "root", name: "Torii gate assembly", level: "macro", role: "architectural-root", parent: null, primitive: "box", dimensions: { width: 3.2, height: 3.35, depth: 0.46 }, material: "vermilion", materialLayers: ["vermilion", "charcoal", "stone"], colorRecipe: recipe("#D04029", "#7A1D10", "wood"), topologyIntent: "symmetrical timber gate assembled around a large central portal", features: [["portal-negative-space", "Tall central opening remains the primary compositional void.", "macro"], ["joinery-shadow", "Layered beam intersections create compact dark contact shadows.", "micro"]], sockets: [{ id: "left-post-head", position: [-0.9, 1.2, 0] }, { id: "right-post-head", position: [0.9, 1.2, 0] }] }),
      component(t, { id: "posts", name: "Paired tapered posts", level: "macro", role: "structural-post-pair", parent: "root", primitive: "cylinder", dimensions: { width: 1.92, height: 2.75, depth: 0.34 }, position: [0, -0.12, 0], material: "vermilion", colorRecipe: recipe("#D04029", "#E1553E", "wood"), topologyIntent: "two slightly tapered polygonal timber shafts", deformations: [{ type: "taper", axis: "y", factor: 1.13, notes: "posts widen subtly toward the stone collars" }], features: [["taper", "Two shafts widen subtly toward the bases.", "macro"], ["vertical-wear", "Subtle darker vertical paint wear follows the grain direction.", "micro"]] }),
      component(t, { id: "kasagi", name: "Swept charcoal crown beam", level: "macro", role: "crown-beam", parent: "root", primitive: "extrude", topologyClass: "continuous-sculpt", topologyRationale: "The silhouette is a single shallow swept profile with continuously upturned ends, best represented by an extrusion rather than stacked boxes.", dimensions: { width: 3.2, height: 0.34, depth: 0.5 }, position: [0, 1.53, 0], material: "charcoal", colorRecipe: recipe("#272020", "#4F4E50", "wood"), topologyIntent: "shallow curved extrusion with lifted tips and a broad bevel", features: [["swept-profile", "Symmetric charcoal crown lifts at both ends.", "macro"], ["edge-bevel", "Broad bevel catches a cool highlight along the cap.", "meso"]] }),
      component(t, { id: "shimagi", name: "Vermilion upper beam", level: "meso", role: "secondary-crown-beam", parent: "root", primitive: "extrude", topologyClass: "assembled-solid", dimensions: { width: 2.9, height: 0.22, depth: 0.4 }, position: [0, 1.28, 0], material: "vermilion", colorRecipe: recipe("#D04029", "#E1553E", "wood"), topologyIntent: "thin beam with gently lifted ends under the charcoal cap", features: [["layer-seam", "A readable shadow seam separates shimagi from the charcoal crown.", "meso"], ["end-taper", "Beam ends slim and lift slightly beyond the posts.", "micro"]] }),
      component(t, { id: "nuki", name: "Projecting lower crossbeam", level: "macro", role: "crossbeam", parent: "posts", primitive: "box", dimensions: { width: 2.65, height: 0.25, depth: 0.32 }, position: [0, 0.72, 0], material: "vermilion", colorRecipe: recipe("#D04029", "#7A1D10", "wood"), features: [["projecting-ends", "Mid beam projects beyond both post axes.", "macro"], ["underside-shadow", "Dark underside makes the beam depth legible.", "micro"]] }),
      component(t, { id: "cross-beams", name: "Central gakuzuka support", level: "meso", role: "central-support", parent: "nuki", primitive: "box", dimensions: { width: 0.24, height: 0.58, depth: 0.25 }, position: [0, 1.02, 0], material: "charcoal", colorRecipe: recipe("#272020", "#7A1D10", "wood"), features: [["gakuzuka", "Central vertical support locks the nuki to the upper beam.", "meso"], ["cap-shadow", "Narrow top overlap creates a concentrated contact shadow.", "micro"]] }),
      component(t, { id: "joinery", name: "Mirrored head tie blocks", level: "meso", role: "joinery-pair", parent: "posts", primitive: "box", dimensions: { width: 2.05, height: 0.32, depth: 0.46 }, position: [0, 1.14, 0], material: "charcoal", colorRecipe: recipe("#272020", "#4F4E50", "wood"), features: [["tie-blocks", "Mirrored rectangular joinery blocks sit beside the post heads.", "meso"], ["fastener-caps", "Small dark end caps punctuate the beam intersections.", "micro"]] }),
      component(t, { id: "foundations", name: "Stepped stone foundations", level: "meso", role: "grounding-plinths", parent: "posts", primitive: "box", dimensions: { width: 2.15, height: 0.45, depth: 0.72 }, position: [0, -1.56, 0], material: "stone", colorRecipe: recipe("#777878", "#4F4E50", "stone"), features: [["stepped-bevels", "Two-tier stone collars and chamfered square footings ground each post.", "meso"], ["stone-pitting", "Sparse fine pits break the foundation highlights.", "micro"]] }),
    ],
    materials: (b) => [
      materialFrom(b, { id: "vermilion", name: "Weathered vermilion paint", color: "#D04029", secondary: "#7A1D10", roughness: 0.54, metalness: 0, materialClass: "wood", override: { id: "edge-wear", description: "Subtle darker vertical wear and lighter bevel response on posts and beams.", confidence: 0.76 } }),
      materialFrom(b, { id: "charcoal", name: "Charcoal-painted crown", color: "#272020", secondary: "#4F4E50", roughness: 0.62, metalness: 0, materialClass: "wood" }),
      materialFrom(b, { id: "stone", name: "Weathered gray foundation stone", color: "#777878", secondary: "#4F4E50", roughness: 0.88, metalness: 0, materialClass: "stone" }),
    ],
    repetitions: [
      { id: "post-mirror-pair", kind: "mirror-array", count: 2, pitch: 1.8, axis: "+X", target: "posts", realization: "One tapered post assembly mirrored across the central portal axis.", evidence: ["full-object"], confidence: 0.95, buildsGeometry: true, instances: 2 },
      { id: "foundation-mirror-pair", kind: "mirror-array", count: 2, pitch: 1.8, axis: "+X", target: "foundations", realization: "One stepped plinth assembly mirrored under both posts.", evidence: ["full-object"], confidence: 0.96, buildsGeometry: true, instances: 2 },
    ],
    featureTargets: [
      { id: "torii-portal-silhouette", name: "Tapered posts and tall central portal", tier: "critical", passIds: ["blockout", "form-refinement"], minimumScore: 0.84, mustPass: true, componentRefs: ["root", "posts"], evidenceRefs: ["full-object"] },
      { id: "torii-swept-crown", name: "Upturned charcoal kasagi over layered vermilion beam", tier: "critical", passIds: ["structural-pass", "form-refinement"], minimumScore: 0.82, mustPass: true, componentRefs: ["kasagi", "shimagi"], evidenceRefs: ["full-object"] },
      { id: "torii-grounded-joinery", name: "Crossbeam joinery and stepped stone feet", tier: "important", passIds: ["structural-pass", "material-pass"], minimumScore: 0.77, mustPass: false, componentRefs: ["nuki", "cross-beams", "joinery", "foundations"], evidenceRefs: ["full-object"] },
    ],
    lighting: neutralLights(true),
    silhouette: { boundingShape: "wide layered crown over two tapered vertical supports", aspectRatios: ["overall width:height = 0.96", "portal width:overall width = 0.54"], symmetry: "strong bilateral symmetry around the portal axis", dominantCurves: ["upturned kasagi ends", "gentle shimagi sweep", "subtle outward post taper"], negativeSpaces: ["large central portal", "small beam-layer gaps", "post-to-foundation shadow gaps"], landmarks: ["charcoal crown", "vermilion posts", "projecting nuki", "stepped stone plinths"] },
    observations: ["Front three-quarter studio view clearly shows layered crown, post taper, joinery and footings.", "Rear joinery depth is inferred from the visible side faces and architectural symmetry."],
    assumptions: ["Single-view stylized reconstruction; hidden rear joinery continues the visible cross-sections.", "Gate proportions are normalized for browser staging rather than historical survey accuracy."],
    animationAnchors: ["root supports slow portal approach and camera-relative yaw", "kasagi and shimagi retain separate pivots for parallax reveal", "paired foundations can settle independently during chapter entrance"],
    passComponents: { blockout: ["root", "posts", "kasagi"], "structural-pass": ["shimagi", "nuki", "cross-beams", "joinery", "foundations"], "form-refinement": ["posts", "kasagi", "shimagi", "nuki"], "material-pass": ["posts", "kasagi", "foundations"], "surface-pass": ["posts", "kasagi", "foundations"], "lighting-pass": ["root"], "interaction-pass": ["root", "kasagi", "shimagi"], "optimization-pass": ["root", "posts", "foundations"] },
  });
  write(file, authored);
}

authorSuitcase();
authorTorii();
console.log("Authored image2threejs sculpt specs for suitcase and torii.");
