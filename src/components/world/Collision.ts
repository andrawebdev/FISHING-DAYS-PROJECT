import { getTerrainHeight } from './Terrain';

export interface Obstacle {
  x: number;
  z: number;
  radius: number;
  height?: number;
}

// Fixed world obstacles: rocks, cabin, shed, trees
export const WORLD_OBSTACLES: Obstacle[] = [
  // Cabin footprint (stone deck & walls at x=0, z=13)
  { x: 0, z: 13, radius: 4.2, height: 4.5 },
  // Boathouse shed at x=9.5, z=11.5
  { x: 9.5, z: 11.5, radius: 3.0, height: 3.8 },

  // Large rocks near dock
  { x: -4.5, z: -1.2, radius: 1.0, height: 0.9 },
  { x: 4.8, z: -0.5, radius: 1.1, height: 0.9 },
  { x: -5.2, z: 1.5, radius: 0.9, height: 0.8 },
  { x: 5.6, z: 2.2, radius: 0.9, height: 0.8 },

  // Crate stack & barrel near dock
  { x: -2.2, z: 4.2, radius: 0.8, height: 1.0 },
  { x: 2.4, z: 3.8, radius: 0.6, height: 0.9 },

  // Big shoreline rocks
  { x: -12, z: -8, radius: 1.6, height: 1.8 },
  { x: -18, z: -15, radius: 2.3, height: 2.2 },
  { x: 14, z: -10, radius: 1.8, height: 2.0 },
  { x: 19, z: -20, radius: 2.5, height: 2.4 },

  // Trees near clearing
  { x: -10, z: 12, radius: 1.1, height: 8.0 },
  { x: -14, z: 18, radius: 1.2, height: 8.0 },
  { x: 8, z: 20, radius: 1.1, height: 8.0 },
  { x: 12, z: 8, radius: 1.0, height: 8.0 },
];

export interface GroundInfo {
  y: number;
  onDock: boolean;
  canFish: boolean;
}

/**
 * Computes exact ground level, dock surface, and fishing feasibility.
 * Dock extends from x in [-2.4, 2.4], z in [-3.2, 6.8] at y = 0.44.
 */
export function getGroundInfo(x: number, z: number): GroundInfo {
  const onDock = x >= -2.4 && x <= 2.4 && z >= -3.2 && z <= 6.8;

  if (onDock) {
    // Top of wooden plank surface
    const dockSurfaceY = 0.44;
    // On the forward half of the dock (or front edge), player is in prime fishing stance
    const canFish = z <= 2.0;
    return { y: dockSurfaceY, onDock: true, canFish };
  }

  const terrainY = getTerrainHeight(x, z);

  // Shoreline check: if standing on land near water (water is at z < 2, height < 0.6)
  const isNearShore = terrainY >= 0.15 && terrainY <= 0.85 && z <= 5.0 && Math.hypot(x, z + 10) < 26;

  return {
    y: Math.max(0.2, terrainY), // Prevent sinking under water while walking on land
    onDock: false,
    canFish: isNearShore,
  };
}

/**
 * Resolves player collision with world bounds, water edges, and solid obstacles.
 * Prevents object clipping, falling off dock edges into water, or stepping into deep water.
 * Returns the corrected [nextX, nextZ].
 */
export function resolvePlayerCollision(
  currX: number,
  currZ: number,
  targetX: number,
  targetZ: number,
  playerRadius = 0.35
): [number, number] {
  let nx = targetX;
  let nz = targetZ;

  // 1. World exploration boundary (keep within village & lake shore area)
  const maxBoundary = 34.0;
  nx = Math.max(-maxBoundary, Math.min(maxBoundary, nx));
  nz = Math.max(-3.0, Math.min(25.0, nz));

  // 2. Dock vs Shoreline constraints
  const dockMinX = -2.2 + playerRadius;
  const dockMaxX = 2.2 - playerRadius;
  const dockMinZ = -3.0 + playerRadius;
  const dockTransitionZ = 6.2;

  // If entering or standing on dock forward section (z < 6.2)
  if (nz < dockTransitionZ && Math.abs(currX) <= 2.3) {
    // Keep strictly on dock planks
    nx = Math.max(dockMinX, Math.min(dockMaxX, nx));
    nz = Math.max(dockMinZ, Math.min(dockTransitionZ, nz));
  } else if (nz < 1.2 && (nx < dockMinX || nx > dockMaxX)) {
    // On land approaching lake shore: don't step into deep water basin
    const tHeight = getTerrainHeight(nx, nz);
    if (tHeight < 0.2) {
      // Push back to safe shoreline elevation
      nz = Math.max(1.2, nz);
    }
  }

  // 3. Obstacle collision resolution
  for (const obs of WORLD_OBSTACLES) {
    const dx = nx - obs.x;
    const dz = nz - obs.z;
    const dist = Math.hypot(dx, dz);
    const minDist = obs.radius + playerRadius;

    if (dist < minDist && dist > 0.0001) {
      // Push out radially
      const push = (minDist - dist) / dist;
      nx += dx * push;
      nz += dz * push;
    }
  }

  // 4. Re-enforce dock constraints if pushed near dock water
  if (nz < dockTransitionZ && Math.abs(nx) <= 2.3) {
    nx = Math.max(dockMinX, Math.min(dockMaxX, nx));
    nz = Math.max(dockMinZ, Math.min(dockTransitionZ, nz));
  }

  return [nx, nz];
}
