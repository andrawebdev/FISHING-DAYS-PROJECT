import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  FishingState,
  WeatherType,
  TimeOfDay,
  AnglerPeer,
  RodItem,
  GearCustomization,
  CabinTheme,
  DockLighting,
  MountedTrophy,
  ViewMode,
} from '../types';
import { createStylizedTerrain } from './world/Terrain';
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
  peers: AnglerPeer[];
  equippedRod: RodItem;
  customization: GearCustomization;
  cabinTheme: CabinTheme;
  dockLighting: DockLighting;
  mountedTrophies: MountedTrophy[];
  viewMode: ViewMode;
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
  peers,
  equippedRod,
  customization,
  cabinTheme,
  dockLighting,
  mountedTrophies,
  viewMode,
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
  const propsRef = useRef<EnvironmentProps | null>(null);
  const skyDomeRef = useRef<StylizedSkyDome | null>(null);
  const villageRef = useRef<StylizedVillageBase | null>(null);

  // Bobber & line
  const bobberGroupRef = useRef<THREE.Group | null>(null);
  const lineMeshRef = useRef<THREE.Line | null>(null);
  const fishShadowRef = useRef<THREE.Mesh | null>(null);
  const peerMeshesRef = useRef<Map<string, THREE.Group>>(new Map());

  // Lights & weather
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const starsRef = useRef<THREE.Points | null>(null);
  const rainParticlesRef = useRef<THREE.Points | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  // Movement & Camera state
  const playerPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.44, 1.2));
  const playerRotYRef = useRef<number>(Math.PI); // Facing the lake (towards -Z)
  const cameraYawRef = useRef<number>(0); // Camera orbit yaw offset
  const cameraPitchRef = useRef<number>(0.2); // Camera orbit pitch

  // Desktop keyboard movement keys
  const keysRef = useRef<{ w: boolean; a: boolean; s: boolean; d: boolean; shift: boolean }>({
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
  });

  // Touch drag for camera rotation
  const touchStartRef = useRef<{ x: number; y: number; id: number } | null>(null);

  // State mirror for 60fps render loop
  const stateRef = useRef({
    fishingState,
    castPower,
    lineTension,
    fishDistance,
    weather,
    timeOfDay,
    peers,
    equippedRod,
    customization,
    cabinTheme,
    dockLighting,
    mountedTrophies,
    viewMode,
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
      peers,
      equippedRod,
      customization,
      cabinTheme,
      dockLighting,
      mountedTrophies,
      viewMode,
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
    peers,
    equippedRod,
    customization,
    cabinTheme,
    dockLighting,
    mountedTrophies,
    viewMode,
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
      48,
      container.clientWidth / container.clientHeight,
      0.1,
      350
    );
    camera.position.set(0, 3.2, 7.5);
    camera.lookAt(0, 1.2, -6);
    cameraRef.current = camera;

    // 3. Lighting Rig
    const ambient = new THREE.AmbientLight(0x93c5fd, 0.55);
    scene.add(ambient);
    ambientLightRef.current = ambient;

    const hemi = new THREE.HemisphereLight(0xbfe3ff, 0x3d4f3b, 0.6);
    hemi.position.set(0, 50, 0);
    scene.add(hemi);
    hemiLightRef.current = hemi;

    const sun = new THREE.DirectionalLight(0xffedd5, 1.35);
    sun.position.set(28, 42, -25);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 1.0;
    sun.shadow.camera.far = 140;
    sun.shadow.camera.left = -35;
    sun.shadow.camera.right = 35;
    sun.shadow.camera.top = 35;
    sun.shadow.camera.bottom = -35;
    sun.shadow.bias = -0.0008;
    scene.add(sun);
    sunLightRef.current = sun;

    // 4. Sky Dome, Clouds & Mountains
    const skyDome = new StylizedSkyDome();
    scene.add(skyDome.mesh);
    scene.add(skyDome.clouds);
    skyDomeRef.current = skyDome;

    const mountains = createMountainHorizon();
    scene.add(mountains);

    // Stars
    const starsCount = 600;
    const starsGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i += 3) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.45;
      const r = 240;
      starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = r * Math.cos(phi);
      starPositions[i + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.2,
      transparent: true,
      opacity: 0,
    });
    const stars = new THREE.Points(starsGeo, starMat);
    scene.add(stars);
    starsRef.current = stars;

    // 5. Stylized Terrain
    const terrain = createStylizedTerrain();
    scene.add(terrain);

    // 6. Water Surface
    const water = new StylizedWater();
    scene.add(water.mesh);
    waterRef.current = water;

    // 7. Trees & Props
    const forest = createTreeForest();
    scene.add(forest);

    const envProps = new EnvironmentProps();
    scene.add(envProps.group);
    propsRef.current = envProps;

    // 8. Dock
    const dock = createStylizedDock();
    scene.add(dock);

    // 9. Village & Base
    const village = new StylizedVillageBase(cabinTheme, dockLighting, mountedTrophies);
    scene.add(village.group);
    villageRef.current = village;

    // 10. Player Character
    const player = new StylizedPlayerCharacter();
    player.group.position.copy(playerPosRef.current);
    scene.add(player.group);
    playerRef.current = player;

    // 11. Bobber
    const bobberGroup = new THREE.Group();
    bobberGroup.position.set(0, 0.08, -12);
    bobberGroup.visible = false; // Hidden until cast!

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

    // 12. Fishing Line
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
    lineMesh.visible = false; // Hidden when not fishing
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

    // Resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Mouse drag for camera rotation
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

      cameraYawRef.current -= dx * 0.005;
      cameraPitchRef.current = Math.max(-0.2, Math.min(0.8, cameraPitchRef.current + dy * 0.004));
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Touch handlers for right-side camera orbit
    const handleTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        // If on right half of screen, treat as camera rotation
        if (t.clientX > window.innerWidth * 0.45 && touchStartRef.current === null) {
          touchStartRef.current = { x: t.clientX, y: t.clientY, id: t.identifier };
          break;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === touchStartRef.current.id) {
          const dx = t.clientX - touchStartRef.current.x;
          const dy = t.clientY - touchStartRef.current.y;
          touchStartRef.current.x = t.clientX;
          touchStartRef.current.y = t.clientY;

          cameraYawRef.current -= dx * 0.007;
          cameraPitchRef.current = Math.max(-0.2, Math.min(0.8, cameraPitchRef.current + dy * 0.005));
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

    // --- ANIMATION LOOP ---
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const renderLoop = () => {
      animationFrameId = requestAnimationFrame(renderLoop);
      const delta = Math.min(0.1, clock.getDelta());
      const elapsedTime = clock.getElapsedTime();

      const {
        fishingState: curState,
        castPower: curCastPower,
        lineTension: curTension,
        fishDistance: curDist,
        weather: curWeather,
        timeOfDay: curTime,
        peers: curPeers,
        customization: curCustom,
        cabinTheme: curCabinTheme,
        viewMode: curViewMode,
        isPaused: curPaused,
        joystickInput: curJoy,
      } = stateRef.current;

      // Skip dynamic updates when paused
      if (curPaused) {
        renderer.render(scene, camera);
        return;
      }

      // 1. Atmosphere
      const atmos = getAtmosphereSettings(curTime, curWeather);
      if (skyDomeRef.current) {
        (skyDomeRef.current.mesh.material as THREE.MeshBasicMaterial).color.set(atmos.skyColor);
        skyDomeRef.current.update(delta);
      }
      if (sunLightRef.current) {
        sunLightRef.current.color.set(atmos.sunColor);
        sunLightRef.current.intensity = atmos.sunIntensity;
        sunLightRef.current.position.set(...atmos.sunPos);
      }
      if (ambientLightRef.current) {
        ambientLightRef.current.color.set(atmos.ambientColor);
        ambientLightRef.current.intensity = atmos.ambientIntensity;
      }
      if (hemiLightRef.current) {
        hemiLightRef.current.color.set(atmos.hemiSkyColor);
        hemiLightRef.current.groundColor.set(atmos.hemiGroundColor);
        hemiLightRef.current.intensity = atmos.hemiIntensity;
      }
      if (scene.fog) {
        const fog = scene.fog as THREE.Fog;
        fog.color.set(atmos.fogColor);
        fog.near = atmos.fogNear;
        fog.far = atmos.fogFar;
      }
      if (starsRef.current) {
        (starsRef.current.material as THREE.PointsMaterial).opacity = atmos.starsOpacity;
      }
      renderer.toneMappingExposure = atmos.exposure;

      // 2. Water & props
      if (waterRef.current) waterRef.current.update(elapsedTime, delta);
      if (propsRef.current) propsRef.current.update(elapsedTime);
      if (villageRef.current) {
        villageRef.current.update(elapsedTime, delta);
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
        if (atmos.rainOpacity > 0) {
          const positions = rainGeo.attributes.position.array as Float32Array;
          const speed = curWeather === 'HEAVY_RAIN' ? 45 : 28;
          for (let i = 1; i < rainPos.length; i += 3) {
            positions[i] -= speed * delta;
            if (positions[i] < -0.5) positions[i] = 38;
          }
          rainGeo.attributes.position.needsUpdate = true;
        }
      }

      // 4. Player Movement & Grounding (Active in IDLE state)
      const canMove = curState === 'IDLE' && curViewMode === 'FISHING_DOCK';
      let moveX = 0;
      let moveZ = 0;

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
          // Normalize and orient relative to camera yaw
          const angle = Math.atan2(kx, kz) + cameraYawRef.current;
          const speed = (k.shift ? 5.2 : 3.4) * Math.min(1.0, inputMag);
          moveX = Math.sin(angle) * speed;
          moveZ = Math.cos(angle) * speed;

          // Face movement direction smoothly
          const targetRot = Math.atan2(moveX, moveZ);
          playerRotYRef.current = THREE.MathUtils.lerp(playerRotYRef.current, targetRot, delta * 12);
        }
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

        const isWalking = Math.hypot(moveX, moveZ) > 0.1;
        playerRef.current.updateAnimation(
          curState,
          curTension,
          curCastPower,
          elapsedTime,
          isWalking,
          Math.hypot(moveX, moveZ) / 3.4
        );
      }

      // 5. Bobber Visibility & Water Physics
      const isFishingActive =
        curState === 'CASTING' ||
        curState === 'BOBBER_ACTIVE' ||
        curState === 'FISH_APPROACHING' ||
        curState === 'BITE' ||
        curState === 'HOOKED' ||
        curState === 'FISH_STRUGGLING' ||
        curState === 'REELING';

      if (bobberGroupRef.current) {
        bobberGroupRef.current.visible = isFishingActive;
        const bg = bobberGroupRef.current;

        if (isFishingActive) {
          // Cast target based on player's position & forward vector
          const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(
            new THREE.Vector3(0, 1, 0),
            playerRotYRef.current
          );
          const castDist = Math.max(6, curDist);
          const targetX = currPos.x + forward.x * castDist;
          const targetZ = currPos.z + forward.z * castDist;

          bg.position.x = THREE.MathUtils.lerp(bg.position.x, targetX, delta * 5);
          bg.position.z = THREE.MathUtils.lerp(bg.position.z, targetZ, delta * 4);

          const waterY = Math.sin(bg.position.x * 0.18 + elapsedTime * 1.5) * 0.09;
          let bobberY = waterY + 0.06;

          if (curState === 'BITE') {
            bobberY -= 0.18 + Math.sin(elapsedTime * 18) * 0.06;
            bg.rotation.z = Math.sin(elapsedTime * 15) * 0.35;
            if (waterRef.current && Math.random() > 0.6) {
              waterRef.current.addRipple(bg.position.x, bg.position.z, 1.2);
            }
          } else if (curState === 'FISH_APPROACHING') {
            bobberY -= 0.04 + Math.sin(elapsedTime * 8) * 0.03;
            bg.rotation.z = Math.sin(elapsedTime * 6) * 0.15;
            if (waterRef.current && Math.random() > 0.85) {
              waterRef.current.addRipple(bg.position.x, bg.position.z, 0.7);
            }
          } else {
            bg.rotation.z = Math.sin(elapsedTime * 2) * 0.08;
          }
          bg.position.y = bobberY;
        } else {
          // Reset bobber back to player when not fishing
          bg.position.set(currPos.x, currPos.y, currPos.z - 1.0);
        }
      }

      // 6. 3D Line Rendering
      if (lineMeshRef.current) {
        lineMeshRef.current.visible = isFishingActive;
        if (isFishingActive && bobberGroupRef.current && playerRef.current) {
          const positions = lineMeshRef.current.geometry.attributes.position.array as Float32Array;
          const start = playerRef.current.rodTipPosition;
          const end = bobberGroupRef.current.position;
          const droopFactor = (1 - curTension) * 0.5;

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

      // 7. Fish Shadow
      if (fishShadowRef.current && bobberGroupRef.current) {
        const fs = fishShadowRef.current;
        const bg = bobberGroupRef.current;
        const fsMat = fs.material as THREE.MeshBasicMaterial;

        if (
          isFishingActive &&
          (curState === 'FISH_APPROACHING' ||
            curState === 'BITE' ||
            curState === 'HOOKED' ||
            curState === 'FISH_STRUGGLING')
        ) {
          fs.visible = true;
          fsMat.opacity = THREE.MathUtils.lerp(fsMat.opacity, 0.75, delta * 3);
          const circleOffset = curState === 'FISH_APPROACHING' ? Math.sin(elapsedTime * 2.5) * 1.2 : 0;
          fs.position.x = bg.position.x + circleOffset;
          fs.position.z = bg.position.z + (curState === 'FISH_APPROACHING' ? Math.cos(elapsedTime * 2.5) * 1.2 : 0);
          fs.position.y = -0.28;
          fs.rotation.y = elapsedTime * 2.5;
        } else {
          fsMat.opacity = THREE.MathUtils.lerp(fsMat.opacity, 0, delta * 4);
          if (fsMat.opacity < 0.05) fs.visible = false;
        }
      }

      // 8. Third-Person Camera with smooth follow & orbit
      if (cameraRef.current) {
        const cam = cameraRef.current;

        if (curViewMode === 'PLAYER_CABIN') {
          cam.position.lerp(new THREE.Vector3(-4.5, 2.6, 7.8), delta * 2.0);
          cam.lookAt(0, 2.2, 13.5);
        } else if (curViewMode === 'UNDERWATER_SONAR') {
          cam.position.lerp(new THREE.Vector3(0, -1.8, -8.0), delta * 2.5);
          cam.lookAt(0, -1.2, -18);
        } else {
          // Dynamic camera distance & position based on orbit yaw/pitch
          const camDist = curState === 'IDLE' ? 5.5 : 4.8;
          const camHeight = 1.8 + Math.sin(cameraPitchRef.current) * 2.2;
          const orbitRadius = camDist * Math.cos(cameraPitchRef.current);

          const camTargetX = currPos.x - Math.sin(cameraYawRef.current) * orbitRadius;
          const camTargetZ = currPos.z + Math.cos(cameraYawRef.current) * orbitRadius;
          const camTargetY = Math.max(0.6, currPos.y + camHeight);

          // Struggle shake
          let shakeX = 0;
          if (curState === 'FISH_STRUGGLING' || curState === 'REELING') {
            shakeX = Math.sin(elapsedTime * 8) * 0.08;
          }

          cam.position.lerp(new THREE.Vector3(camTargetX + shakeX, camTargetY, camTargetZ), delta * 5);
          cam.lookAt(currPos.x, currPos.y + 1.2, currPos.z);
        }
      }

      // Multiplayer peers
      updatePeerModels(curPeers, scene, peerMeshesRef.current);

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

      if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onClick={onCanvasClick}
      className="relative w-full h-full cursor-grab active:cursor-grabbing select-none touch-none overflow-hidden"
    />
  );
};

// Update peer angler models
function updatePeerModels(peers: AnglerPeer[], scene: THREE.Scene, peerMeshes: Map<string, THREE.Group>) {
  peers.forEach((peer) => {
    let group = peerMeshes.get(peer.id);
    if (!group) {
      group = new THREE.Group();
      group.position.set(...peer.position);
      group.rotation.y = peer.rotationY;

      const bodyMat = new THREE.MeshStandardMaterial({ color: peer.color, roughness: 0.7, flatShading: true });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.85, 7), bodyMat);
      body.position.y = 0.45;
      group.add(body);

      const head = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.18, 0),
        new THREE.MeshStandardMaterial({ color: 0xf5d0b5 })
      );
      head.position.y = 1.05;
      group.add(head);

      const hat = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.22, 0.15, 8),
        new THREE.MeshStandardMaterial({ color: 0x3d5a45 })
      );
      hat.position.y = 1.18;
      group.add(hat);

      const peerRod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.03, 2.8, 6),
        new THREE.MeshStandardMaterial({ color: 0x92400e })
      );
      peerRod.position.set(0.25, 0.9, 0.8);
      peerRod.rotation.x = -Math.PI / 4;
      group.add(peerRod);

      scene.add(group);
      peerMeshes.set(peer.id, group);
    }

    if (peer.state === 'reeling') {
      group.position.y = peer.position[1] + Math.sin(Date.now() * 0.01) * 0.04;
    }
  });
}
