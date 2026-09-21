import * as THREE from 'three';
import { getTerrainHeight } from './Terrain';

/**
 * Creates distinct stylized 3D trees:
 * 1. Pine / Evergreen (layered tapered cones with varied scale and slight offsets)
 * 2. Birch / Deciduous (slender white/black notch trunk with faceted foliage cloud clusters)
 * 3. Willow / Lake Shrub (drooping canopy near the water's edge)
 */
export function createTreeForest(): THREE.Group {
  const forest = new THREE.Group();

  // Materials
  const pineTrunkMat = new THREE.MeshStandardMaterial({
    color: 0x4a2e18,
    roughness: 0.9,
    flatShading: true,
  });
  const pineFoliageMat1 = new THREE.MeshStandardMaterial({
    color: 0x1f4728, // Deep pine green
    roughness: 0.75,
    flatShading: true,
  });
  const pineFoliageMat2 = new THREE.MeshStandardMaterial({
    color: 0x2e6138, // Fresh pine green
    roughness: 0.75,
    flatShading: true,
  });

  const birchTrunkMat = new THREE.MeshStandardMaterial({
    color: 0xeeebe8,
    roughness: 0.85,
    flatShading: true,
  });
  const deciduousFoliageMat = new THREE.MeshStandardMaterial({
    color: 0x488339, // Vibrant lush canopy
    roughness: 0.7,
    flatShading: true,
  });
  const goldenDeciduousFoliageMat = new THREE.MeshStandardMaterial({
    color: 0x769b36, // Olive-tinted deciduous
    roughness: 0.7,
    flatShading: true,
  });

  // Helper to construct a stylized Pine tree
  function buildPineTree(scale: number, variant: number): THREE.Group {
    const tree = new THREE.Group();

    // Trunk
    const trunkH = 2.0 * scale;
    const trunkGeo = new THREE.CylinderGeometry(0.18 * scale, 0.32 * scale, trunkH, 6);
    const trunk = new THREE.Mesh(trunkGeo, pineTrunkMat);
    trunk.position.y = trunkH / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // 3 or 4 Foliage tiers
    const tiers = 3 + (variant % 2);
    const folMat = variant % 2 === 0 ? pineFoliageMat1 : pineFoliageMat2;
    for (let t = 0; t < tiers; t++) {
      const tierR = (1.6 - t * 0.32) * scale;
      const tierH = (1.8 - t * 0.25) * scale;
      const coneGeo = new THREE.ConeGeometry(tierR, tierH, 6);
      const cone = new THREE.Mesh(coneGeo, folMat);
      cone.position.y = trunkH * 0.7 + t * (1.1 * scale);
      cone.rotation.y = (t * 0.6) + variant;
      cone.castShadow = true;
      cone.receiveShadow = true;
      tree.add(cone);
    }

    return tree;
  }

  // Helper to construct a stylized Birch / Deciduous tree
  function buildBirchTree(scale: number): THREE.Group {
    const tree = new THREE.Group();

    // Slender curved trunk
    const trunkH = 3.2 * scale;
    const trunkGeo = new THREE.CylinderGeometry(0.14 * scale, 0.24 * scale, trunkH, 6);
    const trunk = new THREE.Mesh(trunkGeo, birchTrunkMat);
    trunk.position.y = trunkH / 2;
    trunk.rotation.z = (Math.random() - 0.5) * 0.12;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // Foliage clusters (low-poly icosahedrons clustered organically)
    const clusterMat = Math.random() > 0.5 ? deciduousFoliageMat : goldenDeciduousFoliageMat;
    const clusterPositions = [
      [0, trunkH + 0.4 * scale, 0, 1.4 * scale],
      [-0.6 * scale, trunkH - 0.2 * scale, 0.4 * scale, 1.0 * scale],
      [0.7 * scale, trunkH - 0.3 * scale, -0.3 * scale, 1.1 * scale],
      [0.2 * scale, trunkH + 0.9 * scale, -0.2 * scale, 0.9 * scale],
    ];

    clusterPositions.forEach(([cx, cy, cz, cr]) => {
      const clusterGeo = new THREE.DodecahedronGeometry(cr, 0);
      const cluster = new THREE.Mesh(clusterGeo, clusterMat);
      cluster.position.set(cx, cy, cz);
      cluster.rotation.set(Math.random(), Math.random(), Math.random());
      cluster.castShadow = true;
      cluster.receiveShadow = true;
      tree.add(cluster);
    });

    return tree;
  }

  // Natural tree placements encircling the lake and framing the clearing
  const treeCoords = [
    // Left shoreline ridge
    { x: -16, z: 4, type: 'birch', scale: 1.1 },
    { x: -20, z: -2, type: 'pine', scale: 1.2 },
    { x: -25, z: -10, type: 'pine', scale: 1.4 },
    { x: -22, z: -18, type: 'birch', scale: 1.0 },
    { x: -28, z: -25, type: 'pine', scale: 1.3 },
    { x: -24, z: -35, type: 'pine', scale: 1.5 },
    { x: -32, z: -42, type: 'birch', scale: 1.2 },

    // Right shoreline ridge
    { x: 18, z: 2, type: 'birch', scale: 1.0 },
    { x: 22, z: -6, type: 'pine', scale: 1.3 },
    { x: 26, z: -14, type: 'birch', scale: 1.2 },
    { x: 24, z: -24, type: 'pine', scale: 1.4 },
    { x: 29, z: -32, type: 'pine', scale: 1.6 },
    { x: 22, z: -40, type: 'birch', scale: 1.1 },

    // Distant back shoreline (framing horizon)
    { x: -14, z: -48, type: 'pine', scale: 1.3 },
    { x: -6, z: -52, type: 'pine', scale: 1.5 },
    { x: 4, z: -50, type: 'pine', scale: 1.4 },
    { x: 12, z: -46, type: 'birch', scale: 1.2 },

    // Behind Cabin & Cleared path area (creating cozy backdrop)
    { x: -10, z: 12, type: 'birch', scale: 1.1 },
    { x: -14, z: 18, type: 'pine', scale: 1.3 },
    { x: -6, z: 22, type: 'pine', scale: 1.4 },
    { x: 8, z: 20, type: 'birch', scale: 1.2 },
    { x: 14, z: 14, type: 'pine', scale: 1.2 },
    { x: 12, z: 8, type: 'birch', scale: 0.95 },
  ];

  treeCoords.forEach((item, idx) => {
    const y = getTerrainHeight(item.x, item.z);
    if (y < 0.2) return; // Don't spawn trees underwater

    const tree = item.type === 'pine' ? buildPineTree(item.scale, idx) : buildBirchTree(item.scale);
    tree.position.set(item.x, y - 0.1, item.z);
    tree.rotation.y = Math.random() * Math.PI * 2;
    forest.add(tree);
  });

  return forest;
}
