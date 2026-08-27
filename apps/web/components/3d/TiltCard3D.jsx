"use client";

import { useRef, useState } from "react";

export default function TiltCard3D({ children, className = "", style = {}, intensity = 12 }) {
  const cardRef = useRef(null);
  const [transformStyle, setTransformStyle] = useState("");
  const [glareStyle, setGlareStyle] = useState({ opacity: 0, x: 50, y: 50 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation angles based on cursor offset from card center
    const rotateX = ((y - centerY) / centerY) * -intensity;
    const rotateY = ((x - centerX) / centerX) * intensity;

    // Calculate glare coordinate percentages
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTransformStyle(
      `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`
    );
    setGlareStyle({
      opacity: 0.25,
      x: glareX,
      y: glareY,
    });
  };

  const handleMouseLeave = () => {
    setTransformStyle(
      "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)"
    );
    setGlareStyle((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        ...style,
        transform: transformStyle,
        transition: "transform 0.15s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.2s ease",
        transformStyle: "preserve-3d",
        position: "relative",
      }}
    >
      {/* Dynamic 3D Glare Light Reflection Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none",
          background: `radial-gradient(circle at ${glareStyle.x}% ${glareStyle.y}%, rgba(255, 255, 255, 0.35) 0%, transparent 65%)`,
          opacity: glareStyle.opacity,
          transition: "opacity 0.25s ease",
          zIndex: 5,
        }}
      />
      {children}
    </div>
  );
}
