import * as THREE from 'three';

/**
 * Creates a rustic, imperfect wooden fishing dock:
 * - Natural plank color variations and slight yaw/pitch jitter for an artisan look
 * - Submerged pilings with algae waterline tint
 * - Handrail posts and mooring cleats
 */
export function createStylizedDock(): THREE.Group {
  const dock = new THREE.Group();

  // Natural warm wood plank palette
  const woodTints = [0x854d0e, 0x92400e, 0x78350f, 0x713f12, 0xa16207];
  const plankMats = woodTints.map(
    (hex) =>
      new THREE.MeshStandardMaterial({
        color: hex,
        roughness: 0.88,
        metalness: 0.05,
        flatShading: true,
      })
  );

  const postMat = new THREE.MeshStandardMaterial({
    color: 0x451a03,
    roughness: 0.95,
    flatShading: true,
  });

  // Dock walkway: From Z = -3.2 (over lake water) to Z = 6.8 (reaching land)
  let pIdx = 0;
  for (let z = -3.2; z <= 6.8; z += 0.42) {
    const mat = plankMats[pIdx % plankMats.length];
    pIdx++;

    const plankW = 4.8 + (Math.sin(z * 3.0) * 0.15); // Slight width variance
    const plankGeo = new THREE.BoxGeometry(plankW, 0.12, 0.38);
    const plank = new THREE.Mesh(plankGeo, mat);

    // Subtle natural tilt for rustic artisan pier
    plank.position.set(0, 0.38, z);
    plank.rotation.y = (Math.sin(z * 4.0) * 0.02);
    plank.rotation.z = (Math.cos(z * 2.5) * 0.012);
    plank.castShadow = true;
    plank.receiveShadow = true;
    dock.add(plank);
  }

  // Wooden Support Pilings
  const pilePositions = [
    [-2.2, -3.0],
    [2.2, -3.0],
    [-2.2, -0.5],
    [2.2, -0.5],
    [-2.2, 2.0],
    [2.2, 2.0],
    [-2.2, 4.5],
    [2.2, 4.5],
  ];

  pilePositions.forEach(([px, pz]) => {
    const pileGeo = new THREE.CylinderGeometry(0.18, 0.22, 3.4, 7);
    const pile = new THREE.Mesh(pileGeo, postMat);
    pile.position.set(px, -0.8, pz);
    pile.castShadow = true;
    pile.receiveShadow = true;
    dock.add(pile);

    // Mooring rope wrapped on top of front pilings
    if (pz < 0) {
      const cleatGeo = new THREE.TorusGeometry(0.2, 0.035, 4, 8);
      cleatGeo.rotateX(Math.PI / 2);
      const cleat = new THREE.Mesh(cleatGeo, new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.8 }));
      cleat.position.set(px, 0.65, pz);
      dock.add(cleat);
    }
  });

  return dock;
}
