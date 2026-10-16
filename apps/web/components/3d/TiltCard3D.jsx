"use client";

import React, { useRef, memo } from "react";

function TiltCard3DComponent({ children, className = "", style = {}, intensity = 6 }) {
  const cardRef = useRef(null);
  const glareRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    if (typeof window !== "undefined" && window.matchMedia && !window.matchMedia("(hover: hover)").matches) {
      return;
    }
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -intensity;
    const rotateY = ((x - centerX) / centerX) * intensity;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`;
    if (glareRef.current) {
      glareRef.current.style.opacity = "0.25";
      glareRef.current.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.35) 0%, transparent 65%)`;
    }
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    }
    if (glareRef.current) {
      glareRef.current.style.opacity = "0";
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        ...style,
        transition: "transform 0.15s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.2s ease",
        transformStyle: "preserve-3d",
        position: "relative",
        willChange: "transform",
      }}
    >
      <div
        ref={glareRef}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none",
          background: "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.35) 0%, transparent 65%)",
          opacity: 0,
          transition: "opacity 0.25s ease",
          zIndex: 5,
        }}
      />
      {children}
    </div>
  );
}

const TiltCard3D = memo(TiltCard3DComponent);
export default TiltCard3D;
