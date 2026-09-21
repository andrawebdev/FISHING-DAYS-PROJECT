import * as THREE from 'three';

/**
 * Creates a stylized water surface with animated gentle waves,
 * soft shoreline depth tint, and dynamic ripple rings.
 */
export class StylizedWater {
  public mesh: THREE.Mesh;
  public geometry: THREE.PlaneGeometry;
  public material: THREE.MeshStandardMaterial;
  private ripples: { mesh: THREE.Mesh; age: number; maxAge: number; startScale: number; maxScale: number }[] = [];
  private rippleGroup: THREE.Group;

  constructor() {
    const width = 110;
    const depth = 110;
    const segs = 70;
    const geo = new THREE.PlaneGeometry(width, depth, segs, segs);
    geo.rotateX(-Math.PI / 2);
    this.geometry = geo;

    this.material = new THREE.MeshStandardMaterial({
      color: 0x1d7088,
      roughness: 0.12,
      metalness: 0.25,
      transparent: true,
      opacity: 0.86,
      flatShading: true, // Stylized faceted reflections
    });

    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.position.set(0, 0, -25);
    this.mesh.receiveShadow = true;

    // Group for ripple rings
    this.rippleGroup = new THREE.Group();
    this.mesh.add(this.rippleGroup);
  }

  /**
   * Spawn a circular ripple at specified world coordinates
   */
  public addRipple(worldX: number, worldZ: number, strength = 1.0) {
    const ringGeo = new THREE.RingGeometry(0.15, 0.28, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x8eedff,
      transparent: true,
      opacity: 0.7 * strength,
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    // Position relative to water mesh (which is at z = -25)
    ringMesh.position.set(worldX - this.mesh.position.x, 0.04, worldZ - this.mesh.position.z);

    this.rippleGroup.add(ringMesh);
    this.ripples.push({
      mesh: ringMesh,
      age: 0,
      maxAge: 1.6,
      startScale: 0.8 * strength,
      maxScale: 3.5 * strength,
    });
  }

  /**
   * Updates wave heights and animates ripples
   */
  public update(time: number, delta: number) {
    const pos = this.geometry.attributes.position;
    const count = pos.count;

    for (let i = 0; i < count; i++) {
      const u = pos.getX(i);
      const v = pos.getZ(i);

      // Stylized organic wave equations
      const wave1 = Math.sin(u * 0.18 + time * 1.5) * 0.09;
      const wave2 = Math.cos(v * 0.14 + time * 1.2) * 0.08;
      const wave3 = Math.sin((u + v) * 0.22 + time * 2.1) * 0.04;

      pos.setY(i, wave1 + wave2 + wave3);
    }
    pos.needsUpdate = true;
    this.geometry.computeVertexNormals();

    // Update ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rip = this.ripples[i];
      rip.age += delta;
      const progress = rip.age / rip.maxAge;

      if (progress >= 1.0) {
        this.rippleGroup.remove(rip.mesh);
        rip.mesh.geometry.dispose();
        (rip.mesh.material as THREE.Material).dispose();
        this.ripples.splice(i, 1);
      } else {
        const currentScale = rip.startScale + progress * (rip.maxScale - rip.startScale);
        rip.mesh.scale.set(currentScale, 1, currentScale);
        const mat = rip.mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = (1 - progress) * 0.65;
      }
    }
  }
}
