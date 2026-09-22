import * as THREE from 'three';

export type CharacterAnimationState = 'IDLE' | 'WALK' | 'CAST' | 'REEL' | 'CATCH';

/**
 * Creates a charming stylized 3D indie angler character:
 * - Head with warm skin tone, eyes, hair / cap
 * - Bucket hat with hatband
 * - Outer flannel/vest jacket over shirt
 * - Articulated arms holding the fishing rod
 * - Stylized trousers with rolled cuffs and leather boots
 * - Procedural smooth animation transitions for IDLE, CAST, REEL, CATCH
 */
export class StylizedPlayerCharacter {
  public group: THREE.Group;
  public rodGroup: THREE.Group;
  public rodTipPosition: THREE.Vector3 = new THREE.Vector3();

  private headGroup: THREE.Group;
  private torsoGroup: THREE.Group;
  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private leftLegGroup: THREE.Group;
  private rightLegGroup: THREE.Group;

  private rodPoleMesh: THREE.Mesh;
  private reelMesh: THREE.Mesh;
  private rodPoleMat: THREE.MeshStandardMaterial;

  constructor() {
    this.group = new THREE.Group();

    // Palette
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b5, roughness: 0.6 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.8 });
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x3d5a45, roughness: 0.7 }); // Forest green bucket hat
    const hatBandMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 }); // Amber band
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.7 }); // Rustic burnt orange flannel
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.85 }); // Indigo denim
    const bootsMat = new THREE.MeshStandardMaterial({ color: 0x3e2716, roughness: 0.6 }); // Leather boots

    // --- 1. TORSO ---
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.y = 0.85;

    // Jacket/Vest body (faceted box-cylinder)
    const jacketGeo = new THREE.CylinderGeometry(0.28, 0.24, 0.7, 7);
    const jacket = new THREE.Mesh(jacketGeo, jacketMat);
    jacket.castShadow = true;
    jacket.receiveShadow = true;
    this.torsoGroup.add(jacket);

    // Collar / Scarf
    const collarGeo = new THREE.TorusGeometry(0.18, 0.05, 5, 8);
    collarGeo.rotateX(Math.PI / 2);
    const collar = new THREE.Mesh(collarGeo, hairMat);
    collar.position.y = 0.36;
    this.torsoGroup.add(collar);

    this.group.add(this.torsoGroup);

    // --- 2. HEAD & BUCKET HAT ---
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.4, 0);

    // Head
    const headGeo = new THREE.DodecahedronGeometry(0.22, 1);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.castShadow = true;
    this.headGroup.add(head);

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1f2937 });
    const eyeGeo = new THREE.SphereGeometry(0.025, 6, 6);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.08, 0.02, 0.2);
    this.headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.08, 0.02, 0.2);
    this.headGroup.add(rightEye);

    // Bucket hat brim & crown
    const hatCrownGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.22, 8);
    const hatCrown = new THREE.Mesh(hatCrownGeo, hatMat);
    hatCrown.position.y = 0.16;
    hatCrown.castShadow = true;
    this.headGroup.add(hatCrown);

    const hatBandGeo = new THREE.CylinderGeometry(0.265, 0.265, 0.05, 8);
    const hatBand = new THREE.Mesh(hatBandGeo, hatBandMat);
    hatBand.position.y = 0.08;
    this.headGroup.add(hatBand);

    const hatBrimGeo = new THREE.CylinderGeometry(0.42, 0.38, 0.03, 8);
    const hatBrim = new THREE.Mesh(hatBrimGeo, hatMat);
    hatBrim.position.y = 0.06;
    hatBrim.castShadow = true;
    this.headGroup.add(hatBrim);

    this.group.add(this.headGroup);

    // --- 3. LEGS & BOOTS ---
    const legGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.5, 6);
    const bootGeo = new THREE.BoxGeometry(0.16, 0.14, 0.24);

    // Left leg
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.14, 0.5, 0);
    const lPants = new THREE.Mesh(legGeo, pantsMat);
    lPants.position.y = -0.18;
    lPants.castShadow = true;
    this.leftLegGroup.add(lPants);
    const lBoot = new THREE.Mesh(bootGeo, bootsMat);
    lBoot.position.set(0, -0.42, 0.04);
    lBoot.castShadow = true;
    this.leftLegGroup.add(lBoot);
    this.group.add(this.leftLegGroup);

    // Right leg
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.14, 0.5, 0);
    const rPants = new THREE.Mesh(legGeo, pantsMat);
    rPants.position.y = -0.18;
    rPants.castShadow = true;
    this.rightLegGroup.add(rPants);
    const rBoot = new THREE.Mesh(bootGeo, bootsMat);
    rBoot.position.set(0, -0.42, 0.04);
    rBoot.castShadow = true;
    this.rightLegGroup.add(rBoot);
    this.group.add(this.rightLegGroup);

    // --- 4. ARMS ---
    const armGeo = new THREE.CylinderGeometry(0.07, 0.065, 0.45, 6);
    armGeo.translate(0, -0.22, 0);
    const handGeo = new THREE.SphereGeometry(0.065, 6, 6);

    // Left arm
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.32, 1.12, 0);
    const lArm = new THREE.Mesh(armGeo, jacketMat);
    this.leftArmGroup.add(lArm);
    const lHand = new THREE.Mesh(handGeo, skinMat);
    lHand.position.y = -0.44;
    this.leftArmGroup.add(lHand);
    this.group.add(this.leftArmGroup);

    // Right arm (gripping rod)
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.32, 1.12, 0);
    const rArm = new THREE.Mesh(armGeo, jacketMat);
    this.rightArmGroup.add(rArm);
    const rHand = new THREE.Mesh(handGeo, skinMat);
    rHand.position.y = -0.44;
    this.rightArmGroup.add(rHand);
    this.group.add(this.rightArmGroup);

    // --- 5. STYLIZED FISHING ROD ---
    this.rodGroup = new THREE.Group();
    this.rodGroup.position.set(0.24, 0.72, 0.25);

    // Rod Cork Handle
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.8 });
    const handleGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.4, 7);
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.y = 0.2;
    handle.rotation.x = -Math.PI / 4.5;
    this.rodGroup.add(handle);

    // Rod Pole blank
    this.rodPoleMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.4 });
    const poleGeo = new THREE.CylinderGeometry(0.012, 0.03, 3.2, 7);
    poleGeo.translate(0, 1.6, 0);
    this.rodPoleMesh = new THREE.Mesh(poleGeo, this.rodPoleMat);
    this.rodPoleMesh.position.y = 0.35;
    this.rodPoleMesh.rotation.x = -Math.PI / 4.5;
    this.rodPoleMesh.castShadow = true;
    this.rodGroup.add(this.rodPoleMesh);

    // Guides along rod
    for (let g = 0; g < 4; g++) {
      const guideGeo = new THREE.TorusGeometry(0.03 - g * 0.005, 0.005, 4, 8);
      const guide = new THREE.Mesh(guideGeo, new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.8 }));
      guide.position.set(0, 0.8 + g * 0.65, -0.45 - g * 0.45);
      guide.rotation.x = -Math.PI / 4.5;
      this.rodGroup.add(guide);
    }

    // Reel
    const reelMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.85, roughness: 0.2 });
    const reelGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.1, 8);
    this.reelMesh = new THREE.Mesh(reelGeo, reelMat);
    this.reelMesh.position.set(0, 0.4, -0.15);
    this.reelMesh.rotation.z = Math.PI / 2;
    this.rodGroup.add(this.reelMesh);

    this.group.add(this.rodGroup);
  }

  public setCustomRodColor(hex: string) {
    this.rodPoleMat.color.set(hex);
  }

  public setCustomReelColor(hex: number) {
    (this.reelMesh.material as THREE.MeshStandardMaterial).color.set(hex);
  }

  /**
   * Updates procedural animation based on movement and fishing state machine
   * Features organic weight shifts, breathing, synced walk-stride, and multi-stage fishing poses.
   */
  public updateAnimation(
    state: string,
    tension: number,
    castPower: number,
    time: number,
    isMoving = false,
    moveSpeed = 0
  ) {
    // 1. Organic Idle & Breathing
    const idleBreath = Math.sin(time * 2.2) * 0.018;
    const weightShift = Math.sin(time * 0.8) * 0.015;
    const headLook = Math.sin(time * 0.6) * 0.1;

    this.torsoGroup.position.y = 0.85 + idleBreath;
    this.torsoGroup.position.x = weightShift;
    this.torsoGroup.rotation.z = weightShift * 0.5;

    this.headGroup.position.y = 1.4 + idleBreath;
    this.headGroup.position.x = weightShift * 0.8;
    this.headGroup.rotation.y = headLook;

    // 2. Walking / Running Leg and Arm Swing
    if (isMoving && state === 'IDLE') {
      const cycleSpeed = Math.max(0.5, moveSpeed);
      const strideFreq = time * 8.5 * cycleSpeed;
      const legStride = Math.sin(strideFreq) * 0.65;
      const footLift = Math.max(0, Math.sin(strideFreq)) * 0.12;

      // Leg stride & knee bend
      this.leftLegGroup.rotation.x = legStride;
      this.rightLegGroup.rotation.x = -legStride;
      this.leftLegGroup.position.y = 0.5 + (legStride > 0 ? footLift : 0);
      this.rightLegGroup.position.y = 0.5 + (legStride < 0 ? footLift : 0);

      // Natural torso step bounce
      const stepBounce = Math.abs(Math.sin(strideFreq)) * 0.04;
      this.torsoGroup.position.y = 0.85 + stepBounce;
      this.headGroup.position.y = 1.4 + stepBounce;

      // Arm swing opposing legs
      this.leftArmGroup.rotation.x = -0.3 - legStride * 0.7;
      this.rightArmGroup.rotation.x = -0.5 + legStride * 0.35;
      this.rightArmGroup.rotation.z = 0.15;
      this.rodGroup.rotation.x = Math.sin(strideFreq) * 0.1;
      this.rodGroup.rotation.z = Math.sin(strideFreq) * 0.04;
      return;
    } else {
      // Return legs to neutral grounded stance
      this.leftLegGroup.rotation.x = 0;
      this.rightLegGroup.rotation.x = 0;
      this.leftLegGroup.position.y = 0.5;
      this.rightLegGroup.position.y = 0.5;
    }

    // 3. Multi-phase Fishing Animations
    if (state === 'IDLE' || state === 'WAITING' || state === 'CANCELLED') {
      // Relaxed idle stance, attentive to float
      const waitBob = Math.sin(time * 1.8) * 0.03;
      this.rightArmGroup.rotation.x = -0.65 + waitBob;
      this.rightArmGroup.rotation.z = 0.22;
      this.leftArmGroup.rotation.x = -0.35 + waitBob * 0.5;
      this.leftArmGroup.rotation.z = -0.15;

      this.rodGroup.rotation.x = -0.1 + waitBob * 0.8;
      this.rodGroup.rotation.z = 0;
      this.headGroup.rotation.x = 0.08; // slightly looking down toward the water
    } else if (state === 'CASTING') {
      // Wind up and power back
      const prepAngle = -0.3 - castPower * 1.1;
      this.rightArmGroup.rotation.x = prepAngle;
      this.rightArmGroup.rotation.z = 0.35;
      this.leftArmGroup.rotation.x = prepAngle * 0.7;
      this.torsoGroup.rotation.x = castPower * 0.2; // leaning back
      this.rodGroup.rotation.x = -prepAngle * 1.2;
      this.headGroup.rotation.x = -0.15; // looking up/forward
    } else if (state === 'BITE') {
      // Sudden sharp bite jolt!
      const jolt = Math.sin(time * 28) * 0.1;
      this.headGroup.rotation.x = 0.2; // snap look at water
      this.torsoGroup.rotation.x = 0.08;
      this.rightArmGroup.rotation.x = -0.95 + jolt;
      this.leftArmGroup.rotation.x = -0.6 + jolt;
      this.rodGroup.rotation.x = 0.35 + jolt * 1.5;
    } else if (state === 'HOOKED' || state === 'REELING') {
      // Dynamic fight: rod bending, torso leaning back against drag, reel cranking
      const strainBend = tension * 0.65;
      const fightJiggle = Math.sin(time * 16) * (0.04 + tension * 0.06);

      // Torso leans back to absorb fish tension
      this.torsoGroup.rotation.x = -0.15 - strainBend * 0.25;
      this.headGroup.rotation.x = -0.1;

      // Right arm holds rod tightly, pulling upward
      this.rightArmGroup.rotation.x = -1.1 - strainBend * 0.4 + fightJiggle;
      this.rightArmGroup.rotation.z = 0.25;

      // Left arm cranks reel furiously in circles!
      const crankAngle = time * 24;
      this.leftArmGroup.rotation.x = -0.7 + Math.sin(crankAngle) * 0.18;
      this.leftArmGroup.rotation.y = Math.cos(crankAngle) * 0.14;

      // Rod bends dynamically
      this.rodGroup.rotation.x = 0.4 + strainBend * 0.8 + fightJiggle * 1.2;
      this.rodGroup.rotation.z = Math.sin(time * 10) * (tension * 0.08);

      // Reel mesh rotation
      this.reelMesh.rotation.x += 0.4;
    } else if (state === 'CAUGHT') {
      // Triumphant catch celebration! Hoisting rod high overhead
      this.rightArmGroup.rotation.x = -1.55;
      this.rightArmGroup.rotation.z = 0.2;
      this.leftArmGroup.rotation.x = -1.45;
      this.leftArmGroup.rotation.z = -0.2;
      this.torsoGroup.rotation.x = -0.12;
      this.headGroup.rotation.x = -0.28; // looking up at catch
      this.rodGroup.rotation.x = 0.75;
    }

    // Compute live rod tip position in world space for line attachment
    const localTip = new THREE.Vector3(0, 3.2, -1.8);
    this.rodTipPosition = localTip.applyMatrix4(this.rodGroup.matrixWorld);
  }
}

