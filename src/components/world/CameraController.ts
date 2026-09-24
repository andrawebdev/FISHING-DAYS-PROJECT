import * as THREE from 'three';
import { getTerrainHeight } from './Terrain';
import { WORLD_OBSTACLES } from './Collision';

export type CameraMode = 'CINEMATIC_MENU' | 'GAMEPLAY';

/**
 * Authoritative Camera Controller:
 * - Single authoritative owner of the active Three.js PerspectiveCamera.
 * - Supports CINEMATIC_MENU mode (ambient scenic camera for Main Menu).
 * - Supports GAMEPLAY mode (smooth, collision-aware third-person player follow).
 * - Targets player chest / upper body (never feet).
 * - Strictly clamped pitch: -10° to +50° (no ground flips or broken angles).
 * - Real obstacle & terrain collision resolution preventing camera clipping.
 * - Near: 0.2, Far: 600 (prevents sky dome/mountain clipping and near-plane artifacts).
 */
export class CameraController {
  public camera: THREE.PerspectiveCamera;
  public mode: CameraMode = 'CINEMATIC_MENU';

  // Orbit angles (radians)
  public yaw = 0;
  public pitch = 0.22;
  private targetYaw = 0;
  private targetPitch = 0.22;

  // Strict Pitch constraints: -10° (-0.174 rad) to +50° (+0.872 rad)
  private readonly minPitch = -0.174;
  private readonly maxPitch = 0.872;

  // Camera distances
  private baseDistance = 4.8;
  private targetDistance = 4.8;
  private currentDistance = 4.8;
  private readonly minSafeDistance = 2.4;

  // Tracking targets
  private smoothedLookAt = new THREE.Vector3(0, 1.25, 1.0);
  private currentCamPos = new THREE.Vector3(0, 2.4, 6.4);
  private cinematicTime = 0;

  // State flags
  private isFishing = false;

  // DOM Pointer Event Management (Desktop drag listeners)
  private attachedElement: HTMLElement | null = null;
  private isPointerDown = false;
  private activePointerId: number | null = null;
  private prevPointerX = 0;
  private prevPointerY = 0;

  private onPointerDownBound: (e: PointerEvent) => void;
  private onPointerMoveBound: (e: PointerEvent) => void;
  private onPointerUpBound: (e: PointerEvent) => void;
  private onPointerCancelBound: (e: PointerEvent) => void;
  private onContextMenuBound: (e: MouseEvent) => void;
  private onWheelBound: (e: WheelEvent) => void;

  constructor(fov = 50, aspect = 16 / 9, near = 0.2, far = 600) {
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.copy(this.currentCamPos);

    this.onPointerDownBound = this.handlePointerDown.bind(this);
    this.onPointerMoveBound = this.handlePointerMove.bind(this);
    this.onPointerUpBound = this.handlePointerUp.bind(this);
    this.onPointerCancelBound = this.handlePointerUp.bind(this);
    this.onContextMenuBound = (e: MouseEvent) => e.preventDefault();
    this.onWheelBound = this.handleWheel.bind(this);
  }

  public setMode(mode: CameraMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    if (mode === 'CINEMATIC_MENU') {
      this.isPointerDown = false;
      this.activePointerId = null;
    }
  }

  /**
   * Attaches mouse/pointer drag listeners directly to the canvas element.
   */
  public attach(element: HTMLElement) {
    if (this.attachedElement === element) return;
    this.detach();

    this.attachedElement = element;
    element.addEventListener('pointerdown', this.onPointerDownBound);
    element.addEventListener('contextmenu', this.onContextMenuBound);
    element.addEventListener('wheel', this.onWheelBound, { passive: true });
    window.addEventListener('pointermove', this.onPointerMoveBound);
    window.addEventListener('pointerup', this.onPointerUpBound);
    window.addEventListener('pointercancel', this.onPointerCancelBound);
  }

  /**
   * Detaches all DOM listeners cleanly.
   */
  public detach() {
    if (!this.attachedElement) return;

    this.attachedElement.removeEventListener('pointerdown', this.onPointerDownBound);
    this.attachedElement.removeEventListener('contextmenu', this.onContextMenuBound);
    this.attachedElement.removeEventListener('wheel', this.onWheelBound);
    window.removeEventListener('pointermove', this.onPointerMoveBound);
    window.removeEventListener('pointerup', this.onPointerUpBound);
    window.removeEventListener('pointercancel', this.onPointerCancelBound);

    this.attachedElement = null;
    this.isPointerDown = false;
    this.activePointerId = null;
  }

  private handlePointerDown(e: PointerEvent) {
    // In CINEMATIC_MENU mode, ignore manual drag
    if (this.mode === 'CINEMATIC_MENU') return;
    if (e.button !== 0 && e.button !== 2) return;

    this.isPointerDown = true;
    this.activePointerId = e.pointerId;
    this.prevPointerX = e.clientX;
    this.prevPointerY = e.clientY;

    if (this.attachedElement) {
      try {
        this.attachedElement.setPointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    }
  }

  private handlePointerMove(e: PointerEvent) {
    if (this.mode === 'CINEMATIC_MENU') return;
    if (!this.isPointerDown || (this.activePointerId !== null && e.pointerId !== this.activePointerId)) {
      return;
    }

    const deltaX = e.clientX - this.prevPointerX;
    const deltaY = e.clientY - this.prevPointerY;
    this.prevPointerX = e.clientX;
    this.prevPointerY = e.clientY;

    const sensitivityX = 0.005;
    const sensitivityY = 0.004;
    this.rotate(deltaX * sensitivityX, deltaY * sensitivityY);
  }

  private handlePointerUp(e: PointerEvent) {
    if (this.activePointerId !== null && e.pointerId === this.activePointerId) {
      this.isPointerDown = false;
      this.activePointerId = null;

      if (this.attachedElement) {
        try {
          this.attachedElement.releasePointerCapture(e.pointerId);
        } catch {
          // Safe fallback
        }
      }
    }
  }

  private handleWheel(e: WheelEvent) {
    if (this.mode === 'CINEMATIC_MENU') return;
    const zoomDelta = Math.sign(e.deltaY) * 0.3;
    const minD = this.isFishing ? 3.6 : 4.0;
    const maxD = this.isFishing ? 5.2 : 6.5;
    this.baseDistance = Math.max(minD, Math.min(maxD, this.baseDistance + zoomDelta));
    this.targetDistance = this.isFishing ? this.baseDistance * 0.85 : this.baseDistance;
  }

  /**
   * Programmatic rotation (called by mobile touch controls or desktop swipe).
   */
  public rotate(deltaYaw: number, deltaPitch: number) {
    if (this.mode === 'CINEMATIC_MENU') return;
    this.targetYaw -= deltaYaw;
    this.targetPitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.targetPitch + deltaPitch));
  }

  /**
   * Adapts distance when player enters or leaves active fishing stance.
   */
  public setFishingMode(fishing: boolean) {
    this.isFishing = fishing;
    this.targetDistance = fishing ? 4.0 : this.baseDistance;
  }

  /**
   * Updates camera aspect ratio on viewport resize.
   */
  public handleResize(width: number, height: number) {
    if (height <= 0 || width <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Authoritative per-frame camera update.
   */
  public update(playerPos: THREE.Vector3, delta: number) {
    if (this.mode === 'CINEMATIC_MENU') {
      // Gentle cinematic panoramic glide for Main Menu
      this.cinematicTime += delta;
      const t = this.cinematicTime;
      const camX = Math.sin(t * 0.08) * 7.5;
      const camY = 2.5 + Math.sin(t * 0.06) * 0.35;
      const camZ = 7.8 + Math.cos(t * 0.08) * 1.5;

      this.currentCamPos.set(camX, camY, camZ);
      this.smoothedLookAt.set(0, 1.1, -4.0);

      this.camera.position.copy(this.currentCamPos);
      this.camera.lookAt(this.smoothedLookAt);
      return;
    }

    // --- GAMEPLAY THIRD-PERSON MODE ---
    // 1. Smoothly interpolate orbit angles with frame-rate independent exponential damping
    const angleLerp = 1.0 - Math.exp(-14 * delta);
    this.yaw = THREE.MathUtils.lerp(this.yaw, this.targetYaw, angleLerp);
    this.pitch = THREE.MathUtils.lerp(this.pitch, this.targetPitch, angleLerp);

    // 2. Smooth player focus target (chest / shoulder level ~1.25m)
    const desiredTarget = new THREE.Vector3(playerPos.x, playerPos.y + 1.25, playerPos.z);
    const targetLerp = 1.0 - Math.exp(-12 * delta);
    this.smoothedLookAt.lerp(desiredTarget, targetLerp);

    // 3. Compute nominal spherical offset vector from focus target
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);

    const dirX = -Math.sin(this.yaw) * cosPitch;
    const dirY = sinPitch;
    const dirZ = Math.cos(this.yaw) * cosPitch;

    // 4. Authoritative Obstacle & Terrain Collision Resolution
    let maxSafeDistance = this.targetDistance;

    // A. Check terrain along camera ray in discrete smooth test samples
    const sampleCount = 8;
    for (let i = 1; i <= sampleCount; i++) {
      const fraction = i / sampleCount;
      const testDist = this.targetDistance * fraction;
      const testX = this.smoothedLookAt.x + dirX * testDist;
      const testZ = this.smoothedLookAt.z + dirZ * testDist;
      const testY = this.smoothedLookAt.y + dirY * testDist;

      const groundH = getTerrainHeight(testX, testZ);
      const minRequiredY = groundH + 0.45;

      if (testY < minRequiredY) {
        // Ray intersects ground: pull allowable distance in front of intersection
        const safeDist = Math.max(this.minSafeDistance, testDist * 0.85);
        maxSafeDistance = Math.min(maxSafeDistance, safeDist);
        break;
      }
    }

    // B. Check world obstacles with height testing
    for (const obs of WORLD_OBSTACLES) {
      const rx = dirX;
      const rz = dirZ;
      const ox = obs.x - this.smoothedLookAt.x;
      const oz = obs.z - this.smoothedLookAt.z;

      const proj = ox * rx + oz * rz;
      if (proj > 0 && proj < this.targetDistance + obs.radius) {
        const perpSq = ox * ox + oz * oz - proj * proj;
        const safeRadius = obs.radius + 0.55;
        if (perpSq < safeRadius * safeRadius) {
          // Check if camera ray height clears the obstacle height
          const rayYAtObstacle = this.smoothedLookAt.y + dirY * proj;
          const obsGroundH = getTerrainHeight(obs.x, obs.z);
          const obsTopY = obsGroundH + (obs.height || 2.0);

          if (rayYAtObstacle < obsTopY + 0.3) {
            // Ray passes through obstacle: shorten distance safely
            const obstacleDist = Math.max(this.minSafeDistance, proj - safeRadius);
            maxSafeDistance = Math.min(maxSafeDistance, obstacleDist);
          }
        }
      }
    }

    // C. Hysteresis distance damping (Fast zoom-in to prevent clipping, smooth zoom-out)
    const isPullingIn = maxSafeDistance < this.currentDistance;
    const distanceLerpRate = isPullingIn ? 18 : 6;
    const distLerp = 1.0 - Math.exp(-distanceLerpRate * delta);
    this.currentDistance = THREE.MathUtils.lerp(this.currentDistance, maxSafeDistance, distLerp);

    // 5. Calculate final position
    let finalX = this.smoothedLookAt.x + dirX * this.currentDistance;
    let finalY = this.smoothedLookAt.y + dirY * this.currentDistance;
    let finalZ = this.smoothedLookAt.z + dirZ * this.currentDistance;

    // Minimum height safety above water plane and immediate ground
    const currentGroundH = getTerrainHeight(finalX, finalZ);
    const minAllowedY = Math.max(0.42, currentGroundH + 0.45);
    if (finalY < minAllowedY) {
      finalY = minAllowedY;
    }

    // 6. Smoothly move camera to position without jitter or snap
    const camLerp = 1.0 - Math.exp(-16 * delta);
    this.currentCamPos.x = THREE.MathUtils.lerp(this.currentCamPos.x, finalX, camLerp);
    this.currentCamPos.y = THREE.MathUtils.lerp(this.currentCamPos.y, finalY, camLerp);
    this.currentCamPos.z = THREE.MathUtils.lerp(this.currentCamPos.z, finalZ, camLerp);

    this.camera.position.copy(this.currentCamPos);
    this.camera.lookAt(this.smoothedLookAt.x, this.smoothedLookAt.y, this.smoothedLookAt.z);
  }

  public dispose() {
    this.detach();
  }
}
