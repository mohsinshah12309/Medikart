"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function Product3DViewer({ productName = "Product Showcase", imageUrl = "" }) {
  const containerRef = useRef(null);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const meshRef = useRef(null);

  // Normalize image URL to absolute backend address if it's relative
  const getAbsoluteUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `http://localhost:5000${url}`;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    
    // Perspective Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.2, 4.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 3D Glass Pedestal Base
    const pedestalGeom = new THREE.CylinderGeometry(2, 2.3, 0.2, 32);
    const pedestalMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a, // Slate 900
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1.0,
      transmission: 0.75,
      opacity: 0.85,
      transparent: true,
    });
    const pedestal = new THREE.Mesh(pedestalGeom, pedestalMat);
    pedestal.position.y = -1.4;
    scene.add(pedestal);

    // 3D Floating Ring (Mint Teal Glow to match Medikart branding)
    const ringGeom = new THREE.TorusGeometry(1.7, 0.035, 16, 100);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x0d9488, // Teal 600
      metalness: 1.0,
      roughness: 0.1,
      emissive: 0x0d9488,
      emissiveIntensity: 0.8,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.5;
    scene.add(ring);

    // Load Product Texture if provided
    let materials = [];
    const geometry = new THREE.BoxGeometry(2.1, 2.1, 0.35, 8, 8, 8);

    const sideMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b, // Slate 800
      metalness: 0.85,
      roughness: 0.2,
      clearcoat: 1.0,
      wireframe: wireframe,
    });

    const targetUrl = getAbsoluteUrl(imageUrl);

    if (targetUrl) {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      const texture = loader.load(
        targetUrl,
        () => {
          renderer.render(scene, camera);
        },
        undefined,
        (err) => {
          console.warn("WebGL Texture loading failed, falling back to default material:", err);
        }
      );
      texture.colorSpace = THREE.SRGBColorSpace;

      const faceMat = new THREE.MeshPhysicalMaterial({
        map: texture,
        metalness: 0.1,
        roughness: 0.25,
        clearcoat: 0.6,
        clearcoatRoughness: 0.1,
        wireframe: wireframe,
      });

      materials = [
        sideMat, // right
        sideMat, // left
        sideMat, // top
        sideMat, // bottom
        faceMat, // front (displays product image)
        faceMat, // back (displays product image)
      ];
    } else {
      const defaultMat = new THREE.MeshPhysicalMaterial({
        color: 0x0d9488,
        metalness: 0.7,
        roughness: 0.2,
        clearcoat: 1.0,
        wireframe: wireframe,
      });
      materials = [sideMat, sideMat, sideMat, sideMat, defaultMat, defaultMat];
    }

    const mesh = new THREE.Mesh(geometry, materials);
    mesh.position.y = 0.25;
    meshRef.current = mesh;
    scene.add(mesh);

    // Lights Setup (Teal/Indigo medical glow)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(5, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x0d9488, 1.8);
    dirLight2.position.set(-5, -2, -5);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x6366f1, 2.5, 10); // Indigo glow
    pointLight.position.set(0, 3, 3);
    scene.add(pointLight);

    // Mouse Interaction for Drag Rotation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging || !meshRef.current) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      meshRef.current.rotation.y += deltaX * 0.01;
      meshRef.current.rotation.x += deltaY * 0.01;
      ring.rotation.z += deltaX * 0.005;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.style.cursor = "grab";
    domElement.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Window Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Anim loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (autoRotate && meshRef.current && !isDragging) {
        meshRef.current.rotation.y += 0.006;
        meshRef.current.rotation.x = Math.sin(elapsedTime * 0.4) * 0.08;
      }

      pedestal.rotation.y += 0.001;
      ring.rotation.z = elapsedTime * 0.25;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      domElement.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      materials.forEach((m) => m.dispose());
      pedestalGeom.dispose();
      pedestalMat.dispose();
      ringGeom.dispose();
      ringMat.dispose();
      renderer.dispose();
    };
  }, [imageUrl, autoRotate, wireframe]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "380px",
        borderRadius: "24px",
        overflow: "hidden",
        background: "radial-gradient(circle at center, rgba(13, 148, 136, 0.1) 0%, rgba(15, 23, 42, 0.98) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "inset 0 0 40px rgba(0,0,0,0.4)",
      }}
    >
      <div ref={containerRef} style={{ width: "100%", height: "100%", minHeight: "380px" }} />

      {/* Floating Header UI */}
      <div className="absolute top-4.5 left-4.5 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-semibold text-teal-400">
        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shadow-[0_0_8px_#14b8a6]" />
        3D Interactive View: {productName}
      </div>

      {/* Control Buttons */}
      <div className="absolute bottom-4.5 right-4.5 flex gap-2 z-10">
        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md cursor-pointer transition-all border ${
            autoRotate 
              ? "bg-teal-500/20 border-teal-500/40 text-teal-350 shadow-sm" 
              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
          }`}
        >
          {autoRotate ? "Pause" : "Spin"}
        </button>
        <button
          type="button"
          onClick={() => setWireframe(!wireframe)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md cursor-pointer transition-all border ${
            wireframe 
              ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-sm" 
              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
          }`}
        >
          {wireframe ? "Shaded" : "Wire"}
        </button>
      </div>

      <div className="absolute bottom-4.5 left-4.5 text-[10px] text-slate-400 font-medium select-none pointer-events-none">
        Drag mouse to rotate package in 3D space
      </div>
    </div>
  );
}
