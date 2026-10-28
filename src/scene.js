import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BLOCK_LAYOUT, LOT_LAYOUT, ROAD_LOOP, WALK_ROUTES } from './layout.js';
const records = (value) => Array.isArray(value) ? value : Object.entries(value || {}).map(([id, data]) => ({ id, ...data }));
const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

function roundedRect(width, depth, radius = 0.5) {
  const x = -width / 2, y = -depth / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + depth - radius);
  shape.quadraticCurveTo(x + width, y + depth, x + width - radius, y + depth);
  shape.lineTo(x + radius, y + depth);
  shape.quadraticCurveTo(x, y + depth, x, y + depth - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

export class CommunityScene {
  constructor(container, { onSelect, onHover, onReady, language = 'en', state = null } = {}) {
    this.container = container;
    this.onSelect = onSelect;
    this.onHover = onHover;
    this.onReady = onReady;
    this.disposed = false;
    this.language = 'en';
    this.mode = 'normal';
    this.modeSignature = null;
    this.selectionSignature = undefined;
    this.previewSignature = null;
    this.selectedId = null;
    this.state = state || { buildings: BLOCK_LAYOUT, lots: LOT_LAYOUT };
    this.blocks = new Map();
    this.lots = new Map();
    this.pickMeshes = [];
    this.pickLabels = [];
    this.trees = [];
    this.cars = [];
    this.people = [];
    this.geometries = new Set();
    this.materials = new Set();
    this.textures = new Set();
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.matrix = new THREE.Matrix4();
    this.dummy = new THREE.Object3D();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#e4ecdf');

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.14;
    this.renderer.domElement.className = 'community-canvas';
    this.renderer.domElement.setAttribute('role', 'img');
    this.setLanguage(language);
    this.renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;outline:none;';
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.OrthographicCamera(-40, 40, 30, -30, 0.1, 160);
    this.camera.position.set(39, 49, 62);
    this.camera.lookAt(0, 0, 1.6);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableRotate = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.085;
    this.controls.enablePan = true;
    this.controls.screenSpacePanning = false;
    this.controls.minZoom = 0.66;
    this.controls.maxZoom = 2.5;
    this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
    this.controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
    this.controls.touches.ONE = THREE.TOUCH.PAN;
    this.controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
    this.controls.target.set(0, 0, 1.6);
    this.controls.update();
    this.controls.saveState();

    this.boxGeometry = this.keepGeometry(new THREE.BoxGeometry(1, 1, 1));
    this.treeGeometry = this.keepGeometry(new THREE.IcosahedronGeometry(1, 1));
    this.trunkGeometry = this.keepGeometry(new THREE.CylinderGeometry(0.09, 0.12, 1, 6));
    this.sphereGeometry = this.keepGeometry(new THREE.SphereGeometry(1, 10, 7));
    this.cylinderGeometry = this.keepGeometry(new THREE.CylinderGeometry(1, 1, 1, 10));
    this.mat = {};
    const colors = {
      grass: '#b8c79e', soil: '#c3baa4', plaster: '#f4f0dc', roof: '#d2d2c1',
      path: '#dedbc6', curb: '#efe9d3', road: '#929e96', stripe: '#f8f1dc',
      window: '#627d79', windowLit: '#9faf9a', metal: '#5f756b', timber: '#bc9670',
      leaf: '#71975c', leafLight: '#91ad69', leafDark: '#537e56', trunk: '#937653',
      green: '#4eaa79', lawn: '#91b97c', darkLawn: '#77a263', blue: '#579bb0',
      solar: '#3c6480', warmLight: '#ffdf8c', pot: '#c99a79', vacant: '#cbbfa3',
    };
    Object.entries(colors).forEach(([name, color]) => {
      this.mat[name] = this.material({ color, roughness: name === 'window' ? 0.52 : 0.88 });
    });
    this.mat.window.metalness = 0.12;
    this.mat.solar.metalness = 0.22;
    this.mat.solar.roughness = 0.38;
    this.mat.warmLight.emissive = new THREE.Color('#ffdda0');
    this.mat.warmLight.emissiveIntensity = 0.3;

    this.environment = new THREE.Group();
    this.scene.add(this.environment);
    this.coverageGroup = new THREE.Group();
    this.selectionGroup = new THREE.Group();
    this.previewGroup = new THREE.Group();
    this.scene.add(this.coverageGroup, this.selectionGroup, this.previewGroup);

    const hemisphere = new THREE.HemisphereLight('#f4f7e9', '#a6b898', 2.2);
    this.scene.add(hemisphere);
    const sun = new THREE.DirectionalLight('#fff0d5', 3.1);
    sun.position.set(-26, 42, 28);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -42, right: 42, top: 42, bottom: -42, near: 1, far: 110 });
    sun.shadow.normalBias = 0.055;
    sun.shadow.bias = -0.00015;
    sun.shadow.radius = 3;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight('#e8f4ff', 0.4);
    fill.position.set(25, 20, -30);
    this.scene.add(fill);

    this.buildGround();
    this.buildRoads();
    this.buildWaterfront();
    records(this.state.buildings).forEach((value) => {
      const config = BLOCK_LAYOUT.find((item) => item.id === String(value.id));
      if (config) this.buildBlock({ ...config, ...value });
    });
    records(this.state.lots).forEach((value) => {
      const config = LOT_LAYOUT.find((item) => item.id === String(value.id));
      if (config) this.buildLot({ ...config, ...value });
    });
    this.buildStreetLife();
    this.bindEvents();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.animate = this.animate.bind(this);
    this.frame = requestAnimationFrame(this.animate);
    requestAnimationFrame(() => this.onReady?.());
  }

  // Building numbers, lot numbers and coverage symbols are language-neutral.
  // Change only descriptive text so camera, selection and GPU objects stay intact.
  setLanguage(language = 'en') {
    this.language = /^zh(?:[-_]|$)/i.test(String(language)) ? 'zh' : 'en';
    const canvas = this.renderer?.domElement;
    canvas?.setAttribute('lang', this.language === 'zh' ? 'zh-CN' : 'en');
    canvas?.setAttribute('aria-label', this.language === 'zh'
      ? '可交互的三维组屋社区地图，点击住宅或空地进行改造'
      : 'Interactive 3D HDB neighbourhood map. Select a block or vacant lot to plan an upgrade.');
    return this.language;
  }

  keepGeometry(geometry) { this.geometries.add(geometry); return geometry; }
  material(options) { const material = new THREE.MeshStandardMaterial(options); this.materials.add(material); return material; }
  basicMaterial(options) { const material = new THREE.MeshBasicMaterial(options); this.materials.add(material); return material; }

  box(parent, width, height, depth, x, y, z, material, shadow = true) {
    const mesh = new THREE.Mesh(this.boxGeometry, material);
    mesh.scale.set(width, height, depth);
    mesh.position.set(x, y, z);
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  sphere(parent, radius, x, y, z, material, scale = [1, 1, 1]) {
    const mesh = new THREE.Mesh(this.sphereGeometry, material);
    mesh.scale.set(radius * scale[0], radius * scale[1], radius * scale[2]);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  instances(parent, geometry, material, transforms, shadow = true) {
    if (!transforms.length) return;
    const mesh = new THREE.InstancedMesh(geometry, material, transforms.length);
    transforms.forEach((item, index) => {
      this.dummy.position.set(...item.p);
      this.dummy.rotation.set(...(item.r || [0, 0, 0]));
      this.dummy.scale.set(...(item.s || [1, 1, 1]));
      this.dummy.updateMatrix();
      mesh.setMatrixAt(index, this.dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  flatShape(parent, width, depth, x, y, z, material, radius = 0.35) {
    const geometry = this.keepGeometry(new THREE.ShapeGeometry(roundedRect(width, depth, radius), 6));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  positionOf(id) {
    return [...records(this.state.buildings), ...records(this.state.lots)].find((item) => String(item.id) === String(id));
  }

  curve(points, closed = false) {
    return new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0, z)), closed, 'centripetal');
  }

  // A planar ribbon avoids the straight, repeated road slabs of the old grid.
  ribbon(parent, curve, width, y, material, segments = 180) {
    const vertices = [], indices = [];
    for (let i = 0; i <= segments; i++) {
      const point = curve.getPointAt(i / segments), tangent = curve.getTangentAt(i / segments);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(width / 2);
      vertices.push(point.x + normal.x, y, point.z + normal.z, point.x - normal.x, y, point.z - normal.z);
      if (i < segments) { const j = i * 2; indices.push(j, j + 2, j + 1, j + 1, j + 2, j + 3); }
    }
    const geometry = this.keepGeometry(new THREE.BufferGeometry());
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  buildGround() {
    const geometry = this.keepGeometry(new THREE.ExtrudeGeometry(roundedRect(56, 51, 2.6), {
      depth: 1, bevelEnabled: true, bevelThickness: 0.13, bevelSize: 0.18, bevelSegments: 2, curveSegments: 8,
    }));
    const island = new THREE.Mesh(geometry, [this.mat.grass, this.mat.soil]);
    island.rotation.x = -Math.PI / 2;
    island.position.set(0, -1, -0.5);
    island.receiveShadow = true;
    island.castShadow = true;
    this.environment.add(island);
    const baseShadow = this.basicMaterial({ color: '#536b50', transparent: true, opacity: 0.075, depthWrite: false });
    this.flatShape(this.environment, 57, 52, 0.5, -1.18, 0.3, baseShadow, 3);
    // Small existing tree clusters are landscape context, distinct from the buildable public sites.
    const trees = [
      [-26.8, -16.3], [-27, -7.7], [-26.7, 2.4], [-26.4, 9.5], [-21.7, 16],
      [26.5, -17.5], [26.8, -6.6], [26.5, 4.7], [25.3, 12.9],
      [-19.3, -16.8], [-18, -15.4], [-17.3, -17.4], [-5.8, -16.6],
      [16.7, -15.6], [18.2, -14.6], [17.9, -16.7],
      [-17.1, -1.9], [-15.4, -0.5], [-15.9, -2.8],
      [5.4, 4.7], [5.1, 6.2], [6.3, 5.5], [18.9, -4], [20.2, -5],
      [-15.8, 12.9], [-16.8, 11.3], [-1.1, 13.2], [-1.4, 14.7], [19.3, 13.8],
    ];
    trees.forEach(([x, z], i) => this.tree(this.environment, x, z, 1.65 + (i % 5) * 0.14, i + 40));
    this.flatShape(this.environment, 49, 0.85, 0, 0.17, 18.95, this.mat.path, 0.35);
    [-19, -2.4, 6.8, 20.3].forEach((x, i) => this.bench(this.environment, x, 18.75, i % 2 ? 0.07 : -0.09));

    const plaza = new THREE.Group();
    plaza.position.set(-4.8, 0.17, 6.2);
    plaza.rotation.y = -0.25;
    this.environment.add(plaza);
    const paving = new THREE.Mesh(this.keepGeometry(new THREE.CircleGeometry(1.38, 28)), this.mat.path);
    paving.rotation.x = -Math.PI / 2; paving.position.y = 0.045; paving.receiveShadow = true;
    plaza.add(paving);
    this.bench(plaza, 0.1, 1.0, -0.1);
    this.bench(plaza, -0.83, -0.28, Math.PI / 2);
    this.box(plaza, 1.45, 0.09, 1.05, 0.4, 1.62, -0.35, this.mat.timber);
    [-0.25, 1.05].forEach((x) => [-0.76, 0.08].forEach((z) => this.box(plaza, 0.07, 1.45, 0.07, x, 0.9, z, this.mat.timber)));
    this.flowerBed(plaza, 0.6, -1.17);
  }

  buildRoads() {
    const road = this.environment;
    this.roadCurve = this.curve(ROAD_LOOP, true);
    this.ribbon(road, this.roadCurve, 3.35, 0.2, this.mat.curb);
    this.ribbon(road, this.roadCurve, 2.85, 0.245, this.mat.road);
    const stripes = [];
    const roadLength = this.roadCurve.getLength();
    for (let along = 0; along < roadLength; along += 2.2) {
      const t = along / roadLength, point = this.roadCurve.getPointAt(t), tangent = this.roadCurve.getTangentAt(t);
      stripes.push({ p: [point.x, 0.27, point.z], s: [0.07, 0.013, 0.82], r: [0, Math.atan2(tangent.x, tangent.z), 0] });
    }
    this.instances(road, this.boxGeometry, this.mat.stripe, stripes, false);
    const serviceLane = this.curve([[-25, -4.5], [-22, -4.4], [-19, -5.3], [-17.5, -6.2]]);
    this.ribbon(road, serviceLane, 2.5, 0.215, this.mat.curb, 50);
    this.ribbon(road, serviceLane, 2.05, 0.255, this.mat.road, 50);
    this.walkCurves = WALK_ROUTES.map((points) => this.curve(points));
    this.walkCurves.forEach((curve) => this.ribbon(road, curve, 1.05, 0.165, this.mat.path, 90));
    [[-19.2, -7], [-7, -4.6], [5.4, -3.4], [20.1, 3.8], [-16.8, 8.4], [-3.8, 7.1], [-21.5, -10], [22, -9], [-5.8, 18.2], [6, 18.2]].forEach(([x, z]) => this.lamp(road, x, z));
  }

  buildWaterfront() {
    const waterMat = this.material({ color: '#82b9bb', roughness: 0.38, metalness: 0.15 });
    this.box(this.environment, 52.5, 0.15, 4.1, 0, 0.16, 21.8, waterMat, false);
    [19.55, 24.03].forEach((z) => this.box(this.environment, 53, 0.24, 0.4, 0, 0.25, z, this.mat.curb));
    const waves = [];
    for (let i = 0; i < 22; i++) {
      const x = -24 + i * 2.2, z = 20.5 + (i % 3) * 1.15;
      waves.push({ p: [x, 0.247, z], s: [0.65 + (i % 4) * 0.2, 0.01, 0.035] });
    }
    this.waveMaterial = this.basicMaterial({ color: '#dbf2e8', transparent: true, opacity: 0.24, depthWrite: false });
    this.instances(this.environment, this.boxGeometry, this.waveMaterial, waves, false);
    const bridge = new THREE.Group();
    bridge.position.set(18.3, 0, 21.8);
    this.environment.add(bridge);
    this.box(bridge, 2.25, 0.21, 5.05, 0, 0.61, 0, this.mat.path);
    this.box(bridge, 2.15, 0.035, 5.03, 0, 0.73, 0, this.mat.timber);
    [-1.03, 1.03].forEach((x) => {
      this.box(bridge, 0.055, 0.055, 5.02, x, 1.27, 0, this.mat.metal);
      this.box(bridge, 0.045, 0.045, 5.02, x, 1.0, 0, this.mat.metal);
      for (let z = -2.3; z < 2.5; z += 0.6) this.box(bridge, 0.06, 0.55, 0.06, x, 1.0, z, this.mat.metal);
    });
    this.flatShape(this.environment, 3, 2, 18.3, 0.18, 18.8, this.mat.path, 0.35);
    this.flatShape(this.environment, 3, 1.4, 18.3, 0.18, 24.7, this.mat.path, 0.3);
  }

  buildBlock(config) {
    const { id, x, z, h, floors, accent } = config;
    const group = new THREE.Group();
    group.position.set(x, 0.18, z);
    group.rotation.y = config.rotation || 0;
    group.scale.set(config.scaleX || 1, 1, config.scaleZ || 1);
    this.scene.add(group);
    const accentMat = this.material({ color: accent, roughness: 0.85 });
    const frontage = this.flatShape(group, 7.3, 6.5, 0, 0.025, 0, this.mat.path, 0.42);
    frontage.receiveShadow = true;
    // Open void decks keep the blocks recognisably HDB rather than generic towers.
    this.box(group, 5.8, h - 1.15, 4.25, 0, (h + 1.15) / 2, 0, this.mat.plaster);
    this.box(group, 5.96, 0.18, 4.4, 0, 1.18, 0, this.mat.plaster);
    const columns = [];
    [-2.48, -1.25, 0, 1.25, 2.48].forEach((cx) => [-1.6, 1.6].forEach((cz) => columns.push({ p: [cx, 0.64, cz], s: [0.19, 1.08, 0.2] })));
    this.instances(group, this.boxGeometry, this.mat.plaster, columns);
    this.box(group, 0.8, 1.1, 1.05, -0.65, 0.62, -0.5, this.mat.window);
    this.box(group, 0.82, 0.07, 1.1, -0.65, 0.97, -0.5, accentMat);
    const panels = [], litWindows = [], shelves = [], frames = [], conditioners = [], grills = [];
    const floorStep = (h - 1.4) / floors;
    for (let floor = 0; floor < floors; floor++) {
      const y = 1.5 + floorStep * floor + floorStep * 0.4;
      for (let col = 0; col < 4; col++) {
        const bx = -1.86 + col * 1.24;
        [-1, 1].forEach((face) => {
          const target = (floor + col + (face > 0 ? 1 : 0)) % 7 === 0 ? litWindows : panels;
          target.push({ p: [bx, y, face * 2.14], s: [0.91, floorStep * 0.68, 0.045] });
          shelves.push({ p: [bx, y - floorStep * 0.32, face * 2.235], s: [1.04, 0.105, 0.24] });
          frames.push({ p: [bx, y, face * 2.176], s: [0.045, floorStep * 0.67, 0.025] });
          frames.push({ p: [bx, y + 0.025, face * 2.18], s: [0.91, 0.035, 0.025] });
          shelves.push({ p: [bx, y - floorStep * 0.22, face * 2.32], s: [0.99, floorStep * 0.14, 0.055] });
        });
      }
      [-1, 1].forEach((side) => {
        [-1.15, 0.95].forEach((cz) => {
          panels.push({ p: [side * 2.924, y, cz], s: [0.035, floorStep * 0.66, 0.69] });
          frames.push({ p: [side * 2.95, y, cz], s: [0.025, floorStep * 0.65, 0.032] });
        });
        conditioners.push({ p: [side * 3.03, y - floorStep * 0.2, -0.15], s: [0.22, 0.25, 0.47] });
        grills.push({ p: [side * 3.15, y - floorStep * 0.2, -0.15], s: [0.026, 0.14, 0.31] });
      });
    }
    this.instances(group, this.boxGeometry, this.mat.window, panels, false);
    this.instances(group, this.boxGeometry, this.mat.windowLit, litWindows, false);
    this.instances(group, this.boxGeometry, this.mat.plaster, shelves);
    this.instances(group, this.boxGeometry, this.mat.curb, frames, false);
    this.instances(group, this.boxGeometry, this.mat.roof, conditioners);
    this.instances(group, this.boxGeometry, this.mat.window, grills, false);
    [-2.56, 2.56].forEach((cx) => {
      [-1, 1].forEach((face) => this.box(group, 0.32, h - 1.26, 0.17, cx, (h + 1.28) / 2, face * 2.19, accentMat));
    });
    this.box(group, 6.02, 0.15, 4.45, 0, h + 0.025, 0, this.mat.roof);
    [-2.89, 2.89].forEach((cx) => this.box(group, 0.13, 0.33, 4.42, cx, h + 0.22, 0, this.mat.plaster));
    [-2.16, 2.16].forEach((cz) => this.box(group, 5.91, 0.33, 0.13, 0, h + 0.22, cz, this.mat.plaster));
    this.box(group, 1.3, 0.9, 1.23, -1.56, h + 0.56, -0.7, this.mat.plaster);
    this.box(group, 1.42, 0.1, 1.35, -1.56, h + 1.04, -0.7, this.mat.roof);
    this.box(group, 0.42, 0.16, 0.42, -1.56, h + 1.16, -0.7, this.mat.metal);
    const wallNumber = this.textPlane(id, 1.16, 0.65, '#284940');
    wallNumber.position.set(2.934, h * 0.6, 0.13);
    wallNumber.rotation.y = Math.PI / 2;
    group.add(wallNumber);
    const numberTag = this.label(id, { width: 1.92, height: 0.63, fill: '#fffdf0', color: '#34574b' });
    numberTag.position.set(0.2, h + 1.3, 0.4);
    group.add(numberTag);
    this.bench(group, -2.6, 2.78, 0);
    this.box(group, 1.7, 0.18, 0.42, 2, 0.17, 2.81, this.mat.pot);
    const smallShrubs = [];
    for (let i = 0; i < 4; i++) smallShrubs.push({ p: [1.37 + i * 0.4, 0.37, 2.81], s: [0.27, 0.24, 0.25] });
    this.instances(group, this.treeGeometry, this.mat.leafLight, smallShrubs);
    const additions = new THREE.Group();
    group.add(additions);
    const overlay = new THREE.Group();
    group.add(overlay);
    const pick = this.box(group, 6.15, h + 1.25, 4.8, 0, h / 2 + 0.45, 0,
      this.basicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }), false);
    pick.userData.id = id;
    this.pickMeshes.push(pick);
    this.blocks.set(id, { config, group, additions, overlay, signature: '', numberTag });
  }

  buildLot(config) {
    const group = new THREE.Group();
    group.position.set(config.x, 0.19, config.z);
    group.rotation.y = config.rotation || 0;
    this.scene.add(group);
    const base = this.flatShape(group, 7.15, 5.7, 0, 0.025, 0, config.parking ? this.mat.road : this.mat.vacant, 0.45);
    const additions = new THREE.Group();
    group.add(additions);
    const marker = this.label(`+  ${config.label}`, { width: 2.2, height: 0.84, fill: '#faf8e8', color: '#497a60', border: '#719f7a' });
    marker.position.set(0, 1.03, 0.3);
    if (config.id === 'p2') marker.position.set(-1.5, 1.03, 0);
    marker.material.depthTest = false;
    marker.renderOrder = 6;
    marker.userData.id = config.id;
    this.pickLabels.push(marker);
    group.add(marker);
    const corners = [];
    for (let i = 0; i < 7; i++) {
      const x = -3.05 + i * 0.9;
      [-2.34, 2.34].forEach((z) => corners.push({ p: [x, 0.06, z], s: [0.5, 0.025, 0.065] }));
    }
    for (let i = 0; i < 5; i++) {
      const z = -1.8 + i * 0.85;
      [-3.17, 3.17].forEach((x) => corners.push({ p: [x, 0.06, z], s: [0.065, 0.025, 0.43] }));
    }
    this.instances(group, this.boxGeometry, this.mat.stripe, corners, false);
    const vacant = new THREE.Group();
    group.add(vacant);
    if (config.parking) {
      const stalls = [];
      for (let i = 0; i < 5; i++) stalls.push({ p: [-2.5 + i * 1.24, 0.075, -0.4], s: [0.045, 0.016, 2.4] });
      this.instances(vacant, this.boxGeometry, this.mat.stripe, stalls, false);
      this.car(vacant, -1.88, -0.2, '#b78d75', 0).position.y = 0.045;
      this.car(vacant, 1.85, -0.2, '#8eaeb3', 0).position.y = 0.045;
    } else {
      const dots = [];
      for (let x = -2.5; x <= 2.5; x += 1.25) for (let z = -1.5; z <= 1.5; z += 1.5) dots.push({ p: [x, 0.064, z], s: [0.047, 0.013, 0.047] });
      this.instances(vacant, this.boxGeometry, this.mat.curb, dots, false);
    }
    const pick = this.box(group, 7.3, 1.6, 5.85, 0, 0.65, 0,
      this.basicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }), false);
    pick.userData.id = config.id;
    this.pickMeshes.push(pick);
    this.lots.set(config.id, { config, group, base, additions, marker, vacant, signature: '' });
  }

  tree(parent, x, z, height = 2, seed = 0, groundY = 0.17, tiny = false) {
    const group = new THREE.Group();
    group.position.set(x, groundY, z);
    parent.add(group);
    const trunk = new THREE.Mesh(this.trunkGeometry, this.mat.trunk);
    trunk.scale.set(tiny ? 0.55 : 1, height * 0.53, tiny ? 0.55 : 1);
    trunk.position.y = height * 0.25;
    trunk.castShadow = true;
    group.add(trunk);
    const crown = new THREE.Group();
    group.add(crown);
    const lobes = [
      { p: [0, height * 0.7, 0], s: [height * 0.36, height * 0.36, height * 0.34], material: this.mat.leaf },
      { p: [-height * 0.2, height * 0.62, 0.08], s: [height * 0.3, height * 0.29, height * 0.29], material: this.mat.leafLight },
      { p: [height * 0.2, height * 0.61, -0.1], s: [height * 0.3, height * 0.3, height * 0.3], material: this.mat.leafDark },
    ];
    lobes.forEach((lobe) => {
      const mesh = new THREE.Mesh(this.treeGeometry, lobe.material);
      mesh.position.set(...lobe.p);
      mesh.scale.set(...lobe.s);
      mesh.rotation.set(seed * 0.2, seed * 0.6, 0.15);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      crown.add(mesh);
    });
    this.trees.push({ group, crown, seed });
    return group;
  }

  bench(parent, x, z, angle = 0) {
    const bench = new THREE.Group();
    bench.position.set(x, parent === this.environment ? 0.15 : 0, z);
    bench.rotation.y = angle;
    parent.add(bench);
    this.box(bench, 1.17, 0.07, 0.42, 0, 0.4, 0, this.mat.timber);
    this.box(bench, 1.17, 0.21, 0.055, 0, 0.61, -0.18, this.mat.timber);
    [-0.43, 0.43].forEach((leg) => this.box(bench, 0.065, 0.35, 0.36, leg, 0.2, 0, this.mat.metal));
  }

  lamp(parent, x, z) {
    const lamp = new THREE.Group();
    lamp.position.set(x, 0.18, z);
    parent.add(lamp);
    this.box(lamp, 0.10, 2.2, 0.1, 0, 1.1, 0, this.mat.metal);
    this.box(lamp, 0.45, 0.08, 0.15, 0.16, 2.2, 0, this.mat.metal);
    this.box(lamp, 0.25, 0.045, 0.13, 0.27, 2.15, 0, this.mat.warmLight, false);
    this.box(lamp, 0.24, 0.1, 0.24, 0, 0.07, 0, this.mat.metal);
  }

  car(parent, x, z, color, angle = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0.33, z);
    group.rotation.y = angle;
    parent.add(group);
    const paint = this.material({ color, roughness: 0.44, metalness: 0.1 });
    this.box(group, 0.72, 0.25, 1.36, 0, 0.24, 0, paint);
    this.box(group, 0.57, 0.27, 0.66, 0, 0.46, -0.07, paint);
    this.box(group, 0.59, 0.17, 0.031, 0, 0.48, 0.28, this.mat.window);
    this.box(group, 0.59, 0.16, 0.031, 0, 0.48, -0.41, this.mat.window);
    [-1, 1].forEach((side) => this.box(group, 0.018, 0.17, 0.51, side * 0.298, 0.48, -0.07, this.mat.window));
    [-0.24, 0.24].forEach((px) => this.box(group, 0.17, 0.063, 0.038, px, 0.28, 0.699, this.mat.warmLight, false));
    const wheels = [];
    [-0.37, 0.37].forEach((px) => [-0.43, 0.43].forEach((pz) => wheels.push({ p: [px, 0.145, pz], s: [0.13, 0.075, 0.13], r: [0, 0, Math.PI / 2] })));
    this.instances(group, this.cylinderGeometry, this.mat.metal, wheels);
    return group;
  }

  buildStreetLife() {
    ['#d29779', '#86a7a7', '#eddbb9', '#778c86'].forEach((color, index) => {
      const car = this.car(this.environment, 0, 0, color);
      this.cars.push({ group: car, offset: index * 29.4, speed: 1.45 + index * 0.16 });
    });
    const shirts = ['#cc9872', '#457f7a', '#e4cb8e', '#c8847d', '#87a6bc', '#617862', '#dbc7b3', '#7e899f'];
    shirts.forEach((color, index) => {
      const person = new THREE.Group();
      this.environment.add(person);
      const skin = this.material({ color: ['#c79870', '#ad7f5b', '#dbc2a1'][index % 3], roughness: 1 });
      const shirt = this.material({ color, roughness: 1 });
      this.sphere(person, 0.105, 0, 0.61, 0, skin);
      this.box(person, 0.2, 0.29, 0.135, 0, 0.39, 0, shirt);
      const leftLeg = this.box(person, 0.055, 0.2, 0.07, -0.057, 0.14, 0, this.mat.window);
      const rightLeg = this.box(person, 0.055, 0.2, 0.07, 0.057, 0.14, 0, this.mat.window);
      this.box(person, 0.052, 0.19, 0.075, -0.145, 0.4, 0, skin);
      this.box(person, 0.052, 0.19, 0.075, 0.145, 0.4, 0, skin);
      this.people.push({ group: person, leftLeg, rightLeg, index, speed: 0.36 + index * 0.025 });
    });
  }

  canvasTexture(text, { fill = null, color = '#34574b', border = null, width = 256, height = 96, round = 20 } = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (fill) {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.roundRect(4, 4, width - 8, height - 8, round);
      ctx.fill();
      if (border) { ctx.strokeStyle = border; ctx.lineWidth = 6; ctx.stroke(); }
    }
    ctx.fillStyle = color;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.floor(height * 0.53)}px "Microsoft YaHei", "Segoe UI", sans-serif`;
    ctx.fillText(text, width / 2, height / 2 + 2);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    this.textures.add(texture);
    return texture;
  }

  label(text, { width = 2, height = 0.65, ...style } = {}) {
    const texture = this.canvasTexture(text, style);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false });
    this.materials.add(material);
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(width, height, 1);
    sprite.renderOrder = 3;
    return sprite;
  }

  textPlane(text, width, height, color) {
    const texture = this.canvasTexture(text, { color, width: 256, height: 128 });
    const material = this.basicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1 });
    const geometry = this.keepGeometry(new THREE.PlaneGeometry(width, height));
    return new THREE.Mesh(geometry, material);
  }

  buildRoofGarden(block) {
    const { additions, config: { h } } = block;
    this.flatShape(additions, 5.53, 3.94, 0, h + 0.12, 0, this.mat.lawn, 0.18);
    this.box(additions, 0.75, 0.027, 3.7, -0.54, h + 0.15, 0, this.mat.path, false);
    [-1.8, 0.6, 1.9].forEach((x) => {
      this.box(additions, 0.87, 0.27, 0.62, x, h + 0.25, 1.3, this.mat.pot);
      this.tree(additions, x, 1.3, 0.8, x * 2, h + 0.34, true);
    });
    this.tree(additions, 1.95, -1.1, 1.14, h, h + 0.14, true);
    this.bench(additions, 0.84, 0.03, Math.PI / 2);
    const lastBench = additions.children[additions.children.length - 1];
    lastBench.position.y = h + 0.14;
  }

  buildSolar(block) {
    const { additions, config: { h } } = block;
    const assembly = new THREE.Group();
    assembly.position.set(0.82, h + 0.5, -0.3);
    additions.add(assembly);
    [-0.57, 0.57].forEach((x) => [-0.54, 0.54].forEach((z) => {
      const panel = new THREE.Group();
      panel.position.set(x, 0, z);
      panel.rotation.x = -0.25;
      assembly.add(panel);
      this.box(panel, 1.08, 0.065, 0.91, 0, 0, 0, this.mat.curb);
      this.box(panel, 1.02, 0.025, 0.85, 0, 0.049, 0, this.mat.solar);
      [-0.25, 0.25].forEach((px) => this.box(panel, 0.012, 0.007, 0.83, px, 0.065, 0, this.mat.windowLit, false));
      [-0.14, 0.14].forEach((pz) => this.box(panel, 1.01, 0.007, 0.011, 0, 0.066, pz, this.mat.windowLit, false));
      this.box(assembly, 0.065, 0.4, 0.065, x, -0.16, z + 0.32, this.mat.metal);
    }));
  }

  buildCooling(block) {
    const { additions } = block;
    const shade = this.material({ color: '#7fa9aa', roughness: 0.88 });
    this.box(additions, 2.15, 0.105, 1.48, 0.67, 1.65, 2.63, shade);
    [-0.27, 1.62].forEach((x) => this.box(additions, 0.07, 1.45, 0.07, x, 0.89, 3.22, this.mat.metal));
    this.box(additions, 2.2, 0.09, 0.085, 0.67, 1.7, 3.36, this.mat.plaster);
    const symbol = this.label('❄', { width: 0.58, height: 0.58, fill: '#e7f4f0', color: '#4c8792', round: 42 });
    symbol.position.set(2.68, 2, 2.33);
    additions.add(symbol);
  }

  buildPark(lot) {
    const group = lot.additions;
    this.flatShape(group, 6.7, 5.25, 0, 0.045, 0, this.mat.lawn, 0.52);
    this.flatShape(group, 5.9, 0.65, 0, 0.065, 0.15, this.mat.path, 0.3);
    this.flatShape(group, 0.7, 4.4, 0.2, 0.075, 0, this.mat.path, 0.3);
    const circle = new THREE.Mesh(this.keepGeometry(new THREE.CircleGeometry(1.25, 24)), this.mat.path);
    circle.rotation.x = -Math.PI / 2;
    circle.position.set(0, 0.08, 0.1);
    circle.receiveShadow = true;
    group.add(circle);
    [[-2.42, -1.7], [-2.2, 1.65], [2.4, -1.6], [2.35, 1.64], [-0.8, -1.82], [0.93, 1.87]].forEach(([x, z], index) => this.tree(group, x, z, 1.7 + (index % 3) * 0.17, index + 80, 0.075));
    const gazebo = new THREE.Group();
    gazebo.position.set(0.1, 0.08, 0.12);
    group.add(gazebo);
    [[-0.77, -0.77], [0.77, -0.77], [-0.77, 0.77], [0.77, 0.77]].forEach(([x, z]) => this.box(gazebo, 0.09, 1.6, 0.09, x, 0.85, z, this.mat.timber));
    const roof = new THREE.Mesh(this.keepGeometry(new THREE.ConeGeometry(1.6, 0.55, 4)), this.mat.leafDark);
    roof.position.y = 1.85;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    gazebo.add(roof);
    this.bench(group, -1.33, 0.85, Math.PI / 2);
    this.bench(group, 1.45, -0.8, -Math.PI / 2);
    this.flowerBed(group, -1.2, -1.1);
  }

  buildWalk(lot) {
    const group = lot.additions;
    this.flatShape(group, 6.7, 5.25, 0, 0.045, 0, this.mat.lawn, 0.5);
    this.flatShape(group, 6.7, 1.5, 0, 0.07, 0, this.mat.path, 0.3);
    [[-2.45, -1.58], [-0.45, -1.62], [1.75, -1.62], [-1.65, 1.63], [0.5, 1.7], [2.43, 1.6]].forEach(([x, z], index) => this.tree(group, x, z, 1.95, index + 100, 0.08));
    [-2.35, 2.35].forEach((x) => [-0.68, 0.68].forEach((z) => this.box(group, 0.095, 1.7, 0.095, x, 0.91, z, this.mat.timber)));
    for (let x = -2.65; x < 2.8; x += 0.46) this.box(group, 0.16, 0.09, 1.86, x, 1.77, 0, this.mat.timber);
    this.bench(group, -1.6, -0.96, Math.PI);
    this.bench(group, 1.6, 1, 0);
    this.flowerBed(group, 2.8, -1.85);
  }

  flowerBed(parent, x, z) {
    this.box(parent, 1.13, 0.16, 0.48, x, 0.16, z, this.mat.pot);
    const flowers = [];
    const flowerMat = this.material({ color: '#ddb797', roughness: 1 });
    for (let i = 0; i < 5; i++) flowers.push({ p: [x - 0.4 + i * 0.2, 0.33 + (i % 2) * 0.06, z], s: [0.11, 0.095, 0.12] });
    this.instances(parent, this.treeGeometry, this.mat.leaf, flowers);
    this.instances(parent, this.sphereGeometry, flowerMat, flowers.map((flower) => ({ p: [flower.p[0], flower.p[1] + 0.08, flower.p[2]], s: [0.06, 0.047, 0.06] })));
  }

  update(state) {
    this.state = state || this.state;
    const buildingStates = records(this.state.buildings);
    const lotStates = records(this.state.lots);
    this.blocks.forEach((block, id) => {
      const value = buildingStates.find((item) => String(item.id) === id) || {};
      this.syncPosition(block, value, 0.18);
      const green = Boolean(value.green || value.roof || value.rooftopGarden || value.features?.includes?.('green'));
      const solar = Boolean(value.energy || value.retrofit || value.efficient || value.solar || value.features?.includes?.('energy'));
      const cooling = Boolean(value.cooling || value.cooled || value.heatProtection || value.features?.includes?.('cooling'));
      block.value = value;
      block.green = green;
      block.solar = solar;
      block.cooling = cooling;
      const signature = `${green}/${solar}/${cooling}`;
      if (signature !== block.signature) {
        this.clearAdditions(block.additions);
        if (green) this.buildRoofGarden(block);
        if (solar) this.buildSolar(block);
        if (cooling) this.buildCooling(block);
        block.signature = signature;
      }
    });
    this.lots.forEach((lot, id) => {
      const value = lotStates.find((item) => String(item.id) === id) || {};
      this.syncPosition(lot, value, 0.19);
      const type = value.type || value.facility || null;
      lot.value = value;
      lot.type = type;
      if (String(type) !== lot.signature) {
        this.clearAdditions(lot.additions);
        lot.vacant.visible = !type;
        lot.marker.visible = !type;
        if (type === 'park') this.buildPark(lot);
        if (type === 'walk' || type === 'shade') this.buildWalk(lot);
        lot.signature = String(type);
      }
    });
    this.refreshMode();
    this.setSelected(this.selectedId);
  }

  syncPosition(record, value, groundY) {
    if (!Number.isFinite(value.x) || !Number.isFinite(value.z)) return;
    const rotation = Number.isFinite(value.rotation) ? value.rotation : 0;
    const scaleX = value.scaleX || 1, scaleZ = value.scaleZ || 1;
    const signature = `${value.x}/${value.z}/${rotation}/${scaleX}/${scaleZ}`;
    if (signature === record.positionSignature) return;
    record.positionSignature = signature;
    Object.assign(record.config, { x: value.x, z: value.z, rotation, scaleX, scaleZ });
    record.group.position.set(value.x, groundY, value.z);
    record.group.rotation.y = rotation;
    record.group.scale.set(scaleX, 1, scaleZ);
    this.modeSignature = null;
    this.selectionSignature = undefined;
    this.clearPreview();
  }

  removeTreesIn(parent) {
    this.trees = this.trees.filter((tree) => {
      let ancestor = tree.group;
      while (ancestor) { if (ancestor === parent) return false; ancestor = ancestor.parent; }
      return true;
    });
  }

  clearAdditions(group) {
    this.removeTreesIn(group);
    const sharedGeometries = new Set([this.boxGeometry, this.treeGeometry, this.trunkGeometry, this.sphereGeometry, this.cylinderGeometry]);
    const sharedMaterials = new Set(Object.values(this.mat));
    const geometries = new Set(), materials = new Set(), textures = new Set();
    group.traverse((object) => {
      // InstancedMesh owns a GPU matrix buffer even when its geometry is shared.
      if (object.isInstancedMesh) object.dispose();
      if (object.geometry && !sharedGeometries.has(object.geometry)) geometries.add(object.geometry);
      const list = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
      list.forEach((material) => {
        if (sharedMaterials.has(material)) return;
        materials.add(material);
        if (material.map) textures.add(material.map);
      });
    });
    geometries.forEach((geometry) => { geometry.dispose(); this.geometries.delete(geometry); });
    materials.forEach((material) => { material.dispose(); this.materials.delete(material); });
    textures.forEach((texture) => { texture.dispose(); this.textures.delete(texture); });
    group.clear();
  }

  served(block) {
    return [...this.lots.values()].some((lot) => {
      const radius = lot.type === 'park' ? 15 : lot.type === 'walk' || lot.type === 'shade' ? 11 : 0;
      return radius > 0 && Math.hypot(block.config.x - lot.config.x, block.config.z - lot.config.z) <= radius;
    });
  }

  setMode(mode = 'normal') {
    this.mode = ['normal', 'coverage', 'heat'].includes(mode) ? mode : 'normal';
    this.refreshMode();
  }

  refreshMode() {
    const signature = `${this.mode}|${this.state.effects?.heatShield || 0}|${[...this.blocks.values()].map((block) => `${block.positionSignature}/${block.green ? 1 : 0}`).join('|')}|${[...this.lots.values()].map((lot) => `${lot.positionSignature}/${lot.type || '-'}`).join('|')}`;
    if (signature === this.modeSignature) return;
    this.modeSignature = signature;
    this.clearGroup(this.coverageGroup);
    this.blocks.forEach((block) => {
      this.clearGroup(block.overlay);
      if (this.mode === 'normal') return;
      const covered = this.served(block);
      const hasPark = [...this.lots.values()].some((lot) => lot.type === 'park' &&
        Math.hypot(block.config.x - lot.config.x, block.config.z - lot.config.z) <= 15);
      const shield = clamp(this.state.effects?.heatShield || 0, 0, 0.35);
      const heatLoss = ((block.green ? 3 : 10) + (hasPark ? 2 : covered ? 4 : 8)) * (1 - shield);
      const positive = this.mode === 'coverage' ? covered : heatLoss <= 7;
      const heatColor = new THREE.Color('#55ab8a').lerp(new THREE.Color('#e4a071'), clamp((heatLoss - 5) / 13, 0, 1));
      const color = this.mode === 'heat' ? heatColor : positive ? '#46aa83' : '#d5af75';
      const geometry = new THREE.BoxGeometry(6.08, block.config.h - 0.9, 4.6);
      const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: positive ? 0.16 : 0.24, depthWrite: false });
      const overlay = new THREE.Mesh(geometry, material);
      overlay.position.y = block.config.h / 2 + 0.9;
      overlay.userData.temporary = true;
      block.overlay.add(overlay);
      const icon = this.label(this.mode === 'coverage' ? (positive ? '✓' : '·') : `${Math.round(heatLoss)}`, {
        width: 0.67, height: 0.67, fill: this.mode === 'heat' ? `#${heatColor.getHexString()}` : positive ? '#4b997b' : '#ce8d5c', color: '#ffffff', round: 42,
      });
      icon.position.set(1.55, block.config.h + 1.23, 0.3);
      block.overlay.add(icon);
    });
    if (this.mode === 'coverage') this.lots.forEach((lot) => {
      if (lot.type) this.radius(this.coverageGroup, lot.config.x, lot.config.z, lot.type === 'park' ? 15 : 11, '#4dba92', 0.08);
    });
    if (this.mode === 'heat') this.lots.forEach((lot) => {
      if (lot.type) this.radius(this.coverageGroup, lot.config.x, lot.config.z, lot.type === 'park' ? 15 : 11, '#60ad92', 0.045);
    });
  }

  radius(parent, x, z, radius, color = '#39aa85', opacity = 0.08) {
    const fillGeometry = new THREE.CircleGeometry(radius, 96);
    const fillMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide });
    const fill = new THREE.Mesh(fillGeometry, fillMat);
    fill.rotation.x = -Math.PI / 2;
    fill.position.set(x, 0.32, z);
    fill.userData.temporary = true;
    parent.add(fill);
    const ringGeometry = new THREE.RingGeometry(radius - 0.075, radius + 0.075, 96);
    const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: Math.min(0.72, opacity * 5 + 0.15), depthWrite: false, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeometry, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.345, z);
    ring.userData.temporary = true;
    parent.add(ring);
  }

  outline(parent, target, color = '#1b9e78') {
    const block = this.blocks.get(target.id);
    const height = block ? block.config.h + 0.52 : 0.6;
    const width = block ? 6.24 * (target.scaleX || 1) : 7.3;
    const depth = block ? 4.85 * (target.scaleZ || 1) : 5.84;
    const box = new THREE.BoxGeometry(width, height, depth);
    const edges = new THREE.EdgesGeometry(box);
    box.dispose();
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85, depthTest: true });
    const line = new THREE.LineSegments(edges, material);
    line.position.set(target.x, 0.27 + height / 2, target.z);
    line.rotation.y = target.rotation || 0;
    line.userData.temporary = true;
    parent.add(line);
    const planeGeometry = new THREE.ShapeGeometry(roundedRect(width + 0.55, depth + 0.55, 0.4));
    const planeMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.13, depthWrite: false, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.set(-Math.PI / 2, 0, target.rotation || 0);
    plane.position.set(target.x, 0.31, target.z);
    plane.userData.temporary = true;
    parent.add(plane);
  }

  setSelected(id) {
    const nextId = id == null ? null : String(id);
    if (nextId === this.selectionSignature) return;
    this.selectedId = nextId;
    this.selectionSignature = nextId;
    this.clearGroup(this.selectionGroup);
    const target = this.positionOf(this.selectedId);
    if (target) this.outline(this.selectionGroup, target, '#288f73');
  }

  preview(type, targetId, state) {
    if (state && state !== this.state) this.update(state);
    const target = this.positionOf(targetId);
    const name = String(type || '').toLowerCase();
    const publicType = name.includes('park') || name.includes('walk') || name.includes('shade') || name.includes('path');
    const buildingType = /green|roof|energy|retrofit|cooling/.test(name);
    if (!target || (publicType && !this.lots.has(target.id)) || (buildingType && !this.blocks.has(target.id))) { this.clearPreview(); return; }
    const signature = `${name}:${target.id}`;
    if (signature === this.previewSignature) return;
    this.clearPreview();
    this.previewSignature = signature;
    this.outline(this.previewGroup, target, '#ddac58');
    if (name.includes('park')) this.radius(this.previewGroup, target.x, target.z, 15, '#35ae88', 0.105);
    if (name.includes('walk') || name.includes('shade') || name.includes('path')) this.radius(this.previewGroup, target.x, target.z, 11, '#35ae88', 0.105);
  }

  clearPreview() { this.previewSignature = null; this.clearGroup(this.previewGroup); }

  clearGroup(group) {
    group.traverse((object) => {
      if (object.isSprite) {
        const texture = object.material?.map;
        texture?.dispose();
        object.material?.dispose();
        this.textures.delete(texture);
        this.materials.delete(object.material);
        return;
      }
      if (!object.userData.temporary) return;
      object.geometry?.dispose();
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
      else object.material?.dispose();
    });
    group.clear();
  }

  bindEvents() {
    const canvas = this.renderer.domElement;
    this.pointerDown = (event) => { this.downPoint = { x: event.clientX, y: event.clientY, moved: false, button: event.button }; };
    this.pointerMove = (event) => {
      if (this.downPoint && Math.hypot(event.clientX - this.downPoint.x, event.clientY - this.downPoint.y) > 5) this.downPoint.moved = true;
      const id = this.hitTest(event.clientX, event.clientY);
      canvas.style.cursor = this.downPoint?.moved ? 'grabbing' : id ? 'pointer' : 'grab';
      if (id !== this.hoverId) { this.hoverId = id; this.onHover?.(id); }
    };
    this.pointerUp = (event) => {
      const down = this.downPoint;
      this.downPoint = null;
      if (!down || down.moved || down.button > 0 || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) return;
      const id = this.hitTest(event.clientX, event.clientY);
      if (id) { this.setSelected(id); this.onSelect?.(id); }
    };
    this.pointerLeave = () => { this.hoverId = null; this.onHover?.(null); };
    this.pointerCancel = () => { this.downPoint = null; };
    canvas.addEventListener('pointerdown', this.pointerDown);
    canvas.addEventListener('pointermove', this.pointerMove);
    canvas.addEventListener('pointerup', this.pointerUp);
    canvas.addEventListener('pointerleave', this.pointerLeave);
    canvas.addEventListener('pointercancel', this.pointerCancel);
    canvas.style.cursor = 'grab';
  }

  hitTest(clientX, clientY) {
    const bounds = this.renderer.domElement.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return null;
    this.pointer.set((clientX - bounds.left) / bounds.width * 2 - 1, -(clientY - bounds.top) / bounds.height * 2 + 1);
    this.camera.updateMatrixWorld();
    this.scene.updateMatrixWorld();
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const labelHits = this.raycaster.intersectObjects(this.pickLabels.filter((label) => label.visible), false);
    if (labelHits.length) return labelHits[0].object.userData.id;
    const hits = this.raycaster.intersectObjects(this.pickMeshes, false);
    return hits[0]?.object.userData.id || null;
  }

  projectTarget(id) {
    const target = this.positionOf(id);
    if (!target) return null;
    const block = this.blocks.get(String(id));
    const lot = this.lots.get(String(id));
    const point = new THREE.Vector3(target.x, block ? block.config.h * 0.75 : 0.8, target.z);
    if (lot?.marker.visible) {
      lot.group.updateWorldMatrix(true, false);
      lot.marker.getWorldPosition(point);
    }
    this.camera.updateMatrixWorld();
    const bounds = this.renderer.domElement.getBoundingClientRect();
    const project = (vector) => {
      const projected = vector.clone().project(this.camera);
      return { x: bounds.left + (projected.x + 1) / 2 * bounds.width, y: bounds.top + (1 - projected.y) / 2 * bounds.height };
    };
    const centre = project(point);
    if (this.hitTest(centre.x, centre.y) === String(id)) return centre;
    for (const [dx, dz] of [[-1.5, 0], [0, 2.1], [-2.7, -2.1], [2.7, 2.1], [2.7, -2.1], [-2.7, 2.1]]) {
      const candidate = project(new THREE.Vector3(target.x + dx, point.y, target.z + dz));
      if (this.hitTest(candidate.x, candidate.y) === String(id)) return candidate;
    }
    return centre;
  }

  resize() {
    if (this.disposed) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    const aspect = width / height;
    const viewHeight = Math.max(45.5, 71 / aspect);
    this.camera.left = -viewHeight * aspect / 2;
    this.camera.right = viewHeight * aspect / 2;
    this.camera.top = viewHeight / 2;
    this.camera.bottom = -viewHeight / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  resetCamera() {
    const damping = this.controls.enableDamping;
    this.controls.enableDamping = false;
    this.controls.update();
    this.camera.zoom = 1;
    this.camera.position.set(39, 49, 62);
    this.controls.target.set(0, 0, 1.6);
    this.camera.updateProjectionMatrix();
    this.controls.update();
    this.controls.enableDamping = damping;
    this.controls.saveState();
  }

  zoom(delta) {
    this.camera.zoom = clamp(this.camera.zoom * Math.exp(delta * 0.2), this.controls.minZoom, this.controls.maxZoom);
    this.camera.updateProjectionMatrix();
  }

  route(distance, points) {
    const lengths = points.map((point, index) => {
      const next = points[(index + 1) % points.length];
      return Math.hypot(next[0] - point[0], next[1] - point[1]);
    });
    const total = lengths.reduce((sum, length) => sum + length, 0);
    let along = ((distance % total) + total) % total;
    for (let i = 0; i < points.length; i++) {
      if (along <= lengths[i]) {
        const from = points[i], to = points[(i + 1) % points.length], t = along / lengths[i];
        return { x: from[0] + (to[0] - from[0]) * t, z: from[1] + (to[1] - from[1]) * t, angle: Math.atan2(to[0] - from[0], to[1] - from[1]) };
      }
      along -= lengths[i];
    }
    return { x: points[0][0], z: points[0][1], angle: 0 };
  }

  animate() {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.animate);
    const elapsed = this.clock.getElapsedTime();
    this.controls.update();
    // Limit panning to the neighbourhood so a misplaced drag cannot lose the whole map.
    const oldX = this.controls.target.x, oldZ = this.controls.target.z;
    this.controls.target.x = clamp(oldX, -17, 17);
    this.controls.target.z = clamp(oldZ, -17, 17);
    this.controls.target.y = 0;
    this.camera.position.x += this.controls.target.x - oldX;
    this.camera.position.z += this.controls.target.z - oldZ;
    this.trees.forEach(({ crown, seed }) => { crown.rotation.z = Math.sin(elapsed * 0.83 + seed) * 0.015; });
    this.cars.forEach((car) => {
      const distance = elapsed * car.speed + car.offset;
      const t = (distance % this.roadCurve.getLength()) / this.roadCurve.getLength();
      const point = this.roadCurve.getPointAt(t), tangent = this.roadCurve.getTangentAt(t);
      car.group.position.set(point.x, 0.33, point.z);
      car.group.rotation.y = Math.atan2(tangent.x, tangent.z);
    });
    this.people.forEach((person) => {
      const curve = this.walkCurves[person.index % this.walkCurves.length], length = curve.getLength();
      const distance = (elapsed * person.speed + person.index * 5.7) % (length * 2);
      const returning = distance > length, t = (returning ? 2 * length - distance : distance) / length;
      const point = curve.getPointAt(t), tangent = curve.getTangentAt(t);
      person.group.position.set(point.x, 0.175, point.z);
      person.group.rotation.y = Math.atan2(tangent.x, tangent.z) + (returning ? Math.PI : 0);
      person.leftLeg.rotation.x = Math.sin(elapsed * 4 + person.index) * 0.28;
      person.rightLeg.rotation.x = -person.leftLeg.rotation.x;
    });
    this.waveMaterial.opacity = 0.2 + Math.sin(elapsed * 0.8) * 0.04;
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    this.controls.dispose();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.pointerDown);
    canvas.removeEventListener('pointermove', this.pointerMove);
    canvas.removeEventListener('pointerup', this.pointerUp);
    canvas.removeEventListener('pointerleave', this.pointerLeave);
    canvas.removeEventListener('pointercancel', this.pointerCancel);
    this.clearGroup(this.coverageGroup);
    this.clearGroup(this.selectionGroup);
    this.clearGroup(this.previewGroup);
    this.blocks.forEach((block) => this.clearGroup(block.overlay));
    this.scene.traverse((object) => { if (object.isInstancedMesh) object.dispose(); });
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.textures.forEach((texture) => texture.dispose());
    this.renderer.dispose();
    canvas.remove();
  }
}
