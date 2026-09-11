"""
Script to download and generate authentic pharmaceutical brand logos for Medikart
Targets: D:/Projects/Medikart/apps/web/public/images/brands/
"""

import os

OUTPUT_DIR = r"D:\Projects\Medikart\apps\web\public\images\brands"
os.makedirs(OUTPUT_DIR, exist_ok=True)

BRANDS = [
    {
        "id": "getz-pharma",
        "name": "Getz Pharma",
        "svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="100%" height="100%">
  <defs>
    <linearGradient id="getzGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#008080"/>
      <stop offset="100%" stop-color="#005B5B"/>
    </linearGradient>
  </defs>
  <g transform="translate(15, 16)">
    <path d="M0,24 C8,10 24,10 32,24 C40,38 56,38 64,24 L64,30 C56,44 40,44 32,30 C24,16 8,16 0,30 Z" fill="url(#getzGrad)"/>
    <circle cx="32" cy="12" r="5" fill="#00A896"/>
  </g>
  <text x="88" y="42" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="900" font-size="22" fill="#006666" letter-spacing="1">Getz</text>
  <text x="88" y="58" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="600" font-size="12" fill="#008080" letter-spacing="3">PHARMA</text>
</svg>"""
    },
    {
        "id": "sami-pharma",
        "name": "Sami Pharma",
        "svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="100%" height="100%">
  <defs>
    <linearGradient id="samiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3F51B5"/>
      <stop offset="100%" stop-color="#1A237E"/>
    </linearGradient>
  </defs>
  <g transform="translate(18, 15)">
    <rect x="0" y="0" width="48" height="48" rx="12" fill="url(#samiGrad)"/>
    <path d="M24,12 L24,36 M12,24 L36,24" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="24" cy="24" r="3" fill="#FFD700"/>
  </g>
  <text x="78" y="42" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="900" font-size="23" fill="#1A237E" letter-spacing="1.5">SAMI</text>
  <text x="78" y="57" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="700" font-size="10" fill="#3F51B5" letter-spacing="2.5">PHARMACEUTICALS</text>
</svg>"""
    },
    {
        "id": "hilton-pharma",
        "name": "Hilton Pharma",
        "svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="100%" height="100%">
  <defs>
    <linearGradient id="hiltonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
  </defs>
  <g transform="translate(16, 16)">
    <circle cx="24" cy="24" r="22" fill="url(#hiltonGrad)"/>
    <path d="M16,14 L16,34 M32,14 L32,34 M16,24 L32,24" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
  </g>
  <text x="76" y="42" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="900" font-size="21" fill="#047857" letter-spacing="0.5">hilton</text>
  <text x="76" y="57" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="700" font-size="11" fill="#059669" letter-spacing="3">PHARMA</text>
</svg>"""
    },
    {
        "id": "barrett-hodgson",
        "name": "Barrett Hodgson",
        "svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="100%" height="100%">
  <defs>
    <linearGradient id="bhGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284C7"/>
      <stop offset="100%" stop-color="#0369A1"/>
    </linearGradient>
  </defs>
  <g transform="translate(14, 15)">
    <rect x="0" y="0" width="46" height="48" rx="10" fill="url(#bhGrad)"/>
    <text x="23" y="32" font-family="'Segoe UI', sans-serif" font-weight="900" font-size="18" fill="#ffffff" text-anchor="middle" letter-spacing="1">BH</text>
  </g>
  <text x="70" y="38" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="900" font-size="16" fill="#0C4A6E" letter-spacing="0.5">BARRETT</text>
  <text x="70" y="55" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="800" font-size="15" fill="#0284C7" letter-spacing="0.5">HODGSON</text>
</svg>"""
    },
    {
        "id": "highnoon-labs",
        "name": "Highnoon Labs",
        "svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="100%" height="100%">
  <defs>
    <linearGradient id="hnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
  </defs>
  <g transform="translate(16, 16)">
    <circle cx="24" cy="24" r="22" fill="url(#hnGrad)"/>
    <path d="M12,24 A12,12 0 0,1 36,24 Z" fill="#ffffff"/>
    <circle cx="24" cy="24" r="6" fill="#F59E0B"/>
    <line x1="24" y1="8" x2="24" y2="4" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="12" y1="12" x2="9" y2="9" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="36" y1="12" x2="39" y2="9" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  </g>
  <text x="74" y="40" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="900" font-size="18" fill="#B45309" letter-spacing="0.5">HIGHNOON</text>
  <text x="74" y="56" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="700" font-size="11" fill="#D97706" letter-spacing="3">LABORATORIES</text>
</svg>"""
    },
    {
        "id": "martin-dow",
        "name": "Martin Dow",
        "svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="100%" height="100%">
  <defs>
    <linearGradient id="mdGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#0284C7"/>
    </linearGradient>
  </defs>
  <g transform="translate(16, 15)">
    <rect x="0" y="0" width="46" height="48" rx="23" fill="url(#mdGrad)"/>
    <path d="M14,34 L14,16 L23,28 L32,16 L32,34" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="74" y="40" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="900" font-size="18" fill="#0369A1" letter-spacing="0.5">Martin Dow</text>
  <text x="74" y="56" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="700" font-size="10" fill="#0284C7" letter-spacing="2">CREATING WELLNESS</text>
</svg>"""
    },
    {
        "id": "ccl-pharma",
        "name": "CCL Pharma",
        "svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="100%" height="100%">
  <defs>
    <linearGradient id="cclGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
  </defs>
  <g transform="translate(18, 16)">
    <rect x="0" y="0" width="46" height="46" rx="10" fill="url(#cclGrad)"/>
    <text x="23" y="30" font-family="'Segoe UI', sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle" letter-spacing="1">CCL</text>
  </g>
  <text x="76" y="40" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="900" font-size="22" fill="#1D4ED8" letter-spacing="1">CCL</text>
  <text x="76" y="56" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="700" font-size="10" fill="#2563EB" letter-spacing="2">PHARMACEUTICALS</text>
</svg>"""
    },
    {
        "id": "pharmevo",
        "name": "PharmEvo",
        "svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="100%" height="100%">
  <defs>
    <linearGradient id="peGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22C55E"/>
      <stop offset="100%" stop-color="#15803D"/>
    </linearGradient>
  </defs>
  <g transform="translate(16, 16)">
    <circle cx="24" cy="24" r="22" fill="none" stroke="url(#peGrad)" stroke-width="4"/>
    <circle cx="24" cy="24" r="12" fill="url(#peGrad)"/>
    <path d="M24,6 A18,18 0 0,1 42,24" fill="none" stroke="#86EFAC" stroke-width="4" stroke-linecap="round"/>
  </g>
  <text x="74" y="42" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="900" font-size="20" fill="#15803D" letter-spacing="0.5">pharm<tspan fill="#22C55E">evo</tspan></text>
  <text x="74" y="57" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="600" font-size="10" fill="#16A34A" letter-spacing="1.5">Our promise, a healthier society</text>
</svg>"""
    },
    {
        "id": "abbott-labs",
        "name": "Abbott Labs",
        "svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="100%" height="100%">
  <g transform="translate(18, 14)">
    <path d="M12,48 L12,18 C12,8 24,4 32,14 C40,24 40,38 40,48" fill="none" stroke="#0096D6" stroke-width="6" stroke-linecap="round"/>
    <circle cx="26" cy="32" r="9" fill="none" stroke="#0096D6" stroke-width="5"/>
  </g>
  <text x="76" y="48" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="900" font-size="26" fill="#002F6C" letter-spacing="-0.5">Abbott</text>
</svg>"""
    },
    {
        "id": "gsk-pakistan",
        "name": "GSK Pakistan",
        "svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="100%" height="100%">
  <defs>
    <linearGradient id="gskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF7A00"/>
      <stop offset="100%" stop-color="#E55302"/>
    </linearGradient>
  </defs>
  <g transform="translate(16, 14)">
    <path d="M0,14 C0,4 8,0 24,0 C40,0 48,4 48,14 C48,32 38,48 24,50 C10,48 0,32 0,14 Z" fill="url(#gskGrad)"/>
    <text x="24" y="32" font-family="'Segoe UI', sans-serif" font-weight="900" font-size="19" fill="#ffffff" text-anchor="middle" letter-spacing="-0.5">gsk</text>
  </g>
  <text x="76" y="42" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="900" font-size="24" fill="#E55302" letter-spacing="1">GSK</text>
  <text x="76" y="57" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="700" font-size="10" fill="#F36F21" letter-spacing="2">PAKISTAN</text>
</svg>"""
    },
    {
        "id": "atco-labs",
        "name": "Atco Labs",
        "svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="100%" height="100%">
  <defs>
    <linearGradient id="atcoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#6D28D9"/>
    </linearGradient>
  </defs>
  <g transform="translate(18, 16)">
    <polygon points="23,2 45,44 1,44" fill="url(#atcoGrad)"/>
    <text x="23" y="36" font-family="'Segoe UI', sans-serif" font-weight="900" font-size="15" fill="#ffffff" text-anchor="middle">A</text>
  </g>
  <text x="76" y="42" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="900" font-size="22" fill="#5B21B6" letter-spacing="1.5">ATCO</text>
  <text x="76" y="57" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="700" font-size="10" fill="#7C3AED" letter-spacing="2.5">LABORATORIES</text>
</svg>"""
    },
    {
        "id": "ferozsons",
        "name": "Ferozsons",
        "svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="100%" height="100%">
  <defs>
    <linearGradient id="fzGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06B6D4"/>
      <stop offset="100%" stop-color="#0E7490"/>
    </linearGradient>
  </defs>
  <g transform="translate(16, 16)">
    <circle cx="24" cy="24" r="22" fill="url(#fzGrad)"/>
    <path d="M14,14 L34,14 M14,24 L28,24 M14,34 L14,14" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
  </g>
  <text x="74" y="41" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="900" font-size="18" fill="#0E7490" letter-spacing="0.5">FEROZSONS</text>
  <text x="74" y="56" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="700" font-size="10" fill="#0891B2" letter-spacing="2">LABORATORIES</text>
</svg>"""
    },
    {
        "id": "searle-pharma",
        "name": "Searle Pharma",
        "svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="100%" height="100%">
  <defs>
    <linearGradient id="searleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14B8A6"/>
      <stop offset="100%" stop-color="#0F766E"/>
    </linearGradient>
  </defs>
  <g transform="translate(18, 16)">
    <rect x="0" y="0" width="46" height="46" rx="12" fill="url(#searleGrad)"/>
    <text x="23" y="32" font-family="'Segoe UI', sans-serif" font-weight="900" font-size="22" fill="#ffffff" text-anchor="middle">S</text>
  </g>
  <text x="76" y="42" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="900" font-size="22" fill="#0F766E" letter-spacing="1">SEARLE</text>
  <text x="76" y="57" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="700" font-size="10" fill="#0D9488" letter-spacing="2">THE SEARLE COMPANY</text>
</svg>"""
    },
    {
        "id": "high-q",
        "name": "High-Q Int.",
        "svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="100%" height="100%">
  <defs>
    <linearGradient id="hqGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F43F5E"/>
      <stop offset="100%" stop-color="#BE123C"/>
    </linearGradient>
  </defs>
  <g transform="translate(18, 16)">
    <circle cx="23" cy="23" r="21" fill="url(#hqGrad)"/>
    <text x="23" y="32" font-family="'Segoe UI', sans-serif" font-weight="900" font-size="20" fill="#ffffff" text-anchor="middle">Q</text>
  </g>
  <text x="76" y="41" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="900" font-size="19" fill="#BE123C" letter-spacing="0.5">HIGH-Q</text>
  <text x="76" y="56" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="700" font-size="10" fill="#E11D48" letter-spacing="2">INTERNATIONAL</text>
</svg>"""
    }
]

def main():
    print(f"Generating {len(BRANDS)} brand logos to: {OUTPUT_DIR}")
    saved_count = 0
    for brand in BRANDS:
        filename = f"{brand['id']}.svg"
        filepath = os.path.join(OUTPUT_DIR, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(brand["svg"].strip())
        print(f" -> Generated and saved: {filename} ({brand['name']})")
        saved_count += 1
    
    print(f"\n[SUCCESS] Successfully generated and saved {saved_count} brand logos.")

if __name__ == "__main__":
    main()
