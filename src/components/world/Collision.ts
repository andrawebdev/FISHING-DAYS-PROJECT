import { getTerrainHeight } from './Terrain';

export interface Obstacle {
  x: number;
  z: number;
  radius: number;
}

// Fixed world obstacles: rocks, cabin, shed, trees
export const WORLD_OBSTACLES: Obstacle[] = [
  // Cabin footprint (stone deck & walls at x=0, z=13)
  { x: 0, z: 13, radius: 3.8 },
  // Boathouse shed at x=9.5, z=11.5
  { x: 9.5, z: 11.5, radius: 2.8 },

  // Large rocks near dock
  { x: -4.5, z: -1.2, radius: 1.0 },
  { x: 4.8, z: -0.5, radius: 1.1 },
  { x: -5.2, z: 1.5, radius: 0.9 },
  { x: 5.6, z: 2.2, radius: 0.9 },

  // Crate stack & barrel near dock
  { x: -2.2, z: 4.2, radius: 0.8 },
  { x: 2.4, z: 3.8, radius: 0.6 },

  // Big shoreline rocks
  { x: -12, z: -8, radius: 1.6 },
  { x: -18, z: -15, radius: 2.3 },
  { x: 14, z: -10, radius: 1.8 },
  { x: 19, z: -20, radius: 2.5 },

  // Trees near clearing
  { x: -10, z: 12, radius: 1.1 },
  { x: -14, z: 18, radius: 1.2 },
  { x: 8, z: 20, radius: 1.1 },
  { x: 12, z: 8, radius: 1.0 },
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
 * Resolves player collision with world bounds, water edges (when not on dock), and solid props.
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
  const maxBoundary = 36.0;
  nx = Math.max(-maxBoundary, Math.min(maxBoundary, nx));
  nz = Math.max(-4.0, Math.min(26.0, nz)); // Don't walk into open deep water unless on dock

  // 2. Dock vs Water check:
  // If moving into deep water (z < -0.2), must be strictly on dock walkway
  if (nz < -0.2) {
    const dockMinX = -2.2 + playerRadius;
    const dockMaxX = 2.2 - playerRadius;
    const dockMinZ = -3.0 + playerRadius;

    // Constrain to dock bounds
    nx = Math.max(dockMinX, Math.min(dockMaxX, nx));
    nz = Math.max(dockMinZ, Math.min(6.8, nz));
  }

  // 3. Obstacle avoidance
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

  return [nx, nz];
}
