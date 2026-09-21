import * as THREE from 'three';

/**
 * Creates layered mountain ridges with atmospheric perspective and rolling silhouettes
 */
export function createMountainHorizon(): THREE.Group {
  const group = new THREE.Group();

  // Layer 1: Mid-distance hills (darker slate green/pine silhouette)
  const midMat = new THREE.MeshStandardMaterial({
    color: 0x2b4539,
    roughness: 0.95,
    flatShading: true,
  });

  // Layer 2: Far background alpine mountains (cool mist slate blue)
  const farMat = new THREE.MeshStandardMaterial({
    color: 0x3d506d,
    roughness: 0.9,
    flatShading: true,
  });

  // Layer 3: Ultra far mountain silhouettes with snowy caps
  const distantMat = new THREE.MeshStandardMaterial({
    color: 0x5a6c85,
    roughness: 0.85,
    flatShading: true,
  });
  const snowCapMat = new THREE.MeshStandardMaterial({
    color: 0xe0e7ff,
    roughness: 0.6,
    flatShading: true,
  });

  // Helper to generate a faceted mountain peak
  function addPeak(x: number, y: number, z: number, radius: number, height: number, mat: THREE.Material, hasSnow = false) {
    const geo = new THREE.ConeGeometry(radius, height, 7);
    const mtn = new THREE.Mesh(geo, mat);
    mtn.position.set(x, y + height / 2, z);
    mtn.rotation.y = (x * 0.1) % (Math.PI * 2);
    group.add(mtn);

    if (hasSnow) {
      const snowH = height * 0.28;
      const snowR = radius * 0.32;
      const snowGeo = new THREE.ConeGeometry(snowR, snowH, 7);
      const snow = new THREE.Mesh(snowGeo, snowCapMat);
      snow.position.set(x, y + height - snowH / 2 + 0.1, z);
      snow.rotation.y = mtn.rotation.y;
      group.add(snow);
    }
  }

  // Mid-distance hills surrounding the lake back
  for (let i = -6; i <= 6; i++) {
    const px = i * 16 + (Math.sin(i * 1.5) * 4);
    const pz = -65 - Math.abs(i) * 3;
    const r = 16 + (Math.cos(i) * 3);
    const h = 18 + (Math.sin(i * 2) * 5);
    addPeak(px, -2, pz, r, h, midMat);
  }

  // Far majestic alpine ridge
  for (let i = -7; i <= 7; i++) {
    const px = i * 22 + (Math.cos(i * 2.2) * 6);
    const pz = -105 - Math.abs(i) * 5;
    const r = 24 + (Math.sin(i) * 5);
    const h = 38 + (Math.cos(i * 1.8) * 9);
    addPeak(px, -4, pz, r, h, farMat, true);
  }

  // Ultra-distant horizon giants
  for (let i = -5; i <= 5; i++) {
    const px = i * 36;
    const pz = -160;
    const r = 42;
    const h = 58 + Math.sin(i * 3) * 12;
    addPeak(px, -6, pz, r, h, distantMat, true);
  }

  return group;
}

/**
 * Creates soft stylized fluffy clouds drifting across the sky
 */
export class StylizedSkyDome {
  public mesh: THREE.Mesh;
  public clouds: THREE.Group;
  private cloudMats: THREE.MeshStandardMaterial[] = [];

  constructor() {
    // Gradient sky sphere
    const skyGeo = new THREE.SphereGeometry(260, 24, 24);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      side: THREE.BackSide,
    });
    this.mesh = new THREE.Mesh(skyGeo, skyMat);

    // Procedural low-poly fluffy cloud clusters
    this.clouds = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      flatShading: true,
    });
    this.cloudMats.push(cloudMat);

    // Spawn 7 cloud puffs at varied heights
    for (let c = 0; c < 7; c++) {
      const cloudGroup = new THREE.Group();
      const puffCount = 4 + Math.floor(Math.random() * 3);
      for (let p = 0; p < puffCount; p++) {
        const puffGeo = new THREE.DodecahedronGeometry(3.5 + Math.random() * 2.5, 0);
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set(
          (p - puffCount / 2) * 3.5,
          (Math.random() - 0.5) * 1.8,
          (Math.random() - 0.5) * 2.5
        );
        cloudGroup.add(puff);
      }

      cloudGroup.position.set(
        (c - 3.5) * 35 + (Math.random() - 0.5) * 15,
        45 + Math.random() * 20,
        -70 - Math.random() * 50
      );
      this.clouds.add(cloudGroup);
    }
  }

  public update(delta: number) {
    // Gently drift clouds along X axis
    this.clouds.children.forEach((cloud) => {
      cloud.position.x += delta * 1.2;
      if (cloud.position.x > 120) {
        cloud.position.x = -120;
      }
    });
  }
}
