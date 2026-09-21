import * as THREE from 'three';
import { getTerrainHeight } from './Terrain';

/**
 * Creates instanced/clustered vegetation and props:
 * - Stylized grass tufts & wild lake flowers
 * - Shoreline reeds and cattails with brown heads
 * - Varied stylized low-poly rocks (river stones, shoreline boulders, mossy rocks)
 * - Lake village props: wooden dock crates, fishing barrels, lanterns, mooring posts
 */
export class EnvironmentProps {
  public group: THREE.Group;
  private reeds: THREE.Mesh[] = [];
  private grassTufts: THREE.Group[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.spawnRocks();
    this.spawnReeds();
    this.spawnFlowersAndGrass();
    this.spawnVillageClutter();
  }

  /**
   * Stylized rocks with varied geometry (dodecahedrons with noise deform), scales, and moss tints
   */
  private spawnRocks() {
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x71717a,
      roughness: 0.92,
      metalness: 0.05,
      flatShading: true,
    });
    const mossRockMat = new THREE.MeshStandardMaterial({
      color: 0x526647, // Moss-tinted boulder
      roughness: 0.95,
      metalness: 0.02,
      flatShading: true,
    });

    const rockLocations = [
      // Along shoreline near dock
      { x: -4.5, z: -1.2, scale: 0.85, moss: true },
      { x: -5.2, z: 1.5, scale: 0.6, moss: false },
      { x: 4.8, z: -0.5, scale: 0.9, moss: true },
      { x: 5.6, z: 2.2, scale: 0.7, moss: false },
      { x: -3.8, z: 5.8, scale: 0.5, moss: false },
      { x: 4.2, z: 6.2, scale: 0.6, moss: false },

      // Around lake perimeter
      { x: -12, z: -8, scale: 1.4, moss: true },
      { x: -18, z: -15, scale: 2.1, moss: true },
      { x: -15, z: -28, scale: 1.8, moss: false },
      { x: 14, z: -10, scale: 1.6, moss: true },
      { x: 19, z: -20, scale: 2.3, moss: false },
      { x: 16, z: -32, scale: 1.5, moss: true },

      // In the shallow water / protruding islands
      { x: -8, z: -18, scale: 1.2, moss: true },
      { x: 9, z: -16, scale: 1.1, moss: true },
      { x: 0, z: -38, scale: 2.5, moss: true },

      // Near cabin
      { x: -5.2, z: 9.5, scale: 0.7, moss: false },
      { x: 6.5, z: 10.2, scale: 0.9, moss: true },
      { x: -2.8, z: 15.0, scale: 0.5, moss: false },
    ];

    rockLocations.forEach((loc, idx) => {
      const y = getTerrainHeight(loc.x, loc.z);
      const geo = new THREE.DodecahedronGeometry(loc.scale * 0.7, 0);

      // Deform slightly for natural facets
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);
        const vz = pos.getZ(i);
        const factor = 1.0 + (Math.sin(vx * 4.0 + idx) * 0.12 + Math.cos(vz * 4.0) * 0.1);
        pos.setXYZ(i, vx * factor, vy * (0.8 + 0.3 * factor), vz * factor);
      }
      geo.computeVertexNormals();

      const mat = loc.moss ? mossRockMat : rockMat;
      const rock = new THREE.Mesh(geo, mat);
      rock.position.set(loc.x, Math.max(-0.2, y + loc.scale * 0.2), loc.z);
      rock.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.group.add(rock);
    });
  }

  /**
   * Reeds and cattails clustered around wet shoreline
   */
  private spawnReeds() {
    const reedStemMat = new THREE.MeshStandardMaterial({
      color: 0x4d7c3f,
      roughness: 0.6,
      flatShading: true,
    });
    const cattailHeadMat = new THREE.MeshStandardMaterial({
      color: 0x452311,
      roughness: 0.8,
      flatShading: true,
    });

    const reedClusters = [
      { cx: -5.5, cz: -3.5, count: 12 },
      { cx: 5.5, cz: -3.2, count: 12 },
      { cx: -9.5, cz: -7.5, count: 16 },
      { cx: 8.5, cz: -8.0, count: 14 },
      { cx: -13.0, cz: -14.0, count: 18 },
    ];

    reedClusters.forEach((cluster) => {
      for (let i = 0; i < cluster.count; i++) {
        const rx = cluster.cx + (Math.random() - 0.5) * 2.4;
        const rz = cluster.cz + (Math.random() - 0.5) * 2.4;
        const ry = getTerrainHeight(rx, rz);

        const reedGroup = new THREE.Group();
        const stemHeight = 1.4 + Math.random() * 0.8;
        const stemGeo = new THREE.CylinderGeometry(0.02, 0.03, stemHeight, 5);
        stemGeo.translate(0, stemHeight / 2, 0);
        const stem = new THREE.Mesh(stemGeo, reedStemMat);
        reedGroup.add(stem);

        // Brown cattail sausage head on top
        if (Math.random() > 0.3) {
          const headGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 6);
          const head = new THREE.Mesh(headGeo, cattailHeadMat);
          head.position.y = stemHeight - 0.2;
          reedGroup.add(head);
        }

        reedGroup.position.set(rx, Math.max(-0.2, ry), rz);
        reedGroup.rotation.y = Math.random() * Math.PI * 2;
        reedGroup.rotation.z = (Math.random() - 0.5) * 0.15;
        this.group.add(reedGroup);
        this.reeds.push(stem);
      }
    });
  }

  /**
   * Wildflowers and grass tufts across the land
   */
  private spawnFlowersAndGrass() {
    const flowerColors = [0xf43f5e, 0xfacc15, 0x60a5fa, 0xf8fafc, 0xc084fc];
    const flowerMats = flowerColors.map(
      (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, flatShading: true })
    );
    const grassBladeMat = new THREE.MeshStandardMaterial({
      color: 0x5ba848,
      roughness: 0.8,
      flatShading: true,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < 45; i++) {
      const gx = (Math.random() - 0.5) * 35;
      const gz = Math.random() * 22; // In land area
      const gy = getTerrainHeight(gx, gz);
      if (gy < 0.2) continue; // Don't spawn underwater
      if (Math.abs(gx) < 1.8 && gz < 12) continue; // Don't block center path

      const tuft = new THREE.Group();
      // 3 crossing blades
      for (let b = 0; b < 3; b++) {
        const bladeGeo = new THREE.PlaneGeometry(0.12, 0.55);
        bladeGeo.translate(0, 0.27, 0);
        const blade = new THREE.Mesh(bladeGeo, grassBladeMat);
        blade.rotation.y = (b / 3) * Math.PI;
        blade.rotation.x = (Math.random() - 0.5) * 0.3;
        tuft.add(blade);
      }

      // Small flower head
      if (Math.random() > 0.4) {
        const fMat = flowerMats[Math.floor(Math.random() * flowerMats.length)];
        const flGeo = new THREE.DodecahedronGeometry(0.08, 0);
        const fl = new THREE.Mesh(flGeo, fMat);
        fl.position.y = 0.52;
        tuft.add(fl);
      }

      tuft.position.set(gx, gy, gz);
      this.group.add(tuft);
      this.grassTufts.push(tuft);
    }
  }

  /**
   * Village clutter: wooden crates, barrels, lifebuoy, dock rope coils
   */
  private spawnVillageClutter() {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.85, flatShading: true });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.4, metalness: 0.8 });

    // Wooden Crates stacked near dock
    const crateGeo = new THREE.BoxGeometry(0.65, 0.65, 0.65);
    const crate1 = new THREE.Mesh(crateGeo, woodMat);
    crate1.position.set(-2.2, 0.65, 4.2);
    crate1.rotation.y = 0.25;
    crate1.castShadow = true;
    this.group.add(crate1);

    const crate2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), woodMat);
    crate2.position.set(-2.1, 1.25, 4.3);
    crate2.rotation.y = -0.15;
    crate2.castShadow = true;
    this.group.add(crate2);

    // Barrel near dock edge
    const barrelGroup = new THREE.Group();
    const barrelBody = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.8, 10), woodMat);
    barrelBody.position.y = 0.4;
    barrelBody.castShadow = true;
    barrelGroup.add(barrelBody);

    // Metal barrel bands
    const bandGeo = new THREE.TorusGeometry(0.35, 0.015, 4, 12);
    bandGeo.rotateX(Math.PI / 2);
    const bandTop = new THREE.Mesh(bandGeo, ironMat);
    bandTop.position.y = 0.65;
    barrelGroup.add(bandTop);
    const bandBot = new THREE.Mesh(bandGeo, ironMat);
    bandBot.position.y = 0.15;
    barrelGroup.add(bandBot);

    barrelGroup.position.set(2.4, 0.35, 3.8);
    this.group.add(barrelGroup);

    // Coiled dock rope on wooden plank
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xd4b886, roughness: 0.95 });
    const ropeGeo = new THREE.TorusGeometry(0.24, 0.05, 8, 16);
    ropeGeo.rotateX(Math.PI / 2);
    const rope = new THREE.Mesh(ropeGeo, ropeMat);
    rope.position.set(2.2, 0.42, 1.0);
    this.group.add(rope);
  }

  /**
   * Animate subtle wind sway across reeds and grass
   */
  public update(time: number) {
    const wind = Math.sin(time * 2.0) * 0.08;
    this.reeds.forEach((reed, idx) => {
      reed.rotation.z = wind + Math.sin(time * 2.5 + idx) * 0.04;
    });
    this.grassTufts.forEach((tuft, idx) => {
      tuft.rotation.z = wind * 0.5 + Math.cos(time * 2.0 + idx) * 0.03;
    });
  }
}
