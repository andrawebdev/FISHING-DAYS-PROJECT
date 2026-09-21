import * as THREE from 'three';

// Fast procedural noise approximation for terrain elevation and shorelines
function snoise(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number): number {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;
  // Cubic Hermite curve
  const ux = fx * fx * (3.0 - 2.0 * fx);
  const uy = fy * fy * (3.0 - 2.0 * fy);

  const a = snoise(i, j);
  const b = snoise(i + 1, j);
  const c = snoise(i, j + 1);
  const d = snoise(i + 1, j + 1);

  return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
}

export function fbm(x: number, y: number, octaves = 3): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1.0;
  for (let o = 0; o < octaves; o++) {
    val += amp * smoothNoise(x * freq, y * freq);
    freq *= 2.0;
    amp *= 0.5;
  }
  return val;
}

/**
 * Returns height for any world X, Z position.
 * Lake basin is situated between Z = -60 and Z = 2, with center roughly at X=0, Z=-25.
 * Dock is at X=0, Z=0 to Z=6.
 * Village/cabin is at X=0..12, Z=8..24.
 */
export function getTerrainHeight(x: number, z: number): number {
  // Distance from lake center
  const lkX = x * 0.75;
  const lkZ = (z + 24) * 0.9;
  const lakeDist = Math.sqrt(lkX * lkX + lkZ * lkZ);

  // Shoreline threshold
  const lakeRadius = 24.0 + fbm(x * 0.08, z * 0.08) * 8.0;

  // Elevation calculation
  if (lakeDist < lakeRadius) {
    // Water basin: slopes smoothly downward into the water
    const depthFactor = Math.max(0, 1.0 - lakeDist / lakeRadius);
    const depth = -0.4 - depthFactor * 4.5;
    return depth;
  } else {
    // Land: gentle rising banks, hills, and surrounding landscape
    const bankDist = lakeDist - lakeRadius;
    const baseElevation = Math.min(6.5, Math.pow(bankDist * 0.14, 1.15));
    const hillNoise = fbm(x * 0.04, z * 0.04, 3) * 4.5;
    const detailNoise = fbm(x * 0.12, z * 0.12, 2) * 0.8;

    // Flatten specifically around dock & cabin clearing
    const dockDist = Math.hypot(x, z - 3);
    const cabinDist = Math.hypot(x - 2, z - 12);
    let flattenFactor = 1.0;
    if (dockDist < 6.0) {
      flattenFactor = Math.min(flattenFactor, dockDist / 6.0);
    }
    if (cabinDist < 8.0) {
      flattenFactor = Math.min(flattenFactor, cabinDist / 8.0);
    }

    const rawHeight = 0.2 + (baseElevation + hillNoise + detailNoise) * (0.35 + 0.65 * flattenFactor);
    // Near dock/cabin, clamp to a clean comfortable surface for walking
    if (dockDist < 4.0) return 0.28;
    if (cabinDist < 6.0) return 0.35;
    return rawHeight;
  }
}

/**
 * Creates the stylized terrain mesh with vertex colors for natural material transitions
 * (Water shoreline wet sand/mud -> Dirt path -> Lush grass -> Darker forest grass -> Rock outcrops).
 */
export function createStylizedTerrain(): THREE.Mesh {
  const width = 160;
  const depth = 160;
  const segs = 120;
  const geo = new THREE.PlaneGeometry(width, depth, segs, segs);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  // Stylized color palette
  const colLushGrass = new THREE.Color(0x3e7a3e);    // Vibrant warm indie green
  const colDarkGrass = new THREE.Color(0x27522d);    // Deep forest green
  const colDirtPath  = new THREE.Color(0x9a7b56);    // Warm sandy dirt
  const colWetMud    = new THREE.Color(0x54402a);    // Moist shoreline sediment
  const colRock      = new THREE.Color(0x6b7280);    // Stylized cool gray stone
  const tempCol      = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = getTerrainHeight(x, z);
    pos.setY(i, y);

    // Color blending logic based on height, distance from path, and procedural noise
    const noiseVal = fbm(x * 0.1, z * 0.1);

    // Path leading from cabin (0, 10) to dock (0, 0)
    const distToPath = Math.abs(x + Math.sin(z * 0.3) * 0.8);
    const isPath = z >= -1 && z <= 18 && distToPath < 1.8;

    if (y < 0.05) {
      // Shoreline wet sand/mud
      tempCol.copy(colWetMud).lerp(colDirtPath, Math.min(1, (y + 1.0) / 1.05));
    } else if (isPath && y < 1.5) {
      // Worn foot path to the dock
      const pathEdge = distToPath / 1.8;
      tempCol.copy(colDirtPath).lerp(colLushGrass, pathEdge * 0.7);
    } else if (y > 4.5) {
      // High hill rock outcrops
      tempCol.copy(colDarkGrass).lerp(colRock, Math.min(1, (y - 4.5) / 2.0));
    } else {
      // Grass variation
      const blend = (noiseVal + 0.5) * 0.5;
      tempCol.copy(colLushGrass).lerp(colDarkGrass, blend);
      // Subtle highlights
      if (noiseVal > 0.45) {
        tempCol.offsetHSL(0.02, 0.05, 0.03);
      }
    }

    colors[i * 3] = tempCol.r;
    colors[i * 3 + 1] = tempCol.g;
    colors[i * 3 + 2] = tempCol.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.88,
    metalness: 0.05,
    flatShading: true, // Stylized low-poly / mid-poly faceted look that catches sunlight beautifully!
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  return mesh;
}
