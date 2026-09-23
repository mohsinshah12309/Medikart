"use client";

import { useRef, useState, useEffect } from "react";

export default function AuthCard3D({
  children,
  className = "",
  badgeIcon = "🔐",
  badgeTitle = "",
  badgeSubtitle = "",
  floatTags = [
    { text: "💊 Genuine Meds", position: "top-left", delay: "0s" },
    { text: "🔒 Secure & Protected", position: "top-right", delay: "1.5s" },
    { text: "⚡ Fast Delivery", position: "bottom-right", delay: "0.8s" },
  ],
}) {
  const cardRef = useRef(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Subtle 3D tilt max ~8 deg for optimal form readability while keeping 3D depth
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setRotate({ x: rotateX, y: rotateY });
    setGlare({ x: glareX, y: glareY, opacity: 0.22 });
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
    setIsHovered(false);
  };

  return (
    <div className="relative w-full max-w-md mx-auto perspective-1000 py-6 sm:py-10">
      {/* Floating 3D ambient decorative badges */}
      {floatTags.map((tag, idx) => {
        let posClasses = "";
        if (tag.position === "top-left") posClasses = "-top-3 -left-4 sm:-left-8";
        else if (tag.position === "top-right") posClasses = "-top-3 -right-4 sm:-right-8";
        else if (tag.position === "bottom-left") posClasses = "-bottom-3 -left-4 sm:-left-8";
        else if (tag.position === "bottom-right") posClasses = "-bottom-3 -right-4 sm:-right-8";

        return (
          <div
            key={idx}
            className={`absolute z-20 pointer-events-none hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 border border-amber-200/80 shadow-lg shadow-amber-950/5 text-[11px] font-bold text-slate-800 backdrop-blur-md transition-transform duration-700 animate-float ${posClasses}`}
            style={{
              animationDelay: tag.delay,
              transform: isHovered
                ? `translateZ(45px) rotateY(${rotate.y * 1.2}deg)`
                : "translateZ(20px)",
            }}
          >
            <span className="inline-block">{tag.text}</span>
          </div>
        );
      })}

      {/* Main 3D Tilted Card */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`relative bg-white/95 backdrop-blur-xl rounded-3xl border border-amber-100/90 shadow-2xl shadow-amber-900/10 p-6 sm:p-8 overflow-hidden transition-all duration-200 ease-out ${className}`}
        style={{
          transformStyle: "preserve-3d",
          transform: `perspective(1000px) rotateX(${rotate.x.toFixed(2)}deg) rotateY(${rotate.y.toFixed(2)}deg) translateZ(0px)`,
        }}
      >
        {/* Dynamic 3D Glare Light */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none transition-opacity duration-300 z-30"
          style={{
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 203, 5, 0.08) 35%, transparent 70%)`,
            opacity: glare.opacity,
          }}
        />

        {/* Top 3D Glowing Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-[#FFCB05] to-yellow-400 z-10" />

        {/* 3D Header Badge with Pop-out Depth */}
        {(badgeTitle || badgeIcon) && (
          <div
            className="text-center mb-6 sm:mb-8 transition-transform duration-300"
            style={{ transform: "translateZ(30px)" }}
          >
            {badgeIcon && (
              <div className="relative inline-flex items-center justify-center w-14 h-14 mb-3 rounded-2xl bg-gradient-to-tr from-amber-100 via-amber-50 to-yellow-100 border border-amber-200 shadow-md shadow-amber-200/50 text-2xl animate-float">
                <span className="transform transition-transform hover:scale-110 select-none">
                  {badgeIcon}
                </span>
                <div className="absolute -bottom-1 w-8 h-1.5 bg-amber-300/40 rounded-full blur-xs" />
              </div>
            )}
            {badgeTitle && (
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading tracking-tight">
                {badgeTitle}
              </h1>
            )}
            {badgeSubtitle && (
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {badgeSubtitle}
              </p>
            )}
          </div>
        )}

        {/* 3D Content Container */}
        <div
          className="relative z-10 transition-transform duration-300"
          style={{ transform: "translateZ(20px)" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
