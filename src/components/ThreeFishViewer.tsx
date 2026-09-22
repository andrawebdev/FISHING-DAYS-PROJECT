import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FishSpecies } from '../types';

interface ThreeFishViewerProps {
  species: FishSpecies;
  size?: number;
}

/**
 * Procedural 3D stylized fish model renderer for the Catch Modal & Encyclopedia
 * Features a real 3D mesh with articulated tail/fin wiggle and interactive 3D orbit.
 */
export const ThreeFishViewer: React.FC<ThreeFishViewerProps> = ({ species, size = 260 }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || size;
    const height = mount.clientHeight || size;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 3.4);
    camera.lookAt(0, 0, 0);

    // 2. WebGL Renderer with transparency
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);

    // 3. Lighting Rig (High contrast studio lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.8);
    rimLight.position.set(-4, -2, -3);
    scene.add(rimLight);

    // 4. Procedural 3D Fish Group
    const fishGroup = new THREE.Group();

    // Body color resolution
    const mainColor = species.color || '#38bdf8';
    const bellyColor = species.secondaryColor || '#e2e8f0';
    const finColor = species.dorsalColor || species.secondaryColor || '#64748b';

    const bodyMat = new THREE.MeshStandardMaterial({
      color: mainColor,
      roughness: 0.35,
      metalness: 0.25,
    });

    const bellyMat = new THREE.MeshStandardMaterial({
      color: bellyColor,
      roughness: 0.45,
      metalness: 0.15,
    });

    const finMat = new THREE.MeshStandardMaterial({
      color: finColor,
      roughness: 0.4,
      metalness: 0.1,
      transparent: true,
      opacity: 0.9,
    });

    // Fish Main Torso (Ellipsoid scale)
    const torsoGeo = new THREE.SphereGeometry(0.75, 24, 18);
    torsoGeo.scale(1.7, 0.9, 0.45);
    const torsoMesh = new THREE.Mesh(torsoGeo, bodyMat);
    fishGroup.add(torsoMesh);

    // Belly Underbody
    const bellyGeo = new THREE.SphereGeometry(0.68, 20, 14);
    bellyGeo.scale(1.5, 0.45, 0.42);
    const bellyMesh = new THREE.Mesh(bellyGeo, bellyMat);
    bellyMesh.position.set(0.1, -0.3, 0);
    fishGroup.add(bellyMesh);

    // Head / Snout taper
    const headGeo = new THREE.ConeGeometry(0.65, 0.8, 16);
    headGeo.rotateZ(-Math.PI / 2);
    headGeo.scale(0.8, 1.2, 0.5);
    const headMesh = new THREE.Mesh(headGeo, bodyMat);
    headMesh.position.set(1.05, -0.05, 0);
    fishGroup.add(headMesh);

    // Eyes
    const eyeWhiteGeo = new THREE.SphereGeometry(0.09, 12, 12);
    const eyePupilGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    // Right Eye
    const eyeR = new THREE.Group();
    eyeR.position.set(1.15, 0.12, 0.22);
    eyeR.add(new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat));
    const pupilR = new THREE.Mesh(eyePupilGeo, eyePupilMat);
    pupilR.position.set(0.05, 0, 0.05);
    eyeR.add(pupilR);
    fishGroup.add(eyeR);

    // Left Eye
    const eyeL = new THREE.Group();
    eyeL.position.set(1.15, 0.12, -0.22);
    eyeL.add(new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat));
    const pupilL = new THREE.Mesh(eyePupilGeo, eyePupilMat);
    pupilL.position.set(0.05, 0, -0.05);
    eyeL.add(pupilL);
    fishGroup.add(eyeL);

    // Dorsal Fin (Top)
    const dorsalFinShape = new THREE.Shape();
    dorsalFinShape.moveTo(0, 0);
    dorsalFinShape.quadraticCurveTo(0.4, 0.65, -0.2, 0.7);
    dorsalFinShape.lineTo(-0.8, 0.1);
    dorsalFinShape.closePath();
    const dorsalExtrude = new THREE.ExtrudeGeometry(dorsalFinShape, {
      depth: 0.04,
      bevelEnabled: false,
    });
    const dorsalFin = new THREE.Mesh(dorsalExtrude, finMat);
    dorsalFin.position.set(0.3, 0.65, -0.02);
    fishGroup.add(dorsalFin);

    // Articulated Tail Fin
    const tailPivot = new THREE.Group();
    tailPivot.position.set(-1.15, 0, 0);

    const tailFinShape = new THREE.Shape();
    tailFinShape.moveTo(0, 0);
    tailFinShape.lineTo(-0.7, 0.6);
    tailFinShape.quadraticCurveTo(-0.4, 0, -0.85, -0.55);
    tailFinShape.lineTo(-0.1, -0.15);
    tailFinShape.closePath();
    const tailExtrude = new THREE.ExtrudeGeometry(tailFinShape, {
      depth: 0.04,
      bevelEnabled: false,
    });
    const tailFin = new THREE.Mesh(tailExtrude, finMat);
    tailFin.position.set(0, 0, -0.02);
    tailPivot.add(tailFin);
    fishGroup.add(tailPivot);

    // Pectoral Fins
    const pectoralGeo = new THREE.BoxGeometry(0.35, 0.03, 0.2);
    const pecR = new THREE.Mesh(pectoralGeo, finMat);
    pecR.position.set(0.5, -0.2, 0.32);
    pecR.rotation.set(0.2, 0.35, -0.3);
    fishGroup.add(pecR);

    const pecL = new THREE.Mesh(pectoralGeo, finMat);
    pecL.position.set(0.5, -0.2, -0.32);
    pecL.rotation.set(-0.2, -0.35, -0.3);
    fishGroup.add(pecL);

    scene.add(fishGroup);

    // Mouse drag interaction to spin the 3D fish!
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let rotationVelocityX = 0;
    let rotationVelocityY = 0.008;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;
      fishGroup.rotation.y += dx * 0.012;
      fishGroup.rotation.x += dy * 0.008;
      rotationVelocityY = dx * 0.004;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Tail & fin organic swim flex
      const tailWiggle = Math.sin(elapsed * 5) * 0.28;
      tailPivot.rotation.y = tailWiggle;
      pecR.rotation.z = -0.3 + Math.sin(elapsed * 5) * 0.12;
      pecL.rotation.z = -0.3 + Math.sin(elapsed * 5) * 0.12;

      // Gentle floating buoyancy
      fishGroup.position.y = Math.sin(elapsed * 2.2) * 0.08;

      // Smooth idle spin when not actively dragging
      if (!isDragging) {
        fishGroup.rotation.y += rotationVelocityY;
        rotationVelocityY *= 0.98;
        if (Math.abs(rotationVelocityY) < 0.004) {
          rotationVelocityY = 0.005;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.dispose();
      if (mount.contains(domEl)) {
        mount.removeChild(domEl);
      }
    };
  }, [species, size]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full min-h-[200px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none"
    />
  );
};
