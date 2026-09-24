"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Image from "next/image";

// Helper: Check if browser supports WebGL
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

export default function Product3DViewer({ productName = "Product Showcase", imageUrl = "" }) {
  const containerRef = useRef(null);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const [fallbackRotation, setFallbackRotation] = useState({ x: 0, y: 0 });
  const meshRef = useRef(null);

  // Normalize image URL to absolute backend address if it's relative
  const getAbsoluteUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return url.startsWith("/") ? url : `/${url}`;
  };

  useEffect(() => {
    if (!isWebGLAvailable()) {
      setUseFallback(true);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    let renderer, scene, camera, mesh, pedestal, ring, geometry;
    let materials = [];
    let animationFrameId;
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let resizeObserver = null;

    try {
      scene = new THREE.Scene();

      const width = container.clientWidth || 400;
      const height = container.clientHeight || 400;

      // Perspective Camera setup
      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 1.2, 4.5);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "default" });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      container.appendChild(renderer.domElement);

      // 3D Glass Pedestal Base (Light Studio Chrome)
      const pedestalGeom = new THREE.CylinderGeometry(2, 2.3, 0.2, 32);
      const pedestalMat = new THREE.MeshPhysicalMaterial({
        color: 0xe2e8f0,
        metalness: 0.6,
        roughness: 0.15,
        clearcoat: 1.0,
        transmission: 0.5,
        opacity: 0.9,
        transparent: true,
      });
      pedestal = new THREE.Mesh(pedestalGeom, pedestalMat);
      pedestal.position.y = -1.4;
      scene.add(pedestal);

      // 3D Floating Ring (Vivid Yellow Glow)
      const ringGeom = new THREE.TorusGeometry(1.7, 0.035, 16, 100);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xeab308,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0xeab308,
        emissiveIntensity: 0.8,
      });
      ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -0.5;
      scene.add(ring);

      // 3D Product Box
      geometry = new THREE.BoxGeometry(2.1, 2.1, 0.35, 8, 8, 8);

      const sideMat = new THREE.MeshPhysicalMaterial({
        color: 0xf1f5f9,
        metalness: 0.3,
        roughness: 0.3,
        clearcoat: 0.8,
        wireframe: wireframe,
      });

      const targetUrl = getAbsoluteUrl(imageUrl);

      if (targetUrl) {
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin("anonymous");
        const texture = loader.load(
          targetUrl,
          () => {
            if (renderer && scene && camera) {
              renderer.render(scene, camera);
            }
          },
          undefined,
          (err) => {
            console.warn("WebGL Texture load fallback:", err?.message || err);
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
          color: 0xfacc15,
          metalness: 0.4,
          roughness: 0.3,
          clearcoat: 1.0,
          wireframe: wireframe,
        });
        materials = [sideMat, sideMat, sideMat, sideMat, defaultMat, defaultMat];
      }

      mesh = new THREE.Mesh(geometry, materials);
      mesh.position.y = 0.25;
      meshRef.current = mesh;
      scene.add(mesh);

      // Lights Setup
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
      scene.add(ambientLight);

      const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
      dirLight1.position.set(5, 8, 5);
      scene.add(dirLight1);

      const dirLight2 = new THREE.DirectionalLight(0x0d9488, 1.8);
      dirLight2.position.set(-5, -2, -5);
      scene.add(dirLight2);

      const pointLight = new THREE.PointLight(0x6366f1, 2.5, 10);
      pointLight.position.set(0, 3, 3);
      scene.add(pointLight);

      // Mouse Drag Rotation
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
        if (ring) ring.rotation.z += deltaX * 0.005;

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

      // Touch interaction for mobile
      const onTouchStart = (e) => {
        if (e.touches.length === 1) {
          isDragging = true;
          previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
      };

      const onTouchMove = (e) => {
        if (!isDragging || !meshRef.current || e.touches.length !== 1) return;
        const deltaX = e.touches[0].clientX - previousMousePosition.x;
        const deltaY = e.touches[0].clientY - previousMousePosition.y;

        meshRef.current.rotation.y += deltaX * 0.01;
        meshRef.current.rotation.x += deltaY * 0.01;
        if (ring) ring.rotation.z += deltaX * 0.005;

        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      };

      const onTouchEnd = () => {
        isDragging = false;
      };

      domElement.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("touchend", onTouchEnd);

      // ResizeObserver for reliable container responsive resizing
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver((entries) => {
          for (let entry of entries) {
            const cr = entry.contentRect;
            if (cr.width > 0 && cr.height > 0 && camera && renderer) {
              camera.aspect = cr.width / cr.height;
              camera.updateProjectionMatrix();
              renderer.setSize(cr.width, cr.height);
            }
          }
        });
        resizeObserver.observe(container);
      }

      // Modern animation loop with performance.now()
      let startTime = performance.now();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const elapsedTime = (performance.now() - startTime) / 1000;

        if (autoRotate && meshRef.current && !isDragging) {
          meshRef.current.rotation.y += 0.008;
          meshRef.current.rotation.x = Math.sin(elapsedTime * 0.5) * 0.08;
        }

        if (pedestal) pedestal.rotation.y += 0.001;
        if (ring) ring.rotation.z = elapsedTime * 0.3;

        if (renderer && scene && camera) {
          renderer.render(scene, camera);
        }
      };

      animate();

      return () => {
        domElement.removeEventListener("mousedown", onMouseDown);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        domElement.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
        if (resizeObserver) resizeObserver.disconnect();
        cancelAnimationFrame(animationFrameId);

        if (container.contains(domElement)) {
          container.removeChild(domElement);
        }

        if (geometry) geometry.dispose();
        materials.forEach((m) => m?.dispose && m.dispose());
        if (pedestal) {
          pedestal.geometry?.dispose();
          pedestal.material?.dispose();
        }
        if (ring) {
          ring.geometry?.dispose();
          ring.material?.dispose();
        }
        if (renderer) renderer.dispose();
      };
    } catch (err) {
      console.error("Three.js 3D initialization error, enabling fallback:", err);
      setUseFallback(true);
    }
  }, [imageUrl, autoRotate, wireframe]);

  // CSS 3D Fallback for non-WebGL environments
  if (useFallback) {
    return (
      <div className="relative w-full h-full min-h-[380px] rounded-2xl overflow-hidden bg-gradient-to-br from-yellow-50 via-slate-50 to-amber-50 flex flex-col items-center justify-center p-6 border border-slate-200">
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/95 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-800 shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
          3D Interactive Showcase: {productName}
        </div>

        <div
          className={`relative w-48 h-48 sm:w-56 sm:h-56 transition-transform duration-500 rounded-2xl bg-white p-4 shadow-xl border border-yellow-200 flex items-center justify-center ${
            autoRotate ? "animate-[spin_8s_linear_infinite]" : ""
          }`}
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateY(${fallbackRotation.y}deg) rotateX(${fallbackRotation.x}deg)`,
          }}
        >
          {imageUrl ? (
            <Image
              src={getAbsoluteUrl(imageUrl)}
              alt={productName}
              fill
              sizes="224px"
              className="object-contain p-2"
            />
          ) : (
            <div className="text-4xl">💊</div>
          )}
        </div>

        <div className="absolute bottom-4 right-4 flex gap-2">
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className="px-3 py-1.5 bg-yellow-400 font-black text-xs text-slate-950 rounded-xl shadow-xs cursor-pointer"
          >
            {autoRotate ? "Pause" : "Spin"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "380px",
        borderRadius: "20px",
        overflow: "hidden",
        background: "radial-gradient(circle at center, rgba(254, 240, 138, 0.3) 0%, rgba(241, 245, 249, 0.95) 100%)",
        border: "1px solid rgba(226, 232, 240, 0.9)",
        boxShadow: "inset 0 0 30px rgba(0,0,0,0.03)",
      }}
    >
      <div ref={containerRef} style={{ width: "100%", height: "100%", minHeight: "380px" }} />

      {/* Floating Header UI */}
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-800 shadow-sm">
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse shadow-[0_0_8px_#eab308]" />
        3D Interactive View: {productName}
      </div>

      {/* Control Buttons */}
      <div className="absolute bottom-4 right-4 flex gap-2 z-10">
        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md cursor-pointer transition-all border ${
            autoRotate 
              ? "bg-yellow-400 border-yellow-500 text-slate-950 shadow-sm" 
              : "bg-white/90 border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          {autoRotate ? "Pause" : "Spin"}
        </button>
        <button
          type="button"
          onClick={() => setWireframe(!wireframe)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md cursor-pointer transition-all border ${
            wireframe 
              ? "bg-slate-900 border-slate-900 text-white shadow-sm" 
              : "bg-white/90 border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          {wireframe ? "Shaded" : "Wire"}
        </button>
      </div>

      <div className="absolute bottom-4 left-4 text-[10px] text-slate-500 font-semibold select-none pointer-events-none bg-white/80 px-2.5 py-1 rounded-md border border-slate-200">
        Drag mouse / finger to rotate package in 3D space
      </div>
    </div>
  );
}
