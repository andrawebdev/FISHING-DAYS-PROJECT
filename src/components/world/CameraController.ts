import * as THREE from 'three';
import { getTerrainHeight } from './Terrain';
import { WORLD_OBSTACLES } from './Collision';

/**
 * Authoritative Third-Person Camera Controller for Fishing Days:
 * - Follows player smoothly near chest/head level (offset Y ~1.25m)
 * - Spherical orbit with yaw and clamped pitch (-15° to 55°)
 * - Collision prevention with terrain, water surface, dock, and world obstacles
 * - Smooth damping without jerky teleportation or drifting
 * - Viewport resize handling
 * - Dedicated fishing camera framing and bite/reel feedback
 */
export class CameraController {
  public camera: THREE.PerspectiveCamera;

  // Orbit angles (radians)
  public yaw = 0;
  public pitch = 0.22;
  private targetYaw = 0;
  private targetPitch = 0.22;

  // Pitch constraints: -15° (-0.26 rad) to +55° (0.96 rad)
  private readonly minPitch = -0.26;
  private readonly maxPitch = 0.96;

  // Distances
  private baseDistance = 5.2;
  private currentDistance = 5.2;
  private targetDistance = 5.2;

  // Smoothing target position
  private smoothedTarget = new THREE.Vector3(0, 1.25, 1.2);
  private currentCamPos = new THREE.Vector3(0, 2.5, 6.4);

  // State
  private isFishing = false;

  constructor(fov = 50, aspect = 16 / 9, near = 0.1, far = 200) {
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.copy(this.currentCamPos);
  }

  public setFishingMode(fishing: boolean) {
    this.isFishing = fishing;
    // When fishing, move slightly closer to frame the rod, line, and lake surface
    this.targetDistance = fishing ? 4.2 : 5.2;
  }

  /**
   * Adds rotational delta to target orbit angles.
   * Yaw can rotate freely 360°; Pitch is clamped to [-15°, 55°].
   */
  public rotate(deltaYaw: number, deltaPitch: number) {
    this.targetYaw -= deltaYaw;
    this.targetPitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.targetPitch + deltaPitch));
  }

  public handleResize(width: number, height: number) {
    if (height <= 0 || width <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Main per-frame update loop called from the 60fps render loop.
   */
  public update(playerPos: THREE.Vector3, delta: number, shakeIntensity = 0) {
    // 1. Smoothly interpolate angles with frame-rate independent damping
    const angleDamp = 1.0 - Math.exp(-14 * delta);
    this.yaw = THREE.MathUtils.lerp(this.yaw, this.targetYaw, angleDamp);
    this.pitch = THREE.MathUtils.lerp(this.pitch, this.targetPitch, angleDamp);

    // 2. Camera target near player chest / upper body
    const desiredTarget = new THREE.Vector3(playerPos.x, playerPos.y + 1.22, playerPos.z);
    const targetDamp = 1.0 - Math.exp(-12 * delta);
    this.smoothedTarget.lerp(desiredTarget, targetDamp);

    // 3. Compute nominal spherical position from target
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);

    // Orbit radius on the horizontal XZ plane
    const orbitRadius = this.targetDistance * cosPitch;
    const nominalOffsetX = -Math.sin(this.yaw) * orbitRadius;
    const nominalOffsetZ = Math.cos(this.yaw) * orbitRadius;
    const nominalOffsetY = this.targetDistance * sinPitch;

    let desiredX = this.smoothedTarget.x + nominalOffsetX;
    let desiredY = this.smoothedTarget.y + nominalOffsetY;
    let desiredZ = this.smoothedTarget.z + nominalOffsetZ;

    // 4. Camera Obstacle & Terrain Collision Prevention
    // Check line from smoothedTarget to desired camera position
    let collisionDistanceFactor = 1.0;

    // A. Terrain height check at desired position
    const tHeight = getTerrainHeight(desiredX, desiredZ);
    const minHeightAboveGround = Math.max(0.5, tHeight + 0.65);
    if (desiredY < minHeightAboveGround) {
      desiredY = minHeightAboveGround;
      // Also pull distance closer if ground slopes steeply behind
      const distFromPlayer = Math.hypot(desiredX - this.smoothedTarget.x, desiredZ - this.smoothedTarget.z);
      if (distFromPlayer > 2.0 && desiredY > this.smoothedTarget.y + 1.8) {
        collisionDistanceFactor = Math.min(collisionDistanceFactor, 0.82);
      }
    }

    // B. World Obstacles (Cabin, Boathouse, Rocks) collision check
    for (const obs of WORLD_OBSTACLES) {
      const dx = desiredX - obs.x;
      const dz = desiredZ - obs.z;
      const dist = Math.hypot(dx, dz);
      const safeRadius = obs.radius + 0.8;
      if (dist < safeRadius) {
        // Camera would clip inside obstacle: shorten distance factor
        const ratio = Math.max(0.4, dist / safeRadius);
        collisionDistanceFactor = Math.min(collisionDistanceFactor, ratio);
      }
    }

    // C. Water Surface & Dock check: keep camera strictly above water (y >= 0.35)
    if (desiredY < 0.35) {
      desiredY = 0.35;
    }

    // Smoothly apply distance factor
    const effectiveDistance = this.targetDistance * collisionDistanceFactor;
    this.currentDistance = THREE.MathUtils.lerp(this.currentDistance, effectiveDistance, 1.0 - Math.exp(-10 * delta));

    const finalRadius = this.currentDistance * cosPitch;
    let finalX = this.smoothedTarget.x - Math.sin(this.yaw) * finalRadius;
    let finalZ = this.smoothedTarget.z + Math.cos(this.yaw) * finalRadius;
    let finalY = Math.max(minHeightAboveGround, this.smoothedTarget.y + this.currentDistance * sinPitch);

    // Apply bite / reeling screen shake feedback
    if (shakeIntensity > 0) {
      finalX += (Math.random() - 0.5) * shakeIntensity;
      finalY += (Math.random() - 0.5) * shakeIntensity * 0.7;
      finalZ += (Math.random() - 0.5) * shakeIntensity;
    }

    // Smooth camera motion
    const camDamp = 1.0 - Math.exp(-16 * delta);
    this.currentCamPos.x = THREE.MathUtils.lerp(this.currentCamPos.x, finalX, camDamp);
    this.currentCamPos.y = THREE.MathUtils.lerp(this.currentCamPos.y, finalY, camDamp);
    this.currentCamPos.z = THREE.MathUtils.lerp(this.currentCamPos.z, finalZ, camDamp);

    this.camera.position.copy(this.currentCamPos);
    this.camera.lookAt(this.smoothedTarget.x, this.smoothedTarget.y, this.smoothedTarget.z);
  }
}
