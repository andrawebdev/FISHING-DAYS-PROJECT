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

  // Segmented rod hierarchy for procedural bending without geometry rebuilding
  private rodHandleGroup: THREE.Group;
  private rodMidGroup: THREE.Group;
  private rodTipGroup: THREE.Group;
  private rodTipMarker: THREE.Object3D;

  private rodPoleMat: THREE.MeshStandardMaterial;
  private reelMesh: THREE.Mesh;

  // Continuous walk phase accumulator (prevents stuttering/phase jumps during lerped acceleration)
  private walkPhase = 0;

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

    // Right arm (gripping rod authoritative attachment point)
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.32, 1.12, 0);
    const rArm = new THREE.Mesh(armGeo, jacketMat);
    this.rightArmGroup.add(rArm);
    const rHand = new THREE.Mesh(handGeo, skinMat);
    rHand.position.y = -0.44;
    this.rightArmGroup.add(rHand);
    this.group.add(this.rightArmGroup);

    // --- 5. EXACTLY ONE PERSISTENT FISHING ROD (ATTACHED TO RIGHT HAND) ---
    this.rodGroup = new THREE.Group();
    // Hand grip transform offset
    this.rodGroup.position.set(0, -0.44, 0.08);
    this.rightArmGroup.add(this.rodGroup);

    // Shared materials
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.8 });
    this.rodPoleMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.4 });
    const guideMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.8 });
    const reelMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.85, roughness: 0.2 });

    // Segment A: Handle and Reel
    this.rodHandleGroup = new THREE.Group();
    const handleGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.42, 8);
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.y = 0.05;
    handle.castShadow = true;
    this.rodHandleGroup.add(handle);

    // Reel attached to handle
    const reelGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.09, 8);
    this.reelMesh = new THREE.Mesh(reelGeo, reelMat);
    this.reelMesh.position.set(0, 0.16, 0.1);
    this.reelMesh.rotation.z = Math.PI / 2;
    this.reelMesh.castShadow = true;
    this.rodHandleGroup.add(this.reelMesh);

    // Reel bracket / spool mount
    const bracketGeo = new THREE.BoxGeometry(0.025, 0.06, 0.08);
    const bracket = new THREE.Mesh(bracketGeo, reelMat);
    bracket.position.set(0, 0.16, 0.05);
    this.rodHandleGroup.add(bracket);

    this.rodGroup.add(this.rodHandleGroup);

    // Segment B: Rod Mid-Blank (bends on tension)
    this.rodMidGroup = new THREE.Group();
    this.rodMidGroup.position.set(0, 0.26, 0);

    const midPoleGeo = new THREE.CylinderGeometry(0.018, 0.028, 1.4, 7);
    midPoleGeo.translate(0, 0.7, 0);
    const midPoleMesh = new THREE.Mesh(midPoleGeo, this.rodPoleMat);
    midPoleMesh.castShadow = true;
    this.rodMidGroup.add(midPoleMesh);

    // Guides on mid blank
    for (let g = 0; g < 2; g++) {
      const guideGeo = new THREE.TorusGeometry(0.024 - g * 0.004, 0.004, 4, 8);
      const guide = new THREE.Mesh(guideGeo, guideMat);
      guide.position.set(0, 0.45 + g * 0.55, 0.025);
      guide.rotation.x = Math.PI / 2;
      this.rodMidGroup.add(guide);
    }

    this.rodHandleGroup.add(this.rodMidGroup);

    // Segment C: Rod Tip Blank (flexible, bends strongly on tension)
    this.rodTipGroup = new THREE.Group();
    this.rodTipGroup.position.set(0, 1.4, 0);

    const tipPoleGeo = new THREE.CylinderGeometry(0.008, 0.018, 1.4, 7);
    tipPoleGeo.translate(0, 0.7, 0);
    const tipPoleMesh = new THREE.Mesh(tipPoleGeo, this.rodPoleMat);
    tipPoleMesh.castShadow = true;
    this.rodTipGroup.add(tipPoleMesh);

    // Tip guide & marker
    for (let g = 0; g < 2; g++) {
      const guideGeo = new THREE.TorusGeometry(0.014 - g * 0.003, 0.003, 4, 8);
      const guide = new THREE.Mesh(guideGeo, guideMat);
      guide.position.set(0, 0.5 + g * 0.6, 0.015);
      guide.rotation.x = Math.PI / 2;
      this.rodTipGroup.add(guide);
    }

    // Top eyelet
    const topEyeletGeo = new THREE.TorusGeometry(0.01, 0.003, 4, 8);
    const topEyelet = new THREE.Mesh(topEyeletGeo, guideMat);
    topEyelet.position.set(0, 1.4, 0.012);
    topEyelet.rotation.x = Math.PI / 2;
    this.rodTipGroup.add(topEyelet);

    // Tip marker for exact line connection
    this.rodTipMarker = new THREE.Object3D();
    this.rodTipMarker.position.set(0, 1.42, 0.012);
    this.rodTipGroup.add(this.rodTipMarker);

    this.rodMidGroup.add(this.rodTipGroup);

    // Authoritative initialization of idle transforms and rod tip
    this.resetToIdle();
  }

  public setCustomRodColor(hex: string) {
    this.rodPoleMat.color.set(hex);
  }

  public setCustomReelColor(hex: number) {
    (this.reelMesh.material as THREE.MeshStandardMaterial).color.set(hex);
  }

  /**
   * Updates procedural animation based on movement and fishing state machine.
   * Features:
   * - Phase-accumulated walk cycles (no stutter on lerped acceleration/deceleration)
   * - Controlled multi-stage procedural rod bending relative to line tension
   * - Hand-anchored rod transforms that naturally rotate with player character
   */
  public updateAnimation(
    state: string,
    tension: number,
    castPower: number,
    time: number,
    delta: number,
    isMoving = false,
    moveSpeedRatio = 0
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

    // Reset default rod bending in non-fight states
    let midBend = 0;
    let tipBend = 0;

    // 2. Synchronized Walk / Run Stride Cycle
    if (isMoving && state === 'IDLE') {
      // Accumulate phase continuously to eliminate jerky phase jumping during lerp transitions
      this.walkPhase += delta * 9.5 * Math.max(0.3, moveSpeedRatio);

      const legStride = Math.sin(this.walkPhase) * 0.65;
      const footLift = Math.max(0, Math.sin(this.walkPhase)) * 0.12;

      // Leg stride & foot lift
      this.leftLegGroup.rotation.x = legStride;
      this.rightLegGroup.rotation.x = -legStride;
      this.leftLegGroup.position.y = 0.5 + (legStride > 0 ? footLift : 0);
      this.rightLegGroup.position.y = 0.5 + (legStride < 0 ? footLift : 0);

      // Torso step bounce
      const stepBounce = Math.abs(Math.sin(this.walkPhase)) * 0.04;
      this.torsoGroup.position.y = 0.85 + stepBounce;
      this.headGroup.position.y = 1.4 + stepBounce;

      // Arm swing opposing legs while carrying rod naturally
      this.leftArmGroup.rotation.x = -0.3 - legStride * 0.6;
      this.leftArmGroup.rotation.z = -0.15;
      this.leftArmGroup.rotation.y = 0;

      this.rightArmGroup.rotation.x = -0.55 + legStride * 0.25;
      this.rightArmGroup.rotation.z = 0.2;
      this.rightArmGroup.rotation.y = -0.1;

      // Natural rod carry angle in hand
      this.rodGroup.rotation.x = -0.65 + Math.sin(this.walkPhase) * 0.06;
      this.rodGroup.rotation.y = 0.2;
      this.rodGroup.rotation.z = -0.1;

      this.rodMidGroup.rotation.x = 0.03;
      this.rodTipGroup.rotation.x = 0.04;
    } else {
      // Smoothly ease legs back to neutral grounded stance
      this.leftLegGroup.rotation.x = THREE.MathUtils.lerp(this.leftLegGroup.rotation.x, 0, delta * 12);
      this.rightLegGroup.rotation.x = THREE.MathUtils.lerp(this.rightLegGroup.rotation.x, 0, delta * 12);
      this.leftLegGroup.position.y = 0.5;
      this.rightLegGroup.position.y = 0.5;

      // 3. Multi-phase Fishing Arm and Rod Poses
      if (state === 'IDLE' || state === 'WAITING' || state === 'CANCELLED') {
        // Attentive ready stance, rod pointed toward water
        const waitBob = Math.sin(time * 1.8) * 0.03;

        this.rightArmGroup.rotation.x = -0.7 + waitBob;
        this.rightArmGroup.rotation.y = -0.15;
        this.rightArmGroup.rotation.z = 0.22;

        this.leftArmGroup.rotation.x = -0.4 + waitBob * 0.5;
        this.leftArmGroup.rotation.y = 0.2;
        this.leftArmGroup.rotation.z = -0.15;

        this.rodGroup.rotation.x = -0.55 + waitBob * 0.5;
        this.rodGroup.rotation.y = 0.15;
        this.rodGroup.rotation.z = 0;

        this.headGroup.rotation.x = 0.08; // subtle focus on water
        this.torsoGroup.rotation.x = 0;

        // Subtle natural rod sag
        midBend = 0.04;
        tipBend = 0.06;
      } else if (state === 'CASTING') {
        // Wind-up and release arc
        const prepAngle = -0.4 - castPower * 1.0;
        this.rightArmGroup.rotation.x = prepAngle;
        this.rightArmGroup.rotation.y = -0.1;
        this.rightArmGroup.rotation.z = 0.35;

        this.leftArmGroup.rotation.x = prepAngle * 0.6;
        this.leftArmGroup.rotation.y = 0.15;
        this.leftArmGroup.rotation.z = -0.2;

        this.torsoGroup.rotation.x = castPower * 0.18; // leaning back
        this.headGroup.rotation.x = -0.15;

        // Rod cocked backward over right shoulder
        this.rodGroup.rotation.x = -0.2 - prepAngle * 0.6;
        this.rodGroup.rotation.y = 0.25;
        this.rodGroup.rotation.z = -0.15;

        midBend = castPower * 0.15;
        tipBend = castPower * 0.25;
      } else if (state === 'BITE') {
        // Sudden sharp bite jerk!
        const jolt = Math.sin(time * 30) * 0.08;
        this.headGroup.rotation.x = 0.22;
        this.torsoGroup.rotation.x = 0.06;

        this.rightArmGroup.rotation.x = -0.85 + jolt;
        this.rightArmGroup.rotation.y = -0.15;
        this.rightArmGroup.rotation.z = 0.25;

        this.leftArmGroup.rotation.x = -0.6 + jolt;
        this.leftArmGroup.rotation.y = 0.25;
        this.leftArmGroup.rotation.z = -0.15;

        this.rodGroup.rotation.x = -0.45 + jolt * 2.0;
        this.rodGroup.rotation.y = 0.15;
        this.rodGroup.rotation.z = 0;

        midBend = 0.15 + jolt * 0.8;
        tipBend = 0.35 + jolt * 1.2;
      } else if (state === 'HOOKED' || state === 'REELING') {
        // Dynamic fight: rod bending upward against fish pull, crank arm rotating
        const clampedTension = Math.max(0, Math.min(1.0, tension));
        const fightJiggle = Math.sin(time * 16) * (0.03 + clampedTension * 0.05);

        // Torso leans back under strain
        this.torsoGroup.rotation.x = -0.12 - clampedTension * 0.2;
        this.headGroup.rotation.x = -0.1;

        // Right arm hoists rod high
        this.rightArmGroup.rotation.x = -1.25 - clampedTension * 0.3 + fightJiggle;
        this.rightArmGroup.rotation.y = -0.12;
        this.rightArmGroup.rotation.z = 0.28;

        // Left arm cranks reel
        const crankSpeed = state === 'REELING' ? time * 25 : time * 4;
        this.leftArmGroup.rotation.x = -0.75 + Math.sin(crankSpeed) * 0.16;
        this.leftArmGroup.rotation.y = 0.35 + Math.cos(crankSpeed) * 0.14;
        this.leftArmGroup.rotation.z = -0.1;

        this.rodGroup.rotation.x = -0.25 + clampedTension * 0.2 + fightJiggle;
        this.rodGroup.rotation.y = 0.1;
        this.rodGroup.rotation.z = Math.sin(time * 8) * (clampedTension * 0.05);

        // Reel spool rotates
        if (state === 'REELING') {
          this.reelMesh.rotation.x += delta * 20;
        }

        // Procedural rod bend under tension
        // 0% tension -> almost straight (0.08 rad)
        // 50% tension -> moderate curve (~0.35 rad)
        // 100% tension -> strong dramatic parabolic bend (~0.75 rad)
        midBend = 0.08 + clampedTension * 0.32;
        tipBend = 0.12 + clampedTension * 0.52;
      } else if (state === 'CAUGHT') {
        // Catch celebration: rod held triumphantly overhead!
        this.rightArmGroup.rotation.x = -1.6;
        this.rightArmGroup.rotation.y = -0.05;
        this.rightArmGroup.rotation.z = 0.2;

        this.leftArmGroup.rotation.x = -1.5;
        this.leftArmGroup.rotation.y = 0.05;
        this.leftArmGroup.rotation.z = -0.2;

        this.torsoGroup.rotation.x = -0.1;
        this.headGroup.rotation.x = -0.25; // looking up proudly

        this.rodGroup.rotation.x = -0.1;
        this.rodGroup.rotation.y = 0.1;
        this.rodGroup.rotation.z = 0;

        midBend = 0.06;
        tipBend = 0.1;
      }

      this.rodMidGroup.rotation.x = THREE.MathUtils.lerp(this.rodMidGroup.rotation.x, midBend, delta * 12);
      this.rodTipGroup.rotation.x = THREE.MathUtils.lerp(this.rodTipGroup.rotation.x, tipBend, delta * 12);
    }

    // Update world matrices for accurate rod tip calculation
    this.group.updateMatrixWorld(true);
    this.rodTipMarker.getWorldPosition(this.rodTipPosition);
  }

  /**
   * Authoritative reset returning rod, arms, and torso immediately to IDLE stance.
   */
  public resetToIdle() {
    this.rightArmGroup.rotation.set(-0.7, -0.15, 0.22);
    this.leftArmGroup.rotation.set(-0.4, 0.2, -0.15);
    this.rodGroup.rotation.set(-0.55, 0.15, 0);
    this.rodMidGroup.rotation.set(0.04, 0, 0);
    this.rodTipGroup.rotation.set(0.06, 0, 0);
    this.torsoGroup.rotation.set(0, 0, 0);
    this.headGroup.rotation.set(0.08, 0, 0);
    this.group.updateMatrixWorld(true);
    this.rodTipMarker.getWorldPosition(this.rodTipPosition);
  }
}

