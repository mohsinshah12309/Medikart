"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import {
  Scissors,
  Wind,
  Activity,
  Sparkles,
  Zap,
  Moon,
  Flame,
  HeartPulse,
  Droplet,
  ShieldAlert,
} from "lucide-react";

const FALLBACK_CONDITIONS = [
  { _id: "c-1", name: "Hair Fall", slug: "hair-fall", imageUrl: "/images/conditions/hair-fall.jpg", icon: "hair" },
  { _id: "c-2", name: "Cough & Cold", slug: "cough-and-cold", imageUrl: "/images/conditions/cough-and-cold.jpg", icon: "cough" },
  { _id: "c-3", name: "Bones & Joints Pain", slug: "bones-and-joints-pain", imageUrl: "/images/conditions/bones-and-joints-pain.jpg", icon: "bone" },
  { _id: "c-4", name: "Acne & Skin Care", slug: "acne-and-skin-care", imageUrl: "/images/conditions/acne-and-skin-care.jpg", icon: "skin" },
  { _id: "c-5", name: "Pain & Body Aches", slug: "pain-and-body-aches", imageUrl: "/images/conditions/pain-and-body-aches.jpg", icon: "pain" },
  { _id: "c-6", name: "Sleep Disorders", slug: "sleep-disorders", imageUrl: "/images/conditions/sleep-disorders.jpg", icon: "sleep" },
  { _id: "c-7", name: "Digestive Health", slug: "digestive-health", imageUrl: "/images/conditions/digestive-health.jpg", icon: "digestion" },
  { _id: "c-8", name: "Diabetes Care", slug: "diabetes-care", imageUrl: "/images/conditions/diabetes-care.jpg", icon: "diabetes" },
];

export default function CareByConditionSection({ initialConditions = [], onSelectCondition }) {
  const scrollRef = useRef(null);
  const [conditions, setConditions] = useState(
    initialConditions.length > 0 ? initialConditions : FALLBACK_CONDITIONS
  );
  const [slideDirection, setSlideDirection] = useState("ltr");
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (initialConditions.length > 0) {
      setConditions(initialConditions);
    } else {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      fetch(`${apiUrl}/conditions`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.data?.conditions && data.data.conditions.length > 0) {
            setConditions(data.data.conditions);
          }
        })
        .catch(() => {});
    }
  }, [initialConditions]);

  const toggleDirection = (dir) => {
    setSlideDirection(dir);
    setIsPaused(false);
  };

  const handleItemClick = (slug, e) => {
    if (e) e.preventDefault();
    if (onSelectCondition) {
      onSelectCondition(slug);
    } else {
      window.dispatchEvent(new CustomEvent("select-condition", { detail: slug }));
    }
    const el = document.getElementById("store-catalog") || document.getElementById("catalog");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderConditionIcon = (slugOrName = "") => {
    const s = slugOrName.toLowerCase();
    if (s.includes("hair")) {
      return <Scissors className="w-9 h-9 text-amber-700" />;
    }
    if (s.includes("cough") || s.includes("cold") || s.includes("respiratory")) {
      return <Wind className="w-9 h-9 text-blue-600" />;
    }
    if (s.includes("bone") || s.includes("joint")) {
      return <ShieldAlert className="w-9 h-9 text-amber-800" />;
    }
    if (s.includes("acne") || s.includes("skin") || s.includes("derma")) {
      return <Sparkles className="w-9 h-9 text-yellow-600" />;
    }
    if (s.includes("pain") || s.includes("ache")) {
      return <Zap className="w-9 h-9 text-rose-600" />;
    }
    if (s.includes("sleep") || s.includes("insomnia")) {
      return <Moon className="w-9 h-9 text-indigo-600" />;
    }
    if (s.includes("digest") || s.includes("stomach") || s.includes("gut")) {
      return <Flame className="w-9 h-9 text-orange-600" />;
    }
    if (s.includes("diabet") || s.includes("sugar") || s.includes("glucose")) {
      return <HeartPulse className="w-9 h-9 text-red-600" />;
    }
    return <Activity className="w-9 h-9 text-amber-600" />;
  };

  const displayConditions = [...conditions, ...conditions];

  return (
    <div className="flex flex-col gap-3 py-2 select-none overflow-hidden">
      {/* Header with Navigation Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Care By Condition
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Find targeted medicines &amp; treatments for your specific health needs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleDirection("ltr")}
            aria-label="Slide Left to Right"
            title="Slide Left to Right"
            className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-sm shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              slideDirection === "ltr" ? "btn-amber-gradient text-slate-900" : "bg-white border border-amber-200 text-slate-700"
            }`}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => toggleDirection("rtl")}
            aria-label="Slide Right to Left"
            title="Slide Right to Left"
            className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-sm shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              slideDirection === "rtl" ? "btn-amber-gradient text-slate-900" : "bg-white border border-amber-200 text-slate-700"
            }`}
          >
            ›
          </button>
        </div>
      </div>

      {/* Auto-Sliding Conditions Track (Continuous Left-to-Right loop, Pauses on Hover) */}
      <div
        className="relative w-full overflow-hidden pb-3 pt-2 group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div
          ref={scrollRef}
          className={`flex items-stretch gap-4 sm:gap-5 ${
            slideDirection === "ltr" ? "animate-slide-ltr" : "animate-slide-rtl"
          }`}
          style={{ animationPlayState: isPaused ? "paused" : "running" }}
        >
          {displayConditions.map((item, idx) => {
            const imgSrc = item.imageUrl || (item.slug ? `/images/conditions/${item.slug}.jpg` : null);
            return (
              <a
                key={`${item._id || item.slug}-${idx}`}
                href="#store-catalog"
                onClick={(e) => handleItemClick(item.slug, e)}
                className="flex-shrink-0 w-28 sm:w-32 md:w-36 flex flex-col items-center group/card cursor-pointer transition-transform duration-200 hover:-translate-y-1"
              >
                {/* Top Circular Photo Container */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white border-2 border-[#F3EFE6] shadow-xs flex items-center justify-center relative overflow-hidden -mb-3 z-10 group-hover/card:scale-105 group-hover/card:border-amber-400 group-hover/card:shadow-md transition-all duration-200">
                  {imgSrc ? (
                    <Image
                      src={imgSrc}
                      alt={item.name ? `${item.name} condition medicines & care` : "Health condition"}
                      fill
                      sizes="96px"
                      className="object-cover transition-transform duration-300 group-hover/card:scale-110"
                    />
                  ) : (
                    renderConditionIcon(item.slug || item.name)
                  )}
                </div>

                {/* Bottom Card Base */}
                <div className="w-full bg-white border border-[#F3EFE6] rounded-2xl pt-5 pb-3 px-2 flex flex-col items-center justify-center shadow-2xs group-hover/card:shadow-warm-card group-hover/card:border-amber-300 transition-all duration-200 min-h-[70px]">
                  <span className="text-xs font-bold text-slate-800 text-center line-clamp-2 leading-tight group-hover/card:text-amber-700 transition-colors">
                    {item.name}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
