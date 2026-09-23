"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Pill, ArrowRight, Sparkles, Layers, Search, X } from "lucide-react";

import {
  triggerCatalogSearch,
  triggerCategorySelect,
  scrollToCatalog,
} from "../lib/catalogEvents";

// Canonical Multi-Level Healthcare Departments & Nested Subcategories (Dvago Architecture)
const DEPARTMENTS = [
  {
    id: "medicine",
    name: "Medicine",
    shortName: "Medicine",
    icon: "💊",
    primarySlug: "medicines",
    subcategories: [
      {
        id: "prescription",
        name: "Prescription Medicines",
        slug: "medicines",
        icon: "℞",
        description: "Certified prescription drugs dispensed under licensed pharmacist supervision.",
        nested: [
          { name: "Antibiotics & Anti-Infectives", query: "Augmentin" },
          { name: "Cardiovascular & Blood Pressure", query: "Capoten" },
          { name: "Diabetes Management (Oral)", query: "Glucophage" },
          { name: "Pain Relief & Anti-Inflammatory", query: "Panadol" },
          { name: "Gastrointestinal & Acidity", query: "Gaviscon" },
          { name: "Neurology & Mental Health", query: "Lexotanil" },
        ],
      },
      {
        id: "cold-chain",
        name: "Fridge & Cold-Chain Items",
        slug: "fridge-items",
        icon: "❄️",
        description: "Temperature-controlled biologicals, insulins & refrigerated eye drops (2°C - 8°C).",
        nested: [
          { name: "Insulin Pens & Cartridges", query: "Insulin" },
          { name: "Vaccines & Biologicals", query: "Vaccines" },
          { name: "Ophthalmic & Eye Drops", query: "Eye Drops" },
          { name: "Injections & Infusions", query: "Injections" },
        ],
      },
      {
        id: "herbal-care",
        name: "Herbal & Natural Care",
        slug: "herbal",
        icon: "🌿",
        description: "Authentic herbal remedies, organic syrups, and botanical health supplements.",
        nested: [
          { name: "Herbal Cough & Flu Syrups", query: "Herbal Syrups" },
          { name: "Ispaghol & Digestive Husks", query: "Ispaghol" },
          { name: "Ginseng & Vitality Tonics", query: "Ginseng" },
          { name: "Natural Herbal Oils", query: "Herbal" },
        ],
      },
    ],
  },
  {
    id: "baby-mother-care",
    name: "Baby & Mother Care",
    shortName: "Baby Care",
    icon: "🍼",
    primarySlug: "diapers-napkins",
    subcategories: [
      {
        id: "diapers-wipes",
        name: "Diapers & Hygiene",
        slug: "diapers-napkins",
        icon: "🧷",
        description: "Soft leak-proof baby diapers, pull-up pants, and hypoallergenic cleansing wipes.",
        nested: [
          { name: "Newborn Tape Diapers (Size 1-2)", query: "Newborn Diapers" },
          { name: "Baby Pant Diapers (Size 3-6)", query: "Pant Diapers" },
          { name: "Wet Wipes & Sensitive Cleansing", query: "Baby Wipes" },
          { name: "Diaper Rash Creams & Powders", query: "Rash Cream" },
        ],
      },
      {
        id: "baby-nutrition",
        name: "Infant Milk & Nutrition",
        slug: "milk-powder",
        icon: "🥛",
        description: "Certified infant formulas, stage 1-3 growing up milk, and nutritious cereals.",
        nested: [
          { name: "Stage 1 Formula (0-6 Months)", query: "Lactogen" },
          { name: "Stage 2 Formula (6-12 Months)", query: "Formula" },
          { name: "Stage 3 Growing-Up Milk (1-3 Yrs)", query: "Pediasure" },
          { name: "Lactose-Free & Special Formula", query: "Lactose Free" },
          { name: "Baby Cereals & Purees", query: "Cerelac" },
        ],
      },
      {
        id: "maternity-care",
        name: "Mother & Maternity Wellness",
        slug: "diapers-napkins",
        icon: "🤰",
        description: "Prenatal, postnatal vitamins, breast pumps, and nourishing maternity skincare.",
        nested: [
          { name: "Prenatal Folic Acid & Iron", query: "Pregnacare" },
          { name: "Breastfeeding Pumps & Nursing", query: "Breast Pump" },
          { name: "Stretch Mark & Nipple Creams", query: "Maternity Cream" },
        ],
      },
    ],
  },
  {
    id: "nutritions-supplements",
    name: "Nutritions & Supplements",
    shortName: "Supplements",
    icon: "✨",
    primarySlug: "vitamins",
    subcategories: [
      {
        id: "daily-vitamins",
        name: "Daily Vitamins & Minerals",
        slug: "vitamins",
        icon: "💊",
        description: "Essential multivitamins, effervescent vitamin C, zinc, and bone-strengthening D3.",
        nested: [
          { name: "Multivitamins (Men & Women)", query: "Multivitamins" },
          { name: "Vitamin C & Immunity Boosters", query: "Vitamin C" },
          { name: "Vitamin D3 & Calcium Tablets", query: "Calcium" },
          { name: "B-Complex & Energy Formulations", query: "Surbex" },
        ],
      },
      {
        id: "nutraceutical-spec",
        name: "Nutraceutical Specialties",
        slug: "nutraceutical",
        icon: "🧬",
        description: "Omega-3 fish oils, joint health glucosamine, and collagen beauty peptides.",
        nested: [
          { name: "Omega-3 & Deep Sea Fish Oil", query: "Fish Oil" },
          { name: "Collagen Peptides & Biotin Plus", query: "Collagen" },
          { name: "Joint Support & Glucosamine", query: "Glucosamine" },
          { name: "Liver & Detox Supplements", query: "Nutraceutical" },
        ],
      },
    ],
  },
  {
    id: "foods-beverages",
    name: "Foods & Beverages",
    shortName: "Beverages",
    icon: "🥤",
    primarySlug: "beverages",
    subcategories: [
      {
        id: "hydration-ors",
        name: "Hydration & Electrolytes",
        slug: "beverages",
        icon: "💧",
        description: "Rapid dehydration recovery, WHO-standard ORS, and refreshing electrolyte drinks.",
        nested: [
          { name: "ORS & Rehydration Sachets", query: "ORS" },
          { name: "Sports & Hydration Drinks", query: "Hydration" },
          { name: "Dextrose Glucose Energy Powders", query: "Glucose" },
        ],
      },
      {
        id: "dietary-nutrition",
        name: "Wholesome Health Foods",
        slug: "consumer",
        icon: "🥣",
        description: "Meal replacement nutritional shakes, sugar substitutes, and organic herbal teas.",
        nested: [
          { name: "Nutritional Shakes & Ensure", query: "Ensure" },
          { name: "Sugar-Free Sweeteners & Stevia", query: "Sweetener" },
          { name: "Green Teas & Herbal Infusions", query: "Tea" },
        ],
      },
    ],
  },
  {
    id: "devices-support",
    name: "Devices & Support",
    shortName: "Devices",
    icon: "🩺",
    primarySlug: "diagnostics",
    subcategories: [
      {
        id: "diagnostics-home",
        name: "Diagnostics & Monitors",
        slug: "diagnostics",
        icon: "📟",
        description: "Accurate digital blood pressure monitors, glucometers, and infrared thermometers.",
        nested: [
          { name: "Digital Blood Pressure Monitors", query: "BP Monitor" },
          { name: "Blood Glucose Meters & Strips", query: "Glucometer" },
          { name: "Infrared Forehead Thermometers", query: "Thermometer" },
          { name: "Compressor & Mesh Nebulizers", query: "Nebulizer" },
        ],
      },
      {
        id: "mobility-supports",
        name: "Patient Supports & Mobility",
        slug: "patient-supports",
        icon: "🦽",
        description: "Foldable wheelchairs, orthopaedic knee braces, walkers, and lumbar belts.",
        nested: [
          { name: "Foldable Wheelchairs & Walkers", query: "Wheelchair" },
          { name: "Knee Braces & Ankle Supports", query: "Knee" },
          { name: "Cervical Collars & Lumbar Belts", query: "Belt" },
          { name: "Anti-Bedsore Air Mattresses", query: "Mattress" },
        ],
      },
      {
        id: "surgical-consumables",
        name: "Surgical Supplies & Dressings",
        slug: "surgical-items",
        icon: "🩹",
        description: "Sterile disposable syringes, surgical gloves, IV cannulas, and dressing gauze.",
        nested: [
          { name: "Disposable Syringes & Needles", query: "Syringe" },
          { name: "Sterile Surgical Latex Gloves", query: "Gloves" },
          { name: "Bandages, Cotton Rolls & Gauze", query: "Bandage" },
        ],
      },
    ],
  },
  {
    id: "personal-care",
    name: "Personal Care",
    shortName: "Personal Care",
    icon: "🧴",
    primarySlug: "dermatology",
    subcategories: [
      {
        id: "clinical-dermatology",
        name: "Dermatology & Skincare",
        slug: "dermatology",
        icon: "☀️",
        description: "Medicated broad-spectrum sunblocks, acne washes, and barrier repair lotions.",
        nested: [
          { name: "Medicated Sunscreens (SPF 50-100)", query: "Sunblock" },
          { name: "Acne Solutions & Face Washes", query: "Acne" },
          { name: "Moisturizers & Ceramide Lotions", query: "Lotion" },
          { name: "Medicated Anti-Dandruff Shampoos", query: "Shampoo" },
        ],
      },
      {
        id: "oral-hygiene",
        name: "Oral & Personal Hygiene",
        slug: "consumer",
        icon: "🪥",
        description: "Medicated toothpastes for sensitivity, antiseptic mouthwashes, and germ-defense soaps.",
        nested: [
          { name: "Toothpastes for Sensitive Teeth", query: "Toothpaste" },
          { name: "Antibacterial Mouthwashes", query: "Mouthwash" },
          { name: "Antiseptic Hand Sanitizers & Soaps", query: "Sanitizer" },
        ],
      },
    ],
  },
  {
    id: "otc-health-need",
    name: "OTC And Health Need",
    shortName: "OTC",
    icon: "🩹",
    primarySlug: "otc",
    subcategories: [
      {
        id: "otc-relief",
        name: "Over-the-Counter Relief",
        slug: "otc",
        icon: "🤒",
        description: "Instant relief for headache, fever, cough, acidity, heartburn, and common colds.",
        nested: [
          { name: "Fever, Headache & Migraine", query: "Panadol" },
          { name: "Cough, Cold & Flu Relief Syrups", query: "Cough" },
          { name: "Antacids & Fast Heartburn Relief", query: "Antacid" },
          { name: "Anti-Allergy & Antihistamines", query: "Allergy" },
        ],
      },
      {
        id: "first-aid-supplies",
        name: "First Aid & Emergency",
        slug: "general-items",
        icon: "🩹",
        description: "Antiseptic liquids, adhesive plasters, sterile cotton, and hot/cold gel packs.",
        nested: [
          { name: "Antiseptic Liquids & Ointments", query: "Pyodine" },
          { name: "Adhesive Waterproof Plasters", query: "Band Aid" },
          { name: "Hot Water Bottles & Ice Packs", query: "Ice Pack" },
        ],
      },
    ],
  },
];

export default function CategorySubBar({ categories = [] }) {
  const [activeDeptId, setActiveDeptId] = useState(null);
  const [activeSubIndex, setActiveSubIndex] = useState(0);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState("");
  const [expandedDeptId, setExpandedDeptId] = useState(null);
  const [mounted, setMounted] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when mobile category drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileDrawerOpen]);

  // Create slug-to-category lookup
  const categoryBySlug = React.useMemo(() => {
    const map = {};
    categories.forEach((cat) => {
      const slug = cat.slug || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      if (slug) map[slug] = cat;
      if (cat.name) {
        map[cat.name.toLowerCase()] = cat;
      }
    });
    return map;
  }, [categories]);

  const findCategory = (slugOrName) => {
    if (!slugOrName) return null;
    if (categoryBySlug[slugOrName]) return categoryBySlug[slugOrName];
    const lower = slugOrName.toLowerCase();
    return (
      categories.find(
        (c) =>
          c.slug === lower ||
          c.name?.toLowerCase().includes(lower) ||
          lower.includes(c.name?.toLowerCase() || "")
      ) || null
    );
  };

  // Reset active subcategory when changing departments
  const handleMouseEnterDept = (deptId) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setActiveDeptId(deptId);
    setActiveSubIndex(0);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveDeptId(null);
    }, 240);
  };

  const handleCategorySelect = (catId, e) => {
    if (e) e.preventDefault();
    setActiveDeptId(null);
    setMobileDrawerOpen(false);

    triggerCategorySelect(catId, true);
    scrollToCatalog();

    if (pathname !== "/") {
      router.push(`/?category=${catId}#store-catalog`);
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete("search");
      if (catId) {
        url.searchParams.set("category", catId);
      } else {
        url.searchParams.delete("category");
      }
      window.history.pushState({}, "", `${url.pathname}?${url.searchParams.toString()}#store-catalog`);
    }
  };

  const handleNestedSearchClick = (query, catId, e) => {
    if (e) e.preventDefault();
    setActiveDeptId(null);
    setMobileDrawerOpen(false);

    triggerCatalogSearch(query, "");
    scrollToCatalog();

    if (pathname !== "/") {
      router.push(`/?search=${encodeURIComponent(query)}#store-catalog`);
    } else {
      const url = new URL(window.location.href);
      url.searchParams.set("search", query);
      url.searchParams.delete("category");
      window.history.pushState({}, "", `${url.pathname}?${url.searchParams.toString()}#store-catalog`);
    }
  };

  const filteredDepartments = DEPARTMENTS.filter((dept) => {
    if (!drawerSearch.trim()) return true;
    const q = drawerSearch.toLowerCase();
    if (dept.name.toLowerCase().includes(q)) return true;
    return dept.subcategories?.some(
      (sub) =>
        sub.name.toLowerCase().includes(q) ||
        sub.nested?.some((n) => n.name.toLowerCase().includes(q))
    );
  });

  return (
    <div
      className="w-full bg-white border-b border-[#F3EFE6] relative z-30 transition-all"
      onMouseLeave={handleMouseLeave}
    >
      <div className="max-w-[1600px] 2xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Horizontal Category Sub-Navbar with Mobile All-Categories Trigger */}
        <div className="relative flex items-center py-1.5 sm:py-2">
          
          {/* Mobile All Categories / Sidebar View Trigger Button */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden flex-shrink-0 mr-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF352] hover:bg-[#FFE01B] border border-amber-300 text-xs font-black text-slate-950 shadow-2xs active:scale-95 transition-all cursor-pointer"
            aria-label="View all categories drawer"
          >
            <span className="text-sm">🗂️</span>
            <span>All Categories</span>
          </button>

          {/* Scrollable category pills with swipe support */}
          <nav
            aria-label="Healthcare Department navigation"
            className="flex items-center flex-1 overflow-x-auto scrollbar-none gap-1.5 sm:gap-2.5 lg:gap-4 snap-x snap-mandatory pr-6"
          >
            {DEPARTMENTS.map((dept) => {
              const isOpen = activeDeptId === dept.id;
              const primaryCat = findCategory(dept.primarySlug) || findCategory(dept.shortName) || findCategory(dept.name);

              return (
                <div
                  key={dept.id}
                  className="relative py-1 flex-shrink-0 snap-start"
                  onMouseEnter={() => handleMouseEnterDept(dept.id)}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      if (primaryCat) {
                        handleCategorySelect(primaryCat._id, e);
                      } else {
                        setActiveDeptId(isOpen ? null : dept.id);
                      }
                    }}
                    aria-expanded={isOpen}
                    className={`group inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all cursor-pointer ${
                      isOpen
                        ? "text-amber-600 bg-amber-50/90 font-bold shadow-2xs ring-1 ring-amber-200"
                        : "text-slate-700 hover:text-amber-600 hover:bg-amber-50/50 bg-slate-50/70 sm:bg-transparent"
                    }`}
                  >
                    <span className="text-xs sm:hidden">{dept.icon}</span>
                    <span className="whitespace-nowrap sm:hidden">{dept.shortName || dept.name}</span>
                    <span className="whitespace-nowrap hidden sm:inline">{dept.name}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 hidden sm:block ${
                        isOpen
                          ? "rotate-180 text-amber-500"
                          : "text-slate-400 group-hover:text-amber-500"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </nav>

          {/* Swipe indicator / right fade gradient for mobile */}
          <div
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden pointer-events-auto absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white via-white/95 to-transparent flex items-center justify-end pr-0.5 text-amber-600 cursor-pointer"
            title="Swipe or tap to view all categories"
          >
            <span className="text-xs font-black animate-pulse">›</span>
          </div>
        </div>
      </div>

      {/* ─── DVAGO MULTI-LEVEL NESTED SUBCATEGORIES DRILL-DOWN PANEL ─── */}
      {activeDeptId && (
        <div
          className="absolute top-full left-0 right-0 w-full bg-white/98 backdrop-blur-md border-b border-amber-200/90 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          }}
          onMouseLeave={handleMouseLeave}
        >
          {/* Top Amber Brand Accent Strip */}
          <div className="h-1 w-full bg-gradient-to-r from-amber-300 via-[#FFCB05] to-yellow-300" />

          {(() => {
            const currentDept = DEPARTMENTS.find((d) => d.id === activeDeptId);
            if (!currentDept) return null;

            const activeSub = currentDept.subcategories[activeSubIndex] || currentDept.subcategories[0];
            const primaryCat = findCategory(currentDept.primarySlug) || findCategory(currentDept.shortName) || findCategory(currentDept.name);
            const activeSubCat = findCategory(activeSub?.slug) || findCategory(activeSub?.name);

            return (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Department Header Strip inside Mega-Menu */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{currentDept.icon}</span>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 font-heading">
                        {currentDept.name}
                      </h3>
                      <span className="text-xs text-slate-500 font-medium">
                        Select a subcategory to explore specialized products and formulations
                      </span>
                    </div>
                  </div>

                  {primaryCat && (
                    <button
                      type="button"
                      onClick={(e) => handleCategorySelect(primaryCat._id, e)}
                      className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 group cursor-pointer bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200"
                    >
                      <span>View All in {currentDept.shortName}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>

                {/* 2-Tier Subcategories -> Nested Subcategories Drill-down Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Subcategories List (Tier 1) */}
                  <div className="md:col-span-5 lg:col-span-4 space-y-2 border-r border-slate-100 pr-4">
                    <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 pb-1">
                      Subcategories
                    </div>

                    {currentDept.subcategories.map((sub, idx) => {
                      const isSelected = activeSubIndex === idx;
                      const catObj = findCategory(sub.slug) || findCategory(sub.name);

                      return (
                        <div
                          key={sub.id}
                          onMouseEnter={() => setActiveSubIndex(idx)}
                          onClick={(e) => {
                            if (catObj) handleCategorySelect(catObj._id, e);
                          }}
                          className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                            isSelected
                              ? "bg-amber-100/70 border border-amber-300/80 shadow-2xs"
                              : "hover:bg-slate-50 border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xl flex-shrink-0">{sub.icon}</span>
                            <div className="text-left">
                              <p
                                className={`text-xs font-bold leading-tight ${
                                  isSelected ? "text-amber-950 font-extrabold" : "text-slate-800"
                                }`}
                              >
                                {sub.name}
                              </p>
                              <p className="text-[10.5px] text-slate-500 line-clamp-1 mt-0.5">
                                {sub.nested.length} item categories
                              </p>
                            </div>
                          </div>
                          <ChevronRight
                            className={`w-4 h-4 transition-transform flex-shrink-0 ${
                              isSelected
                                ? "text-amber-700 translate-x-0.5"
                                : "text-slate-300 opacity-60"
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Panel: Nested Sub-Items & Therapeutic Classes (Tier 2) */}
                  <div className="md:col-span-7 lg:col-span-8 flex flex-col justify-between h-full">
                    <div>
                      {/* Active Subcategory Heading & Description */}
                      <div className="mb-4 bg-gradient-to-r from-amber-50/60 to-yellow-50/40 p-4 rounded-2xl border border-amber-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                            Drill-down Subcategories
                          </span>
                          <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                            {activeSub.name}
                          </h4>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {activeSub.description}
                          </p>
                        </div>
                        {activeSubCat && (
                          <button
                            type="button"
                            onClick={(e) => handleCategorySelect(activeSubCat._id, e)}
                            className="btn-amber-gradient px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs whitespace-nowrap hidden sm:inline-flex"
                          >
                            Explore &rarr;
                          </button>
                        )}
                      </div>

                      {/* Nested Items Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {activeSub.nested.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={(e) => handleNestedSearchClick(item.query, activeSubCat?._id, e)}
                            className="group p-3 rounded-xl bg-white border border-slate-200/80 hover:border-amber-300 hover:bg-amber-50/50 shadow-3xs hover:shadow-2xs transition-all cursor-pointer text-left flex items-center justify-between"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-bold text-slate-800 group-hover:text-amber-800 transition-colors line-clamp-1">
                                {item.name}
                              </p>
                              <span className="text-[10px] text-slate-400 group-hover:text-amber-600">
                                Filter products &rarr;
                              </span>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-amber-200 text-slate-400 group-hover:text-amber-900 flex items-center justify-center text-xs flex-shrink-0 transition-colors">
                              &rsaquo;
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Pharmacist Help Strip */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-semibold text-slate-700">Looking for a specific Pakistani brand or generic?</span>
                      </div>
                      <Link
                        href="/instant-order"
                        onClick={() => setActiveDeptId(null)}
                        className="font-bold text-amber-700 hover:text-amber-800 underline decoration-amber-300"
                      >
                        Upload Doctor Prescription &rarr;
                      </Link>
                    </div>

                  </div>

                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ─── FULL MOBILE CATEGORY SIDEBAR DRAWER (PORTAL) ─── */}
      {mounted && mobileDrawerOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Slide-in Drawer Container */}
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250 overflow-hidden">
            {/* Drawer Header */}
            <div className="p-4 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-b border-amber-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FFF352] border border-amber-300 flex items-center justify-center text-base shadow-2xs font-black">
                  🗂️
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 font-heading">
                    All Categories
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Explore healthcare departments
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm shadow-2xs transition-colors cursor-pointer"
                aria-label="Close categories drawer"
              >
                ✕
              </button>
            </div>

            {/* Quick Search in Categories */}
            <div className="p-3 border-b border-slate-100 bg-white">
              <div className="relative">
                <input
                  type="text"
                  value={drawerSearch}
                  onChange={(e) => setDrawerSearch(e.target.value)}
                  placeholder="Filter categories or medicines..."
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-amber-400 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-all"
                />
                <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">🔍</span>
                {drawerSearch && (
                  <button
                    type="button"
                    onClick={() => setDrawerSearch("")}
                    className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Categories Accordion / List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
              {filteredDepartments.map((dept) => {
                const isExpanded = expandedDeptId === dept.id || Boolean(drawerSearch);
                const primaryCat = findCategory(dept.primarySlug) || findCategory(dept.shortName) || findCategory(dept.name);

                return (
                  <div
                    key={dept.id}
                    className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs transition-all"
                  >
                    {/* Department Header Button */}
                    <div className="flex items-center justify-between p-3 bg-slate-50/70 hover:bg-amber-50/60 transition-colors">
                      <button
                        type="button"
                        onClick={(e) => {
                          if (primaryCat) {
                            handleCategorySelect(primaryCat._id, e);
                            setMobileDrawerOpen(false);
                          }
                        }}
                        className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
                      >
                        <span className="text-lg flex-shrink-0">{dept.icon}</span>
                        <div className="min-w-0">
                          <span className="text-xs font-black text-slate-900 block truncate">
                            {dept.name}
                          </span>
                          <span className="text-[10px] text-amber-700 font-bold block">
                            {dept.subcategories?.length || 0} Subcategories
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedDeptId(isExpanded ? null : dept.id)}
                        className="w-7 h-7 rounded-lg hover:bg-slate-200/70 flex items-center justify-center text-slate-500 transition-colors shrink-0 ml-1 cursor-pointer"
                        aria-label="Toggle subcategories"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180 text-amber-600" : ""}`} />
                      </button>
                    </div>

                    {/* Subcategories list */}
                    {isExpanded && (
                      <div className="p-2.5 pt-1.5 space-y-2 border-t border-slate-100 bg-white">
                        {dept.subcategories?.map((sub) => {
                          const subCat = findCategory(sub.slug) || findCategory(sub.name);
                          return (
                            <div key={sub.id} className="p-2 rounded-xl bg-amber-50/40 border border-amber-100">
                              <button
                                type="button"
                                onClick={(e) => {
                                  if (subCat) {
                                    handleCategorySelect(subCat._id, e);
                                  } else {
                                    handleNestedSearchClick(sub.name, null, e);
                                  }
                                  setMobileDrawerOpen(false);
                                }}
                                className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-900 hover:text-amber-700 cursor-pointer group"
                              >
                                <span className="flex items-center gap-1.5 truncate">
                                  <span>{sub.icon}</span>
                                  <span>{sub.name}</span>
                                </span>
                                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                              </button>

                              {/* Nested search chips */}
                              {sub.nested && (
                                <div className="flex flex-wrap gap-1 mt-1.5 pt-1 border-t border-amber-200/40">
                                  {sub.nested.slice(0, 4).map((n, i) => (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={(e) => {
                                        handleNestedSearchClick(n.query || n.name, subCat?._id, e);
                                        setMobileDrawerOpen(false);
                                      }}
                                      className="px-2 py-0.5 rounded-lg bg-white border border-amber-200 text-[10px] font-semibold text-slate-700 hover:bg-amber-100 hover:text-amber-900 transition-colors cursor-pointer"
                                    >
                                      {n.name}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Footer Action */}
            <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
              <Link
                href="/#store-catalog"
                onClick={(e) => {
                  setMobileDrawerOpen(false);
                  scrollToCatalog();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-[#FFF352] text-xs font-black text-center shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>View Full Store Catalog</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
