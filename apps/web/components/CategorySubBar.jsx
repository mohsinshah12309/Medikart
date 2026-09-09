"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Pill, ArrowRight, Sparkles } from "lucide-react";

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
          { name: "Antibiotics & Anti-Infectives", query: "Antibiotics" },
          { name: "Cardiovascular & Blood Pressure", query: "Blood Pressure" },
          { name: "Diabetes Management (Oral)", query: "Diabetes" },
          { name: "Pain Relief & Anti-Inflammatory", query: "Pain Relief" },
          { name: "Gastrointestinal & Acidity", query: "Acidity" },
          { name: "Neurology & Mental Health", query: "Neurology" },
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
          { name: "Stage 1 Formula (0-6 Months)", query: "Lactogen 1" },
          { name: "Stage 2 Formula (6-12 Months)", query: "BF-2" },
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
          { name: "Vitamin D3 & Calcium Tablets", query: "Calcium D3" },
          { name: "B-Complex & Energy Formulations", query: "Surbex Z" },
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
          { name: "Joint Support & Glucosamine", query: "Joint Support" },
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
          { name: "ORS & Rehydration Sachets", query: "Peditral ORS" },
          { name: "Sports & Hydration Drinks", query: "Gatorade" },
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
          { name: "Sugar-Free Sweeteners & Stevia", query: "Canderel" },
          { name: "Green Teas & Herbal Infusions", query: "Green Tea" },
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
          { name: "Blood Glucose Meters & Strips", query: "Glucometer Strips" },
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
          { name: "Knee Braces & Ankle Supports", query: "Knee Brace" },
          { name: "Cervical Collars & Lumbar Belts", query: "Lumbar Belt" },
          { name: "Anti-Bedsore Air Mattresses", query: "Air Mattress" },
        ],
      },
      {
        id: "surgical-consumables",
        name: "Surgical Supplies & Dressings",
        slug: "surgical-items",
        icon: "🩹",
        description: "Sterile disposable syringes, surgical gloves, IV cannulas, and dressing gauze.",
        nested: [
          { name: "Disposable Syringes & Needles", query: "Syringes" },
          { name: "Sterile Surgical Latex Gloves", query: "Surgical Gloves" },
          { name: "Bandages, Cotton Rolls & Gauze", query: "Bandages" },
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
          { name: "Moisturizers & Ceramide Lotions", query: "Moisturizer" },
          { name: "Medicated Anti-Dandruff Shampoos", query: "Anti Dandruff" },
        ],
      },
      {
        id: "oral-hygiene",
        name: "Oral & Personal Hygiene",
        slug: "consumer",
        icon: "🪥",
        description: "Medicated toothpastes for sensitivity, antiseptic mouthwashes, and germ-defense soaps.",
        nested: [
          { name: "Toothpastes for Sensitive Teeth", query: "Sensodyne" },
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
          { name: "Cough, Cold & Flu Relief Syrups", query: "Cough Syrup" },
          { name: "Antacids & Fast Heartburn Relief", query: "Gaviscon" },
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
  const hoverTimeoutRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  // Create slug-to-category lookup
  const categoryBySlug = React.useMemo(() => {
    const map = {};
    categories.forEach((cat) => {
      const slug = cat.slug || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      if (slug) map[slug] = cat;
    });
    return map;
  }, [categories]);

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

    if (pathname === "/") {
      window.dispatchEvent(new CustomEvent("select-category", { detail: catId }));
      const el = document.getElementById("store-catalog") || document.getElementById("catalog");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      router.push(`/?category=${catId}#store-catalog`);
    }
  };

  const handleNestedSearchClick = (query, e) => {
    if (e) e.preventDefault();
    setActiveDeptId(null);

    if (pathname === "/") {
      const inputEl = document.getElementById("catalog-search-input");
      if (inputEl) {
        inputEl.value = query;
        inputEl.dispatchEvent(new Event("input", { bubbles: true }));
      }
      const el = document.getElementById("store-catalog") || document.getElementById("catalog");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      router.push(`/?search=${encodeURIComponent(query)}#store-catalog`);
    } else {
      router.push(`/?search=${encodeURIComponent(query)}#store-catalog`);
    }
  };

  return (
    <div
      className="w-full bg-white border-b border-[#F3EFE6] relative z-30 select-none transition-all"
      onMouseLeave={handleMouseLeave}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Horizontal Category Sub-Navbar */}
        <nav
          aria-label="Healthcare Department navigation"
          className="flex items-center justify-between overflow-x-auto scrollbar-none py-2 gap-2 sm:gap-3 lg:gap-4"
        >
          {DEPARTMENTS.map((dept) => {
            const isOpen = activeDeptId === dept.id;

            return (
              <div
                key={dept.id}
                className="relative py-1 flex-shrink-0"
                onMouseEnter={() => handleMouseEnterDept(dept.id)}
              >
                <button
                  type="button"
                  onClick={() => {
                    const primaryCat = categoryBySlug[dept.primarySlug];
                    if (primaryCat) handleCategorySelect(primaryCat._id);
                    else setActiveDeptId(isOpen ? null : dept.id);
                  }}
                  aria-expanded={isOpen}
                  className={`group inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all cursor-pointer ${
                    isOpen
                      ? "text-amber-600 bg-amber-50/90 font-bold shadow-2xs ring-1 ring-amber-200"
                      : "text-slate-700 hover:text-amber-600 hover:bg-amber-50/50"
                  }`}
                >
                  <span className="whitespace-nowrap">{dept.name}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
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
          <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400" />

          {(() => {
            const currentDept = DEPARTMENTS.find((d) => d.id === activeDeptId);
            if (!currentDept) return null;

            const activeSub = currentDept.subcategories[activeSubIndex] || currentDept.subcategories[0];
            const primaryCat = categoryBySlug[currentDept.primarySlug];

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
                      const catObj = categoryBySlug[sub.slug];

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
                        {categoryBySlug[activeSub.slug] && (
                          <button
                            type="button"
                            onClick={(e) => handleCategorySelect(categoryBySlug[activeSub.slug]._id, e)}
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
                            onClick={(e) => handleNestedSearchClick(item.query, e)}
                            className="group p-3 rounded-xl bg-white border border-slate-200/80 hover:border-amber-300 hover:bg-amber-50/50 shadow-3xs hover:shadow-2xs transition-all cursor-pointer select-none text-left flex items-center justify-between"
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
    </div>
  );
}
