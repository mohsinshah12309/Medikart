const fs = require('fs');
const path = require('path');

// Beautiful, high-end, responsive SVG illustrations designed specifically for Online Pharmacy UI (Dvago / 1mg style)
const CATEGORIES_SVG = {
  'medicines': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="medBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EFF6FF"/>
      <stop offset="100%" stop-color="#DBEAFE"/>
    </linearGradient>
    <linearGradient id="blisterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#E2E8F0"/>
    </linearGradient>
    <linearGradient id="capsuleRed" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#EF4444"/>
      <stop offset="100%" stop-color="#DC2626"/>
    </linearGradient>
    <linearGradient id="capsuleBlue" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
    <linearGradient id="pillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60A5FA"/>
      <stop offset="100%" stop-color="#2563EB"/>
    </linearGradient>
    <filter id="medShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#1E3A8A" flood-opacity="0.15"/>
    </filter>
  </defs>
  <rect width="200" height="200" rx="36" fill="url(#medBg)"/>
  
  <!-- Blister Pack -->
  <g filter="url(#medShadow)" transform="rotate(-10 90 100)">
    <rect x="35" y="45" width="90" height="110" rx="12" fill="url(#blisterGrad)" stroke="#CBD5E1" stroke-width="2"/>
    <!-- Blister grid -->
    <rect x="47" y="57" width="28" height="18" rx="9" fill="url(#pillGrad)"/>
    <rect x="85" y="57" width="28" height="18" rx="9" fill="url(#pillGrad)"/>
    <rect x="47" y="85" width="28" height="18" rx="9" fill="url(#pillGrad)"/>
    <rect x="85" y="85" width="28" height="18" rx="9" fill="url(#pillGrad)"/>
    <rect x="47" y="113" width="28" height="18" rx="9" fill="url(#pillGrad)"/>
    <rect x="85" y="113" width="28" height="18" rx="9" fill="url(#pillGrad)"/>
    <!-- Foil shine -->
    <line x1="38" y1="48" x2="122" y2="48" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
  </g>

  <!-- Large 3D Capsule in Foreground -->
  <g filter="url(#medShadow)" transform="rotate(35 130 110)">
    <rect x="100" y="55" width="40" height="50" rx="20" fill="url(#capsuleRed)"/>
    <rect x="100" y="95" width="40" height="50" rx="20" fill="url(#capsuleBlue)"/>
    <rect x="99" y="93" width="42" height="4" fill="#FFFFFF" opacity="0.9"/>
    <!-- Capsule Gloss -->
    <ellipse cx="112" cy="72" rx="4" ry="10" fill="#FFFFFF" opacity="0.6"/>
    <ellipse cx="112" cy="120" rx="4" ry="10" fill="#FFFFFF" opacity="0.4"/>
  </g>

  <!-- Rx Medical Cross Badge -->
  <circle cx="155" cy="45" r="18" fill="#2563EB" filter="url(#medShadow)"/>
  <path d="M155 35 V55 M145 45 H165" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
</svg>`,

  'vitamins': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="vitBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFBEB"/>
      <stop offset="100%" stop-color="#FEF3C7"/>
    </linearGradient>
    <linearGradient id="bottleAmber" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#B45309"/>
      <stop offset="40%" stop-color="#D97706"/>
      <stop offset="100%" stop-color="#92400E"/>
    </linearGradient>
    <linearGradient id="goldSoftgel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="60%" stop-color="#EAB308"/>
      <stop offset="100%" stop-color="#CA8A04"/>
    </linearGradient>
    <filter id="vitShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#78350F" flood-opacity="0.2"/>
    </filter>
  </defs>
  <rect width="200" height="200" rx="36" fill="url(#vitBg)"/>
  
  <!-- Multivitamin Amber Bottle -->
  <g filter="url(#vitShadow)">
    <rect x="55" y="32" width="50" height="14" rx="4" fill="#F8FAFC" stroke="#E2E8F0"/>
    <rect x="62" y="46" width="36" height="10" fill="#B45309"/>
    <rect x="45" y="56" width="70" height="95" rx="14" fill="url(#bottleAmber)"/>
    <!-- Label -->
    <rect x="48" y="75" width="64" height="55" rx="6" fill="#FFFFFF"/>
    <rect x="54" y="83" width="30" height="6" rx="3" fill="#D97706"/>
    <rect x="54" y="93" width="52" height="4" rx="2" fill="#94A3B8"/>
    <rect x="54" y="101" width="40" height="4" rx="2" fill="#CBD5E1"/>
    <!-- Bottle Shine -->
    <path d="M52 62 L52 145" stroke="#FDE68A" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
  </g>

  <!-- Golden Translucent Omega Softgels & Vitamin C Slice -->
  <g filter="url(#vitShadow)">
    <!-- Vitamin C Citrus slice -->
    <circle cx="138" cy="120" r="32" fill="#F97316"/>
    <circle cx="138" cy="120" r="28" fill="#FDBA74"/>
    <circle cx="138" cy="120" r="24" fill="#EA580C"/>
    <path d="M138 96 L138 144 M114 120 L162 120 M121 103 L155 137 M121 137 L155 103" stroke="#FDBA74" stroke-width="2.5"/>
    <circle cx="138" cy="120" r="5" fill="#FFFFFF"/>
    
    <!-- Shiny Golden Softgel Pills -->
    <ellipse cx="120" cy="70" rx="16" ry="10" transform="rotate(-25 120 70)" fill="url(#goldSoftgel)"/>
    <ellipse cx="118" cy="67" rx="6" ry="3" transform="rotate(-25 118 67)" fill="#FFFFFF" opacity="0.8"/>

    <ellipse cx="155" cy="65" rx="14" ry="9" transform="rotate(30 155 65)" fill="url(#goldSoftgel)"/>
    <ellipse cx="153" cy="63" rx="5" ry="3" transform="rotate(30 153 63)" fill="#FFFFFF" opacity="0.8"/>
  </g>

  <!-- Sparkles -->
  <path d="M150 25 L153 32 L160 35 L153 38 L150 45 L147 38 L140 35 L147 32 Z" fill="#F59E0B"/>
</svg>`,

  'milk-powder': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="milkBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F0F9FF"/>
      <stop offset="100%" stop-color="#E0F2FE"/>
    </linearGradient>
    <linearGradient id="canMetal" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0284C7"/>
      <stop offset="50%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#0369A1"/>
    </linearGradient>
    <filter id="milkShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#0369A1" flood-opacity="0.2"/>
    </filter>
  </defs>
  <rect width="200" height="200" rx="36" fill="url(#milkBg)"/>
  
  <!-- Baby Formula Powder Tin Canister -->
  <g filter="url(#milkShadow)">
    <ellipse cx="80" cy="50" rx="42" ry="12" fill="#E2E8F0" stroke="#CBD5E1"/>
    <path d="M38 50 V135 C38 143 57 150 80 150 C103 150 122 143 122 135 V50 Z" fill="url(#canMetal)"/>
    <ellipse cx="80" cy="50" rx="42" ry="10" fill="#38BDF8"/>
    <!-- Tin Label -->
    <path d="M38 75 C60 82 100 82 122 75 V125 C100 132 60 132 38 125 Z" fill="#FFFFFF"/>
    <!-- Teddy Bear / Baby Icon on Can -->
    <circle cx="80" cy="98" r="12" fill="#FDE047"/>
    <circle cx="72" cy="88" r="5" fill="#FDE047"/>
    <circle cx="88" cy="88" r="5" fill="#FDE047"/>
    <circle cx="76" cy="97" r="1.5" fill="#713F12"/>
    <circle cx="84" cy="97" r="1.5" fill="#713F12"/>
    <ellipse cx="80" cy="102" rx="4" ry="2.5" fill="#FEF08A"/>
    <!-- Text bar on tin -->
    <rect x="58" y="115" width="44" height="4" rx="2" fill="#0284C7"/>
  </g>

  <!-- Baby Feeding Bottle with Measurement Lines -->
  <g filter="url(#milkShadow)" transform="rotate(15 140 100)">
    <!-- Nipple -->
    <path d="M135 42 Q140 30 145 42 Z" fill="#FDBA74"/>
    <rect x="130" y="42" width="20" height="8" rx="2" fill="#F43F5E"/>
    <!-- Bottle body -->
    <rect x="126" y="50" width="28" height="75" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
    <rect x="128" y="70" width="24" height="52" rx="4" fill="#F8FAFC"/>
    <!-- Milk Level -->
    <rect x="128" y="85" width="24" height="37" rx="4" fill="#FFFBEB"/>
    <!-- Graduations -->
    <line x1="130" y1="90" x2="137" y2="90" stroke="#0284C7" stroke-width="2"/>
    <line x1="130" y1="100" x2="140" y2="100" stroke="#0284C7" stroke-width="2"/>
    <line x1="130" y1="110" x2="137" y2="110" stroke="#0284C7" stroke-width="2"/>
  </g>

  <!-- Measuring Scoop -->
  <path d="M125 155 Q145 162 165 145" stroke="#F59E0B" stroke-width="4" stroke-linecap="round" fill="none"/>
  <ellipse cx="125" cy="155" rx="10" ry="7" fill="#F59E0B"/>
</svg>`,

  'herbal': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="herbBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F0FDF4"/>
      <stop offset="100%" stop-color="#DCFCE7"/>
    </linearGradient>
    <linearGradient id="mortarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="50%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <filter id="herbShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#065F46" flood-opacity="0.2"/>
    </filter>
  </defs>
  <rect width="200" height="200" rx="36" fill="url(#herbBg)"/>

  <!-- Natural Mortar & Pestle -->
  <g filter="url(#herbShadow)">
    <!-- Pestle -->
    <rect x="110" y="35" width="16" height="65" rx="8" transform="rotate(30 110 35)" fill="#6EE7B7" stroke="#047857" stroke-width="2"/>
    
    <!-- Mortar Bowl -->
    <path d="M45 90 Q100 80 155 90 L145 140 Q100 160 55 140 Z" fill="url(#mortarGrad)"/>
    <ellipse cx="100" cy="90" rx="55" ry="15" fill="#34D399"/>
    <ellipse cx="100" cy="90" rx="48" ry="10" fill="#047857"/>
  </g>

  <!-- Fresh Green Organic Medicinal Leaves -->
  <g filter="url(#herbShadow)">
    <path d="M100 75 Q125 50 145 60 Q135 85 100 75 Z" fill="#22C55E"/>
    <path d="M100 75 Q125 65 145 60" stroke="#DCFCE7" stroke-width="1.5" fill="none"/>

    <path d="M70 70 Q50 45 35 58 Q45 80 70 70 Z" fill="#16A34A"/>
    <path d="M70 70 Q50 58 35 58" stroke="#DCFCE7" stroke-width="1.5" fill="none"/>

    <path d="M100 50 Q100 20 115 30 Q115 50 100 50 Z" fill="#4ADE80"/>
  </g>

  <!-- Herbal Extract Dropper Bottle -->
  <g filter="url(#herbShadow)" transform="translate(130, 95)">
    <rect x="10" y="0" width="12" height="8" rx="2" fill="#15803D"/>
    <rect x="6" y="8" width="20" height="40" rx="6" fill="#059669"/>
    <rect x="9" y="16" width="14" height="24" rx="2" fill="#FFFFFF"/>
    <!-- Droplet -->
    <path d="M16 54 C16 54 22 62 22 66 C22 70 19 72 16 72 C13 72 10 70 10 66 C10 62 16 54 16 54 Z" fill="#22C55E"/>
  </g>
</svg>`,

  'flat-items': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="flatBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F8FAFC"/>
      <stop offset="100%" stop-color="#F1F5F9"/>
    </linearGradient>
    <linearGradient id="bandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FED7AA"/>
      <stop offset="100%" stop-color="#FDBA74"/>
    </linearGradient>
    <filter id="flatShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#475569" flood-opacity="0.15"/>
    </filter>
  </defs>
  <rect width="200" height="200" rx="36" fill="url(#flatBg)"/>

  <!-- Sterile Gauze Dressing Pad -->
  <g filter="url(#flatShadow)">
    <rect x="35" y="45" width="85" height="85" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    <!-- Woven gauze grid pattern -->
    <path d="M45 45 V130 M60 45 V130 M75 45 V130 M90 45 V130 M105 45 V130" stroke="#F1F5F9" stroke-width="2"/>
    <path d="M35 58 H120 M35 73 H120 M35 88 H120 M35 103 H120 M35 118 H120" stroke="#F1F5F9" stroke-width="2"/>
    <rect x="52" y="62" width="50" height="50" rx="4" fill="#F8FAFC" stroke="#CBD5E1" stroke-dasharray="3 3"/>
  </g>

  <!-- Surgical Adhesive Tape Roll -->
  <g filter="url(#flatShadow)">
    <ellipse cx="145" cy="135" rx="32" ry="18" fill="#E2E8F0"/>
    <ellipse cx="145" cy="130" rx="32" ry="18" fill="#FFFFFF" stroke="#CBD5E1"/>
    <ellipse cx="145" cy="130" rx="16" ry="9" fill="#0284C7"/>
    <ellipse cx="145" cy="128" rx="16" ry="9" fill="#38BDF8"/>
  </g>

  <!-- Adhesive Plaster / Band-Aid Strips (Criss-Cross) -->
  <g filter="url(#flatShadow)" transform="rotate(25 100 100)">
    <rect x="50" y="85" width="100" height="30" rx="15" fill="url(#bandGrad)" stroke="#FB923C" stroke-width="1.5"/>
    <!-- Center white wound pad -->
    <rect x="85" y="87" width="30" height="26" rx="3" fill="#FFFBEB"/>
    <!-- Air holes -->
    <circle cx="62" cy="100" r="2" fill="#EA580C"/>
    <circle cx="72" cy="94" r="2" fill="#EA580C"/>
    <circle cx="72" cy="106" r="2" fill="#EA580C"/>
    <circle cx="128" cy="94" r="2" fill="#EA580C"/>
    <circle cx="128" cy="106" r="2" fill="#EA580C"/>
    <circle cx="138" cy="100" r="2" fill="#EA580C"/>
  </g>
</svg>`,

  'consumer': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="consBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F5F3FF"/>
      <stop offset="100%" stop-color="#EDE9FE"/>
    </linearGradient>
    <linearGradient id="pumpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#8B5CF6"/>
    </linearGradient>
    <filter id="consShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#4C1D95" flood-opacity="0.15"/>
    </filter>
  </defs>
  <rect width="200" height="200" rx="36" fill="url(#consBg)"/>

  <!-- Liquid Hand Wash / Sanitizer Pump Bottle -->
  <g filter="url(#consShadow)">
    <!-- Pump head -->
    <path d="M65 35 H95 V42 H85 V52 H75 V42 H65 Z" fill="#475569"/>
    <rect x="75" y="52" width="10" height="12" fill="#94A3B8"/>
    <!-- Bottle body -->
    <path d="M55 70 C55 64 65 64 80 64 C95 64 105 64 105 70 L110 145 C110 152 98 156 80 156 C62 156 50 152 50 145 Z" fill="url(#pumpGrad)"/>
    <!-- Label -->
    <rect x="60" y="85" width="40" height="45" rx="6" fill="#FFFFFF"/>
    <circle cx="80" cy="102" r="8" fill="#C4B5FD"/>
    <path d="M80 97 V107 M75 102 H85" stroke="#6D28D9" stroke-width="2" stroke-linecap="round"/>
    <rect x="68" y="116" width="24" height="4" rx="2" fill="#A78BFA"/>
  </g>

  <!-- Toothbrush with Toothpaste Swirl -->
  <g filter="url(#consShadow)" transform="rotate(30 140 100)">
    <!-- Handle -->
    <rect x="135" y="45" width="12" height="105" rx="6" fill="#06B6D4"/>
    <rect x="137" y="110" width="8" height="35" rx="4" fill="#0891B2"/>
    <!-- Bristles -->
    <rect x="133" y="32" width="16" height="15" rx="2" fill="#FFFFFF"/>
    <!-- Toothpaste ribbon -->
    <path d="M130 32 Q141 24 152 30 Q145 35 130 32 Z" fill="#38BDF8"/>
  </g>

  <!-- Clean Sparkles -->
  <path d="M150 40 L153 46 L160 48 L153 50 L150 56 L147 50 L140 48 L147 46 Z" fill="#8B5CF6"/>
  <path d="M40 90 L42 94 L47 95 L42 97 L40 101 L38 97 L33 95 L38 94 Z" fill="#06B6D4"/>
</svg>`,

  'fridge-items': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="fridgeBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ECFEFF"/>
      <stop offset="100%" stop-color="#CFFAFE"/>
    </linearGradient>
    <linearGradient id="vialGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0891B2"/>
      <stop offset="50%" stop-color="#06B6D4"/>
      <stop offset="100%" stop-color="#0E7490"/>
    </linearGradient>
    <filter id="fridgeShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#0E7490" flood-opacity="0.2"/>
    </filter>
  </defs>
  <rect width="200" height="200" rx="36" fill="url(#fridgeBg)"/>

  <!-- Cold Chain Medical Box / Cooler with 2°C - 8°C Badge -->
  <g filter="url(#fridgeShadow)">
    <!-- Insulated container base -->
    <rect x="40" y="70" width="90" height="85" rx="14" fill="#FFFFFF" stroke="#A5F3FC" stroke-width="2"/>
    <rect x="36" y="62" width="98" height="14" rx="6" fill="#06B6D4"/>
    <!-- Temperature gauge pill -->
    <rect x="52" y="85" width="66" height="24" rx="12" fill="#E0F2FE"/>
    <text x="85" y="101" font-size="11" font-weight="900" fill="#0369A1" text-anchor="middle" font-family="Arial, sans-serif">2°C - 8°C</text>
    <!-- Cold ice pack indicator -->
    <rect x="55" y="118" width="60" height="24" rx="6" fill="#F0FDFA" stroke="#67E8F9"/>
    <circle cx="70" cy="130" r="4" fill="#06B6D4"/>
    <circle cx="85" cy="130" r="4" fill="#06B6D4"/>
    <circle cx="100" cy="130" r="4" fill="#06B6D4"/>
  </g>

  <!-- Insulin Pen / Cold Injection Vial -->
  <g filter="url(#fridgeShadow)" transform="rotate(20 145 90)">
    <!-- Vial Cap -->
    <rect x="135" y="35" width="20" height="8" rx="2" fill="#F43F5E"/>
    <rect x="139" y="43" width="12" height="6" fill="#94A3B8"/>
    <!-- Vial Glass -->
    <rect x="130" y="49" width="30" height="55" rx="6" fill="#FFFFFF" stroke="#CBD5E1"/>
    <!-- Liquid Vaccine / Insulin -->
    <rect x="132" y="65" width="26" height="37" rx="4" fill="url(#vialGrad)"/>
    <rect x="134" y="68" width="22" height="18" rx="2" fill="#FFFFFF"/>
    <line x1="137" y1="74" x2="153" y2="74" stroke="#0891B2" stroke-width="2"/>
    <line x1="137" y1="80" x2="147" y2="80" stroke="#0891B2" stroke-width="2"/>
  </g>

  <!-- Snowflakes (Cold Chain Indicator) -->
  <g fill="#0284C7">
    <!-- Snowflake 1 -->
    <g transform="translate(145, 140) scale(0.9)">
      <path d="M0 -15 V15 M-15 0 H15 M-10 -10 L10 10 M-10 10 L10 -10" stroke="#0284C7" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="3" fill="#0284C7"/>
    </g>
    <!-- Snowflake 2 -->
    <g transform="translate(45, 40) scale(0.6)">
      <path d="M0 -15 V15 M-15 0 H15 M-10 -10 L10 10 M-10 10 L10 -10" stroke="#06B6D4" stroke-width="2.5" stroke-linecap="round"/>
    </g>
  </g>
</svg>`,

  'surgical-items': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="surgBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EEF2FF"/>
      <stop offset="100%" stop-color="#E0E7FF"/>
    </linearGradient>
    <linearGradient id="steelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F8FAFC"/>
      <stop offset="50%" stop-color="#94A3B8"/>
      <stop offset="100%" stop-color="#64748B"/>
    </linearGradient>
    <filter id="surgShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#312E81" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="200" height="200" rx="36" fill="url(#surgBg)"/>

  <!-- Sterile Medical Tray -->
  <rect x="30" y="45" width="140" height="120" rx="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="3" filter="url(#surgShadow)"/>
  <rect x="38" y="53" width="124" height="104" rx="12" fill="#F1F5F9"/>

  <!-- Sterile Blue Surgical Latex Gloves -->
  <g filter="url(#surgShadow)" transform="translate(45, 65)">
    <path d="M15 45 C10 35 12 15 18 10 C22 6 28 12 30 20 C32 10 38 8 42 12 C45 15 45 22 45 28 C48 18 55 16 58 20 C60 25 58 35 55 45 L50 70 H20 Z" fill="#3B82F6" opacity="0.85"/>
  </g>

  <!-- Surgical Stainless Steel Scissors -->
  <g filter="url(#surgShadow)" transform="rotate(-35 110 110)">
    <!-- Finger loops -->
    <circle cx="85" cy="145" r="12" fill="none" stroke="url(#steelGrad)" stroke-width="5"/>
    <circle cx="115" cy="145" r="12" fill="none" stroke="url(#steelGrad)" stroke-width="5"/>
    <!-- Shanks & Joint -->
    <line x1="88" y1="135" x2="98" y2="105" stroke="url(#steelGrad)" stroke-width="5" stroke-linecap="round"/>
    <line x1="112" y1="135" x2="102" y2="105" stroke="url(#steelGrad)" stroke-width="5" stroke-linecap="round"/>
    <circle cx="100" cy="105" r="4" fill="#334155"/>
    <!-- Sharp Blades -->
    <path d="M100 105 L92 55 Q96 52 100 60 Z" fill="url(#steelGrad)"/>
    <path d="M100 105 L108 55 Q104 52 100 60 Z" fill="url(#steelGrad)"/>
  </g>

  <!-- Stainless Steel Scalpel -->
  <g filter="url(#surgShadow)" transform="rotate(45 135 105)">
    <rect x="130" y="60" width="8" height="60" rx="2" fill="url(#steelGrad)"/>
    <path d="M130 60 Q130 40 138 48 L138 60 Z" fill="#E2E8F0" stroke="#94A3B8"/>
  </g>
</svg>`,

  'dermatology': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="dermaBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF1F2"/>
      <stop offset="100%" stop-color="#FFE4E6"/>
    </linearGradient>
    <linearGradient id="serumGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FB7185"/>
      <stop offset="100%" stop-color="#F43F5E"/>
    </linearGradient>
    <filter id="dermaShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#9F1239" flood-opacity="0.15"/>
    </filter>
  </defs>
  <rect width="200" height="200" rx="36" fill="url(#dermaBg)"/>

  <!-- Clinical Skincare Serum Bottle with Dropper Pipette -->
  <g filter="url(#dermaShadow)">
    <!-- Dropper bulb -->
    <path d="M68 28 C68 22 75 22 75 22 C75 22 82 22 82 28 L82 36 H68 Z" fill="#475569"/>
    <rect x="65" y="36" width="20" height="8" rx="2" fill="#E2E8F0"/>
    <rect x="72" y="44" width="6" height="12" fill="#94A3B8"/>
    <!-- Glass bottle -->
    <rect x="52" y="56" width="46" height="88" rx="12" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
    <!-- Rose serum liquid -->
    <rect x="55" y="75" width="40" height="66" rx="8" fill="url(#serumGrad)"/>
    <!-- Clean minimal label -->
    <rect x="60" y="88" width="30" height="38" rx="4" fill="#FFFFFF"/>
    <rect x="65" y="96" width="20" height="4" rx="2" fill="#FB7185"/>
    <rect x="65" y="104" width="14" height="3" rx="1.5" fill="#94A3B8"/>
    <rect x="65" y="111" width="18" height="3" rx="1.5" fill="#CBD5E1"/>
  </g>

  <!-- Skincare Cream Tube (SPF / Moisturizer) -->
  <g filter="url(#dermaShadow)" transform="rotate(22 135 105)">
    <!-- Tube Cap -->
    <rect x="122" y="125" width="26" height="14" rx="3" fill="#F43F5E"/>
    <!-- Tube Body -->
    <path d="M120 45 H150 L146 125 H124 Z" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
    <path d="M120 45 H150 V55 H120 Z" fill="#FECDD3"/>
    <!-- Derma Sun / Sparkle Emblem -->
    <circle cx="135" cy="85" r="8" fill="#FBBF24"/>
    <rect x="128" y="100" width="14" height="4" rx="2" fill="#F43F5E"/>
  </g>

  <!-- Pure Hydration Droplet -->
  <path d="M145 35 C145 35 155 48 155 54 C155 60 150 64 145 64 C140 64 135 60 135 54 C135 48 145 35 145 35 Z" fill="#FB7185" filter="url(#dermaShadow)"/>
</svg>`,

  'diagnostics': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="diagBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F0FDF4"/>
      <stop offset="100%" stop-color="#DCFCE7"/>
    </linearGradient>
    <linearGradient id="bpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F8FAFC"/>
    </linearGradient>
    <filter id="diagShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#065F46" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="200" height="200" rx="36" fill="url(#diagBg)"/>

  <!-- Digital Blood Pressure Monitor with Arm Cuff -->
  <g filter="url(#diagShadow)">
    <rect x="35" y="55" width="85" height="95" rx="16" fill="url(#bpGrad)" stroke="#CBD5E1" stroke-width="2"/>
    <!-- Digital LCD Screen -->
    <rect x="45" y="68" width="65" height="50" rx="8" fill="#0F172A"/>
    <!-- Digital Numbers -->
    <text x="52" y="90" font-size="16" font-weight="900" fill="#22C55E" font-family="monospace">120</text>
    <text x="52" y="108" font-size="14" font-weight="900" fill="#38BDF8" font-family="monospace">80</text>
    <text x="88" y="105" font-size="11" font-weight="bold" fill="#EF4444" font-family="monospace">♥72</text>
    <!-- Start Button -->
    <circle cx="77" cy="133" r="8" fill="#22C55E"/>
    <text x="77" y="136" font-size="7" font-weight="bold" fill="#FFFFFF" text-anchor="middle">ON</text>
  </g>

  <!-- Medical Stethoscope -->
  <g filter="url(#diagShadow)">
    <!-- Tube -->
    <path d="M120 120 C140 140 170 110 155 80 C145 60 135 45 130 35" fill="none" stroke="#059669" stroke-width="5" stroke-linecap="round"/>
    <!-- Chest Piece / Disc -->
    <circle cx="120" cy="120" r="18" fill="#E2E8F0" stroke="#64748B" stroke-width="2"/>
    <circle cx="120" cy="120" r="12" fill="#059669"/>
    <!-- Earpieces -->
    <path d="M130 35 Q135 25 145 25 M130 35 Q125 25 115 25" fill="none" stroke="#64748B" stroke-width="4"/>
    <circle cx="145" cy="25" r="3" fill="#0F172A"/>
    <circle cx="115" cy="25" r="3" fill="#0F172A"/>
  </g>

  <!-- Digital Clinical Thermometer -->
  <g filter="url(#diagShadow)" transform="rotate(40 155 130)">
    <rect x="145" y="90" width="10" height="55" rx="5" fill="#FFFFFF" stroke="#CBD5E1"/>
    <path d="M145 140 L150 155 L155 140 Z" fill="#94A3B8"/>
    <rect x="147" y="105" width="6" height="15" rx="2" fill="#0F172A"/>
    <text x="150" y="116" font-size="6" fill="#22C55E" font-weight="bold" text-anchor="middle">36.6</text>
  </g>
</svg>`,

  'diapers-napkins': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="diaperBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDF2F8"/>
      <stop offset="100%" stop-color="#FCE7F3"/>
    </linearGradient>
    <filter id="diaperShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#831843" flood-opacity="0.15"/>
    </filter>
  </defs>
  <rect width="200" height="200" rx="36" fill="url(#diaperBg)"/>

  <!-- Stack of Premium Soft Baby Diapers -->
  <g filter="url(#diaperShadow)">
    <!-- Bottom Diaper -->
    <path d="M40 120 C40 105 60 95 100 95 C140 95 160 105 160 120 C160 135 140 150 100 150 C60 150 40 135 40 120 Z" fill="#F1F5F9" stroke="#E2E8F0" stroke-width="2"/>
    <path d="M45 110 C50 95 70 85 100 85 C130 85 150 95 155 110 C155 125 130 140 100 140 C70 140 45 125 45 110 Z" fill="#FFFFFF" stroke="#F472B6" stroke-width="2"/>
    <!-- Cute Waistband Pattern -->
    <path d="M60 90 Q100 98 140 90" stroke="#F472B6" stroke-width="4" stroke-linecap="round" fill="none"/>
    <circle cx="80" cy="105" r="4" fill="#FBCFE8"/>
    <circle cx="100" cy="105" r="4" fill="#FBCFE8"/>
    <circle cx="120" cy="105" r="4" fill="#FBCFE8"/>
    <!-- Side Grip Tapes -->
    <rect x="42" y="102" width="12" height="10" rx="3" fill="#38BDF8"/>
    <rect x="146" y="102" width="12" height="10" rx="3" fill="#38BDF8"/>
  </g>

  <!-- Baby Wipes Dispenser Box -->
  <g filter="url(#diaperShadow)" transform="translate(35, 40)">
    <rect x="0" y="15" width="65" height="40" rx="8" fill="#EC4899"/>
    <!-- Pop-up Lid -->
    <ellipse cx="32" cy="15" rx="18" ry="7" fill="#FBCFE8" stroke="#DB2777"/>
    <!-- Protruding Soft White Wipe -->
    <path d="M24 15 Q32 0 40 15 Z" fill="#FFFFFF"/>
  </g>

  <!-- Sanitary Care Napkins Package Indicator -->
  <g filter="url(#diaperShadow)" transform="translate(125, 40)">
    <rect x="0" y="0" width="40" height="45" rx="8" fill="#A855F7"/>
    <circle cx="20" cy="22" r="10" fill="#E9D5FF"/>
    <path d="M15 22 Q20 15 25 22 Q20 30 15 22 Z" fill="#9333EA"/>
  </g>
</svg>`,

  'patient-supports': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="suppBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F0FDFA"/>
      <stop offset="100%" stop-color="#CCFBF1"/>
    </linearGradient>
    <filter id="suppShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#115E59" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="200" height="200" rx="36" fill="url(#suppBg)"/>

  <!-- Orthopedic Knee Support Brace with Patella Gel Ring -->
  <g filter="url(#suppShadow)">
    <!-- Main Neoprene Sleeve -->
    <path d="M60 45 C75 42 125 42 140 45 L132 155 C120 158 80 158 68 155 Z" fill="#0F766E" stroke="#115E59" stroke-width="2"/>
    <!-- Breathable Elastic Mesh Zones -->
    <path d="M64 65 H136 M66 80 H134 M68 125 H132 M70 140 H130" stroke="#14B8A6" stroke-width="3" stroke-linecap="round"/>
    <!-- Circular Patella Open Gel Ring -->
    <circle cx="100" cy="102" r="20" fill="#042F2E" stroke="#F59E0B" stroke-width="4"/>
    <circle cx="100" cy="102" r="12" fill="#CCFBF1"/>
    <!-- Adjustable Dual Straps with Velcro -->
    <rect x="52" y="55" width="96" height="12" rx="4" fill="#134E4A" stroke="#2DD4BF"/>
    <rect x="54" y="132" width="92" height="12" rx="4" fill="#134E4A" stroke="#2DD4BF"/>
  </g>
</svg>`,

  'general-items': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="genBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FEF2F2"/>
      <stop offset="100%" stop-color="#FEE2E2"/>
    </linearGradient>
    <filter id="genShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#991B1B" flood-opacity="0.15"/>
    </filter>
  </defs>
  <rect width="200" height="200" rx="36" fill="url(#genBg)"/>

  <!-- First Aid Emergency Medical Kit Box -->
  <g filter="url(#genShadow)">
    <rect x="40" y="60" width="90" height="85" rx="14" fill="#EF4444" stroke="#DC2626" stroke-width="2"/>
    <!-- Handle -->
    <path d="M65 60 V48 C65 44 72 44 85 44 C98 44 105 44 105 48 V60" fill="none" stroke="#DC2626" stroke-width="5" stroke-linecap="round"/>
    <!-- White Medical Cross -->
    <circle cx="85" cy="102" r="24" fill="#FFFFFF"/>
    <path d="M85 88 V116 M71 102 H99" stroke="#EF4444" stroke-width="6" stroke-linecap="round"/>
  </g>

  <!-- Antiseptic Liquid Bottle (Dettol / Pyodine Style) -->
  <g filter="url(#genShadow)" transform="rotate(18 140 100)">
    <rect x="135" y="52" width="16" height="10" rx="2" fill="#FFFFFF"/>
    <rect x="125" y="62" width="36" height="65" rx="8" fill="#B45309" stroke="#78350F"/>
    <rect x="128" y="75" width="30" height="35" rx="4" fill="#FFFFFF"/>
    <!-- Sword / Cross symbol on antiseptic -->
    <path d="M143 82 V102 M136 88 H150" stroke="#16A34A" stroke-width="3" stroke-linecap="round"/>
  </g>

  <!-- Sterile Cotton Roll -->
  <ellipse cx="145" cy="142" rx="16" ry="10" fill="#FFFFFF" stroke="#E2E8F0" filter="url(#genShadow)"/>
</svg>`,

  'beverages': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bevBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFBEB"/>
      <stop offset="100%" stop-color="#FEF3C7"/>
    </linearGradient>
    <linearGradient id="juiceGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#F97316"/>
    </linearGradient>
    <filter id="bevShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#B45309" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="200" height="200" rx="36" fill="url(#bevBg)"/>

  <!-- Electrolyte ORS Hydration Bottle -->
  <g filter="url(#bevShadow)">
    <rect x="75" y="32" width="20" height="10" rx="3" fill="#0284C7"/>
    <rect x="80" y="42" width="10" height="8" fill="#E2E8F0"/>
    <rect x="62" y="50" width="46" height="105" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
    <!-- Hydration Juice Level -->
    <rect x="65" y="70" width="40" height="82" rx="10" fill="url(#juiceGrad)"/>
    <!-- Energy Lightning / Wave on Bottle -->
    <path d="M88 85 L80 102 H90 L82 120" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>

  <!-- Citrus Slice & Refreshing Splash -->
  <g filter="url(#bevShadow)">
    <circle cx="138" cy="115" r="28" fill="#F97316"/>
    <circle cx="138" cy="115" r="24" fill="#FEF08A"/>
    <circle cx="138" cy="115" r="20" fill="#EA580C"/>
    <path d="M138 95 V135 M118 115 H158" stroke="#FEF08A" stroke-width="2"/>
    <circle cx="138" cy="115" r="4" fill="#FFFFFF"/>
  </g>

  <!-- Water Drops -->
  <circle cx="135" cy="55" r="5" fill="#38BDF8"/>
  <circle cx="150" cy="70" r="3" fill="#38BDF8"/>
</svg>`,

  'nutraceutical': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="nutraBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F0FDF4"/>
      <stop offset="100%" stop-color="#DCFCE7"/>
    </linearGradient>
    <linearGradient id="nutraBottle" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#047857"/>
      <stop offset="50%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#065F46"/>
    </linearGradient>
    <filter id="nutraShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#065F46" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="200" height="200" rx="36" fill="url(#nutraBg)"/>

  <!-- Premium Nutraceutical Dietary Supplement Jar -->
  <g filter="url(#nutraShadow)">
    <rect x="55" y="38" width="60" height="14" rx="4" fill="#D97706" stroke="#B45309"/>
    <rect x="45" y="52" width="80" height="98" rx="16" fill="url(#nutraBottle)"/>
    <!-- Quality Label -->
    <rect x="50" y="72" width="70" height="60" rx="6" fill="#FFFFFF"/>
    <!-- Organic Shield Badge -->
    <path d="M85 85 L72 90 V102 Q85 115 85 115 Q85 115 98 102 V90 Z" fill="#10B981"/>
    <path d="M80 98 L84 102 L91 94" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" fill="none"/>
  </g>

  <!-- Omega Softgels & Herbal Leaf -->
  <g filter="url(#nutraShadow)">
    <ellipse cx="145" cy="85" rx="15" ry="10" transform="rotate(-30 145 85)" fill="#F59E0B"/>
    <ellipse cx="143" cy="82" rx="5" ry="3" transform="rotate(-30 143 82)" fill="#FEF3C7"/>

    <ellipse cx="140" cy="130" rx="14" ry="9" transform="rotate(20 140 130)" fill="#10B981"/>
    <ellipse cx="138" cy="128" rx="5" ry="3" transform="rotate(20 138 128)" fill="#D1FAE5"/>
  </g>
</svg>`,

  'otc': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="otcBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EFF6FF"/>
      <stop offset="100%" stop-color="#DBEAFE"/>
    </linearGradient>
    <linearGradient id="otcBox" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
    <filter id="otcShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#1E3A8A" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="200" height="200" rx="36" fill="url(#otcBg)"/>

  <!-- OTC Medicine Box -->
  <g filter="url(#otcShadow)">
    <rect x="35" y="55" width="85" height="100" rx="12" fill="url(#otcBox)"/>
    <rect x="35" y="55" width="85" height="25" rx="6" fill="#60A5FA"/>
    <!-- OTC Cross Banner -->
    <rect x="45" y="95" width="65" height="20" rx="4" fill="#FFFFFF"/>
    <text x="77" y="110" font-size="12" font-weight="900" fill="#1D4ED8" text-anchor="middle" font-family="Arial, sans-serif">OTC</text>
    <rect x="48" y="125" width="40" height="4" rx="2" fill="#93C5FD"/>
    <rect x="48" y="135" width="55" height="4" rx="2" fill="#BFDBFE"/>
  </g>

  <!-- Soothing Throat Lozenges & Relief Tablets -->
  <g filter="url(#otcShadow)">
    <circle cx="145" cy="75" r="16" fill="#F59E0B" stroke="#D97706" stroke-width="2"/>
    <circle cx="145" cy="75" r="10" fill="#FBBF24"/>

    <circle cx="135" cy="125" r="14" fill="#EF4444" stroke="#DC2626" stroke-width="2"/>
    <circle cx="135" cy="125" r="8" fill="#F87171"/>
  </g>
</svg>`,

  'surgical-furniture': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="furnBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F1F5F9"/>
      <stop offset="100%" stop-color="#E2E8F0"/>
    </linearGradient>
    <filter id="furnShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#334155" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="200" height="200" rx="36" fill="url(#furnBg)"/>

  <!-- Hospital Examination Bed -->
  <g filter="url(#furnShadow)">
    <!-- Bed frame -->
    <rect x="35" y="105" width="130" height="15" rx="4" fill="#0284C7"/>
    <!-- Mattress -->
    <rect x="35" y="90" width="130" height="18" rx="6" fill="#38BDF8"/>
    <!-- Headrest inclined -->
    <path d="M35 105 L65 75 L75 80 L45 110 Z" fill="#0284C7"/>
    <path d="M35 90 L65 60 L75 66 L45 96 Z" fill="#38BDF8"/>
    <!-- Legs & Wheels -->
    <rect x="45" y="120" width="8" height="35" rx="2" fill="#64748B"/>
    <rect x="145" y="120" width="8" height="35" rx="2" fill="#64748B"/>
    <circle cx="49" cy="158" r="6" fill="#334155"/>
    <circle cx="149" cy="158" r="6" fill="#334155"/>
  </g>

  <!-- IV Drip Stand with Saline Bag -->
  <g filter="url(#furnShadow)" transform="translate(130, 25)">
    <line x1="20" y1="15" x2="20" y2="100" stroke="#94A3B8" stroke-width="4"/>
    <path d="M10 15 H30 M10 15 V25 M30 15 V25" stroke="#94A3B8" stroke-width="3"/>
    <!-- Saline Bag -->
    <rect x="12" y="25" width="16" height="28" rx="4" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.5"/>
    <rect x="14" y="32" width="12" height="18" rx="2" fill="#E0F2FE"/>
  </g>
</svg>`
};

// Aliases
CATEGORIES_SVG['nutra'] = CATEGORIES_SVG['nutraceutical'];
CATEGORIES_SVG['nutraceuticals'] = CATEGORIES_SVG['nutraceutical'];
CATEGORIES_SVG['surgical'] = CATEGORIES_SVG['surgical-items'];

const CONDITIONS_SVG = {
  'acne-and-skin-care': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="acneBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF1F2"/>
      <stop offset="100%" stop-color="#FFE4E6"/>
    </linearGradient>
    <filter id="acneShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#9F1239" flood-opacity="0.18"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="95" fill="url(#acneBg)" stroke="#FECDD3" stroke-width="2"/>
  
  <!-- Clear Skin Facial Profile & Radiant Glow -->
  <g filter="url(#acneShadow)" transform="translate(45, 35)">
    <!-- Anti-Acne Treatment Tube -->
    <g transform="rotate(-25 50 60)">
      <rect x="35" y="20" width="30" height="75" rx="8" fill="#F43F5E" stroke="#E11D48"/>
      <rect x="40" y="95" width="20" height="12" rx="2" fill="#FFFFFF"/>
      <!-- Label -->
      <rect x="40" y="35" width="20" height="40" rx="3" fill="#FFFFFF"/>
      <circle cx="50" cy="50" r="5" fill="#FB7185"/>
      <rect x="44" y="60" width="12" height="3" rx="1.5" fill="#94A3B8"/>
    </g>

    <!-- Calming Aloe & Salicylic Serum Droplet -->
    <path d="M75 60 C75 60 90 80 90 90 C90 98 83 105 75 105 C67 105 60 98 60 90 C60 80 75 60 75 60 Z" fill="#10B981" opacity="0.9"/>
    <circle cx="72" cy="92" r="3" fill="#A7F3D0"/>
  </g>

  <!-- Glowing Clear Skin Stars -->
  <path d="M145 35 L148 42 L155 45 L148 48 L145 55 L142 48 L135 45 L142 42 Z" fill="#F59E0B"/>
  <path d="M45 130 L47 134 L52 136 L47 138 L45 142 L43 138 L38 136 L43 134 Z" fill="#FB7185"/>
</svg>`,

  'pain-and-body-aches': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="painBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF1F2"/>
      <stop offset="100%" stop-color="#FEE2E2"/>
    </linearGradient>
    <filter id="painShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#991B1B" flood-opacity="0.2"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="95" fill="url(#painBg)" stroke="#FECACA" stroke-width="2"/>

  <!-- Targeted Pain Relief Muscle Therapy & Heat Waves -->
  <g filter="url(#painShadow)">
    <!-- Muscle Pain Rub Tube -->
    <g transform="rotate(-30 85 95)">
      <rect x="65" y="45" width="35" height="85" rx="8" fill="#EF4444" stroke="#DC2626"/>
      <rect x="72" y="130" width="21" height="12" rx="2" fill="#FFFFFF"/>
      <path d="M72 65 L82 85 H74 L84 105" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </g>

    <!-- Fast Acting Analgesic Pain Capsule -->
    <g transform="rotate(35 130 95)">
      <rect x="115" y="65" width="30" height="35" rx="15" fill="#DC2626"/>
      <rect x="115" y="95" width="30" height="35" rx="15" fill="#F59E0B"/>
      <line x1="115" y1="95" x2="145" y2="95" stroke="#FFFFFF" stroke-width="2"/>
    </g>
  </g>

  <!-- Heat Waves / Radiating Relief Waves -->
  <path d="M140 45 Q150 55 140 65 Q150 75 140 85" fill="none" stroke="#F97316" stroke-width="3" stroke-linecap="round"/>
  <path d="M155 45 Q165 55 155 65 Q165 75 155 85" fill="none" stroke="#EF4444" stroke-width="3" stroke-linecap="round"/>
</svg>`,

  'sleep-disorders': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="sleepBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EEF2FF"/>
      <stop offset="100%" stop-color="#E0E7FF"/>
    </linearGradient>
    <filter id="sleepShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#312E81" flood-opacity="0.2"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="95" fill="url(#sleepBg)" stroke="#C7D2FE" stroke-width="2"/>

  <!-- Golden Crescent Moon & Lavender Night Tea -->
  <g filter="url(#sleepShadow)">
    <!-- Crescent Moon -->
    <path d="M95 35 C60 40 40 75 50 110 C58 135 82 150 108 148 C85 138 72 110 82 85 C90 65 105 50 125 45 C115 38 105 35 95 35 Z" fill="#F59E0B"/>
    <ellipse cx="80" cy="80" rx="3" ry="1" fill="#78350F" opacity="0.4"/>
  </g>

  <!-- Melatonin Night Softgel / Calming Chamomile Blossom -->
  <g filter="url(#sleepShadow)" transform="translate(105, 85)">
    <circle cx="25" cy="25" r="20" fill="#6366F1"/>
    <!-- Zzz Icons -->
    <text x="25" y="32" font-size="18" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="Arial, sans-serif">Z</text>
  </g>

  <!-- Stars -->
  <path d="M140 40 L142 45 L147 47 L142 49 L140 54 L138 49 L133 47 L138 45 Z" fill="#FBBF24"/>
  <path d="M165 75 L167 79 L171 80 L167 81 L165 85 L163 81 L159 80 L163 79 Z" fill="#818CF8"/>
  <path d="M45 50 L47 54 L51 55 L47 56 L45 60 L43 56 L39 55 L43 54 Z" fill="#818CF8"/>
</svg>`,

  'digestive-health': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="digBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F0FDF4"/>
      <stop offset="100%" stop-color="#DCFCE7"/>
    </linearGradient>
    <filter id="digShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#065F46" flood-opacity="0.18"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="95" fill="url(#digBg)" stroke="#BBF7D0" stroke-width="2"/>

  <!-- Gut Health Probiotics & Stomach Wellness -->
  <g filter="url(#digShadow)">
    <!-- Stomach Silhouette -->
    <path d="M70 50 C65 40 85 35 95 45 C115 50 145 65 140 100 C135 130 115 145 85 145 C65 145 55 130 55 115 C55 90 75 80 80 65 Z" fill="#22C55E" opacity="0.85" stroke="#16A34A" stroke-width="2"/>
    
    <!-- Soothing Probiotic Sparkles & Mint -->
    <circle cx="95" cy="85" r="8" fill="#FFFFFF"/>
    <circle cx="95" cy="85" r="5" fill="#10B981"/>
    
    <circle cx="115" cy="105" r="6" fill="#FFFFFF"/>
    <circle cx="115" cy="105" r="3.5" fill="#10B981"/>

    <circle cx="80" cy="115" r="6" fill="#FFFFFF"/>
    <circle cx="80" cy="115" r="3.5" fill="#10B981"/>
  </g>

  <!-- Soothing Antacid Spoon & Droplet -->
  <g filter="url(#digShadow)" transform="translate(45, 120)">
    <path d="M0 15 Q25 20 45 5" stroke="#0284C7" stroke-width="4" stroke-linecap="round" fill="none"/>
    <ellipse cx="45" cy="5" rx="10" ry="6" fill="#38BDF8"/>
  </g>
</svg>`,

  'diabetes-care': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="diabBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F0F9FF"/>
      <stop offset="100%" stop-color="#E0F2FE"/>
    </linearGradient>
    <filter id="diabShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#0369A1" flood-opacity="0.2"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="95" fill="url(#diabBg)" stroke="#BAE6FD" stroke-width="2"/>

  <!-- Digital Glucometer Blood Glucose Meter -->
  <g filter="url(#diabShadow)">
    <!-- Glucometer Device -->
    <rect x="65" y="45" width="70" height="95" rx="20" fill="#0284C7" stroke="#0369A1" stroke-width="2"/>
    <!-- Screen -->
    <rect x="75" y="60" width="50" height="40" rx="8" fill="#0F172A"/>
    <!-- Glucose Reading -->
    <text x="100" y="86" font-size="18" font-weight="900" fill="#22C55E" text-anchor="middle" font-family="monospace">105</text>
    <text x="100" y="96" font-size="7" font-weight="bold" fill="#94A3B8" text-anchor="middle" font-family="Arial, sans-serif">mg/dL</text>
    <!-- Buttons -->
    <circle cx="88" cy="118" r="6" fill="#38BDF8"/>
    <circle cx="112" cy="118" r="6" fill="#38BDF8"/>
  </g>

  <!-- Test Strip with Blood Drop -->
  <g filter="url(#diabShadow)">
    <rect x="94" y="22" width="12" height="30" rx="2" fill="#FFFFFF" stroke="#CBD5E1"/>
    <rect x="96" y="24" width="8" height="6" fill="#F59E0B"/>
    <!-- Ruby Blood Drop -->
    <path d="M100 8 C100 8 108 18 108 24 C108 28 104 32 100 32 C96 32 92 28 92 24 C92 18 100 8 100 8 Z" fill="#DC2626"/>
    <circle cx="98" cy="25" r="2" fill="#F87171"/>
  </g>
</svg>`,

  'hair-fall': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="hairBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFBEB"/>
      <stop offset="100%" stop-color="#FEF3C7"/>
    </linearGradient>
    <filter id="hairShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#78350F" flood-opacity="0.18"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="95" fill="url(#hairBg)" stroke="#FDE68A" stroke-width="2"/>

  <!-- Scalp Dropper Pipette & Biotin Hair Growth Serum -->
  <g filter="url(#hairShadow)">
    <!-- Dropper with Golden Oil -->
    <g transform="rotate(25 100 70)">
      <path d="M95 20 C95 15 105 15 105 15 C105 15 115 15 115 20 V28 H95 Z" fill="#475569"/>
      <rect x="92" y="28" width="26" height="8" rx="2" fill="#D97706"/>
      <!-- Glass Pipette -->
      <path d="M98 36 H112 L108 95 L102 95 Z" fill="#FFFFFF" stroke="#CBD5E1" opacity="0.9"/>
      <path d="M100 55 H110 L108 92 L102 92 Z" fill="#F59E0B"/>
      <!-- Serum Droplet -->
      <path d="M105 102 C105 102 110 110 110 114 C110 117 108 120 105 120 C102 120 100 117 100 114 C100 110 105 102 105 102 Z" fill="#D97706"/>
    </g>

    <!-- Strong Hair Follicle Strand with Golden Strength Halo -->
    <path d="M75 160 Q70 110 85 70" stroke="#78350F" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M65 160 Q55 120 70 85" stroke="#B45309" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M85 160 Q85 125 100 95" stroke="#92400E" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  </g>

  <!-- Vitality Sparkles -->
  <path d="M145 125 L148 131 L154 133 L148 135 L145 141 L142 135 L136 133 L142 131 Z" fill="#F59E0B"/>
  <path d="M50 65 L52 69 L56 70 L52 71 L50 75 L48 71 L44 70 L48 69 Z" fill="#F59E0B"/>
</svg>`,

  'cough-and-cold': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="coughBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EFF6FF"/>
      <stop offset="100%" stop-color="#DBEAFE"/>
    </linearGradient>
    <filter id="coughShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#1E3A8A" flood-opacity="0.18"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="95" fill="url(#coughBg)" stroke="#BFDBFE" stroke-width="2"/>

  <!-- Amber Cough Syrup Bottle with Measuring Cup & Honey Spoon -->
  <g filter="url(#coughShadow)">
    <!-- Bottle -->
    <rect x="65" y="42" width="30" height="10" rx="3" fill="#FFFFFF" stroke="#CBD5E1"/>
    <rect x="73" y="52" width="14" height="8" fill="#78350F"/>
    <rect x="52" y="60" width="56" height="90" rx="14" fill="#B45309" stroke="#78350F"/>
    <!-- Amber Liquid & Honey Glow -->
    <rect x="55" y="78" width="50" height="68" rx="10" fill="#D97706"/>
    <!-- Label -->
    <rect x="58" y="90" width="44" height="38" rx="4" fill="#FFFFFF"/>
    <path d="M68 100 L76 108 L88 96" stroke="#2563EB" stroke-width="3" stroke-linecap="round" fill="none"/>
  </g>

  <!-- Calibrated Medicine Dosage Cup -->
  <g filter="url(#coughShadow)" transform="translate(115, 85)">
    <path d="M5 10 L35 10 L30 50 L10 50 Z" fill="#FFFFFF" stroke="#93C5FD" stroke-width="2"/>
    <path d="M8 25 L32 25 L28 48 L12 48 Z" fill="#F59E0B" opacity="0.8"/>
    <line x1="8" y1="20" x2="18" y2="20" stroke="#2563EB" stroke-width="1.5"/>
    <line x1="10" y1="30" x2="22" y2="30" stroke="#2563EB" stroke-width="1.5"/>
    <line x1="11" y1="40" x2="18" y2="40" stroke="#2563EB" stroke-width="1.5"/>
  </g>

  <!-- Honey & Lemon Lozenges -->
  <circle cx="140" cy="55" r="14" fill="#FBBF24" stroke="#F59E0B" stroke-width="2" filter="url(#coughShadow)"/>
  <circle cx="140" cy="55" r="8" fill="#FEF08A"/>
</svg>`,

  'bones-and-joints-pain': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="boneBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFBEB"/>
      <stop offset="100%" stop-color="#FEF3C7"/>
    </linearGradient>
    <filter id="boneShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#78350F" flood-opacity="0.18"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="95" fill="url(#boneBg)" stroke="#FDE68A" stroke-width="2"/>

  <!-- Articulated Knee / Joint Bone Health & Calcium D3 Shield -->
  <g filter="url(#boneShadow)" transform="translate(50, 30)">
    <!-- Femur / Upper Bone -->
    <path d="M45 15 C35 15 35 30 45 35 V70 C40 70 35 75 40 85 C45 92 55 92 60 85 C65 75 60 70 55 70 V35 C65 30 65 15 55 15 Z" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
    
    <!-- Joint Cartilage Cushion & Mobility Sparkles -->
    <ellipse cx="50" cy="80" rx="18" ry="6" fill="#F59E0B"/>

    <!-- Tibia / Lower Bone -->
    <path d="M42 95 C35 95 38 105 45 108 V135 C38 138 38 148 45 148 C55 148 55 138 55 135 V108 C62 105 65 95 58 95 Z" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
  </g>

  <!-- Calcium & Vitamin D3 Molecular / Sparkle Badges -->
  <g filter="url(#boneShadow)">
    <circle cx="145" cy="75" r="16" fill="#F59E0B"/>
    <text x="145" y="80" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="Arial, sans-serif">Ca</text>

    <circle cx="140" cy="125" r="14" fill="#3B82F6"/>
    <text x="140" y="130" font-size="10" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="Arial, sans-serif">D3</text>
  </g>
</svg>`,

  'heart-care': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="heartBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF1F2"/>
      <stop offset="100%" stop-color="#FFE4E6"/>
    </linearGradient>
    <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EF4444"/>
      <stop offset="100%" stop-color="#B91C1C"/>
    </linearGradient>
    <filter id="heartShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#991B1B" flood-opacity="0.2"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="95" fill="url(#heartBg)" stroke="#FECDD3" stroke-width="2"/>

  <!-- Anatomical / Stethoscope Heart Shape with Pulse Wave -->
  <g filter="url(#heartShadow)">
    <!-- 3D Heart -->
    <path d="M100 65 C90 40 55 40 45 65 C35 90 60 115 100 150 C140 115 165 90 155 65 C145 40 110 40 100 65 Z" fill="url(#heartGrad)"/>
    
    <!-- Heartbeat ECG Pulse Rhythm -->
    <path d="M50 95 H80 L88 75 L96 115 L104 85 L112 105 L120 95 H150" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>

  <!-- Pulse Beat Indicator -->
  <circle cx="150" cy="50" r="14" fill="#F59E0B" filter="url(#heartShadow)"/>
  <text x="150" y="55" font-size="14" fill="#FFFFFF" text-anchor="middle">♥</text>
</svg>`
};

async function generateAssets() {
  const catDir = path.join(__dirname, '../apps/web/public/images/categories');
  const condDir = path.join(__dirname, '../apps/web/public/images/conditions');

  if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });
  if (!fs.existsSync(condDir)) fs.mkdirSync(condDir, { recursive: true });

  console.log('--- Writing High-End Vector SVG & Image Assets for Categories ---');
  for (const [slug, svgContent] of Object.entries(CATEGORIES_SVG)) {
    // Write SVG
    const svgPath = path.join(catDir, `${slug}.svg`);
    fs.writeFileSync(svgPath, svgContent.trim());
    console.log(`Saved Category SVG [${slug}.svg]`);
  }

  console.log('\n--- Writing High-End Vector SVG & Image Assets for Conditions ---');
  for (const [slug, svgContent] of Object.entries(CONDITIONS_SVG)) {
    // Write SVG
    const svgPath = path.join(condDir, `${slug}.svg`);
    fs.writeFileSync(svgPath, svgContent.trim());
    console.log(`Saved Condition SVG [${slug}.svg]`);
  }

  console.log('\nAll SVG illustrations generated successfully!');
}

generateAssets();
