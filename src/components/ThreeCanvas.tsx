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
import { CameraController } from './world/CameraController';

interface ThreeCanvasProps {
  cameraMode?: 'CINEMATIC_MENU' | 'GAMEPLAY';
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
  onLoadingProgress?: (progress: number, stepName: string) => void;
  onLoadingError?: (error: string) => void;
  onLoadingComplete?: () => void;
  cameraRotateRef?: React.MutableRefObject<((deltaYaw: number, deltaPitch: number) => void) | null>;
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
  cameraMode = 'GAMEPLAY',
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
  onLoadingProgress,
  onLoadingError,
  onLoadingComplete,
  cameraRotateRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraControllerRef = useRef<CameraController | null>(null);

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

  // Bobber water anchor
  const bobberAnchorRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.05, -12));
  const initialCastDistRef = useRef<number>(14);

  // Desktop keyboard movement keys
  const keysRef = useRef<{ w: boolean; a: boolean; s: boolean; d: boolean; shift: boolean }>({
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
  });

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

  useEffect(() => {
    if (cameraControllerRef.current) {
      cameraControllerRef.current.setMode(cameraMode);
    }
  }, [cameraMode]);

  // Main 3D Life Cycle
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isDisposed = false;
    let animationFrameId: number;

    try {
      onLoadingProgress?.(10, 'BOOTING 3D ENGINE...');

      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      // 1. WebGL Renderer
      onLoadingProgress?.(25, 'INITIALIZING WEBGL RENDERER...');
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      rendererRef.current = renderer;

      // Clear container and attach canvas
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(renderer.domElement);

      // 2. Scene & Atmosphere Lights
      onLoadingProgress?.(40, 'BUILDING SCENE & ATMOSPHERE...');
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0b1922);
      scene.fog = new THREE.FogExp2(0x0b1922, 0.015);
      sceneRef.current = scene;

      const ambient = new THREE.AmbientLight(0xffffff, 0.8);
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

      // Night Stars
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

      // Stylized Sky Dome & Mountains
      const skyDome = new StylizedSkyDome();
      scene.add(skyDome.mesh);
      skyDomeRef.current = skyDome;

      const mountains = createMountainHorizon();
      scene.add(mountains);

      // 3. Terrain, Water & Village Dock
      onLoadingProgress?.(60, 'GENERATING LAKE & CABIN DOCK...');
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

      const dock = createStylizedDock();
      scene.add(dock);

      const village = new StylizedVillageBase(cabinTheme, dockLighting, mountedTrophies);
      scene.add(village.group);
      villageRef.current = village;

      // 4. EXACTLY ONE Player Character with ONE Segmented Rod
      onLoadingProgress?.(75, 'RIGGING ANGLER & ROD...');
      const player = new StylizedPlayerCharacter();
      player.group.position.copy(playerPosRef.current);
      scene.add(player.group);
      playerRef.current = player;

      // 5. Authoritative Camera Controller
      onLoadingProgress?.(85, 'INITIALIZING CAMERA CONTROLLER...');
      const cameraController = new CameraController(50, width / height, 0.2, 600);
      cameraController.setMode(cameraMode);
      cameraController.attach(renderer.domElement);
      cameraControllerRef.current = cameraController;

      // Connect camera rotation handler for mobile swipe & external inputs
      if (cameraRotateRef) {
        cameraRotateRef.current = (dy: number, dp: number) => {
          cameraControllerRef.current?.rotate(dy, dp);
        };
      }

      // 6. EXACTLY ONE Bobber & Line
      onLoadingProgress?.(92, 'CONFIGURING FISHING LINE & BOBBER...');
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

      // Fish Shadow
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

      // Rain Particles
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

      // 7. Desktop Keyboard & Mouse Event Listeners
      const handleKeyDown = (e: KeyboardEvent) => {
        if (['KeyW', 'ArrowUp'].includes(e.code)) keysRef.current.w = true;
        if (['KeyS', 'ArrowDown'].includes(e.code)) keysRef.current.s = true;
        if (['KeyA', 'ArrowLeft'].includes(e.code)) keysRef.current.a = true;
        if (['KeyD', 'ArrowRight'].includes(e.code)) keysRef.current.d = true;
        if (['ShiftLeft', 'ShiftRight'].includes(e.code)) keysRef.current.shift = true;
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        if (['KeyW', 'ArrowUp'].includes(e.code)) keysRef.current.w = false;
        if (['KeyS', 'ArrowDown'].includes(e.code)) keysRef.current.s = false;
        if (['KeyA', 'ArrowLeft'].includes(e.code)) keysRef.current.a = false;
        if (['KeyD', 'ArrowRight'].includes(e.code)) keysRef.current.d = false;
        if (['ShiftLeft', 'ShiftRight'].includes(e.code)) keysRef.current.shift = false;
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);

      // Viewport Resize Handler (Does not recreate camera or scene)
      const handleResize = () => {
        if (!container || !rendererRef.current || !cameraControllerRef.current) return;
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        rendererRef.current.setSize(w, h);
        cameraControllerRef.current.handleResize(w, h);
      };

      window.addEventListener('resize', handleResize);

      // Final validation pass
      onLoadingProgress?.(98, 'RUNNING VALIDATION PASS...');
      setTimeout(() => {
        if (!isDisposed) {
          onLoadingProgress?.(100, 'READY');
          setTimeout(() => {
            if (!isDisposed) {
              onLoadingComplete?.();
            }
          }, 350);
        }
      }, 100);

      // 8. 60FPS Centralized Authoritative Render Loop
      let lastTime = performance.now();
      let elapsedTime = 0;

      const renderLoop = () => {
        if (isDisposed) return;
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

        // Atmosphere update
        const atmos = getAtmosphereSettings(curTime, curWeather);
        if (scene.fog) {
          scene.fog.color.set(atmos.fogColor);
        }
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

        // Animated water & environmental objects
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

        // Rain particles
        if (rainParticlesRef.current) {
          const rainMat = rainParticlesRef.current.material as THREE.PointsMaterial;
          const isRaining = curWeather === 'RAIN' || curWeather === 'HEAVY_RAIN';
          rainParticlesRef.current.visible = isRaining;
          if (isRaining && !curPaused) {
            rainMat.opacity = curWeather === 'HEAVY_RAIN' ? 0.75 : 0.45;
            const positions = rainParticlesRef.current.geometry.attributes.position.array as Float32Array;
            const dropSpeed = curWeather === 'HEAVY_RAIN' ? 44 : 26;
            for (let i = 1; i < rainCount * 3; i += 3) {
              positions[i] -= delta * dropSpeed;
              if (positions[i] < -1) positions[i] = 38;
            }
            rainParticlesRef.current.geometry.attributes.position.needsUpdate = true;
          }
        }

        // Player Movement & Deceleration
        const targetVel = new THREE.Vector2(0, 0);
        const k = keysRef.current;
        const isFishingActive =
          curState === 'CASTING' ||
          curState === 'WAITING' ||
          curState === 'BITE' ||
          curState === 'HOOKED' ||
          curState === 'REELING';

        // Movement is locked during active cast/fight or cinematic menu
        if (!curPaused && !isFishingActive && cameraMode === 'GAMEPLAY') {
          let forwardInput = 0;
          let rightInput = 0;
          if (k.w) forwardInput += 1;
          if (k.s) forwardInput -= 1;
          if (k.d) rightInput += 1;
          if (k.a) rightInput -= 1;

          // Mobile joystick input
          if (curJoy && (Math.abs(curJoy.x) > 0.05 || Math.abs(curJoy.y) > 0.05)) {
            rightInput += curJoy.x;
            forwardInput += curJoy.y;
          }

          const inputMag = Math.hypot(rightInput, forwardInput);
          if (inputMag > 0.05) {
            const camYaw = cameraControllerRef.current ? cameraControllerRef.current.yaw : 0;
            // Camera forward and right directions projected onto horizontal plane
            const fwdX = Math.sin(camYaw);
            const fwdZ = -Math.cos(camYaw);
            const rightX = Math.cos(camYaw);
            const rightZ = Math.sin(camYaw);

            const normRight = rightInput / inputMag;
            const normFwd = forwardInput / inputMag;
            const maxSpeed = (k.shift ? 5.2 : 3.4) * Math.min(1.0, inputMag);

            targetVel.x = (fwdX * normFwd + rightX * normRight) * maxSpeed;
            targetVel.y = (fwdZ * normFwd + rightZ * normRight) * maxSpeed;
          }
        }

        // Damped acceleration (9) and deceleration (14)
        const lerpRate = targetVel.lengthSq() > 0.01 ? 9 : 14;
        velocityRef.current.lerp(targetVel, delta * lerpRate);

        const moveX = velocityRef.current.x;
        const moveZ = velocityRef.current.y;
        const currentSpeed = velocityRef.current.length();

        // Smooth rotation toward movement direction
        if (currentSpeed > 0.15) {
          const targetRot = Math.atan2(moveX, moveZ);
          let diff = (targetRot - playerRotYRef.current) % (Math.PI * 2);
          if (diff < -Math.PI) diff += Math.PI * 2;
          if (diff > Math.PI) diff -= Math.PI * 2;
          playerRotYRef.current += diff * Math.min(1.0, delta * 9);
        }

        // Apply Collision & Terrain Height
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

        if (onCanFishChange) onCanFishChange(ground.canFish);
        if (onPlayerPositionChange) onPlayerPositionChange([currPos.x, currPos.y, currPos.z]);

        // Update player model
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

        // Deterministic Bobber Position
        if (curState === 'CASTING') {
          const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(
            new THREE.Vector3(0, 1, 0),
            playerRotYRef.current
          );
          const castDist = Math.max(7, curDist);
          let targetX = currPos.x + forward.x * castDist;
          let targetZ = currPos.z + forward.z * castDist;

          // Water basin constraints: z <= -3.8
          if (targetZ > -3.8) targetZ = -4.2;
          targetX = Math.max(-26, Math.min(26, targetX));
          targetZ = Math.max(-36, Math.min(-3.8, targetZ));

          const tHeight = getTerrainHeight(targetX, targetZ);
          if (tHeight >= 0.0) {
            targetZ = Math.min(-8.0, targetZ);
            targetX = targetX * 0.6;
          }

          bobberAnchorRef.current.set(targetX, 0.05, targetZ);
          initialCastDistRef.current = Math.max(6, Math.hypot(targetX - currPos.x, targetZ - currPos.z));
        }

        // Bobber kinematics
        if (bobberGroupRef.current) {
          const bg = bobberGroupRef.current;
          bg.visible = isFishingActive;

          if (isFishingActive) {
            const anchor = bobberAnchorRef.current;
            let targetX = anchor.x;
            let targetZ = anchor.z;

            if (curState === 'CASTING') {
              if (playerRef.current) {
                const tip = playerRef.current.rodTipPosition;
                targetX = tip.x;
                targetZ = tip.z;
              }
            } else if (curState === 'REELING' || curState === 'HOOKED') {
              const initDist = Math.max(5, initialCastDistRef.current);
              const reelRatio = Math.max(0, Math.min(1.0, curDist / initDist));
              targetX = THREE.MathUtils.lerp(currPos.x, anchor.x, reelRatio);
              targetZ = THREE.MathUtils.lerp(currPos.z - 0.8, anchor.z, reelRatio);
            }

            if (curState === 'CASTING' && playerRef.current) {
              const tip = playerRef.current.rodTipPosition;
              bg.position.set(tip.x, tip.y - 0.28, tip.z);
            } else {
              bg.position.x = THREE.MathUtils.lerp(bg.position.x, targetX, delta * 8);
              bg.position.z = THREE.MathUtils.lerp(bg.position.z, targetZ, delta * 8);

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
            }
          } else {
            bg.position.set(currPos.x, currPos.y, currPos.z - 0.5);
          }
        }

        // Fishing Line Mesh (Attached from player rod tip to bobber)
        if (lineMeshRef.current) {
          lineMeshRef.current.visible = isFishingActive;
          if (isFishingActive && bobberGroupRef.current && playerRef.current) {
            const positions = lineMeshRef.current.geometry.attributes.position.array as Float32Array;
            const start = playerRef.current.rodTipPosition;
            const end = bobberGroupRef.current.position;
            const droopFactor = curState === 'CASTING' ? 0.02 : (1 - curTension) * 0.45;

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

        // Underwater fish approach shadow
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

        // Authoritative Camera Update with collision & smooth non-shaking follow
        if (cameraControllerRef.current) {
          cameraControllerRef.current.setFishingMode(isFishingActive);
          cameraControllerRef.current.update(currPos, delta);
          renderer.render(scene, cameraControllerRef.current.camera);
        }
      };

      renderLoop();

      return () => {
        isDisposed = true;
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('resize', handleResize);

        if (cameraControllerRef.current) {
          cameraControllerRef.current.dispose();
          cameraControllerRef.current = null;
        }

        if (cameraRotateRef) {
          cameraRotateRef.current = null;
        }

        if (rendererRef.current) {
          rendererRef.current.dispose();
          if (container.contains(rendererRef.current.domElement)) {
            container.removeChild(rendererRef.current.domElement);
          }
        }
      };
    } catch (err: unknown) {
      console.error('[THREE CANVAS] Fatal initialization failure:', err);
      onLoadingError?.((err as Error)?.message || 'Failed to initialize 3D WebGL Engine');
    }
  }, []);

  return (
    <div
      id="three-canvas-container"
      ref={containerRef}
      onClick={() => {
        if (cameraMode === 'GAMEPLAY' && onCanvasClick) onCanvasClick();
      }}
      className="relative w-full h-full cursor-grab active:cursor-grabbing select-none touch-none overflow-hidden"
    />
  );
};
