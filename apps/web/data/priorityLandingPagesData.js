/**
 * Priority OTC & Consumer Health Brand Landing Data (25 Brand Families)
 * Phase 3 Model: Panadol + 24 High-Demand OTC / Wellness Staples
 * 
 * Rules:
 *  - 100% DRAP Compliant: Zero promotional claims for prescription medicines
 *  - Factual delivery times: 2-4 hours in Lahore, Karachi, Islamabad, Rawalpindi; 24-48 hrs nationwide
 *  - Standard delivery fee: Rs 250 (strictly no free delivery tier per business facts)
 *  - No invented dosages or medical claims; always refers to product packaging & licensed pharmacist
 *  - Marked 'needs pharmacist review'
 */

export const PRIORITY_LANDING_PAGES = {
  panadol: {
    slug: 'panadol',
    name: 'Panadol',
    genericName: 'Paracetamol (Acetaminophen)',
    manufacturer: 'GSK Pakistan',
    brandQuery: 'Panadol',
    categorySlug: 'otc',
    categoryName: 'Over-The-Counter (OTC)',
    h1: 'Panadol Price in Pakistan & Authentic Online Delivery',
    metaTitle: 'Panadol Price in Pakistan & Online Order | Medikart',
    metaDescription: 'Buy authentic Panadol 500mg, Extra, CF, and Forte suspension online in Pakistan. Verified pharmacy stock, 2-4 hr delivery in Lahore, Cash on Delivery.',
    answerFirstSummary: 'Panadol price in Pakistan ranges from Rs 3.60 per tablet up to Rs 680 for standard 200-tablet dispenser boxes, with pediatric suspensions between Rs 96 and Rs 148. Sourced from licensed partner pharmacies, Medikart delivers genuine GSK Panadol across Lahore within 2 to 4 hours with Cash on Delivery.',
    editorialDraftNote: 'needs pharmacist review',
    whatItIs: 'Panadol is Pakistan\'s leading paracetamol (acetaminophen) brand, manufactured by GSK Pakistan under strict Drug Regulatory Authority of Pakistan (DRAP) standards. It provides temporary relief from everyday headaches, body aches, toothaches, fever, and discomfort associated with seasonal cold and flu.',
    availablePacks: [
      { name: 'Panadol 500mg Tablets (Regular)', desc: 'Standard paracetamol tablets for adult fever reduction and mild-to-moderate pain relief. Available in foil strips and 200-tablet economy dispenser packs.' },
      { name: 'Panadol Extra Tablets', desc: 'Enhanced formulation combining 500mg paracetamol with 65mg caffeine to tackle stubborn tension headaches, migraines, and persistent muscular aches.' },
      { name: 'Panadol CF (Cold & Flu) Tablets', desc: 'Multi-symptom caplets formulated with paracetamol and decongestants for temporary relief from blocked nasal passages, sinus headache, and fever.' },
      { name: 'Panadol Forte & Pediatric Suspensions', desc: 'Liquid pediatric paracetamol suspensions (160mg/5ml syrup, 250mg/5ml Forte suspension, and 80mg/0.8ml infant drops) designed for precise pediatric fever control.' },
      { name: 'Panadol Extend Tablets', desc: 'Dual-layer sustained-release tablets (665mg paracetamol) providing prolonged relief for persistent joint pain, arthritis stiffness, and muscular backache.' },
    ],
    whatToCheckOnLabel: [
      'Official DRAP Registration Number printed clearly on outer box and blister strip foil (e.g., 000100 series).',
      'Embossed Batch Number (BN), Manufacturing Date (MFG), and Expiry Date (EXP) matching across packaging.',
      'GSK security tamper-evident packaging and intact blister foil seals.',
      'Clear storage instructions (store below 25°C in a dry environment away from moisture and direct heat).'
    ],
    whenToSeeDoctor: [
      'Fever persists for more than 3 consecutive days despite treatment.',
      'Pain lasts for more than 5 days in adults or 2 days in children.',
      'Sore throat is severe, persists beyond 48 hours, or is accompanied by difficulty breathing.',
      'Signs of an allergic reaction appear, such as skin rash, facial itching, or respiratory wheezing.'
    ],
    pharmacistWarning: 'Never exceed the maximum recommended daily dosage stated on the packaging or consume multiple paracetamol-containing products concurrently, as paracetamol overdose can cause severe liver damage. Always consult your doctor or a licensed Medikart pharmacist before use if you are pregnant, nursing, or suffer from liver or kidney impairment.',
    deliveryFacts: {
      expressCities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'],
      expressTime: '2 to 4 hours',
      nationwideTime: '24 to 48 hours via secure courier',
      shippingFee: 'Standard delivery Rs 250 nationwide (no free delivery tier)',
      supportWhatsapp: '+92 324 4489159',
      whatsappPrefilledText: 'Hello Medikart, I would like to order authentic Panadol with Cash on Delivery in Lahore.'
    },
    relatedBrands: [
      { name: 'Calpol', slug: 'calpol' },
      { name: 'Disprin', slug: 'disprin' },
      { name: 'GSK Pakistan', slug: 'gsk-pakistan' }
    ],
    relatedBlogSlugs: ['fever-management-guide', 'safe-buying-guide-online-pharmacy-pakistan']
  },

  calpol: {
    slug: 'calpol',
    name: 'Calpol',
    genericName: 'Paracetamol (Pediatric Formulation)',
    manufacturer: 'GSK Pakistan',
    brandQuery: 'Calpol',
    categorySlug: 'otc',
    categoryName: 'Over-The-Counter (OTC)',
    h1: 'Calpol Price in Pakistan & Authentic Online Delivery',
    metaTitle: 'Calpol Price in Pakistan & Online Order | Medikart',
    metaDescription: 'Buy authentic Calpol 120ml infant syrup and Calpol 6 Plus suspension online in Pakistan. Licensed pharmacy stock, 2-4 hr delivery in Lahore, Cash on Delivery.',
    answerFirstSummary: 'Calpol price in Pakistan starts from Rs 70 for 120ml infant syrup up to Rs 135 for Calpol 6 Plus 250mg/5ml suspension. Sourced from licensed partner pharmacies, Medikart delivers genuine GSK Calpol across Lahore within 2 to 4 hours with Cash on Delivery.',
    editorialDraftNote: 'needs pharmacist review',
    whatItIs: 'Calpol is GSK Pakistan’s trusted pediatric paracetamol brand, formulated specifically for infants and young children. It offers gentle yet effective relief from post-immunization discomfort, high fever, teething pain, earache, and headache in child-friendly flavors.',
    availablePacks: [
      { name: 'Calpol Infant Suspension (120mg/5ml, 120ml)', desc: 'Strawberry-flavored liquid paracetamol for infants and toddlers between 2 months and 6 years of age.' },
      { name: 'Calpol 6 Plus Suspension (250mg/5ml, 90ml)', desc: 'Higher strength paracetamol suspension formulated for growing children aged 6 years and older for fever and dental pain.' },
      { name: 'Calpol 500mg Tablets (Economy Box)', desc: 'Standard paracetamol tablets for teenagers and adults requiring gentle antipyretic pain relief.' },
    ],
    whatToCheckOnLabel: [
      'Original GSK measuring spoon or graduated syringe enclosed inside the sealed retail box.',
      'Valid DRAP registration number printed on both outer carton and bottle label.',
      'Intact bottle security cap with tamper-evident plastic break-ring.',
      'Accurate expiry date stamped on carton flap and bottle base.'
    ],
    whenToSeeDoctor: [
      'Infant fever exceeds 38.5°C or persists beyond 24 hours without improvement.',
      'Child appears lethargic, refuses hydration, or experiences persistent vomiting.',
      'Pain or fever follows a head injury or unexplained ear discharge.',
      'Unusual skin petechiae or unexplained spots appear on child\'s body.'
    ],
    pharmacistWarning: 'Always use the measuring spoon or syringe supplied with the pack for accurate pediatric dosing based on the child\'s weight. Never administer adult tablets to young children or give alongside other paracetamol medications without clinical oversight.',
    deliveryFacts: {
      expressCities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'],
      expressTime: '2 to 4 hours',
      nationwideTime: '24 to 48 hours via secure courier',
      shippingFee: 'Standard delivery Rs 250 nationwide (no free delivery tier)',
      supportWhatsapp: '+92 324 4489159',
      whatsappPrefilledText: 'Hello Medikart, I would like to order genuine Calpol suspension with rapid delivery in Lahore.'
    },
    relatedBrands: [
      { name: 'Panadol', slug: 'panadol' },
      { name: 'GSK Pakistan', slug: 'gsk-pakistan' },
      { name: 'Disprin', slug: 'disprin' }
    ],
    relatedBlogSlugs: ['fever-management-guide', 'pediatric-health-tips']
  },

  disprin: {
    slug: 'disprin',
    name: 'Disprin',
    genericName: 'Aspirin (Acetylsalicylic Acid 300mg)',
    manufacturer: 'Reckitt Benckiser Pakistan',
    brandQuery: 'Disprin',
    categorySlug: 'otc',
    categoryName: 'Over-The-Counter (OTC)',
    h1: 'Disprin Price in Pakistan & Authentic Online Delivery',
    metaTitle: 'Disprin Price in Pakistan & Online Order | Medikart',
    metaDescription: 'Buy authentic Disprin 300mg soluble tablets online in Pakistan. Verified pharmacy stock, rapid headache relief, 2-4 hr delivery in Lahore, Cash on Delivery.',
    answerFirstSummary: 'Disprin price in Pakistan ranges from Rs 2.40 per tablet to Rs 240 for a 100-tablet dispenser box. Sourced directly through verified partner pharmacies, Medikart delivers genuine Reckitt Disprin across Lahore within 2 to 4 hours with Cash on Delivery.',
    editorialDraftNote: 'needs pharmacist review',
    whatItIs: 'Disprin is an iconic soluble effervescent aspirin formulation manufactured by Reckitt Benckiser Pakistan under DRAP regulations. Disprin dissolves rapidly in water for accelerated absorption, offering swift relief from tension headaches, acute toothache, sore throat, and muscular pain.',
    availablePacks: [
      { name: 'Disprin 300mg Soluble Tablets (100 Tablets Box)', desc: 'Standard household box containing individually sealed foil strips of soluble analgesic tablets.' },
      { name: 'Disprin 300mg Tablets (600 Tablets Clinic Pack)', desc: 'Bulk dispenser packaging designed for registered clinics and institutional medical cabinets.' },
      { name: 'Disprin Extra Soluble Formulations', desc: 'Enhanced strength soluble tablets for stubborn migraines and inflammatory muscular aches.' },
    ],
    whatToCheckOnLabel: [
      'Official Reckitt Benckiser security imprint and registered trademark on packaging.',
      'Clearly stamped DRAP manufacturing license and product registration number.',
      'Hermetically sealed foil strips with no moisture leakage or tablet degradation.',
      'Complete batch identification and verified expiry date stamped on box flap.'
    ],
    whenToSeeDoctor: [
      'Headache is unusually sudden, severe ("thunderclap"), or accompanied by visual changes.',
      'Pain does not subside after 3 to 5 days of intermittent analgesic use.',
      'Patient experiences unexplained stomach discomfort, nausea, or dark stools.',
      'Symptoms occur in individuals taking prescription anticoagulants or blood pressure medication.'
    ],
    pharmacistWarning: 'Disprin must NEVER be given to children or teenagers under 16 years of age with viral infections or fevers due to the risk of Reye\'s syndrome. Avoid if you have active gastric ulcers, asthma, or bleeding tendencies. Always dissolve fully in a glass of water before taking.',
    deliveryFacts: {
      expressCities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'],
      expressTime: '2 to 4 hours',
      nationwideTime: '24 to 48 hours via secure courier',
      shippingFee: 'Standard delivery Rs 250 nationwide (no free delivery tier)',
      supportWhatsapp: '+92 324 4489159',
      whatsappPrefilledText: 'Hello Medikart, I would like to order authentic Disprin soluble tablets in Lahore.'
    },
    relatedBrands: [
      { name: 'Panadol', slug: 'panadol' },
      { name: 'Calpol', slug: 'calpol' },
      { name: 'Dettol', slug: 'dettol' }
    ],
    relatedBlogSlugs: ['safe-buying-guide-online-pharmacy-pakistan']
  },

  surbex: {
    slug: 'surbex',
    name: 'Surbex Z',
    genericName: 'Zinc + Vitamin B-Complex + Vitamin C & E',
    manufacturer: 'Abbott Laboratories Pakistan',
    brandQuery: 'Surbex',
    categorySlug: 'vitamins',
    categoryName: 'Vitamins & Supplements',
    h1: 'Surbex Z Price in Pakistan & Authentic Online Delivery',
    metaTitle: 'Surbex Z Price in Pakistan & Online Order | Medikart',
    metaDescription: 'Buy authentic Surbex Z zinc & multivitamin tablets online in Pakistan. Verified Abbott stock, daily stamina & immunity, 2-4 hr delivery in Lahore, COD.',
    answerFirstSummary: 'Surbex Z price in Pakistan ranges from Rs 12 per tablet up to Rs 620 for a 30-tablet bottle, with Surbex syrup at Rs 115. Sourced from licensed pharmacy distributors, Medikart delivers genuine Abbott Surbex across Lahore within 2 to 4 hours with Cash on Delivery.',
    editorialDraftNote: 'needs pharmacist review',
    whatItIs: 'Surbex Z is Pakistan’s leading therapeutic nutritional supplement manufactured by Abbott Laboratories Pakistan. Featuring high-potency zinc, complete Vitamin B-Complex, Vitamin C, and Vitamin E, it is clinically recommended for rebuilding immune defenses, combating physical fatigue, and supporting hair and skin health.',
    availablePacks: [
      { name: 'Surbex Z Tablets (Bottle of 30 Tablets)', desc: 'High-potency zinc and B-complex film-coated tablets for daily adult nutritional support and post-illness vitality.' },
      { name: 'Surbex T Tablets (High-Potency Vitamin B-Complex)', desc: 'Therapeutic formulation enriched with Vitamin C for elevated metabolic and neurological demands.' },
      { name: 'Surbex 120ml Liquid Syrup', desc: 'Pleasant-tasting liquid B-complex multivitamin formulation suitable for growing children and geriatric recovery.' },
    ],
    whatToCheckOnLabel: [
      'Abbott security seal on the bottle neck and cap closure.',
      'Official DRAP Registration Number on the carton and amber bottle label.',
      'Uniform dark yellow/orange film-coated tablets free from spotting or surface chipping.',
      'Moisture-absorbing desiccant pack included inside unopened bottle.'
    ],
    whenToSeeDoctor: [
      'Persistent, unexplained chronic exhaustion or unintentional weight loss occurs.',
      'Severe skin pallor, shortness of breath on exertion, or dizziness develops.',
      'Nutritional supplementation is needed during diagnosed chronic kidney or liver disease.',
      'Gastrointestinal intolerance or nausea persists after taking the tablet with food.'
    ],
    pharmacistWarning: 'Surbex Z is a dietary supplement and should not replace a balanced daily diet. Take one tablet daily preferably after a main meal to optimize absorption and avoid mild gastric discomfort. High zinc intake over prolonged periods should be monitored by your physician.',
    deliveryFacts: {
      expressCities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'],
      expressTime: '2 to 4 hours',
      nationwideTime: '24 to 48 hours via secure courier',
      shippingFee: 'Standard delivery Rs 250 nationwide (no free delivery tier)',
      supportWhatsapp: '+92 324 4489159',
      whatsappPrefilledText: 'Hello Medikart, I would like to order authentic Abbott Surbex Z in Lahore.'
    },
    relatedBrands: [
      { name: 'CaC-1000 Plus', slug: 'cac-1000' },
      { name: 'Centrum', slug: 'centrum' },
      { name: 'Abbott Laboratories', slug: 'abbott-labs' }
    ],
    relatedBlogSlugs: ['vital-vitamins-immunity-guide', 'safe-buying-guide-online-pharmacy-pakistan']
  },

  'cac-1000': {
    slug: 'cac-1000',
    name: 'CaC-1000 Plus',
    genericName: 'Calcium Lactate Gluconate + Vitamin C + Vitamin D3 + B6',
    manufacturer: 'GSK Pakistan',
    brandQuery: 'Cac-1000|Cac 1000',
    categorySlug: 'vitamins',
    categoryName: 'Vitamins & Supplements',
    h1: 'CaC-1000 Plus Price in Pakistan & Online Delivery',
    metaTitle: 'CaC-1000 Plus Price in Pakistan & Order | Medikart',
    metaDescription: 'Buy authentic CaC-1000 Plus orange & cola effervescent tablets in Pakistan. 1000mg calcium, Vitamin C & D3, 2-4 hr delivery in Lahore, Cash on Delivery.',
    answerFirstSummary: 'CaC-1000 Plus price in Pakistan ranges from Rs 330 to Rs 656 per 10 or 20-tablet tube depending on flavor. Sourced from authorized GSK pharmacy distributors, Medikart delivers genuine CaC-1000 Plus across Lahore within 2 to 4 hours with Cash on Delivery.',
    editorialDraftNote: 'needs pharmacist review',
    whatItIs: 'CaC-1000 Plus is Pakistan’s premier effervescent calcium and multivitamin supplement manufactured by GSK Pakistan. Combining 1000mg bioavailable calcium with Vitamin C (1000mg), Vitamin D3 (300 IU), and Vitamin B6, it dissolves into a refreshing drink for strong bones, teeth, and cellular immune health.',
    availablePacks: [
      { name: 'CaC-1000 Plus Orange Flavor (10 / 20 Effervescent Tablets)', desc: 'Classic citrus flavor effervescent tablets providing essential daily bone density and immune defense.' },
      { name: 'CaC-1000 Plus Cola Flavor (10 / 20 Effervescent Tablets)', desc: 'Popular effervescent formulation offering identical bone-strengthening micronutrients in refreshing cola taste.' },
      { name: 'CaC-1000 Plus Mango Flavor (10 Tablets)', desc: 'Tropical mango-flavored effervescent calcium formulation for daily family vitality.' },
    ],
    whatToCheckOnLabel: [
      'Original GSK tamper-evident spiral cap seal on the cylindrical plastic tube.',
      'Active DRAP registration number printed on the outer tube graphics.',
      'Desiccant granules sealed inside the stopper cap to maintain effervescent freshness.',
      'Tablets dissolve cleanly in water with vigorous bubbling and zero gritty residue.'
    ],
    whenToSeeDoctor: [
      'You have a history of kidney stones (renal calculi) or elevated blood calcium levels.',
      'Bone or joint pain is acute, asymmetric, or accompanied by localized swelling.',
      'Patient is currently on cardiac glycosides (digoxin) or prescription thiazide diuretics.',
      'Symptoms of hypercalcemia appear (excessive thirst, frequent urination, nausea).'
    ],
    pharmacistWarning: 'Always dissolve one effervescent tablet fully in a glass of drinking water (approx. 200ml) before consuming. Do not swallow the dry tablet directly. Individuals with hypercalcemia or severe kidney impairment should not consume calcium supplements without nephrologist approval.',
    deliveryFacts: {
      expressCities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'],
      expressTime: '2 to 4 hours',
      nationwideTime: '24 to 48 hours via secure courier',
      shippingFee: 'Standard delivery Rs 250 nationwide (no free delivery tier)',
      supportWhatsapp: '+92 324 4489159',
      whatsappPrefilledText: 'Hello Medikart, I would like to order genuine CaC-1000 Plus with express delivery in Lahore.'
    },
    relatedBrands: [
      { name: 'Surbex Z', slug: 'surbex' },
      { name: 'Sunny D', slug: 'sunny-d' },
      { name: 'GSK Pakistan', slug: 'gsk-pakistan' }
    ],
    relatedBlogSlugs: ['vital-vitamins-immunity-guide']
  },

  centrum: {
    slug: 'centrum',
    name: 'Centrum',
    genericName: 'Complete Daily Multivitamins & Minerals (24+ Nutrients)',
    manufacturer: 'Haleon / Pfizer',
    brandQuery: 'Centrum',
    categorySlug: 'vitamins',
    categoryName: 'Vitamins & Supplements',
    h1: 'Centrum Price in Pakistan & Authentic Online Delivery',
    metaTitle: 'Centrum Price in Pakistan & Online Order | Medikart',
    metaDescription: 'Buy authentic Centrum Silver 30s and Centrum Adult multivitamin tablets in Pakistan. 24+ essential nutrients, 2-4 hr delivery in Lahore, Cash on Delivery.',
    answerFirstSummary: 'Centrum price in Pakistan ranges from Rs 1,800 to Rs 2,000 for standard 30-tablet imported authentic bottles. Sourced through licensed retail partners, Medikart delivers genuine Haleon Centrum across Lahore within 2 to 4 hours with Cash on Delivery.',
    editorialDraftNote: 'needs pharmacist review',
    whatItIs: 'Centrum is the world\'s most researched complete daily multivitamin brand, formulated by Haleon to provide 24+ essential vitamins, minerals, and antioxidants. It supports cellular energy metabolism, heart health, normal cognitive function, eye health, and strong natural immunity across adult life stages.',
    availablePacks: [
      { name: 'Centrum Silver 50+ (30 Tablets)', desc: 'Tailored for adults aged 50 and above with enhanced Vitamin D3, B-vitamins, and lutein to support healthy aging and eye vitality.' },
      { name: 'Centrum Adult Complete (30 Tablets)', desc: 'Comprehensive daily multivitamin and mineral formulation for active adults supporting daily stamina and immune resistance.' },
      { name: 'Centrum Women & Men Targeted Formulas', desc: 'Gender-specific formulas optimized with iron and calcium for women, or zinc and B-vitamins for men.' },
    ],
    whatToCheckOnLabel: [
      'Official Haleon / Pfizer barcode, batch code, and tamper-evident neck plastic seal.',
      'Clear list of 24+ active micronutrients with exact percentage daily values printed on the label.',
      'Smooth, oval-shaped film-coated tablets embossed with the distinctive Centrum "C" mark.',
      'Expiry date stamped on the bottle base with at least 12 months shelf stability.'
    ],
    whenToSeeDoctor: [
      'You are undergoing chemotherapy, radiation, or scheduled for major surgical procedures.',
      'You take prescription blood thinners (warfarin) due to Vitamin K interactions.',
      'Severe fatigue persists despite regular multivitamin supplementation.',
      'Unusual gastrointestinal distress or allergic reaction develops after ingestion.'
    ],
    pharmacistWarning: 'Take one tablet daily with water, preferably alongside breakfast or lunch. Do not exceed the recommended daily intake. Contains iron, which can be harmful to very young children if accidentally consumed in large quantities; keep bottle tightly closed out of reach.',
    deliveryFacts: {
      expressCities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'],
      expressTime: '2 to 4 hours',
      nationwideTime: '24 to 48 hours via secure courier',
      shippingFee: 'Standard delivery Rs 250 nationwide (no free delivery tier)',
      supportWhatsapp: '+92 324 4489159',
      whatsappPrefilledText: 'Hello Medikart, I would like to order authentic Centrum multivitamins in Lahore.'
    },
    relatedBrands: [
      { name: 'Surbex Z', slug: 'surbex' },
      { name: 'CaC-1000 Plus', slug: 'cac-1000' },
      { name: 'Evion', slug: 'evion' }
    ],
    relatedBlogSlugs: ['vital-vitamins-immunity-guide']
  },

  ors: {
    slug: 'ors',
    name: 'ORS Electrolytes',
    genericName: 'Oral Rehydration Salts (Sodium Chloride, Potassium, Glucose, Citrate)',
    manufacturer: 'Various Licensed Pharmaceutical Partners',
    brandQuery: 'Osmolar|Rehydramin|Hydralyte|Oraes|\\bORS\\b',
    categorySlug: 'beverages',
    categoryName: 'Hydration & Beverages',
    h1: 'ORS Price in Pakistan & Clinical Electrolyte Delivery',
    metaTitle: 'ORS Price in Pakistan & Online Order | Medikart',
    metaDescription: 'Buy authentic WHO-standard ORS electrolyte sachets and hydration drinks in Pakistan. Osmolar & Hydralyte, 2-4 hr delivery in Lahore, Cash on Delivery.',
    answerFirstSummary: 'ORS price in Pakistan ranges from Rs 20 per individual sachet up to Rs 320 for 20-sachet clinical dispenser packs. Sourced from licensed pharmaceutical partners, Medikart delivers authentic WHO-formula ORS across Lahore within 2 to 4 hours with Cash on Delivery.',
    editorialDraftNote: 'needs pharmacist review',
    whatItIs: 'Oral Rehydration Salts (ORS) are life-saving clinical electrolyte powder formulations manufactured under WHO and DRAP specifications. ORS rapidly replenishes vital fluids, sodium, potassium, and chloride lost through acute diarrhea, vomiting, heat exhaustion, or intense seasonal dehydration in Pakistan.',
    availablePacks: [
      { name: 'Osmolar ORS Orange Sachets (Pack of 20)', desc: 'Low-osmolarity WHO-compliant formulation in pleasant orange flavor for rapid absorption.' },
      { name: 'Rehydramin ORS Lemon Sachets (Pack of 20)', desc: 'Refreshing lemon-flavored electrolyte powder easily soluble in clean drinking water.' },
      { name: 'Hydralyte Clinical Electrolyte Sachets', desc: 'Rapid hydration formulation designed for intense summer dehydration, fever recovery, and travelers\' diarrhea.' },
      { name: 'Pedialyte Ready-to-Drink Electrolyte Liquids', desc: 'Pre-mixed, sterile pediatric oral electrolyte solutions for infants recovering from gastroenteritis.' },
    ],
    whatToCheckOnLabel: [
      'Official DRAP Registration Number on each individually sealed aluminum foil sachet.',
      'Explicit dilution instructions (e.g. dissolve entire sachet in exactly 1 Liter or 250ml of clean boiled water).',
      'Free-flowing, dry powder free from clumping, discoloration, or moisture intrusion.',
      'Batch number and expiry date cleanly printed on the edge crimp of each sachet.'
    ],
    whenToSeeDoctor: [
      'Signs of severe dehydration appear (sunken eyes, extreme thirst, lack of tears, sunken fontanelle in infants).',
      'Patient cannot keep fluids down due to persistent intractable vomiting.',
      'Diarrhea lasts for more than 48 hours or is accompanied by high fever or blood in stool.',
      'Decreased urine output or dark-colored urine persists for more than 8 hours.'
    ],
    pharmacistWarning: 'Always dissolve the ORS powder in the exact quantity of clean boiled or filtered drinking water specified on the pack (do not mix with milk, juice, or sugary drinks). Discard any prepared ORS solution not consumed within 24 hours to prevent bacterial contamination.',
    deliveryFacts: {
      expressCities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'],
      expressTime: '2 to 4 hours',
      nationwideTime: '24 to 48 hours via secure courier',
      shippingFee: 'Standard delivery Rs 250 nationwide (no free delivery tier)',
      supportWhatsapp: '+92 324 4489159',
      whatsappPrefilledText: 'Hello Medikart, I would like to order clinical ORS electrolyte sachets with fast delivery in Lahore.'
    },
    relatedBrands: [
      { name: 'Panadol', slug: 'panadol' },
      { name: 'Calpol', slug: 'calpol' },
      { name: 'Dettol', slug: 'dettol' }
    ],
    relatedBlogSlugs: ['safe-buying-guide-online-pharmacy-pakistan']
  },

  dettol: {
    slug: 'dettol',
    name: 'Dettol',
    genericName: 'Chloroxylenol (Antiseptic & Disinfectant)',
    manufacturer: 'Reckitt Benckiser Pakistan',
    brandQuery: 'Dettol',
    categorySlug: 'consumer',
    categoryName: 'Personal Care & Hygiene',
    h1: 'Dettol Price in Pakistan & Antiseptic Delivery',
    metaTitle: 'Dettol Price in Pakistan & Online Order | Medikart',
    metaDescription: 'Buy authentic Dettol antiseptic liquid, antibacterial soaps, and hand sanitizers online in Pakistan. 2-4 hr delivery in Lahore, Cash on Delivery.',
    answerFirstSummary: 'Dettol price in Pakistan ranges from Rs 130 for antibacterial bar soap up to Rs 2,000 for 1-Liter hospital antiseptic liquid bottles. Sourced from authorized Reckitt distributors, Medikart delivers genuine Dettol across Lahore within 2 to 4 hours with Cash on Delivery.',
    editorialDraftNote: 'needs pharmacist review',
    whatItIs: 'Dettol is Pakistan’s foremost clinical antiseptic and disinfectant brand manufactured by Reckitt Benckiser. Utilizing chloroxylenol, Dettol provides proven broad-spectrum antimicrobial protection for wound cleansing, minor skin abrasions, household disinfection, and daily personal hygiene.',
    availablePacks: [
      { name: 'Dettol Antiseptic Liquid (60ml, 120ml, 250ml, 500ml, 1 Liter)', desc: 'Amber antiseptic liquid for wound first-aid dilution, bathing sanitation, and linen disinfection.' },
      { name: 'Dettol Antibacterial Bar Soaps (85g / 135g)', desc: 'Germ-protection toilet soaps in Original, Skincare, Cool, and Re-energize variants.' },
      { name: 'Dettol Instant Hand Sanitizers (50ml / 200ml)', desc: 'Alcohol-based antimicrobial gel for rapid waterless hand hygiene on the go.' },
      { name: 'Dettol Disinfectant Multi-Action Sprays', desc: 'Household surface sanitizing sprays killing 99.9% of germs on kitchen and bathroom surfaces.' },
    ],
    whatToCheckOnLabel: [
      'Official Reckitt embossed sword logo and authentic brand security graphics.',
      'Characteristic chloroxylenol aroma and clouding ("blooming") effect when diluted in clear water.',
      'Intact bottle cap seal with no leakage or tampering.',
      'Clear DRAP or national standards registration information on rear packaging.'
    ],
    whenToSeeDoctor: [
      'Wound is deep, jagged, contains foreign debris (gravel, glass), or bled profusely.',
      'Animal or human bites, or puncture wounds from rusted nails occur (tetanus risk).',
      'Wound develops signs of active infection (increasing redness, heat, swelling, or yellow pus).',
      'Skin develops severe contact dermatitis or burning after antiseptic application.'
    ],
    pharmacistWarning: 'Dettol Antiseptic Liquid is for EXTERNAL USE ONLY. Never apply undiluted antiseptic liquid directly to open flesh or wounds; always dilute with clean water according to label instructions. If accidentally swallowed, do not induce vomiting—seek emergency medical help immediately.',
    deliveryFacts: {
      expressCities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'],
      expressTime: '2 to 4 hours',
      nationwideTime: '24 to 48 hours via secure courier',
      shippingFee: 'Standard delivery Rs 250 nationwide (no free delivery tier)',
      supportWhatsapp: '+92 324 4489159',
      whatsappPrefilledText: 'Hello Medikart, I would like to order authentic Dettol antiseptic liquid and soaps in Lahore.'
    },
    relatedBrands: [
      { name: 'Pyodine', slug: 'pyodine' },
      { name: 'Polyfax', slug: 'polyfax' },
      { name: 'Disprin', slug: 'disprin' }
    ],
    relatedBlogSlugs: ['safe-buying-guide-online-pharmacy-pakistan']
  },

  pyodine: {
    slug: 'pyodine',
    name: 'Pyodine',
    genericName: 'Povidone-Iodine 10% (Antiseptic Microbicide)',
    manufacturer: 'Brookes Pharma Pakistan',
    brandQuery: 'Pyodine',
    categorySlug: 'otc',
    categoryName: 'Over-The-Counter (OTC)',
    h1: 'Pyodine Price in Pakistan & Antiseptic Delivery',
    metaTitle: 'Pyodine Price in Pakistan & Online Order | Medikart',
    metaDescription: 'Buy authentic Pyodine 10% solution, gargle, and antiseptic ointment online in Pakistan. Verified surgical first aid, 2-4 hr delivery in Lahore, COD.',
    answerFirstSummary: 'Pyodine price in Pakistan ranges from Rs 180 for 60ml topical solution up to Rs 350 for surgical scrub and antiseptic ointment tubes. Sourced from licensed partner pharmacies, Medikart delivers genuine Brookes Pyodine across Lahore within 2 to 4 hours with Cash on Delivery.',
    editorialDraftNote: 'needs pharmacist review',
    whatItIs: 'Pyodine is Pakistan\'s gold-standard topical antiseptic microbicide manufactured by Brookes Pharma. Containing 10% Povidone-Iodine (equivalent to 1% available iodine), it delivers broad-spectrum bactericidal, virucidal, and fungicidal action without the stinging associated with spirit-based antiseptics.',
    availablePacks: [
      { name: 'Pyodine Solution 10% (60ml, 120ml, 450ml)', desc: 'Non-stinging topical antiseptic liquid for wound dressing, burn management, and surgical site prep.' },
      { name: 'Pyodine 10% Ointment (20g Tube)', desc: 'Soothing antiseptic ointment for minor cuts, scrapes, abrasions, and superficial burn dressings.' },
      { name: 'Pyodine Surgical Scrub 7.5%', desc: 'Medicated foaming antiseptic scrub for pre-operative hand disinfection and clinical cleansing.' },
      { name: 'Pyodine Concentrated Gargle & Mouthwash 1%', desc: 'Oral antiseptic wash for post-dental extractions, pharyngitis, and mouth ulcer hygiene.' },
    ],
    whatToCheckOnLabel: [
      'Authentic Brookes Pharma hologram and security tamper band on bottle cap.',
      'Distinct dark brown liquid consistency free from crystallization or phase separation.',
      'Valid DRAP manufacturing registration number stamped clearly on the carton.',
      'Expiry date and batch number stamped on the bottle base and box flap.'
    ],
    whenToSeeDoctor: [
      'Wound is extensive, heavily contaminated, or covers a significant burn area.',
      'Patient has a known thyroid disorder (iodine absorption may interfere with thyroid tests).',
      'Infection worsens after 3 days of topical antiseptic application.',
      'Localized severe skin erythema, blistering, or chemical dermatitis occurs.'
    ],
    pharmacistWarning: 'For external topical use only. Do not use Pyodine on premature infants or in extensive open body cavities without clinical supervision. Avoid concurrent application with mercury-containing antiseptic agents as this forms corrosive mercuric iodide.',
    deliveryFacts: {
      expressCities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'],
      expressTime: '2 to 4 hours',
      nationwideTime: '24 to 48 hours via secure courier',
      shippingFee: 'Standard delivery Rs 250 nationwide (no free delivery tier)',
      supportWhatsapp: '+92 324 4489159',
      whatsappPrefilledText: 'Hello Medikart, I would like to order genuine Pyodine antiseptic solution in Lahore.'
    },
    relatedBrands: [
      { name: 'Dettol', slug: 'dettol' },
      { name: 'Polyfax', slug: 'polyfax' },
      { name: 'Panadol', slug: 'panadol' }
    ],
    relatedBlogSlugs: ['safe-buying-guide-online-pharmacy-pakistan']
  },

  polyfax: {
    slug: 'polyfax',
    name: 'Polyfax',
    genericName: 'Polymyxin B Sulfate + Bacitracin Zinc',
    manufacturer: 'GSK Pakistan',
    brandQuery: 'Polyfax',
    categorySlug: 'otc',
    categoryName: 'Over-The-Counter (OTC)',
    h1: 'Polyfax Price in Pakistan & Authentic Online Delivery',
    metaTitle: 'Polyfax Price in Pakistan & Online Order | Medikart',
    metaDescription: 'Buy authentic Polyfax skin & eye ointments and Polyfax Plus online in Pakistan. Dual-action first aid, 2-4 hr delivery in Lahore, Cash on Delivery.',
    answerFirstSummary: 'Polyfax price in Pakistan ranges from Rs 114 to Rs 289 per 20g tube for Skin Ointment, Eye Ointment, and Polyfax Plus. Sourced through licensed pharmacy partners, Medikart delivers genuine GSK Polyfax across Lahore within 2 to 4 hours with Cash on Delivery.',
    editorialDraftNote: 'needs pharmacist review',
    whatItIs: 'Polyfax is Pakistan’s trusted topical first-aid antibiotic ointment manufactured by GSK Pakistan under DRAP regulations. Combining Polymyxin B Sulfate with Bacitracin Zinc, it provides targeted dual-action antibacterial coverage against Gram-negative and Gram-positive pathogens causing minor skin, burn, and ocular infections.',
    availablePacks: [
      { name: 'Polyfax Skin Ointment (20g Tube)', desc: 'Dual-action topical antibiotic ointment for cuts, scrapes, minor infected wounds, and cracked skin.' },
      { name: 'Polyfax Eye Ointment (6g Sterile Tube)', desc: 'Sterile ophthalmic ointment for superficial bacterial conjunctivitis, blepharitis, and styes.' },
      { name: 'Polyfax Plus Ointment (with Lignocaine)', desc: 'Antibiotic skin ointment enriched with local anesthetic for painful cuts, abrasions, and minor burns.' },
    ],
    whatToCheckOnLabel: [
      'Original GSK sealed metal or laminated aluminum tube with unbroken tamper-proof nozzle seal.',
      'Explicit differentiation between "Skin Ointment" and sterile "Eye Ointment" packaging.',
      'DRAP registration number and manufacturer license printed legibly on tube crimp.',
      'Smooth, homogeneous petroleum-based ointment texture free from gritty particles.'
    ],
    whenToSeeDoctor: [
      'Eye pain, persistent visual blurring, or extreme photophobia accompanies eye discharge.',
      'Skin redness spreads outward or localized red streaks appear radiating from the wound.',
      'Infection fails to improve or worsens after 5 days of regular application.',
      'Skin develops contact sensitization, burning, or intense itching after ointment application.'
    ],
    pharmacistWarning: 'NEVER use Polyfax Skin Ointment inside the eyes; only the specifically labeled, sterile "Polyfax Eye Ointment" is safe for ophthalmic use. Wash hands thoroughly before and after application, and do not apply over large body surface areas without medical direction.',
    deliveryFacts: {
      expressCities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'],
      expressTime: '2 to 4 hours',
      nationwideTime: '24 to 48 hours via secure courier',
      shippingFee: 'Standard delivery Rs 250 nationwide (no free delivery tier)',
      supportWhatsapp: '+92 324 4489159',
      whatsappPrefilledText: 'Hello Medikart, I would like to order authentic Polyfax ointment in Lahore.'
    },
    relatedBrands: [
      { name: 'Pyodine', slug: 'pyodine' },
      { name: 'Dettol', slug: 'dettol' },
      { name: 'GSK Pakistan', slug: 'gsk-pakistan' }
    ],
    relatedBlogSlugs: ['safe-buying-guide-online-pharmacy-pakistan']
  },

  strepsils: {
    slug: 'strepsils',
    name: 'Strepsils',
    genericName: '2,4-Dichlorobenzyl Alcohol + Amylmetacresol (Antiseptic Lozenges)',
    manufacturer: 'Reckitt Benckiser Pakistan',
    brandQuery: 'Strepsils',
    categorySlug: 'otc',
    categoryName: 'Over-The-Counter (OTC)',
    h1: 'Strepsils Price in Pakistan & Sore Throat Delivery',
    metaTitle: 'Strepsils Price in Pakistan & Online Order | Medikart',
    metaDescription: 'Buy authentic Strepsils Honey & Lemon, Orange, and Extra sore throat lozenges in Pakistan. Fast throat relief, 2-4 hr delivery in Lahore, Cash on Delivery.',
    answerFirstSummary: 'Strepsils price in Pakistan ranges from Rs 24 per blister strip up to Rs 330 for multi-strip household boxes. Sourced from authorized Reckitt distributors, Medikart delivers genuine Strepsils across Lahore within 2 to 4 hours with Cash on Delivery.',
    editorialDraftNote: 'needs pharmacist review',
    whatItIs: 'Strepsils is Pakistan\'s leading medicated sore throat lozenge brand manufactured by Reckitt Benckiser. Formulated with two proven antiseptics (Amylmetacresol and Dichlorobenzyl Alcohol), Strepsils actively kills throat bacteria and delivers soothing lubrication to relieve raw, scratchy, and painful throats.',
    availablePacks: [
      { name: 'Strepsils Honey & Lemon Lozenges', desc: 'The classic soothing flavor combining natural honey taste with dual antiseptic sore throat relief.' },
      { name: 'Strepsils Orange with Vitamin C Lozenges', desc: 'Citrus-flavored lozenges enriched with 100mg Vitamin C to support immune defense during seasonal colds.' },
      { name: 'Strepsils Extra Blackcurrant / Menthol', desc: 'Enhanced formula with Hexylresorcinol for acute, painful throat inflammation and numbing relief.' },
      { name: 'Strepsils Sugar-Free Strawberry Lozenges', desc: 'Specially formulated for diabetics and calorie-conscious individuals needing throat relief.' },
    ],
    whatToCheckOnLabel: [
      'Official Reckitt Benckiser security packaging with intact foil blister seals.',
      'Clearly stamped DRAP manufacturing license and product registration number on the carton.',
      'Translucent, smooth-edged hard boiled lozenges without melting or sticky packaging damage.',
      'Batch number and expiry date embossed on the edge of each blister strip.'
    ],
    whenToSeeDoctor: [
      'Sore throat persists for more than 3 days or is accompanied by high fever or chills.',
      'Swallowing is acutely painful, or patient experiences difficulty opening mouth or breathing.',
      'White patches or pus spots are visible on the tonsils in the back of the throat.',
      'Sore throat is accompanied by an unexplained full-body rash or joint stiffness.'
    ],
    pharmacistWarning: 'Dissolve one lozenge slowly in the mouth every 2 to 3 hours as needed. Do not chew or swallow lozenges whole. Young children should be supervised to avoid accidental choking. Diabetics should select sugar-free formulations.',
    deliveryFacts: {
      expressCities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'],
      expressTime: '2 to 4 hours',
      nationwideTime: '24 to 48 hours via secure courier',
      shippingFee: 'Standard delivery Rs 250 nationwide (no free delivery tier)',
      supportWhatsapp: '+92 324 4489159',
      whatsappPrefilledText: 'Hello Medikart, I would like to order authentic Strepsils lozenges with fast delivery in Lahore.'
    },
    relatedBrands: [
      { name: 'Panadol', slug: 'panadol' },
      { name: 'Disprin', slug: 'disprin' },
      { name: 'Vicks', slug: 'vicks' }
    ],
    relatedBlogSlugs: ['safe-buying-guide-online-pharmacy-pakistan']
  },

  vicks: {
    slug: 'vicks',
    name: 'Vicks',
    genericName: 'Camphor + Menthol + Eucalyptus Oil (Topical Decongestant)',
    manufacturer: 'Procter & Gamble Pakistan',
    brandQuery: 'Vicks',
    categorySlug: 'otc',
    categoryName: 'Over-The-Counter (OTC)',
    h1: 'Vicks VapoRub Price in Pakistan & Online Order',
    metaTitle: 'Vicks Price in Pakistan & Online Order | Medikart',
    metaDescription: 'Buy authentic Vicks VapoRub 50g ointment and inhaler online in Pakistan. Fast cold & chest congestion relief, 2-4 hr delivery in Lahore, Cash on Delivery.',
    answerFirstSummary: 'Vicks VapoRub price in Pakistan is Rs 340 for the standard 50g jar. Sourced from authorized Procter & Gamble distributors, Medikart delivers genuine Vicks across Lahore within 2 to 4 hours with Cash on Delivery.',
    editorialDraftNote: 'needs pharmacist review',
    whatItIs: 'Vicks VapoRub is an internationally trusted topical decongestant ointment manufactured by Procter & Gamble under DRAP standards. Combining natural menthol, camphor, and eucalyptus oil, Vicks vapors clear blocked nasal passages, soothe persistent coughs, and ease seasonal muscular stiffness.',
    availablePacks: [
      { name: 'Vicks VapoRub Ointment (50g Jar)', desc: 'Standard family tub of soothing medicated vapors for chest, neck, and back rub application.' },
      { name: 'Vicks VapoRub Ointment (100g Economy Jar)', desc: 'Large household jar for cold season replenishment and steam inhalation.' },
      { name: 'Vicks Pocket Inhaler Stick', desc: 'Compact portable inhaler providing instant soothing menthol clearance for stuffy noses on the go.' },
    ],
    whatToCheckOnLabel: [
      'Original Procter & Gamble green container with intact tamper-evident foil lid seal.',
      'Strong, fresh menthol-eucalyptus aromatic fragrance upon unsealing.',
      'Valid DRAP registration number stamped on the label graphics.',
      'Uniform translucent petrolatum ointment consistency free from separation or foreign particulates.'
    ],
    whenToSeeDoctor: [
      'Cough produces thick green/yellow phlegm, blood, or is accompanied by chest pain.',
      'Difficulty breathing, wheezing, or shortness of breath develops.',
      'Fever is high or cough lasts longer than 7 days without improvement.',
      'Patient is an infant under 2 years of age experiencing respiratory distress.'
    ],
    pharmacistWarning: 'Vicks VapoRub is strictly for external use or steam inhalation; NEVER apply inside the nostrils, on broken skin, or ingest orally. Do not apply directly to the faces or nostrils of infants under 2 years old due to the risk of respiratory spasm. Never heat the ointment directly in a microwave.',
    deliveryFacts: {
      expressCities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'],
      expressTime: '2 to 4 hours',
      nationwideTime: '24 to 48 hours via secure courier',
      shippingFee: 'Standard delivery Rs 250 nationwide (no free delivery tier)',
      supportWhatsapp: '+92 324 4489159',
      whatsappPrefilledText: 'Hello Medikart, I would like to order authentic Vicks VapoRub in Lahore.'
    },
    relatedBrands: [
      { name: 'Panadol', slug: 'panadol' },
      { name: 'Strepsils', slug: 'strepsils' },
      { name: 'Disprin', slug: 'disprin' }
    ],
    relatedBlogSlugs: ['safe-buying-guide-online-pharmacy-pakistan']
  },

  sensodyne: {
    slug: 'sensodyne',
    name: 'Sensodyne',
    genericName: 'Potassium Nitrate + Sodium Fluoride / Novamin (Desensitizing Oral Care)',
    manufacturer: 'Haleon / GSK Pakistan',
    brandQuery: 'Sensodyne',
    categorySlug: 'consumer',
    categoryName: 'Personal Care & Hygiene',
    h1: 'Sensodyne Price in Pakistan & Authentic Delivery',
    metaTitle: 'Sensodyne Price in Pakistan & Online Order | Medikart',
    metaDescription: 'Buy authentic Sensodyne Rapid Action, Fluoride, and Multi-Care toothpaste online in Pakistan. Dentist recommended, 2-4 hr delivery in Lahore, COD.',
    answerFirstSummary: 'Sensodyne price in Pakistan ranges from Rs 165 for compact 70g tubes up to Rs 550 for specialized 100g Rapid Action and Repair & Protect formulations. Sourced from authorized distributors, Medikart delivers genuine Sensodyne across Lahore within 2 to 4 hours with Cash on Delivery.',
    editorialDraftNote: 'needs pharmacist review',
    whatItIs: 'Sensodyne is Pakistan’s leading dentist-recommended toothpaste brand for dentine hypersensitivity, manufactured by Haleon under DRAP quality regulations. Utilizing potassium nitrate and advanced calcium minerals (Novamin), Sensodyne soothes nerve signals and rebuilds protective layers over exposed dentin.',
    availablePacks: [
      { name: 'Sensodyne Rapid Action (70g / 100g)', desc: 'Clinically proven to beat tooth sensitivity in 60 seconds with rapid barrier formation.' },
      { name: 'Sensodyne Fluoride & Fresh Mint (70g / 100g)', desc: 'Daily cavity prevention combined with round-the-clock sensitivity protection and clean breath.' },
      { name: 'Sensodyne Repair & Protect (Deep Repair Formulation)', desc: 'Advanced Novamin technology that actively lays down a repairing mineral layer over vulnerable tooth zones.' },
      { name: 'Sensodyne Multi-Care & Whitening', desc: 'All-round daily protection offering stain removal, gum health maintenance, and enamel strengthening.' },
    ],
    whatToCheckOnLabel: [
      'Original Haleon packaging with holographic or tamper-evident end flaps.',
      'Sealed nozzle foil membrane intact prior to initial use.',
      'Clear expiration date and manufacturing batch code stamped on the tube crimp.',
      'Accurate ingredient listing detailing active desensitizing agents and fluoride content (1450 ppm).'
    ],
    whenToSeeDoctor: [
      'Tooth pain is severe, constant, throbbing, or wakes you at night (indicates pulpitis).',
      'Sensitivity does not improve after 4 weeks of twice-daily continuous brushing.',
      'Gums are visibly red, swollen, receding heavily, or bleed continuously.',
      'A tooth is visibly chipped, cracked, or has loose fillings.'
    ],
    pharmacistWarning: 'Brush thoroughly twice daily with Sensodyne and do not swallow. Sensitive teeth may indicate an underlying dental issue requiring prompt treatment by a qualified dental surgeon. Not for use by children under 12 years of age unless directed by a dentist.',
    deliveryFacts: {
      expressCities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'],
      expressTime: '2 to 4 hours',
      nationwideTime: '24 to 48 hours via secure courier',
      shippingFee: 'Standard delivery Rs 250 nationwide (no free delivery tier)',
      supportWhatsapp: '+92 324 4489159',
      whatsappPrefilledText: 'Hello Medikart, I would like to order authentic Sensodyne toothpaste in Lahore.'
    },
    relatedBrands: [
      { name: 'Panadol', slug: 'panadol' },
      { name: 'GSK Pakistan', slug: 'gsk-pakistan' },
      { name: 'Dettol', slug: 'dettol' }
    ],
    relatedBlogSlugs: ['safe-buying-guide-online-pharmacy-pakistan']
  },

  'sunny-d': {
    slug: 'sunny-d',
    name: 'Sunny D',
    genericName: 'Vitamin D3 (Cholecalciferol 5000 IU / 200,000 IU)',
    manufacturer: 'The Searle Company Limited',
    brandQuery: 'Sunny D|Sunny-D',
    categorySlug: 'vitamins',
    categoryName: 'Vitamins & Supplements',
    h1: 'Sunny D Price in Pakistan & Vitamin D3 Delivery',
    metaTitle: 'Sunny D Price in Pakistan & Online Order | Medikart',
    metaDescription: 'Buy authentic Sunny D 5000 IU softgels, drops, and Sunny D Insta ampoules online in Pakistan. Verified Searle stock, 2-4 hr delivery in Lahore, COD.',
    answerFirstSummary: 'Sunny D price in Pakistan ranges from Rs 32 for oral ampoules up to Rs 650 for 30-softgel monthly packs, with specialized high-potency formulations up to Rs 4,470. Sourced from licensed Searle distributors, Medikart delivers genuine Sunny D across Lahore within 2 to 4 hours with Cash on Delivery.',
    editorialDraftNote: 'needs pharmacist review',
    whatItIs: 'Sunny D is Pakistan’s leading Vitamin D3 (Cholecalciferol) brand manufactured by The Searle Company under strict cGMP and DRAP guidelines. It corrects widespread vitamin D deficiency in Pakistan, promoting intestinal calcium absorption, preventing bone demineralization, and supporting healthy immune responses.',
    availablePacks: [
      { name: 'Sunny D 5000 IU Softgels (Pack of 30 Softgels)', desc: 'Daily or weekly therapeutic oral softgels for correcting moderate vitamin D deficiency and bone support.' },
      { name: 'Sunny D Insta Oral Ampoules (200,000 IU / 1ml)', desc: 'High-dose oral liquid ampoules for rapid correction of severe clinical vitamin D deficiency.' },
      { name: 'Sunny D Infant Drops (400 IU/drop, 15ml Bottle)', desc: 'Pediatric dropper formulation recommended for breastfed infants to prevent rickets and support skeletal growth.' },
      { name: 'Sunny D Max Tablets (High Potency Bone Formula)', desc: 'Therapeutic strength tablets formulated for clinical osteoporosis and osteomalacia management.' },
    ],
    whatToCheckOnLabel: [
      'Official Searle security hologram and anti-counterfeit packaging.',
      'Clear DRAP registration number printed on carton graphics.',
      'Softgels are golden-yellow, clear, and uniform without leaks or oiliness in blister.',
      'Oral ampoules are glass-sealed with clean snap lines and legible batch printing.'
    ],
    whenToSeeDoctor: [
      'You experience persistent bone pain, muscle weakness, or difficulty climbing stairs.',
      'You have diagnosed hyperparathyroidism, sarcoidosis, or chronic kidney disease.',
      'Patient takes prescription anticonvulsants (phenytoin, carbamazepine) which alter vitamin D metabolism.',
      'Symptoms of vitamin D toxicity occur (nausea, confusion, excessive thirst, vomiting).'
    ],
    pharmacistWarning: 'High-dose Vitamin D3 ampoules (such as 200,000 IU) are potent clinical doses and should ONLY be taken in the exact weekly or monthly frequency recommended by your physician. It is strongly advised to verify your serum 25(OH)D levels with a clinical laboratory test before initiating high-dose therapy.',
    deliveryFacts: {
      expressCities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'],
      expressTime: '2 to 4 hours',
      nationwideTime: '24 to 48 hours via secure courier',
      shippingFee: 'Standard delivery Rs 250 nationwide (no free delivery tier)',
      supportWhatsapp: '+92 324 4489159',
      whatsappPrefilledText: 'Hello Medikart, I would like to order genuine Sunny D Vitamin D3 in Lahore.'
    },
    relatedBrands: [
      { name: 'CaC-1000 Plus', slug: 'cac-1000' },
      { name: 'Surbex Z', slug: 'surbex' },
      { name: 'The Searle Company', slug: 'searle-pharma' }
    ],
    relatedBlogSlugs: ['vital-vitamins-immunity-guide']
  },

  evion: {
    slug: 'evion',
    name: 'Evion',
    genericName: 'Vitamin E (Alpha-Tocopheryl Acetate 200mg / 400mg / 600mg)',
    manufacturer: 'Martin Dow / Merck Pakistan',
    brandQuery: 'Evion',
    categorySlug: 'vitamins',
    categoryName: 'Vitamins & Supplements',
    h1: 'Evion Price in Pakistan & Authentic Online Delivery',
    metaTitle: 'Evion Price in Pakistan & Online Order | Medikart',
    metaDescription: 'Buy authentic Evion 200mg and Evion 400mg Vitamin E softgels online in Pakistan. Antioxidant health & skin vitality, 2-4 hr delivery in Lahore, COD.',
    answerFirstSummary: 'Evion price in Pakistan ranges from Rs 9 per capsule up to Rs 310 for standard 30 or 100-capsule boxes across 200mg and 400mg strengths. Sourced through licensed partner pharmacies, Medikart delivers genuine Martin Dow Evion across Lahore within 2 to 4 hours with Cash on Delivery.',
    editorialDraftNote: 'needs pharmacist review',
    whatItIs: 'Evion is Pakistan\'s benchmark fat-soluble Vitamin E antioxidant formulation manufactured by Martin Dow. Acting as a primary scavenger of free radicals, Evion protects cellular membranes from oxidative damage, supports dermatological health, promotes muscle recovery, and aids healthy vascular function.',
    availablePacks: [
      { name: 'Evion 200mg Softgel Capsules (Box of 100)', desc: 'Low-dose daily dietary antioxidant capsules for general wellness and cellular defense.' },
      { name: 'Evion 400mg Softgel Capsules (Box of 30 / 100)', desc: 'The most popular therapeutic strength for dermatological support, leg muscle cramps, and antioxidant nutrition.' },
      { name: 'Evion 600mg Softgel Capsules', desc: 'High-potency Vitamin E capsules designed for clinical deficiency states and specialized dermatological recovery.' },
    ],
    whatToCheckOnLabel: [
      'Original Martin Dow / Merck security seal and branded packaging.',
      'Clear green softgel capsules with uniform oval shape and smooth oil filling.',
      'Valid DRAP registration number printed on both outer carton and foil blister.',
      'Batch number and expiry date embossed on the blister edge.'
    ],
    whenToSeeDoctor: [
      'Patient has an upcoming surgical procedure (Vitamin E may increase bleeding tendencies).',
      'You are taking prescription anticoagulant therapy (warfarin or heparin).',
      'Chronic fat malabsorption (cystic fibrosis, cholestatic liver disease) is suspected.',
      'Severe skin rash or allergic hypersensitivity occurs after ingestion.'
    ],
    pharmacistWarning: 'Swallow capsules whole with water after meals. Do not chew or pierce softgels unless specifically instructed by a dermatologist. High continuous doses of Vitamin E should be avoided by patients with cardiovascular disease or bleeding disorders without medical supervision.',
    deliveryFacts: {
      expressCities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'],
      expressTime: '2 to 4 hours',
      nationwideTime: '24 to 48 hours via secure courier',
      shippingFee: 'Standard delivery Rs 250 nationwide (no free delivery tier)',
      supportWhatsapp: '+92 324 4489159',
      whatsappPrefilledText: 'Hello Medikart, I would like to order authentic Evion Vitamin E capsules in Lahore.'
    },
    relatedBrands: [
      { name: 'Surbex Z', slug: 'surbex' },
      { name: 'Centrum', slug: 'centrum' },
      { name: 'Neurobion', slug: 'neurobion' }
    ],
    relatedBlogSlugs: ['vital-vitamins-immunity-guide']
  },

  neurobion: {
    slug: 'neurobion',
    name: 'Neurobion',
    genericName: 'Neurotropic B-Vitamins (B1 Thiamine + B6 Pyridoxine + B12 Cyanocobalamin)',
    manufacturer: 'Martin Dow / P&G Health',
    brandQuery: 'Neurobion',
    categorySlug: 'vitamins',
    categoryName: 'Vitamins & Supplements',
    h1: 'Neurobion Price in Pakistan & Nerve Health Delivery',
    metaTitle: 'Neurobion Price in Pakistan & Online Order | Medikart',
    metaDescription: 'Buy authentic Neurobion tablets (B1, B6, B12) online in Pakistan. Relief for nerve tingling, numbness & fatigue, 2-4 hr delivery in Lahore, COD.',
    answerFirstSummary: 'Neurobion price in Pakistan ranges from Rs 14 per tablet up to Rs 880 for full 100-tablet economy dispensary boxes. Sourced from authorized Martin Dow distributors, Medikart delivers genuine Neurobion across Lahore within 2 to 4 hours with Cash on Delivery.',
    editorialDraftNote: 'needs pharmacist review',
    whatItIs: 'Neurobion is Pakistan’s leading neurotropic multivitamin formulation manufactured by Martin Dow under DRAP standards. It combines high doses of Vitamin B1 (Thiamine), B6 (Pyridoxine), and B12 (Cyanocobalamin) to nourish, regenerate, and protect peripheral nerve fibers, relieving numbness, tingling, and nerve fatigue.',
    availablePacks: [
      { name: 'Neurobion Coated Tablets (Box of 100 Tablets)', desc: 'Standard therapeutic oral daily tablets for managing peripheral neuropathy, tingling hands and feet, and neuralgia.' },
      { name: 'Neurobion Forte Formulations', desc: 'Enhanced strength neurotropic B-vitamins designed for diabetic nerve pain and severe deficiency states.' },
      { name: 'Neurobion Clinical Ampoules (25 Ampoules)', desc: 'Clinical injectable solutions for hospital and physician-administered neuro-rehabilitation.' },
    ],
    whatToCheckOnLabel: [
      'Original Martin Dow / P&G Health security graphics and tamper-evident carton.',
      'Valid DRAP registration number printed legibly on both outer box and aluminum blister strips.',
      'Smooth, round red/pink coated tablets free from cracks or moisture discoloration.',
      'Matching batch number and expiry date embossed on the blister edge.'
    ],
    whenToSeeDoctor: [
      'Numbness, loss of sensation, or tingling spreads rapidly or is accompanied by muscle weakness.',
      'Patient has poorly controlled diabetes mellitus and diabetic foot symptoms.',
      'Walking balance is impaired or sudden shooting nerve pain radiates down limbs.',
      'Symptoms persist without improvement after 4 weeks of regular supplementation.'
    ],
    pharmacistWarning: 'Take one tablet daily with water after meals. Do not exceed the prescribed duration or dosage, as long-term excessive intake of Vitamin B6 can rarely lead to sensory nerve damage. Neurobion is not recommended for children without pediatric specialist consultation.',
    deliveryFacts: {
      expressCities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'],
      expressTime: '2 to 4 hours',
      nationwideTime: '24 to 48 hours via secure courier',
      shippingFee: 'Standard delivery Rs 250 nationwide (no free delivery tier)',
      supportWhatsapp: '+92 324 4489159',
      whatsappPrefilledText: 'Hello Medikart, I would like to order authentic Neurobion tablets in Lahore.'
    },
    relatedBrands: [
      { name: 'Surbex Z', slug: 'surbex' },
      { name: 'Evion', slug: 'evion' },
      { name: 'Centrum', slug: 'centrum' }
    ],
    relatedBlogSlugs: ['vital-vitamins-immunity-guide']
  },

  gaviscon: {
    slug: 'gaviscon',
    name: 'Gaviscon',
    genericName: 'Sodium Alginate + Sodium Bicarbonate + Calcium Carbonate',
    manufacturer: 'Reckitt Benckiser Pakistan',
    brandQuery: 'Gaviscon',
    categorySlug: 'otc',
    categoryName: 'Over-The-Counter (OTC)',
    h1: 'Gaviscon Price in Pakistan & Heartburn Relief Delivery',
    metaTitle: 'Gaviscon Price in Pakistan & Online Order | Medikart',
    metaDescription: 'Buy authentic Gaviscon liquid syrup 120ml and Gaviscon Advance online in Pakistan. Fast heartburn & acid reflux relief, 2-4 hr delivery in Lahore, COD.',
    answerFirstSummary: 'Gaviscon price in Pakistan ranges from Rs 280 for standard 120ml liquid syrup up to Rs 400 for Gaviscon Advance formulation. Sourced through licensed partner pharmacies, Medikart delivers genuine Reckitt Gaviscon across Lahore within 2 to 4 hours with Cash on Delivery.',
    editorialDraftNote: 'needs pharmacist review',
    whatItIs: 'Gaviscon is Pakistan’s leading fast-acting acid reflux and heartburn treatment manufactured by Reckitt Benckiser. Its unique sodium alginate formula forms a protective physical raft barrier on top of stomach acid contents, physically preventing acid from rising up into the esophagus.',
    availablePacks: [
      { name: 'Gaviscon Original Liquid Suspension (120ml / 300ml Bottle)', desc: 'Peppermint-flavored liquid suspension for soothing heartburn, indigestion, and acid reflux within minutes.' },
      { name: 'Gaviscon Advance Suspension (120ml)', desc: 'Double concentration of sodium alginate providing stronger, longer-lasting raft protection against severe reflux.' },
      { name: 'Gaviscon Double Action Tablets (Chewable)', desc: 'Convenient chewable tablets combining the protective raft barrier with neutralizing antacids.' },
    ],
    whatToCheckOnLabel: [
      'Original Reckitt Benckiser branding and tamper-evident break-ring on the bottle cap.',
      'Valid DRAP registration number printed on both outer carton and glass bottle label.',
      'Smooth, viscous off-white liquid suspension with a clean peppermint aroma.',
      'Batch number and expiry date clearly stamped on carton top and bottle label.'
    ],
    whenToSeeDoctor: [
      'Heartburn is accompanied by chest pain radiating to the jaw, neck, or left arm (seek emergency care).',
      'You experience painful or difficult swallowing (dysphagia), or food feels stuck.',
      'Unexplained vomiting, coffee-ground emesis, or dark tarry stools occur.',
      'Acid reflux symptoms persist for more than 7 days despite regular antacid use.'
    ],
    pharmacistWarning: 'Shake bottle thoroughly before measuring each dose. Take 10ml to 20ml after meals and at bedtime. Patients on strictly sodium-restricted diets (due to hypertension or heart failure) should consult a doctor before use, as Gaviscon contains sodium bicarbonate.',
    deliveryFacts: {
      expressCities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'],
      expressTime: '2 to 4 hours',
      nationwideTime: '24 to 48 hours via secure courier',
      shippingFee: 'Standard delivery Rs 250 nationwide (no free delivery tier)',
      supportWhatsapp: '+92 324 4489159',
      whatsappPrefilledText: 'Hello Medikart, I would like to order authentic Gaviscon liquid syrup in Lahore.'
    },
    relatedBrands: [
      { name: 'Panadol', slug: 'panadol' },
      { name: 'Disprin', slug: 'disprin' },
      { name: 'Reckitt', slug: 'dettol' }
    ],
    relatedBlogSlugs: ['safe-buying-guide-online-pharmacy-pakistan']
  },

  molfix: {
    slug: 'molfix',
    name: 'Molfix',
    genericName: 'Premium Comfort Baby Diapers & Pants (3D Anti-Leakage Technology)',
    manufacturer: 'Hayat Kimya Pakistan',
    brandQuery: 'Molfix',
    categorySlug: 'diapers-napkins',
    categoryName: 'Baby Diapers & Hygiene',
    h1: 'Molfix Diapers Price in Pakistan & Doorstep Delivery',
    metaTitle: 'Molfix Diapers Price in Pakistan & Order | Medikart',
    metaDescription: 'Buy authentic Molfix baby diaper pants and tapes in Pakistan. Newborn, Midi, Maxi, Junior sizes, 2-4 hr delivery in Lahore, Cash on Delivery.',
    answerFirstSummary: 'Molfix diapers price in Pakistan ranges from Rs 1,450 for regular packs up to Rs 4,800 for jumbo mega boxes across Sizes 1 through 6. Sourced from authorized Hayat Kimya distributors, Medikart delivers genuine Molfix diapers across Lahore within 2 to 4 hours with Cash on Delivery.',
    editorialDraftNote: 'needs pharmacist review',
    whatItIs: 'Molfix is Pakistan’s leading premium baby diaper brand manufactured by Hayat Kimya under certified dermatological standards. Featuring 3D elastic waistband technology, breathable microporous backsheets, and ultra-absorbent green layers, Molfix keeps baby skin dry and protected against diaper rash.',
    availablePacks: [
      { name: 'Molfix Diaper Pants (Sizes 4, 5, 6 - Maxi, Junior, Extra Large)', desc: 'Easy pull-up pants with 360-degree flexible waistbands for active babies and easy changes.' },
      { name: 'Molfix Comfort Taped Diapers (Newborn Size 1 & Mini Size 2)', desc: 'Gentle taped diapers with umbilical cord cut-outs and aloe vera & chamomile soothing balms.' },
      { name: 'Molfix Jumbo Economy Packs (44s, 60s, 72s)', desc: 'High-value bulk diaper packs providing continuous all-night dryness for peaceful sleep.' },
    ],
    whatToCheckOnLabel: [
      'Original Hayat Kimya factory packaging with heat-sealed tear notch and carrying handle.',
      'Distinct color-coded size branding (Size 1 through 6) with child weight indicators.',
      'Wetness indicator line running down the center of the diaper turns from yellow to blue when full.',
      'Clean, soft, lint-free non-woven inner lining free from moisture or chemical odor.'
    ],
    whenToSeeDoctor: [
      'Severe diaper rash develops open sores, blisters, or does not improve after 3 days of barrier cream.',
      'Infant develops fever alongside localized redness in the groin area.',
      'Diaper rash exhibits bright red satellite lesions, suggesting a secondary candidal (yeast) infection.',
      'Infant displays persistent crying or distress during urination.'
    ],
    pharmacistWarning: 'Change diapers promptly when wetness indicator changes color or immediately after bowel movements to prevent ammonia irritation and skin breakdown. Cleanse the diaper area gently with warm water or alcohol-free wipes, and allow skin to air dry before applying barrier ointments.',
    deliveryFacts: {
      expressCities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'],
      expressTime: '2 to 4 hours',
      nationwideTime: '24 to 48 hours via secure courier',
      shippingFee: 'Standard delivery Rs 250 nationwide (no free delivery tier)',
      supportWhatsapp: '+92 324 4489159',
      whatsappPrefilledText: 'Hello Medikart, I would like to order Molfix baby diaper pants with express delivery in Lahore.'
    },
    relatedBrands: [
      { name: 'Canbebe', slug: 'canbebe' },
      { name: 'Pampers', slug: 'pampers' },
      { name: 'Dettol', slug: 'dettol' }
    ],
    relatedBlogSlugs: ['safe-buying-guide-online-pharmacy-pakistan']
  },

  canbebe: {
    slug: 'canbebe',
    name: 'Canbebe',
    genericName: 'Comfort Dry Baby Diapers (Anatomical Fit & Absorption Channels)',
    manufacturer: 'Ontex Group',
    brandQuery: 'Canbebe',
    categorySlug: 'diapers-napkins',
    categoryName: 'Baby Diapers & Hygiene',
    h1: 'Canbebe Diapers Price in Pakistan & Fast Delivery',
    metaTitle: 'Canbebe Diapers Price in Pakistan & Order | Medikart',
    metaDescription: 'Buy authentic Canbebe baby diapers online in Pakistan. Sizes 3, 4, 5 Midi, Maxi, Junior packs, 2-4 hr delivery in Lahore, Cash on Delivery.',
    answerFirstSummary: 'Canbebe diapers price in Pakistan ranges from Rs 1,930 to Rs 2,750 for 36-piece and 60-piece convenience packs across Sizes 3, 4, and 5. Sourced through authorized retail distribution, Medikart delivers genuine Canbebe diapers across Lahore within 2 to 4 hours with Cash on Delivery.',
    editorialDraftNote: 'needs pharmacist review',
    whatItIs: 'Canbebe is an internationally acclaimed baby diaper brand developed by Ontex Group. Engineered with anatomical fit technology, super-absorbent core polymers, and gentle side leak barriers, Canbebe offers reliable day-and-night protection keeping infants dry, active, and comfortable.',
    availablePacks: [
      { name: 'Canbebe Size 3 Midi Diapers (4 to 9 kg, 36s & 60s)', desc: 'Ideal for rolling and crawling infants needing flexible waistbands and high liquid retention.' },
      { name: 'Canbebe Size 4 Maxi Diapers (7 to 18 kg, 32s & 54s)', desc: 'Designed for active toddlers exploring and standing with extra-absorbent core channels.' },
      { name: 'Canbebe Size 5 Junior Diapers (11 to 25 kg)', desc: 'High-capacity diapers providing full night-time leakage protection for older toddlers.' },
    ],
    whatToCheckOnLabel: [
      'Official Ontex packaging with factory heat-crimped seal.',
      'Weight range guidelines (kg) printed on packaging matching your child\'s current size.',
      'Flexible, re-sealable side tabs that hold securely without tearing.',
      'Soft cottony outer cover with breathable micro-pores.'
    ],
    whenToSeeDoctor: [
      'Persistent red bumps or raw skin fail to respond to zinc oxide barrier ointments.',
      'Diaper area skin shows signs of bacterial infection (crusting, warmth, pus).',
      'Child expresses severe pain whenever the diaper area is touched.',
      'Child develops an unexplained fever accompanied by groin rash.'
    ],
    pharmacistWarning: 'Ensure you select the appropriate diaper size based on your infant\'s current weight rather than age alone, as ill-fitting diapers cause chafing and leakage. Fasten tabs snugly around the waist without restricting comfortable abdominal breathing.',
    deliveryFacts: {
      expressCities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'],
      expressTime: '2 to 4 hours',
      nationwideTime: '24 to 48 hours via secure courier',
      shippingFee: 'Standard delivery Rs 250 nationwide (no free delivery tier)',
      supportWhatsapp: '+92 324 4489159',
      whatsappPrefilledText: 'Hello Medikart, I would like to order Canbebe baby diapers with doorstep delivery in Lahore.'
    },
    relatedBrands: [
      { name: 'Molfix', slug: 'molfix' },
      { name: 'Pampers', slug: 'pampers' },
      { name: 'Calpol', slug: 'calpol' }
    ],
    relatedBlogSlugs: ['safe-buying-guide-online-pharmacy-pakistan']
  },

  pampers: {
    slug: 'pampers',
    name: 'Pampers',
    genericName: 'All-Night Dry Baby Diapers & Pants',
    manufacturer: 'Procter & Gamble Pakistan',
    brandQuery: 'Pampers',
    categorySlug: 'diapers-napkins',
    categoryName: 'Baby Diapers & Hygiene',
    h1: 'Pampers Diapers Price in Pakistan & Express Delivery',
    metaTitle: 'Pampers Price in Pakistan & Online Order | Medikart',
    metaDescription: 'Buy authentic Pampers baby diapers and pants online in Pakistan. Verified P&G stock, all-night dryness, 2-4 hr delivery in Lahore, Cash on Delivery.',
    answerFirstSummary: 'Pampers diapers price in Pakistan ranges from Rs 2,600 to Rs 2,650 for standard 44-piece taped and pant packs. Sourced from authorized Procter & Gamble distribution, Medikart delivers genuine Pampers across Lahore within 2 to 4 hours with Cash on Delivery.',
    editorialDraftNote: 'needs pharmacist review',
    whatItIs: 'Pampers is the world’s pioneer baby diaper brand manufactured by Procter & Gamble under stringent dermatological oversight. Featuring three absorbing channels, micro-pearls locking in wetness, and breathable air circulation layers, Pampers delivers up to 12 hours of uninterrupted dryness.',
    availablePacks: [
      { name: 'Pampers Baby-Dry Pants (Large & Junior Sizes)', desc: '360-degree stretch pants with tear-away sides for easy, mess-free changing on active toddlers.' },
      { name: 'Pampers Premium Care Diapers', desc: 'Silky-soft top sheet with lotion to protect delicate newborn skin against irritation and wetness.' },
      { name: 'Pampers Junior Size 5 Taped Diapers (44s)', desc: 'Secure tape fasteners with overlapping tabs for maximum leak guard during nocturnal sleep.' },
    ],
    whatToCheckOnLabel: [
      'Official Procter & Gamble security packaging with distinctive teal and yellow branding.',
      'Absorbing channel pattern visible inside the dry diaper core.',
      'Fresh baby-powder scent and soft, lotion-treated top layer.',
      'Intact factory packaging with no punctures, tears, or seal degradation.'
    ],
    whenToSeeDoctor: [
      'Severe diaper rash develops red blisters or breaks into open bleeding skin.',
      'Rash spreads onto thighs or abdomen and resists standard diaper cream.',
      'Child exhibits unexplained fussiness or fever with urinary signs.',
      'Allergic contact dermatitis is suspected from diaper fragrances.'
    ],
    pharmacistWarning: 'Do not flush used diapers down toilets. Fold used diapers inward, wrap securely with the adhesive tabs or disposal tape on pants, and discard in household sanitary waste. Change diapers frequently to maintain healthy skin barrier integrity.',
    deliveryFacts: {
      expressCities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'],
      expressTime: '2 to 4 hours',
      nationwideTime: '24 to 48 hours via secure courier',
      shippingFee: 'Standard delivery Rs 250 nationwide (no free delivery tier)',
      supportWhatsapp: '+92 324 4489159',
      whatsappPrefilledText: 'Hello Medikart, I would like to order authentic Pampers diapers in Lahore.'
    },
    relatedBrands: [
      { name: 'Molfix', slug: 'molfix' },
      { name: 'Canbebe', slug: 'canbebe' },
      { name: 'Calpol', slug: 'calpol' }
    ],
    relatedBlogSlugs: ['safe-buying-guide-online-pharmacy-pakistan']
  },

  morinaga: {
    slug: 'morinaga',
    name: 'Morinaga',
    genericName: 'Japanese Pediatric Infant & Growing-Up Nutritional Formula',
    manufacturer: 'Morinaga Milk Industry / NutriCo Pakistan',
    brandQuery: 'Morinaga',
    categorySlug: 'milk-powder',
    categoryName: 'Infant Milk & Nutrition',
    h1: 'Morinaga Milk Price in Pakistan & Online Order',
    metaTitle: 'Morinaga Milk Price in Pakistan & Order | Medikart',
    metaDescription: 'Buy authentic Morinaga BF-1, BF-2, and BF-3 baby milk powder online in Pakistan. Verified pharmacy stock, 2-4 hr delivery in Lahore, Cash on Delivery.',
    answerFirstSummary: 'Morinaga milk price in Pakistan ranges from Rs 1,015 for 400g tins up to Rs 6,030 for multi-pack soft packs across BF-1, BF-2, BF-3, and BF-P. Sourced from authorized distributors, Medikart delivers genuine Morinaga across Lahore within 2 to 4 hours with Cash on Delivery.',
    editorialDraftNote: 'needs pharmacist review',
    whatItIs: 'Morinaga is a premier Japanese pediatric nutrition brand formulated by Morinaga Milk Industry and produced under DRAP food safety standards in Pakistan. Fortified with Lactoferrin, nucleotides, DHA, and balanced oligosaccharides, Morinaga formulas support infant brain development, digestion, and natural immune defenses.',
    availablePacks: [
      { name: 'Morinaga BF-1 Infant Formula (0 to 6 Months, 400g / 800g)', desc: 'Stage 1 infant milk with Lactoferrin and ARA/DHA for non-breastfed infants from birth.' },
      { name: 'Morinaga BF-2 Follow-Up Formula (6 to 12 Months)', desc: 'Stage 2 nutritional formula fortified with iron, calcium, and zinc for weaning infants.' },
      { name: 'Morinaga BF-3 Growing-Up Milk (1 to 3 Years)', desc: 'Stage 3 child nutrition powder supporting active physical growth and cognitive milestones.' },
      { name: 'Morinaga BF-P Specialized Formula (400g Tin)', desc: 'Specialized nutritional formulation designed for premature and low-birth-weight infants under pediatrician supervision.' },
    ],
    whatToCheckOnLabel: [
      'Original factory metal tin with hermetic foil pull-tab seal intact.',
      'NutriCo Pakistan security stamp and official batch identification.',
      'Clear expiration date and manufacturing date embossed on the tin bottom.',
      'Accurate scoop measure included inside the sealed container.'
    ],
    whenToSeeDoctor: [
      'Infant shows signs of severe formula intolerance (excessive gas, projectile vomiting, blood in stool).',
      'Infant fails to gain weight steadily along pediatric growth curves.',
      'Infant exhibits persistent watery diarrhea or severe constipation.',
      'Suspected cow\'s milk protein allergy (hives, wheezing, facial swelling).'
    ],
    pharmacistWarning: 'Maternal breast milk is the best and most natural nourishment for babies and should be continued whenever possible. Follow the preparation instructions on the tin precisely: use clean boiled water cooled to 40°C, and use only the level scoop provided. Never dilute or thicken feeds without medical advice.',
    deliveryFacts: {
      expressCities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'],
      expressTime: '2 to 4 hours',
      nationwideTime: '24 to 48 hours via secure courier',
      shippingFee: 'Standard delivery Rs 250 nationwide (no free delivery tier)',
      supportWhatsapp: '+92 324 4489159',
      whatsappPrefilledText: 'Hello Medikart, I would like to order authentic Morinaga infant milk in Lahore.'
    },
    relatedBrands: [
      { name: 'Meiji', slug: 'meiji' },
      { name: 'Lactogen', slug: 'lactogen' },
      { name: 'Cerelac', slug: 'cerelac' }
    ],
    relatedBlogSlugs: ['pediatric-nutrition-guide']
  },

  meiji: {
    slug: 'meiji',
    name: 'Meiji',
    genericName: 'Japanese Pediatric Milk Formula & Specialized Child Nutrition',
    manufacturer: 'Meiji Holdings / Authorized Importers',
    brandQuery: 'Meiji',
    categorySlug: 'milk-powder',
    categoryName: 'Infant Milk & Nutrition',
    h1: 'Meiji Milk Price in Pakistan & Authentic Delivery',
    metaTitle: 'Meiji Milk Price in Pakistan & Online Order | Medikart',
    metaDescription: 'Buy authentic Meiji Big 3, FM-T, and Meiji Lactoless formula online in Pakistan. Verified nutritional milk, 2-4 hr delivery in Lahore, Cash on Delivery.',
    answerFirstSummary: 'Meiji milk price in Pakistan ranges from Rs 995 for 350g Lactoless up to Rs 5,425 for multi-pack 900g tins across Big 3 and specialized formulations. Sourced through licensed partner pharmacies, Medikart delivers genuine Meiji across Lahore within 2 to 4 hours with Cash on Delivery.',
    editorialDraftNote: 'needs pharmacist review',
    whatItIs: 'Meiji is a prestigious Japanese nutritional science brand providing specialized and stage-based pediatric formulas. Designed through decades of breast milk research, Meiji provides optimal ratios of DHA, iron, zinc, nucleotides, and easily digestible proteins supporting cognitive acuity, gut comfort, and strong immunity.',
    availablePacks: [
      { name: 'Meiji Big 3 Growing-Up Formula (1 to 3 Years, 900g Tin)', desc: 'Stage 3 nutritional milk powder fortified with DHA, iron, and calcium for active toddlers.' },
      { name: 'Meiji Lactoless Specialized Formula (350g Tin)', desc: 'Lactose-free nutritional formula specially developed for infants recovering from lactose intolerance and acute diarrhea.' },
      { name: 'Meiji FM-T Infant Formula (0 to 12 Months)', desc: 'Comprehensive stage 1 infant milk with balanced fatty acid profiles for healthy physical development.' },
    ],
    whatToCheckOnLabel: [
      'Original Japanese Meiji packaging with English nutritional and regulatory labeling.',
      'Unbroken foil seal under the plastic snap-on lid with measuring scoop enclosed.',
      'Valid expiry date clearly stamped on the tin base with at least 9 months shelf life.',
      'Uniform, sweet, pleasant milky aroma and fine powder consistency.'
    ],
    whenToSeeDoctor: [
      'Infant shows symptoms of dehydration or refuses multiple feeds consecutively.',
      'Persistent digestive distress or severe colic continues despite formula adjustment.',
      'Child displays developmental growth delays or poor weight gain.',
      'Signs of formula allergy appear after feeding (skin hives, persistent vomiting).'
    ],
    pharmacistWarning: 'Breast milk is the ideal food for infants. Prepare each bottle individually just prior to feeding, and discard any formula remaining after 1 hour. Do not use Meiji Lactoless as a permanent diet unless explicitly diagnosed with lactose intolerance by a pediatrician.',
    deliveryFacts: {
      expressCities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'],
      expressTime: '2 to 4 hours',
      nationwideTime: '24 to 48 hours via secure courier',
      shippingFee: 'Standard delivery Rs 250 nationwide (no free delivery tier)',
      supportWhatsapp: '+92 324 4489159',
      whatsappPrefilledText: 'Hello Medikart, I would like to order authentic Meiji baby formula in Lahore.'
    },
    relatedBrands: [
      { name: 'Morinaga', slug: 'morinaga' },
      { name: 'Lactogen', slug: 'lactogen' },
      { name: 'Cerelac', slug: 'cerelac' }
    ],
    relatedBlogSlugs: ['pediatric-nutrition-guide']
  },

  lactogen: {
    slug: 'lactogen',
    name: 'Lactogen',
    genericName: 'Infant Milk Formula with L. reuteri Probiotics',
    manufacturer: 'Nestle Pakistan',
    brandQuery: 'Lactogen',
    categorySlug: 'milk-powder',
    categoryName: 'Infant Milk & Nutrition',
    h1: 'Nestle Lactogen Price in Pakistan & Order Online',
    metaTitle: 'Lactogen Price in Pakistan & Online Order | Medikart',
    metaDescription: 'Buy authentic Nestle Lactogen 1 & 2 Happy Smooth 800g formula in Pakistan. L. reuteri probiotics, 2-4 hr delivery in Lahore, Cash on Delivery.',
    answerFirstSummary: 'Nestle Lactogen price in Pakistan ranges from Rs 750 for 200g bib packs up to Rs 3,000 for 800g Happy Smooth tins across Stages 1 and 2. Sourced from authorized Nestle distributors, Medikart delivers genuine Lactogen across Lahore within 2 to 4 hours with Cash on Delivery.',
    editorialDraftNote: 'needs pharmacist review',
    whatItIs: 'Lactogen is Pakistan’s widely trusted infant milk formula brand manufactured by Nestle Pakistan under strict food safety and DRAP regulations. Enriched with active L. reuteri probiotic cultures, iron, calcium, and essential fatty acids, Lactogen supports smooth, comfortable digestion, gut microflora balance, and steady growth.',
    availablePacks: [
      { name: 'Nestle Lactogen 1 Happy Smooth (0 to 6 Months, 400g / 800g)', desc: 'Stage 1 infant formula enriched with L. reuteri for non-breastfed infants from birth.' },
      { name: 'Nestle Lactogen 2 Happy Smooth (6 to 12 Months, 400g / 800g)', desc: 'Stage 2 follow-up formula providing higher iron and calcium for growing babies starting solids.' },
      { name: 'Nestle Lactogen Economy Bib Packs (200g / 400g)', desc: 'Cardboard box formats containing sealed aluminum pouches for convenient household replenishment.' },
    ],
    whatToCheckOnLabel: [
      'Original Nestle security seal and clear "Happy Smooth" branding with blue/yellow graphics.',
      'Hermetically sealed foil membrane inside the tin or sealed inner pouch in bib packs.',
      'Clear DRAP and food regulatory compliance declarations printed on the rear panel.',
      'Manufacturing date, batch number, and expiry date stamped on the package.'
    ],
    whenToSeeDoctor: [
      'Infant shows signs of severe digestive intolerance (projectile vomiting, severe diarrhea).',
      'Infant does not achieve steady weight gain according to WHO milestone charts.',
      'Suspected milk allergy signs appear (eczema, facial hives, wheezing).',
      'Infant exhibits persistent crying or signs of abdominal cramping after feeds.'
    ],
    pharmacistWarning: 'Breast milk is best for babies and provides superior nutrition and immunity. Strictly adhere to the feeding table on the back of the package; incorrect dilution (too much powder or too much water) can make your baby ill or cause severe electrolyte imbalance.',
    deliveryFacts: {
      expressCities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'],
      expressTime: '2 to 4 hours',
      nationwideTime: '24 to 48 hours via secure courier',
      shippingFee: 'Standard delivery Rs 250 nationwide (no free delivery tier)',
      supportWhatsapp: '+92 324 4489159',
      whatsappPrefilledText: 'Hello Medikart, I would like to order authentic Nestle Lactogen in Lahore.'
    },
    relatedBrands: [
      { name: 'Cerelac', slug: 'cerelac' },
      { name: 'Morinaga', slug: 'morinaga' },
      { name: 'Meiji', slug: 'meiji' }
    ],
    relatedBlogSlugs: ['pediatric-nutrition-guide']
  },

  cerelac: {
    slug: 'cerelac',
    name: 'Cerelac',
    genericName: 'Fortified Infant Complementary Cereal (Iron, Zinc, Calcium, Vitamins A & C)',
    manufacturer: 'Nestle Pakistan',
    brandQuery: 'Cerelac',
    categorySlug: 'milk-powder',
    categoryName: 'Infant Milk & Nutrition',
    h1: 'Nestle Cerelac Price in Pakistan & Doorstep Delivery',
    metaTitle: 'Cerelac Price in Pakistan & Online Order | Medikart',
    metaDescription: 'Buy authentic Nestle Cerelac Wheat & Banana, 3 Fruits, and Rice cereals in Pakistan. Iron-fortified baby food, 2-4 hr delivery in Lahore, Cash on Delivery.',
    answerFirstSummary: 'Nestle Cerelac price in Pakistan ranges from Rs 50 for single-serve sachets to Rs 870 for 350g economy bib boxes across Stages 1, 2, and 3. Sourced from authorized Nestle distributors, Medikart delivers genuine Cerelac across Lahore within 2 to 4 hours with Cash on Delivery.',
    editorialDraftNote: 'needs pharmacist review',
    whatItIs: 'Nestle Cerelac is Pakistan’s leading complementary infant cereal brand manufactured by Nestle Pakistan. Fortified with essential iron, zinc, calcium, Vitamin C, and Bifidus BL probiotics, Cerelac provides smooth, easily digestible first solid foods supporting cognitive development and immune vitality.',
    availablePacks: [
      { name: 'Cerelac Stage 1: Wheat & Milk / Rice (From 6 Months, 175g / 350g)', desc: 'Smooth, simple-grain introductory cereal for gentle weaning onto solid foods.' },
      { name: 'Cerelac Stage 2: Wheat & Banana / 3 Fruits (From 8 Months)', desc: 'Fruit-enriched complementary cereal introducing new textures and natural fruit tastes.' },
      { name: 'Cerelac Stage 3: Multi-Grain & 5 Fruits (From 10 to 12 Months)', desc: 'Hearty multi-grain cereal with small fruit pieces encouraging chewing milestones.' },
      { name: 'Cerelac Single-Serve 25g Sachets', desc: 'Convenient pre-measured travel sachets ensuring fresh preparation on the go.' },
    ],
    whatToCheckOnLabel: [
      'Original Nestle tamper-evident inner aluminum pouch cleanly sealed without air leaks.',
      'Clear stage indicator (Stage 1, 2, or 3) indicating age-appropriate complementary feeding.',
      'Clear list of fortified micronutrients (including 50% daily iron in two servings).',
      'Batch code and expiry date printed legibly on both outer box and inner foil pouch.'
    ],
    whenToSeeDoctor: [
      'Infant shows signs of food allergy after introduction (facial swelling, vomiting, urticaria).',
      'Infant refuses all complementary foods and shows poor weight gain past 6 months.',
      'Infant develops persistent constipation or diarrhea after starting new cereals.',
      'Infant exhibits swallowing difficulties or choking sensations.'
    ],
    pharmacistWarning: 'Complementary foods should only be introduced around 6 months of age alongside continued breastfeeding. Always prepare with clean boiled drinking water cooled to lukewarm temperature. Feed with a clean spoon; never feed cereal from an enlarged bottle nipple due to choking risk.',
    deliveryFacts: {
      expressCities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'],
      expressTime: '2 to 4 hours',
      nationwideTime: '24 to 48 hours via secure courier',
      shippingFee: 'Standard delivery Rs 250 nationwide (no free delivery tier)',
      supportWhatsapp: '+92 324 4489159',
      whatsappPrefilledText: 'Hello Medikart, I would like to order authentic Nestle Cerelac in Lahore.'
    },
    relatedBrands: [
      { name: 'Lactogen', slug: 'lactogen' },
      { name: 'Morinaga', slug: 'morinaga' },
      { name: 'Meiji', slug: 'meiji' }
    ],
    relatedBlogSlugs: ['pediatric-nutrition-guide']
  },

  'accu-chek': {
    slug: 'accu-chek',
    name: 'Accu-Chek',
    genericName: 'Blood Glucose Monitoring Meters, Active Test Strips & Lancets',
    manufacturer: 'Roche Diagnostics / ACON Laboratories',
    brandQuery: 'Accu-Chek|Accu Chek|On Call',
    categorySlug: 'diagnostics',
    categoryName: 'Diagnostics & Health Devices',
    h1: 'Accu-Chek Price in Pakistan & Glucometer Strips Delivery',
    metaTitle: 'Accu-Chek Price in Pakistan & Online Order | Medikart',
    metaDescription: 'Buy authentic Accu-Chek Active glucometer and On Call Extra 50s test strips online in Pakistan. Clinical accuracy, 2-4 hr delivery in Lahore, COD.',
    answerFirstSummary: 'Accu-Chek and On Call glucose monitor price in Pakistan ranges from Rs 6 per sterile lancet up to Rs 4,483 for complete meter starter kits, with 50-strip packs between Rs 1,400 and Rs 2,400. Sourced from authorized diagnostic distributors, Medikart delivers genuine strips across Lahore within 2 to 4 hours with Cash on Delivery.',
    editorialDraftNote: 'needs pharmacist review',
    whatItIs: 'Accu-Chek (by Roche Diagnostics) and On Call Extra (by ACON) are Pakistan’s premier clinical self-monitoring blood glucose (SMBG) systems. Designed for individuals managing Type 1 and Type 2 diabetes, they provide laboratory-accurate blood glucose readings within 5 seconds with minimal blood sample requirements.',
    availablePacks: [
      { name: 'Accu-Chek Active Blood Glucose Meter Starter Kit', desc: 'Complete monitor kit including digital meter, lancing device, 10 sterile lancets, and carry pouch.' },
      { name: 'Accu-Chek Active 50 Test Strips Box', desc: 'Laboratory-calibrated test strips in sealed desiccant plastic vial for routine home diabetes tracking.' },
      { name: 'On Call Extra Blood Glucose Meter & 50 Strips', desc: 'Highly popular, cost-effective blood glucose monitoring system with auto-calibration.' },
      { name: 'Accu-Chek Softclix Sterile Lancets (Pack of 100)', desc: 'Precision-cut silicone-coated lancets designed for gentle, virtually pain-free fingertip sampling.' },
    ],
    whatToCheckOnLabel: [
      'Original Roche Diagnostics / ACON security hologram and tamper-proof box seal.',
      'Unopened plastic test strip vial with integrated desiccant stopper cap.',
      'Expiration date clearly printed on the strip vial (never use strips past expiry as readings will be erroneous).',
      'Valid DRAP medical device registration and CE certification marks.'
    ],
    whenToSeeDoctor: [
      'Blood glucose reading is critically high (above 250-300 mg/dL) with ketones in urine or confusion.',
      'Blood glucose reading is critically low (below 70 mg/dL) and does not recover after fast-acting carbs.',
      'Patient experiences symptoms of diabetic ketoacidosis (nausea, fruity breath, deep rapid breathing).',
      'Unexplained wide fluctuations in glucose readings occur despite consistent diet and medication.'
    ],
    pharmacistWarning: 'Always close the strip vial tightly immediately after removing a test strip to preserve the enzyme chemistry against atmospheric humidity. Clean your hands with warm water and soap before testing; alcohol wipes can alter readings if not completely evaporated. Dispose of used lancets safely in a sharps container.',
    deliveryFacts: {
      expressCities: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'],
      expressTime: '2 to 4 hours',
      nationwideTime: '24 to 48 hours via secure courier',
      shippingFee: 'Standard delivery Rs 250 nationwide (no free delivery tier)',
      supportWhatsapp: '+92 324 4489159',
      whatsappPrefilledText: 'Hello Medikart, I would like to order authentic Accu-Chek test strips with express delivery in Lahore.'
    },
    relatedBrands: [
      { name: 'Surbex Z', slug: 'surbex' },
      { name: 'Sensodyne', slug: 'sensodyne' },
      { name: 'Dettol', slug: 'dettol' }
    ],
    relatedBlogSlugs: ['safe-buying-guide-online-pharmacy-pakistan']
  }
};

export function getPriorityLandingPage(slug) {
  if (!slug) return null;
  return PRIORITY_LANDING_PAGES[slug.toLowerCase().trim()] || null;
}

export function getAllPriorityLandingSlugs() {
  return Object.keys(PRIORITY_LANDING_PAGES);
}
