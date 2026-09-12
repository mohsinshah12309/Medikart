"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// Helper: Check WebGL availability
function isWebGLAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch (e) {
    return false;
  }
}

/**
 * Creates a two-tone 3D medicine capsule with shiny finish and chrome belt
 */
function createCapsule(primaryColor = 0xffcb05, secondaryColor = 0xffffff, radius = 0.5, length = 1.0) {
  const group = new THREE.Group();

  const halfLength = length / 2;

  // Materials
  const topMat = new THREE.MeshPhysicalMaterial({
    color: primaryColor,
    roughness: 0.15,
    metalness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    reflectivity: 0.9,
  });

  const bottomMat = new THREE.MeshPhysicalMaterial({
    color: secondaryColor,
    roughness: 0.2,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    metalness: 0.85,
    roughness: 0.2,
  });

  // Top Dome (Primary Color)
  const topDomeGeom = new THREE.SphereGeometry(radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const topDome = new THREE.Mesh(topDomeGeom, topMat);
  topDome.position.y = halfLength;
  group.add(topDome);

  // Top Cylinder Half
  const topCylGeom = new THREE.CylinderGeometry(radius, radius, halfLength, 32);
  const topCyl = new THREE.Mesh(topCylGeom, topMat);
  topCyl.position.y = halfLength / 2;
  group.add(topCyl);

  // Bottom Cylinder Half
  const botCylGeom = new THREE.CylinderGeometry(radius, radius, halfLength, 32);
  const botCyl = new THREE.Mesh(botCylGeom, bottomMat);
  botCyl.position.y = -halfLength / 2;
  group.add(botCyl);

  // Bottom Dome (Secondary Color)
  const botDomeGeom = new THREE.SphereGeometry(radius, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const botDome = new THREE.Mesh(botDomeGeom, bottomMat);
  botDome.position.y = -halfLength;
  group.add(botDome);

  // Middle Chrome Dividing Ring
  const ringGeom = new THREE.TorusGeometry(radius + 0.015, 0.025, 16, 32);
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  return group;
}

/**
 * Auth3DScene: Interactive 3D Canvas with floating 3D pills, glowing vitamin spheres, and particles
 */
export default function Auth3DScene({ className = "", interactive = true }) {
  const containerRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isWebGLAvailable()) return;

    const container = containerRef.current;
    if (!container) return;

    let scene, camera, renderer, animationFrameId;
    let capsules = [];
    let spheres = [];
    let particlesMesh;
    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let clock = new THREE.Clock();

    const init = () => {
      scene = new THREE.Scene();

      const width = container.clientWidth || 600;
      const height = container.clientHeight || 600;

      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 0, 8);

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      container.appendChild(renderer.domElement);

      // --- Lighting ---
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
      scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xfffae6, 2.2);
      mainLight.position.set(5, 8, 6);
      scene.add(mainLight);

      const rimLight = new THREE.DirectionalLight(0x6ee7b7, 1.4);
      rimLight.position.set(-6, -4, -2);
      scene.add(rimLight);

      const pointLight = new THREE.PointLight(0xffcb05, 1.8, 15);
      pointLight.position.set(0, 2, 4);
      scene.add(pointLight);

      // --- 3D Capsule Models ---
      const capsuleConfigs = [
        // Main Hero Pill (Amber/Yellow + White)
        {
          color1: 0xffcb05,
          color2: 0xffffff,
          radius: 0.65,
          length: 1.3,
          pos: [1.8, 0.6, 1.2],
          rot: [0.6, 0.4, 0.8],
          rotSpeed: { x: 0.007, y: 0.01, z: 0.005 },
          floatSpeed: 1.2,
          floatOffset: 0,
        },
        // Mint / White Pill
        {
          color1: 0x10b981,
          color2: 0xf8fafc,
          radius: 0.48,
          length: 0.95,
          pos: [-2.2, 1.5, -0.4],
          rot: [-0.4, 0.8, -0.2],
          rotSpeed: { x: 0.006, y: -0.008, z: 0.006 },
          floatSpeed: 1.4,
          floatOffset: 1.8,
        },
        // Vibrant Gold / Slate Pill
        {
          color1: 0xf59e0b,
          color2: 0x334155,
          radius: 0.4,
          length: 0.85,
          pos: [-1.8, -1.8, 0.4],
          rot: [1.1, -0.5, 0.3],
          rotSpeed: { x: -0.009, y: 0.007, z: -0.005 },
          floatSpeed: 1.1,
          floatOffset: 3.2,
        },
        // Deep Emerald / Pure White Pill
        {
          color1: 0x059669,
          color2: 0xffffff,
          radius: 0.35,
          length: 0.7,
          pos: [2.5, -1.6, -0.6],
          rot: [0.2, -1.2, 0.6],
          rotSpeed: { x: 0.007, y: -0.006, z: 0.009 },
          floatSpeed: 1.6,
          floatOffset: 4.5,
        },
      ];

      capsuleConfigs.forEach((cfg) => {
        const cap = createCapsule(cfg.color1, cfg.color2, cfg.radius, cfg.length);
        cap.position.set(...cfg.pos);
        cap.rotation.set(...cfg.rot);
        cap.userData = {
          basePos: new THREE.Vector3(...cfg.pos),
          rotSpeed: cfg.rotSpeed,
          floatSpeed: cfg.floatSpeed,
          floatOffset: cfg.floatOffset,
        };
        scene.add(cap);
        capsules.push(cap);
      });

      // --- Translucent Glowing Vitamin Beads ---
      const sphereMat1 = new THREE.MeshPhysicalMaterial({
        color: 0xffcb05,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.3,
        roughness: 0.1,
        transmission: 0.7,
        opacity: 0.85,
        transparent: true,
      });

      const sphereMat2 = new THREE.MeshPhysicalMaterial({
        color: 0x34d399,
        emissive: 0x059669,
        emissiveIntensity: 0.3,
        roughness: 0.1,
        transmission: 0.7,
        opacity: 0.85,
        transparent: true,
      });

      const sphereGeom = new THREE.SphereGeometry(0.2, 24, 24);
      const spherePositions = [
        { pos: [0.4, 2.4, 0], mat: sphereMat1, speed: 1.3, offset: 0.5 },
        { pos: [2.8, 2.0, -1.0], mat: sphereMat2, speed: 1.1, offset: 2.1 },
        { pos: [-2.5, -0.4, 0.8], mat: sphereMat1, speed: 1.5, offset: 3.4 },
        { pos: [0.8, -2.6, -0.5], mat: sphereMat2, speed: 1.3, offset: 1.2 },
      ];

      spherePositions.forEach((sp) => {
        const mesh = new THREE.Mesh(sphereGeom, sp.mat);
        mesh.position.set(...sp.pos);
        mesh.userData = {
          basePos: new THREE.Vector3(...sp.pos),
          speed: sp.speed,
          offset: sp.offset,
        };
        scene.add(mesh);
        spheres.push(mesh);
      });

      // --- Ambient Golden & Mint Dust Particles ---
      const particleCount = 40;
      const particleGeom = new THREE.BufferGeometry();
      const posArray = new Float32Array(particleCount * 3);
      const colorArray = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount * 3; i += 3) {
        posArray[i] = (Math.random() - 0.5) * 12;
        posArray[i + 1] = (Math.random() - 0.5) * 10;
        posArray[i + 2] = (Math.random() - 0.5) * 6;

        if (Math.random() > 0.4) {
          colorArray[i] = 1.0;
          colorArray[i + 1] = 0.8;
          colorArray[i + 2] = 0.2;
        } else {
          colorArray[i] = 0.4;
          colorArray[i + 1] = 0.9;
          colorArray[i + 2] = 0.7;
        }
      }

      particleGeom.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
      particleGeom.setAttribute("color", new THREE.BufferAttribute(colorArray, 3));

      const particleMat = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
      });

      particlesMesh = new THREE.Points(particleGeom, particleMat);
      scene.add(particlesMesh);
    };

    init();

    // Mouse parallax tracking
    const handleMouseMove = (e) => {
      if (!interactive) return;
      const { innerWidth, innerHeight } = window;
      mouse.targetX = (e.clientX / innerWidth - 0.5) * 2;
      mouse.targetY = -(e.clientY / innerHeight - 0.5) * 2;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Resize handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Animation Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // Animate 3D Capsules
      capsules.forEach((cap) => {
        const u = cap.userData;
        cap.rotation.x += u.rotSpeed.x;
        cap.rotation.y += u.rotSpeed.y;
        cap.rotation.z += u.rotSpeed.z;

        cap.position.y = u.basePos.y + Math.sin(elapsedTime * u.floatSpeed + u.floatOffset) * 0.25;
        cap.position.x = u.basePos.x + Math.cos(elapsedTime * u.floatSpeed * 0.7 + u.floatOffset) * 0.15;

        cap.position.x += mouse.x * 0.2;
        cap.position.y += mouse.y * 0.2;
      });

      // Animate Spheres
      spheres.forEach((sp) => {
        const u = sp.userData;
        sp.position.y = u.basePos.y + Math.sin(elapsedTime * u.speed + u.offset) * 0.2;
        sp.position.x = u.basePos.x + mouse.x * 0.15;
      });

      // Animate Particles
      if (particlesMesh) {
        particlesMesh.rotation.y = elapsedTime * 0.03 + mouse.x * 0.1;
        particlesMesh.rotation.x = mouse.y * 0.08;
      }

      // Camera subtle drift
      if (camera) {
        camera.position.x = mouse.x * 0.35;
        camera.position.y = mouse.y * 0.25;
        camera.lookAt(0, 0, 0);
      }

      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, [mounted, interactive]);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    />
  );
}
