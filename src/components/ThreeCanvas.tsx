import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  FishingState,
  WeatherType,
  TimeOfDay,
  RodItem,
  GearCustomization,
  CabinTheme,
  DockLighting,
  MountedTrophy,
} from '../types';
import { createStylizedTerrain, getTerrainHeight } from './world/Terrain';
import { StylizedWater } from './world/Water';
import { createTreeForest } from './world/Trees';
import { EnvironmentProps } from './world/Props';
import { createMountainHorizon, StylizedSkyDome } from './world/EnvironmentHorizon';
import { StylizedPlayerCharacter } from './world/PlayerCharacter';
import { createStylizedDock } from './world/Dock';
import { StylizedVillageBase, CABIN_WALL_COLORS } from './world/VillageBase';
import { getAtmosphereSettings } from './world/Atmosphere';
import { getGroundInfo, resolvePlayerCollision } from './world/Collision';

interface ThreeCanvasProps {
  fishingState: FishingState;
  castPower: number;
  lineTension: number;
  fishDistance: number;
  weather: WeatherType;
  timeOfDay: TimeOfDay;
  equippedRod: RodItem;
  customization: GearCustomization;
  cabinTheme: CabinTheme;
  dockLighting: DockLighting;
  mountedTrophies: MountedTrophy[];
  isPaused?: boolean;
  onCanFishChange?: (canFish: boolean) => void;
  onPlayerPositionChange?: (pos: [number, number, number]) => void;
  joystickInput?: { x: number; y: number };
  onCanvasClick?: () => void;
}

const REEL_METAL_COLORS: Record<string, number> = {
  SILVER: 0xcbd5e1,
  GOLD: 0xfacc15,
  ONYX: 0x1e293b,
  ROSE_GOLD: 0xfb7185,
  TITANIUM_BLUE: 0x38bdf8,
};

const LINE_TINT_COLORS: Record<string, number> = {
  CLEAR: 0xffffff,
  NEON_GREEN: 0x4ade80,
  BRAIDED_GOLD: 0xeab308,
  DEEP_BLUE: 0x38bdf8,
  SUNSET_ORANGE: 0xf97316,
};

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  fishingState,
  castPower,
  lineTension,
  fishDistance,
  weather,
  timeOfDay,
  equippedRod,
  customization,
  cabinTheme,
  dockLighting,
  mountedTrophies,
  isPaused = false,
  onCanFishChange,
  onPlayerPositionChange,
  joystickInput,
  onCanvasClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Entities
  const playerRef = useRef<StylizedPlayerCharacter | null>(null);
  const waterRef = useRef<StylizedWater | null>(null);
  const villageRef = useRef<StylizedVillageBase | null>(null);
  const skyDomeRef = useRef<StylizedSkyDome | null>(null);
  const propsRef = useRef<EnvironmentProps | null>(null);
  const bobberGroupRef = useRef<THREE.Group | null>(null);
  const lineMeshRef = useRef<THREE.Line | null>(null);
  const fishShadowRef = useRef<THREE.Mesh | null>(null);

  // Lights & weather
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const starsRef = useRef<THREE.Points | null>(null);
  const rainParticlesRef = useRef<THREE.Points | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  // Player state: start cleanly on dock walkway facing lake (-Z)
  const playerPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.44, 1.2));
  const playerRotYRef = useRef<number>(Math.PI);
  const velocityRef = useRef<THREE.Vector2>(new THREE.Vector2(0, 0));
  // Bobber fixed water anchor and cast distance for current session
  const bobberAnchorRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.05, -12));
  const initialCastDistRef = useRef<number>(14);

  // Third-person camera orbit (distance: 4.8 - 5.5m, height: 2.2m)
  const cameraYawRef = useRef<number>(0);
  const cameraPitchRef = useRef<number>(0.22);

  // Desktop keyboard movement keys
  const keysRef = useRef<{ w: boolean; a: boolean; s: boolean; d: boolean; shift: boolean }>({
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
  });

  // Touch drag tracking for right-side camera rotation on mobile
  const touchStartRef = useRef<{ x: number; y: number; id: number } | null>(null);

  // State mirror for 60fps render loop
  const stateRef = useRef({
    fishingState,
    castPower,
    lineTension,
    fishDistance,
    weather,
    timeOfDay,
    equippedRod,
    customization,
    cabinTheme,
    dockLighting,
    mountedTrophies,
    isPaused,
    joystickInput,
  });

  useEffect(() => {
    stateRef.current = {
      fishingState,
      castPower,
      lineTension,
      fishDistance,
      weather,
      timeOfDay,
      equippedRod,
      customization,
      cabinTheme,
      dockLighting,
      mountedTrophies,
      isPaused,
      joystickInput,
    };
  }, [
    fishingState,
    castPower,
    lineTension,
    fishDistance,
    weather,
    timeOfDay,
    equippedRod,
    customization,
    cabinTheme,
    dockLighting,
    mountedTrophies,
    isPaused,
    joystickInput,
  ]);

  // Keyboard listeners for WASD
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') keysRef.current.w = true;
      if (code === 'KeyA' || code === 'ArrowLeft') keysRef.current.a = true;
      if (code === 'KeyS' || code === 'ArrowDown') keysRef.current.s = true;
      if (code === 'KeyD' || code === 'ArrowRight') keysRef.current.d = true;
      if (code === 'ShiftLeft' || code === 'ShiftRight') keysRef.current.shift = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') keysRef.current.w = false;
      if (code === 'KeyA' || code === 'ArrowLeft') keysRef.current.a = false;
      if (code === 'KeyS' || code === 'ArrowDown') keysRef.current.s = false;
      if (code === 'KeyD' || code === 'ArrowRight') keysRef.current.d = false;
      if (code === 'ShiftLeft' || code === 'ShiftRight') keysRef.current.shift = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Three.js scene initialization
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.Fog(0xb2d9fb, 35, 135);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      350
    );
    camera.position.set(0, 2.6, 6.2);
    camera.lookAt(0, 1.2, 0);
    cameraRef.current = camera;

    // 3. Lighting Rig
    const ambient = new THREE.AmbientLight(0x93c5fd, 0.55);
    scene.add(ambient);
    ambientLightRef.current = ambient;

    const hemi = new THREE.HemisphereLight(0xbfe3ff, 0x3d4f3b, 0.6);
    hemi.position.set(0, 50, 0);
    scene.add(hemi);
    hemiLightRef.current = hemi;

    const sun = new THREE.DirectionalLight(0xfff3d6, 1.4);
    sun.position.set(30, 45, -35);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 150;
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    sun.shadow.bias = -0.0004;
    scene.add(sun);
    sunLightRef.current = sun;

    // 4. Night Stars
    const starCount = 600;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 160;
      starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = Math.abs(r * Math.cos(phi)) + 15;
      starPositions[i + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      transparent: true,
      opacity: 0,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);
    starsRef.current = stars;

    // 5. Stylized Sky Dome
    const skyDome = new StylizedSkyDome();
    scene.add(skyDome.mesh);
    skyDomeRef.current = skyDome;

    // 6. Mountain Horizon
    const mountains = createMountainHorizon();
    scene.add(mountains);

    // 7. Terrain & Forest & Water
    const terrain = createStylizedTerrain();
    scene.add(terrain);

    const forest = createTreeForest();
    scene.add(forest);

    const water = new StylizedWater();
    scene.add(water.mesh);
    waterRef.current = water;

    const envProps = new EnvironmentProps();
    scene.add(envProps.group);
    propsRef.current = envProps;

    // 8. Dock
    const dock = createStylizedDock();
    scene.add(dock);

    // 9. Village & Cabin Base
    const village = new StylizedVillageBase(cabinTheme, dockLighting, mountedTrophies);
    scene.add(village.group);
    villageRef.current = village;

    // 10. EXACTLY ONE Player Character with ONE Fishing Rod attached
    const player = new StylizedPlayerCharacter();
    player.group.position.copy(playerPosRef.current);
    scene.add(player.group);
    playerRef.current = player;

    // 11. EXACTLY ONE Bobber (hidden until active fishing)
    const bobberGroup = new THREE.Group();
    bobberGroup.position.set(0, 0.08, -12);
    bobberGroup.visible = false;

    const bobberTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 })
    );
    const bobberBottom = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
    );
    const bobberAntenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.22, 6),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    bobberAntenna.position.y = 0.16;
    bobberGroup.add(bobberTop);
    bobberGroup.add(bobberBottom);
    bobberGroup.add(bobberAntenna);
    scene.add(bobberGroup);
    bobberGroupRef.current = bobberGroup;

    // 12. EXACTLY ONE 3D Fishing Line (hidden when not fishing)
    const lineGeo = new THREE.BufferGeometry();
    const linePointsCount = 20;
    const linePositions = new Float32Array(linePointsCount * 3);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: LINE_TINT_COLORS[customization.lineTint] || 0xffffff,
      transparent: true,
      opacity: 0.85,
    });
    const lineMesh = new THREE.Line(lineGeo, lineMat);
    lineMesh.visible = false;
    scene.add(lineMesh);
    lineMeshRef.current = lineMesh;

    // 13. Fish Shadow
    const fishShadowGeo = new THREE.ConeGeometry(0.35, 1.4, 8);
    fishShadowGeo.rotateX(Math.PI / 2);
    const fishShadowMat = new THREE.MeshBasicMaterial({
      color: 0x073129,
      transparent: true,
      opacity: 0,
    });
    const fishShadow = new THREE.Mesh(fishShadowGeo, fishShadowMat);
    fishShadow.position.set(0, -0.28, -12);
    scene.add(fishShadow);
    fishShadowRef.current = fishShadow;

    // 14. Rain
    const rainCount = 1800;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount * 3; i += 3) {
      rainPos[i] = (Math.random() - 0.5) * 90;
      rainPos[i + 1] = Math.random() * 40;
      rainPos[i + 2] = (Math.random() - 0.5) * 90;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0xa5f3fc,
      size: 0.35,
      transparent: true,
      opacity: 0,
    });
    const rain = new THREE.Points(rainGeo, rainMat);
    scene.add(rain);
    rainParticlesRef.current = rain;

    // Resize handling
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Desktop Mouse Drag for Camera Orbit
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      cameraYawRef.current -= dx * 0.006;
      cameraPitchRef.current = Math.max(-0.15, Math.min(0.65, cameraPitchRef.current + dy * 0.005));
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Mobile touch controls: Right half of screen controls camera swipe
    const handleTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.clientX > container.clientWidth * 0.35) {
          touchStartRef.current = { x: touch.clientX, y: touch.clientY, id: touch.identifier };
          break;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchStartRef.current.id) {
          const dx = touch.clientX - touchStartRef.current.x;
          const dy = touch.clientY - touchStartRef.current.y;
          touchStartRef.current.x = touch.clientX;
          touchStartRef.current.y = touch.clientY;

          cameraYawRef.current -= dx * 0.007;
          cameraPitchRef.current = Math.max(-0.15, Math.min(0.65, cameraPitchRef.current + dy * 0.006));
          break;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchStartRef.current.id) {
          touchStartRef.current = null;
          break;
        }
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    // 60FPS Centralized Render Loop
    let animationFrameId: number;
    let lastTime = performance.now();
    let elapsedTime = 0;

    const renderLoop = () => {
      animationFrameId = requestAnimationFrame(renderLoop);

      const now = performance.now();
      const delta = Math.min(0.06, (now - lastTime) / 1000);
      lastTime = now;

      const {
        fishingState: curState,
        castPower: curCastPower,
        lineTension: curTension,
        fishDistance: curDist,
        weather: curWeather,
        timeOfDay: curTime,
        customization: curCustom,
        cabinTheme: curCabinTheme,
        isPaused: curPaused,
        joystickInput: curJoy,
      } = stateRef.current;

      if (!curPaused) {
        elapsedTime += delta;
      }

      // 1. Atmosphere
      const atmos = getAtmosphereSettings(curTime, curWeather);
      scene.fog!.color.set(atmos.fogColor);
      sun.color.set(atmos.sunColor);
      sun.intensity = atmos.sunIntensity;
      ambient.color.set(atmos.ambientColor);
      ambient.intensity = atmos.ambientIntensity;
      hemi.color.set(atmos.hemiSkyColor);
      hemi.groundColor.set(atmos.hemiGroundColor);

      if (starsRef.current) {
        (starsRef.current.material as THREE.PointsMaterial).opacity = atmos.starsOpacity;
      }
      if (skyDomeRef.current) {
        (skyDomeRef.current.mesh.material as THREE.MeshBasicMaterial).color.set(atmos.skyColor);
        if (!curPaused) skyDomeRef.current.update(delta);
      }
      renderer.toneMappingExposure = atmos.exposure;

      // 2. Water & props
      if (waterRef.current && !curPaused) waterRef.current.update(elapsedTime, delta);
      if (propsRef.current && !curPaused) propsRef.current.update(elapsedTime);
      if (villageRef.current) {
        if (!curPaused) villageRef.current.update(elapsedTime, delta);
        if (villageRef.current.cabinWallMesh) {
          (villageRef.current.cabinWallMesh.material as THREE.MeshStandardMaterial).color.set(
            CABIN_WALL_COLORS[curCabinTheme] || 0x9a3412
          );
        }
      }

      // 3. Rain
      if (rainParticlesRef.current) {
        const rMat = rainParticlesRef.current.material as THREE.PointsMaterial;
        rMat.opacity = atmos.rainOpacity;
        if (atmos.rainOpacity > 0 && !curPaused) {
          const positions = rainGeo.attributes.position.array as Float32Array;
          const speed = curWeather === 'HEAVY_RAIN' ? 45 : 28;
          for (let i = 1; i < rainPos.length; i += 3) {
            positions[i] -= speed * delta;
            if (positions[i] < -0.5) positions[i] = 38;
          }
          rainGeo.attributes.position.needsUpdate = true;
        }
      }

      // 4. Player Movement & Grounding (Smooth Acceleration / Deceleration)
      const canMove = curState === 'IDLE' && !curPaused;
      const targetVel = new THREE.Vector2(0, 0);

      if (canMove) {
        // Desktop WASD
        const k = keysRef.current;
        let kx = 0;
        let kz = 0;
        if (k.w) kz -= 1;
        if (k.s) kz += 1;
        if (k.a) kx -= 1;
        if (k.d) kx += 1;

        // Mobile joystick input
        if (curJoy && (Math.abs(curJoy.x) > 0.05 || Math.abs(curJoy.y) > 0.05)) {
          kx += curJoy.x;
          kz -= curJoy.y;
        }

        const inputMag = Math.hypot(kx, kz);
        if (inputMag > 0.05) {
          const angle = Math.atan2(kx, kz) + cameraYawRef.current;
          const maxSpeed = (k.shift ? 5.2 : 3.4) * Math.min(1.0, inputMag);
          targetVel.x = Math.sin(angle) * maxSpeed;
          targetVel.y = Math.cos(angle) * maxSpeed;
        }
      }

      // Smooth interpolation for acceleration (9) and deceleration (12)
      const lerpSpeed = targetVel.lengthSq() > 0.01 ? 9 : 12;
      velocityRef.current.lerp(targetVel, delta * lerpSpeed);

      const moveX = velocityRef.current.x;
      const moveZ = velocityRef.current.y;
      const currentSpeed = velocityRef.current.length();

      // Smooth rotation toward movement direction
      if (currentSpeed > 0.15) {
        const targetRot = Math.atan2(moveX, moveZ);
        // Shortest angle difference to prevent 360 spinning
        let diff = (targetRot - playerRotYRef.current) % (Math.PI * 2);
        if (diff < -Math.PI) diff += Math.PI * 2;
        if (diff > Math.PI) diff -= Math.PI * 2;
        playerRotYRef.current += diff * Math.min(1.0, delta * 9);
      }

      // Apply collision & ground resolution
      const currPos = playerPosRef.current;
      const [resolvedX, resolvedZ] = resolvePlayerCollision(
        currPos.x,
        currPos.z,
        currPos.x + moveX * delta,
        currPos.z + moveZ * delta
      );
      const ground = getGroundInfo(resolvedX, resolvedZ);

      currPos.x = resolvedX;
      currPos.y = ground.y;
      currPos.z = resolvedZ;

      if (onCanFishChange) {
        onCanFishChange(ground.canFish);
      }
      if (onPlayerPositionChange) {
        onPlayerPositionChange([currPos.x, currPos.y, currPos.z]);
      }

      // Update player character mesh
      if (playerRef.current) {
        playerRef.current.group.position.copy(currPos);
        playerRef.current.group.rotation.y = playerRotYRef.current;
        playerRef.current.setCustomRodColor(curCustom.rodColor);
        playerRef.current.setCustomReelColor(REEL_METAL_COLORS[curCustom.reelMetalTint] || 0xcbd5e1);

        const isWalking = currentSpeed > 0.1;
        playerRef.current.updateAnimation(
          curState,
          curTension,
          curCastPower,
          elapsedTime,
          delta,
          isWalking,
          currentSpeed / 3.4
        );
      }

      // Update bobber landing target whenever entering CASTING
      if (curState === 'CASTING') {
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          playerRotYRef.current
        );
        const castDist = Math.max(7, curDist);
        let targetX = currPos.x + forward.x * castDist;
        let targetZ = currPos.z + forward.z * castDist;

        // Keep strictly in water: dock is z >= -3.5, lake is z <= -3.8
        if (targetZ > -3.8) targetZ = -4.2;
        targetX = Math.max(-26, Math.min(26, targetX));
        targetZ = Math.max(-36, Math.min(-3.8, targetZ));

        // Terrain height validation
        const tHeight = getTerrainHeight(targetX, targetZ);
        if (tHeight >= 0.0) {
          targetZ = Math.min(-8.0, targetZ);
          targetX = targetX * 0.6;
        }

        bobberAnchorRef.current.set(targetX, 0.05, targetZ);
        initialCastDistRef.current = Math.max(6, Math.hypot(targetX - currPos.x, targetZ - currPos.z));
      }

      // 5. Bobber Visibility & Water Physics
      const isFishingActive =
        curState === 'CASTING' ||
        curState === 'WAITING' ||
        curState === 'BITE' ||
        curState === 'HOOKED' ||
        curState === 'REELING';

      if (bobberGroupRef.current) {
        bobberGroupRef.current.visible = isFishingActive;
        const bg = bobberGroupRef.current;

        if (isFishingActive) {
          const anchor = bobberAnchorRef.current;
          let targetX = anchor.x;
          let targetZ = anchor.z;

          if (curState === 'CASTING') {
            // During cast charge, bobber moves smoothly along cast preparation arc
            if (playerRef.current) {
              const tip = playerRef.current.rodTipPosition;
              targetX = THREE.MathUtils.lerp(tip.x, anchor.x, curCastPower * 0.35);
              targetZ = THREE.MathUtils.lerp(tip.z, anchor.z, curCastPower * 0.35);
            }
          } else if (curState === 'REELING' || curState === 'HOOKED') {
            // As fish distance decreases, bobber pulls smoothly along line toward dock
            const initDist = Math.max(5, initialCastDistRef.current);
            const reelRatio = Math.max(0, Math.min(1.0, curDist / initDist));
            targetX = THREE.MathUtils.lerp(currPos.x, anchor.x, reelRatio);
            targetZ = THREE.MathUtils.lerp(currPos.z - 0.8, anchor.z, reelRatio);
          }

          bg.position.x = THREE.MathUtils.lerp(bg.position.x, targetX, delta * 8);
          bg.position.z = THREE.MathUtils.lerp(bg.position.z, targetZ, delta * 8);

          // Water surface wave height
          const waterY = Math.sin(bg.position.x * 0.18 + elapsedTime * 1.5) * 0.06;
          let bobberY = waterY + 0.05;

          if (curState === 'BITE') {
            bobberY -= 0.16 + Math.sin(elapsedTime * 22) * 0.05;
            bg.rotation.z = Math.sin(elapsedTime * 18) * 0.3;
            if (waterRef.current && Math.random() > 0.4) {
              waterRef.current.addRipple(bg.position.x, bg.position.z, 1.4);
            }
          } else if (curState === 'HOOKED' || curState === 'REELING') {
            bobberY -= 0.08 + Math.sin(elapsedTime * 14) * 0.04;
            if (waterRef.current && Math.random() > 0.6) {
              waterRef.current.addRipple(bg.position.x, bg.position.z, 0.9);
            }
          } else {
            bg.rotation.z = Math.sin(elapsedTime * 2) * 0.06;
          }
          bg.position.y = bobberY;
        } else {
          // Keep reset position at player's feet
          bg.position.set(currPos.x, currPos.y, currPos.z - 0.5);
        }
      }

      // 6. EXACTLY ONE 3D Fishing Line
      if (lineMeshRef.current) {
        lineMeshRef.current.visible = isFishingActive;
        if (isFishingActive && bobberGroupRef.current && playerRef.current) {
          const positions = lineMeshRef.current.geometry.attributes.position.array as Float32Array;
          const start = playerRef.current.rodTipPosition;
          const end = bobberGroupRef.current.position;
          const droopFactor = (1 - curTension) * 0.45;

          for (let i = 0; i < linePointsCount; i++) {
            const t = i / (linePointsCount - 1);
            const px = THREE.MathUtils.lerp(start.x, end.x, t);
            const pz = THREE.MathUtils.lerp(start.z, end.z, t);
            const sag = Math.sin(t * Math.PI) * droopFactor;
            const py = THREE.MathUtils.lerp(start.y, end.y, t) - sag;

            positions[i * 3] = px;
            positions[i * 3 + 1] = py;
            positions[i * 3 + 2] = pz;
          }
          lineMeshRef.current.geometry.attributes.position.needsUpdate = true;
        }
      }

      // 7. Fish Shadow (Approaching underwater)
      if (fishShadowRef.current && bobberGroupRef.current) {
        const fs = fishShadowRef.current;
        const bg = bobberGroupRef.current;
        const fsMat = fs.material as THREE.MeshBasicMaterial;

        if (isFishingActive && (curState === 'WAITING' || curState === 'BITE' || curState === 'HOOKED')) {
          fs.visible = true;
          fsMat.opacity = THREE.MathUtils.lerp(fsMat.opacity, 0.7, delta * 3);
          const circleOffset = Math.sin(elapsedTime * 2.2) * 0.9;
          fs.position.x = bg.position.x + circleOffset;
          fs.position.z = bg.position.z + Math.cos(elapsedTime * 2.2) * 0.9;
          fs.position.y = -0.26;
          fs.rotation.y = elapsedTime * 2.2;
        } else {
          fsMat.opacity = THREE.MathUtils.lerp(fsMat.opacity, 0, delta * 4);
          if (fsMat.opacity < 0.05) fs.visible = false;
        }
      }

      // 8. Third-Person Camera with smooth lag and gentle feedback
      if (cameraRef.current) {
        const cam = cameraRef.current;

        const camDist = curState === 'IDLE' ? 5.2 : 4.4; // Moves slightly closer during fishing
        const camHeight = 2.2 + Math.sin(cameraPitchRef.current) * 2.0;
        const orbitRadius = camDist * Math.cos(cameraPitchRef.current);

        const camTargetX = currPos.x - Math.sin(cameraYawRef.current) * orbitRadius;
        const camTargetZ = currPos.z + Math.cos(cameraYawRef.current) * orbitRadius;
        const camTargetY = Math.max(0.6, currPos.y + camHeight);

        let biteShake = 0;
        if (curState === 'BITE') {
          biteShake = Math.sin(elapsedTime * 30) * 0.03;
        } else if (curState === 'REELING') {
          biteShake = Math.sin(elapsedTime * 14) * 0.035;
        }

        cam.position.lerp(
          new THREE.Vector3(camTargetX + biteShake, camTargetY, camTargetZ + biteShake * 0.5),
          delta * 4.5
        );
        cam.lookAt(currPos.x, currPos.y + 1.1, currPos.z);
      }

      renderer.render(scene, camera);
    };

    renderLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);

      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.dispose();
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, []);

  return (
    <div
      id="three-canvas-container"
      ref={containerRef}
      onClick={onCanvasClick}
      className="relative w-full h-full cursor-grab active:cursor-grabbing select-none touch-none overflow-hidden"
    />
  );
};
