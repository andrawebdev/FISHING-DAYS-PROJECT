import * as THREE from 'three';
import { getTerrainHeight } from './Terrain';
import { WORLD_OBSTACLES } from './Collision';

/**
 * Authoritative Third-Person Camera Controller:
 * - Completely manages yaw, pitch, distance, and collision internally.
 * - Manages its own DOM pointer/mouse event listeners without requiring manual DOM manipulation by callers.
 * - Guarantees smooth, non-shaking, critically-damped third-person follow behavior.
 * - Clamps pitch to prevent ground flips or gimbal singularity.
 * - Handles ray-based terrain and obstacle collision resolution with hysteresis to prevent jitter.
 */
export class CameraController {
  public camera: THREE.PerspectiveCamera;

  // Orbit angles (radians)
  public yaw = 0;
  public pitch = 0.22;
  private targetYaw = 0;
  private targetPitch = 0.22;

  // Pitch constraints: -12° (-0.21 rad) to +54° (0.94 rad)
  private readonly minPitch = -0.21;
  private readonly maxPitch = 0.94;

  // Camera distances
  private baseDistance = 5.2;
  private targetDistance = 5.2;
  private currentDistance = 5.2;

  // Smooth tracking targets
  private smoothedLookAt = new THREE.Vector3(0, 1.25, 1.2);
  private currentCamPos = new THREE.Vector3(0, 2.4, 6.4);

  // State flags
  private isFishing = false;

  // DOM Event Management (Self-contained, no manual DOM manipulation needed in components)
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

  constructor(fov = 50, aspect = 16 / 9, near = 0.1, far = 220) {
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.copy(this.currentCamPos);

    // Bind event handlers for clean lifecycle attachment/detachment
    this.onPointerDownBound = this.handlePointerDown.bind(this);
    this.onPointerMoveBound = this.handlePointerMove.bind(this);
    this.onPointerUpBound = this.handlePointerUp.bind(this);
    this.onPointerCancelBound = this.handlePointerUp.bind(this);
    this.onContextMenuBound = (e: MouseEvent) => e.preventDefault();
    this.onWheelBound = this.handleWheel.bind(this);
  }

  /**
   * Attaches mouse and pointer drag listeners directly to the WebGL canvas element.
   * Completely encapsulates user interaction without manual DOM manipulation in React.
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
    // Only respond to primary (left) or secondary (right) mouse button, or touch
    if (e.button !== 0 && e.button !== 2) return;

    this.isPointerDown = true;
    this.activePointerId = e.pointerId;
    this.prevPointerX = e.clientX;
    this.prevPointerY = e.clientY;

    if (this.attachedElement) {
      try {
        this.attachedElement.setPointerCapture(e.pointerId);
      } catch {
        // Safe fallback for browsers without setPointerCapture support
      }
    }
  }

  private handlePointerMove(e: PointerEvent) {
    if (!this.isPointerDown || (this.activePointerId !== null && e.pointerId !== this.activePointerId)) {
      return;
    }

    const deltaX = e.clientX - this.prevPointerX;
    const deltaY = e.clientY - this.prevPointerY;
    this.prevPointerX = e.clientX;
    this.prevPointerY = e.clientY;

    // Smooth rotational sensitivity
    const sensitivityX = 0.0055;
    const sensitivityY = 0.0045;
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
    // Smooth zoom adjustment within safe limits
    const zoomDelta = Math.sign(e.deltaY) * 0.35;
    const minD = this.isFishing ? 3.6 : 4.0;
    const maxD = this.isFishing ? 5.5 : 7.0;
    this.baseDistance = Math.max(minD, Math.min(maxD, this.baseDistance + zoomDelta));
    this.targetDistance = this.isFishing ? this.baseDistance * 0.85 : this.baseDistance;
  }

  /**
   * Programmatic rotation (called by mobile touch controls or gamepad).
   */
  public rotate(deltaYaw: number, deltaPitch: number) {
    this.targetYaw -= deltaYaw;
    this.targetPitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.targetPitch + deltaPitch));
  }

  /**
   * Adapts distance when player enters or leaves active fishing stance.
   */
  public setFishingMode(fishing: boolean) {
    this.isFishing = fishing;
    this.targetDistance = fishing ? 4.2 : this.baseDistance;
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
   * Authoritative per-frame update called in the render loop.
   * Guarantees smooth, non-shaking camera motion with collision avoidance.
   */
  public update(playerPos: THREE.Vector3, delta: number) {
    // 1. Smoothly interpolate orbit angles with frame-rate independent exponential damping
    const angleLerp = 1.0 - Math.exp(-16 * delta);
    this.yaw = THREE.MathUtils.lerp(this.yaw, this.targetYaw, angleLerp);
    this.pitch = THREE.MathUtils.lerp(this.pitch, this.targetPitch, angleLerp);

    // 2. Smooth player focus target (chest / shoulder level ~1.22m)
    const desiredTarget = new THREE.Vector3(playerPos.x, playerPos.y + 1.22, playerPos.z);
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
    const sampleCount = 6;
    for (let i = 1; i <= sampleCount; i++) {
      const fraction = i / sampleCount;
      const testDist = this.targetDistance * fraction;
      const testX = this.smoothedLookAt.x + dirX * testDist;
      const testZ = this.smoothedLookAt.z + dirZ * testDist;
      const testY = this.smoothedLookAt.y + dirY * testDist;

      const groundH = getTerrainHeight(testX, testZ);
      const minRequiredY = groundH + 0.55;

      if (testY < minRequiredY) {
        // Ray intersects ground: pull allowable distance in front of intersection
        const safeDist = Math.max(1.8, testDist * 0.88);
        maxSafeDistance = Math.min(maxSafeDistance, safeDist);
        break;
      }
    }

    // B. Check world obstacles (Cabin, Boathouse, Large boulders)
    for (const obs of WORLD_OBSTACLES) {
      // 2D ray-circle closest approach from smoothedLookAt to desiredCamPos
      const rx = dirX;
      const rz = dirZ;
      const ox = obs.x - this.smoothedLookAt.x;
      const oz = obs.z - this.smoothedLookAt.z;

      // Project obstacle center onto ray
      const proj = ox * rx + oz * rz;
      if (proj > 0 && proj < this.targetDistance + obs.radius) {
        // Perpendicular distance from obstacle center to ray
        const perpSq = ox * ox + oz * oz - proj * proj;
        const safeRadius = obs.radius + 0.65;
        if (perpSq < safeRadius * safeRadius) {
          // Ray passes through obstacle: shorten distance safely
          const obstacleDist = Math.max(1.8, proj - safeRadius);
          maxSafeDistance = Math.min(maxSafeDistance, obstacleDist);
        }
      }
    }

    // C. Hysteresis distance damping (Fast zoom-in to prevent clipping, smooth zoom-out to prevent pop)
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
    const minAllowedY = Math.max(0.42, currentGroundH + 0.55);
    if (finalY < minAllowedY) {
      finalY = minAllowedY;
    }

    // 6. Smoothly move camera to position without jitter, pop, or screen shake
    const camLerp = 1.0 - Math.exp(-16 * delta);
    this.currentCamPos.x = THREE.MathUtils.lerp(this.currentCamPos.x, finalX, camLerp);
    this.currentCamPos.y = THREE.MathUtils.lerp(this.currentCamPos.y, finalY, camLerp);
    this.currentCamPos.z = THREE.MathUtils.lerp(this.currentCamPos.z, finalZ, camLerp);

    this.camera.position.copy(this.currentCamPos);
    this.camera.lookAt(this.smoothedLookAt.x, this.smoothedLookAt.y, this.smoothedLookAt.z);
  }

  /**
   * Complete cleanup.
   */
  public dispose() {
    this.detach();
  }
}
