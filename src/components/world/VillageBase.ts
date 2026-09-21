import * as THREE from 'three';
import { CabinTheme, DockLighting, MountedTrophy } from '../../types';

export const CABIN_WALL_COLORS: Record<CabinTheme, number> = {
  RUSTIC_CEDAR: 0x9a3412,
  NORDIC_BIRCH: 0xd97706,
  ALPINE_PINE: 0x3f6212,
  DARK_MAHOGANY: 0x451a03,
};

/**
 * Creates a charming stylized lakeside fishing village & angler base:
 * - Detailed player cabin with pitched cedar shingle roof, stone chimney with smoke puffs, front porch & warm glowing window
 * - Village boathouse / tackle shed nearby
 * - Warm string lighting or brass lanterns
 * - Mounted trophy plaques
 */
export class StylizedVillageBase {
  public group: THREE.Group;
  public cabinWallMesh: THREE.Mesh;
  public dockLightBulbs: THREE.Mesh[] = [];
  public windowLightMat: THREE.MeshBasicMaterial;
  private smokePuffs: { mesh: THREE.Mesh; startY: number; speed: number; offset: number }[] = [];

  constructor(
    cabinTheme: CabinTheme,
    dockLighting: DockLighting,
    trophies: MountedTrophy[]
  ) {
    this.group = new THREE.Group();

    // --- 1. PLAYER'S ANGLER CABIN ---
    const cabinGroup = new THREE.Group();
    cabinGroup.position.set(0, 0.4, 13.0);

    // Foundation stone deck
    const stoneDeckGeo = new THREE.BoxGeometry(7.2, 0.4, 6.2);
    const stoneDeck = new THREE.Mesh(
      stoneDeckGeo,
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9, flatShading: true })
    );
    stoneDeck.position.y = 0.2;
    stoneDeck.receiveShadow = true;
    cabinGroup.add(stoneDeck);

    // Log cabin walls
    const wallGeo = new THREE.BoxGeometry(5.8, 3.2, 4.6);
    this.cabinWallMesh = new THREE.Mesh(
      wallGeo,
      new THREE.MeshStandardMaterial({
        color: CABIN_WALL_COLORS[cabinTheme] || 0x9a3412,
        roughness: 0.85,
        flatShading: true,
      })
    );
    this.cabinWallMesh.position.set(0, 1.9, 0.3);
    this.cabinWallMesh.castShadow = true;
    this.cabinWallMesh.receiveShadow = true;
    cabinGroup.add(this.cabinWallMesh);

    // Pitched faceted roof
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8, flatShading: true });
    const roofGeo = new THREE.ConeGeometry(4.6, 2.2, 4);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 4.3, 0.3);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    cabinGroup.add(roof);

    // Stone Chimney
    const chimGeo = new THREE.BoxGeometry(0.7, 3.4, 0.7);
    const chim = new THREE.Mesh(
      chimGeo,
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9, flatShading: true })
    );
    chim.position.set(2.0, 3.6, 0.8);
    chim.castShadow = true;
    cabinGroup.add(chim);

    // Warm glowing cabin window
    this.windowLightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const winGeo = new THREE.PlaneGeometry(1.2, 1.2);
    const win = new THREE.Mesh(winGeo, this.windowLightMat);
    win.position.set(-1.4, 2.1, -2.02);
    win.rotation.y = Math.PI;
    cabinGroup.add(win);

    // Front porch overhang & pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.6, 6), pillarMat);
    p1.position.set(-2.4, 1.5, -2.4);
    cabinGroup.add(p1);
    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.6, 6), pillarMat);
    p2.position.set(2.4, 1.5, -2.4);
    cabinGroup.add(p2);

    // Chimney smoke puffs
    const smokeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.9,
      transparent: true,
      opacity: 0.45,
      flatShading: true,
    });
    for (let s = 0; s < 4; s++) {
      const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22 + s * 0.08, 0), smokeMat);
      puff.position.set(2.0, 5.4 + s * 0.6, 0.8);
      cabinGroup.add(puff);
      this.smokePuffs.push({ mesh: puff, startY: 5.4, speed: 0.8, offset: s * 0.8 });
    }

    this.group.add(cabinGroup);

    // --- 2. NEIGHBORING VILLAGE BOATHOUSE / SHED ---
    const shedGroup = new THREE.Group();
    shedGroup.position.set(9.5, 0.35, 11.5);
    shedGroup.rotation.y = -0.35;

    const shedWalls = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 2.6, 3.8),
      new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.88, flatShading: true })
    );
    shedWalls.position.y = 1.4;
    shedWalls.castShadow = true;
    shedGroup.add(shedWalls);

    const shedRoof = new THREE.Mesh(
      new THREE.ConeGeometry(3.4, 1.8, 4),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8, flatShading: true })
    );
    shedRoof.position.set(0, 3.4, 0);
    shedRoof.rotation.y = Math.PI / 4;
    shedRoof.castShadow = true;
    shedGroup.add(shedRoof);

    // Wooden boat parked beside shed
    const boatGeo = new THREE.ConeGeometry(0.9, 3.4, 5);
    boatGeo.rotateX(Math.PI / 2);
    const boat = new THREE.Mesh(
      boatGeo,
      new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.7, flatShading: true })
    );
    boat.position.set(-2.4, 0.3, 0);
    boat.rotation.z = 0.2;
    boat.castShadow = true;
    shedGroup.add(boat);

    this.group.add(shedGroup);

    // --- 3. DOCK LIGHTING POSTS & STRINGS ---
    this.setupDockLighting(dockLighting);
  }

  private setupDockLighting(dockLighting: DockLighting) {
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });

    const postMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.5, metalness: 0.7 });

    // Lantern posts flanking dock entrance
    const lanternPositions = [
      [-2.4, 0.38, 5.8],
      [2.4, 0.38, 5.8],
      [-2.4, 0.38, 0.5],
      [2.4, 0.38, 0.5],
    ];

    lanternPositions.forEach(([lx, ly, lz]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.4, 6), postMat);
      post.position.set(lx, ly + 1.2, lz);
      this.group.add(post);

      const lampHead = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), bulbMat);
      lampHead.position.set(lx, ly + 2.3, lz);
      this.group.add(lampHead);
      this.dockLightBulbs.push(lampHead);
    });
  }

  public update(time: number, delta: number) {
    // Animate chimney smoke rising and drifting gently with the breeze
    this.smokePuffs.forEach((p) => {
      p.mesh.position.y += delta * p.speed;
      p.mesh.position.x = 2.0 + Math.sin(p.mesh.position.y * 1.5 + time) * 0.25;
      if (p.mesh.position.y > 7.5) {
        p.mesh.position.y = p.startY;
      }
    });
  }
}
