/**
 * Script to seed comprehensive Dvago & Pakistani Over The Counter (OTC) products.
 * Associates each product with the 'OTC (Over the Counter)' category as well as
 * a relevant secondary category (Medicines, Vitamins, Dermatology, Herbal, etc.).
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('../src/modules/products/product.model');
const Category = require('../src/modules/categories/category.model');

async function seedOtc() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set!');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB.');

  // Find categories
  const categories = await Category.find();
  const getCatId = (slug) => {
    const found = categories.find((c) => c.slug === slug);
    return found ? found._id : null;
  };

  const otcId = getCatId('otc');
  const medicinesId = getCatId('medicines');
  const vitaminsId = getCatId('vitamins');
  const dermatologyId = getCatId('dermatology');
  const herbalId = getCatId('herbal');
  const generalId = getCatId('general-items');
  const surgicalId = getCatId('surgical-items');

  if (!otcId) {
    console.error('OTC category not found in DB!');
    process.exit(1);
  }

  const otcProductsData = [
    // ─── 1. PAIN & FEVER RELIEF ────────────────────────────────────────────────
    {
      name: 'Panadol 500mg Tablets (200 Tablets)',
      genericName: 'Paracetamol',
      sku: 'OTC-PAN-500',
      price: 680,
      description: 'Effective relief from headache, migraine, fever, muscular aches, period pain, and toothache. Gentle on the stomach.',
      categoryIds: [otcId, medicinesId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/panadol.jpg', isPrimary: true }],
    },
    {
      name: 'Panadol Extra Tablets (100 Tablets)',
      genericName: 'Paracetamol 500mg + Caffeine 65mg',
      sku: 'OTC-PAN-EXT',
      price: 520,
      description: 'Provides extra fast, powerful relief from tough headaches, body aches, and pain with added caffeine for faster absorption.',
      categoryIds: [otcId, medicinesId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/panadol-extra.jpg', isPrimary: true }],
    },
    {
      name: 'Panadol CF Cold & Flu Tablets (100 Tablets)',
      genericName: 'Paracetamol 500mg + Pseudoephedrine 30mg + Chlorpheniramine 2mg',
      sku: 'OTC-PAN-CF',
      price: 490,
      description: 'Complete multi-symptom relief for cold, flu, blocked nose, sneezing, fever, and sinus congestion.',
      categoryIds: [otcId, medicinesId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/panadol-cf.jpg', isPrimary: true }],
    },
    {
      name: 'Disprin 300mg Soluble Tablets (100 Tablets)',
      genericName: 'Aspirin (Acetylsalicylic Acid)',
      sku: 'OTC-DIS-300',
      price: 240,
      description: 'Fast-dissolving soluble pain relief tablets for immediate relief from headache, toothache, fever, and inflammation.',
      categoryIds: [otcId, medicinesId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/disprin.jpg', isPrimary: true }],
    },
    {
      name: 'Brufen 400mg Tablets (30 Tablets)',
      genericName: 'Ibuprofen',
      sku: 'OTC-BRU-400',
      price: 360,
      description: 'Non-steroidal anti-inflammatory (NSAID) for rapid relief from muscular pain, backache, dental pain, arthritis, and fever.',
      categoryIds: [otcId, medicinesId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/brufen.jpg', isPrimary: true }],
    },
    {
      name: 'Calpol 120mg/5ml Pediatric Suspension (60ml)',
      genericName: 'Paracetamol',
      sku: 'OTC-CAL-120',
      price: 135,
      description: 'Pleasant strawberry-flavored pediatric syrup for fever reduction, teething pain, post-immunization fever, and sore throat in infants and toddlers.',
      categoryIds: [otcId, medicinesId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/calpol.jpg', isPrimary: true }],
    },
    {
      name: 'Arinac Forte Tablets (100 Tablets)',
      genericName: 'Ibuprofen 400mg + Pseudoephedrine HCl 60mg',
      sku: 'OTC-ARI-FORTE',
      price: 780,
      description: 'Dual-action formulation combining anti-inflammatory pain relief and decongestant for severe cold, sinusitis, and flu.',
      categoryIds: [otcId, medicinesId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/arinac-forte.jpg', isPrimary: true }],
    },
    {
      name: 'Ponstan 500mg Tablets (100 Tablets)',
      genericName: 'Mefenamic Acid',
      sku: 'OTC-PON-500',
      price: 650,
      description: 'Targeted relief from acute pain, post-operative dental pain, dysmenorrhea (menstrual cramps), and rheumatoid arthritis.',
      categoryIds: [otcId, medicinesId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/ponstan.jpg', isPrimary: true }],
    },
    {
      name: 'Volini Pain Relief Gel (30g)',
      genericName: 'Diclofenac Diethylamine + Methyl Salicylate + Menthol',
      sku: 'OTC-VOL-30G',
      price: 260,
      description: 'Fast-absorbing topical pain relief gel with micro-particles for deep muscular pain, neck, shoulder stiffness, and sports sprains.',
      categoryIds: [otcId, medicinesId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/volini.jpg', isPrimary: true }],
    },
    {
      name: 'Deep Heat Rub Cream (35g)',
      genericName: 'Menthol + Methyl Salicylate',
      sku: 'OTC-DPH-35G',
      price: 295,
      description: 'Fast acting warming heat rub for symptomatic relief of muscular aches, strains, rheumatism, backache, and sciatica.',
      categoryIds: [otcId, medicinesId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/deep-heat.jpg', isPrimary: true }],
    },

    // ─── 2. ACIDITY, INDIGESTION & DIGESTIVE HEALTH ─────────────────────────────
    {
      name: 'Gaviscon Double Action Liquid Mint (120ml)',
      genericName: 'Sodium Alginate + Sodium Bicarbonate + Calcium Carbonate',
      sku: 'OTC-GAV-120ML',
      price: 285,
      description: 'Forms a protective soothing barrier on top of stomach contents to prevent acid reflux, heartburn, and indigestion.',
      categoryIds: [otcId, medicinesId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/gaviscon.jpg', isPrimary: true }],
    },
    {
      name: 'Gaviscon Double Action Chewable Tablets (16 Tablets)',
      genericName: 'Sodium Alginate + Sodium Bicarbonate',
      sku: 'OTC-GAV-TAB',
      price: 340,
      description: 'Chewable peppermint tablets providing immediate relief from acid indigestion, sour stomach, and burning heartburn on the go.',
      categoryIds: [otcId, medicinesId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/gaviscon-tabs.jpg', isPrimary: true }],
    },
    {
      name: 'ENO Fruit Salt Lemon (Pack of 30 Sachets)',
      genericName: 'Sodium Bicarbonate + Citric Acid',
      sku: 'OTC-ENO-LEM',
      price: 450,
      description: 'Fast-acting effervescent antacid powder that neutralizes stomach acid within 6 seconds. Refreshing lemon taste.',
      categoryIds: [otcId, generalId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/eno-lemon.jpg', isPrimary: true }],
    },
    {
      name: 'Digas Antacid Chewable Tablets (40 Tablets)',
      genericName: 'Magnesium Hydroxide + Aluminium Hydroxide + Simethicone',
      sku: 'OTC-DIG-TAB',
      price: 220,
      description: 'Triple-action chewable tablets for acidity, gas bloating, flatulence, and stomach fullness.',
      categoryIds: [otcId, medicinesId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/digas.jpg', isPrimary: true }],
    },
    {
      name: 'Smecta 3g Powder (30 Sachets)',
      genericName: 'Diosmectite',
      sku: 'OTC-SME-30S',
      price: 1150,
      description: 'Natural clay adsorbent for the symptomatic treatment of acute diarrhea, gastroenteritis, and abdominal pain in children and adults.',
      categoryIds: [otcId, medicinesId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/smecta.jpg', isPrimary: true }],
    },
    {
      name: 'Hydralyte Oral Rehydration Salts (ORS) Lemon (20 Sachets)',
      genericName: 'Oral Rehydration Salts (WHO Formula)',
      sku: 'OTC-ORS-LEM',
      price: 320,
      description: 'Scientifically formulated electrolyte replacement to rapidly restore hydration lost due to diarrhea, vomiting, heat exhaustion, and sports.',
      categoryIds: [otcId, generalId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/hydralyte.jpg', isPrimary: true }],
    },
    {
      name: 'Hashmi Ispaghol Husk (100g Box)',
      genericName: 'Psyllium Husk',
      sku: 'OTC-HAS-ISP',
      price: 380,
      description: '100% natural soluble dietary fiber for healthy digestive motility, smooth bowel movement, constipation relief, and cholesterol support.',
      categoryIds: [otcId, herbalId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/hashmi-ispaghol.jpg', isPrimary: true }],
    },
    {
      name: 'Mucaine Gel Mint Suspension (120ml)',
      genericName: 'Oxethazaine + Aluminium Hydroxide + Magnesium Hydroxide',
      sku: 'OTC-MUC-120ML',
      price: 290,
      description: 'Local anesthetic antacid suspension for quick relief of severe burning gastric pain, esophagitis, and gastritis.',
      categoryIds: [otcId, medicinesId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/mucaine.jpg', isPrimary: true }],
    },

    // ─── 3. COUGH, COLD, FLU & SORE THROAT ──────────────────────────────────────
    {
      name: 'Strepsils Honey & Lemon Lozenges (Pack of 24 Lozenges)',
      genericName: 'Amylmetacresol + 2,4-Dichlorobenzyl Alcohol',
      sku: 'OTC-STR-HONEY',
      price: 310,
      description: 'Antiseptic soothing throat lozenges that fight throat infections, calm tickly coughs, and provide lubricating comfort for painful throats.',
      categoryIds: [otcId, medicinesId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/strepsils-honey.jpg', isPrimary: true }],
    },
    {
      name: 'Strepsils Orange with Vitamin C (24 Lozenges)',
      genericName: 'Amylmetacresol + Dichlorobenzyl Alcohol + Vitamin C 100mg',
      sku: 'OTC-STR-ORANGE',
      price: 330,
      description: 'Soothing antiseptic throat lozenges enriched with Vitamin C to bolster immune response and relieve sore throat soreness.',
      categoryIds: [otcId, vitaminsId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/strepsils-orange.jpg', isPrimary: true }],
    },
    {
      name: 'Qarshi Johar Joshanda Instant Herbal Tea (30 Sachets)',
      genericName: 'Herbal Cold & Cough Extract',
      sku: 'OTC-QAR-JOSH',
      price: 480,
      description: 'Traditional herbal remedy formulated from natural botanical extracts for instant soothing relief from cold, flu, cough, and throat irritation.',
      categoryIds: [otcId, herbalId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/johar-joshanda.jpg', isPrimary: true }],
    },
    {
      name: 'Vicks VapoRub Ointment (50g Tub)',
      genericName: 'Camphor + Menthol + Eucalyptus Oil',
      sku: 'OTC-VIC-50G',
      price: 340,
      description: 'Topical vaporizing ointment for chest, throat, and back to relieve nasal congestion, cough, and minor muscular aches.',
      categoryIds: [otcId, medicinesId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/vicks-vaporub.jpg', isPrimary: true }],
    },
    {
      name: 'Sancos Dextromethorphan Cough Syrup (120ml)',
      genericName: 'Dextromethorphan Hydrobromide',
      sku: 'OTC-SAN-120ML',
      price: 210,
      description: 'Centrally-acting dry cough suppressant for restful nights and soothing non-productive bronchial cough relief.',
      categoryIds: [otcId, medicinesId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/sancos.jpg', isPrimary: true }],
    },
    {
      name: 'Pulmonol Herbal Cough Syrup (120ml)',
      genericName: 'Herbal Expectorant & Bronchial Reliever',
      sku: 'OTC-PUL-120ML',
      price: 195,
      description: 'Gentle expectorant syrup that thins mucus, eases chest tightness, and promotes comfortable breathing.',
      categoryIds: [otcId, herbalId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/pulmonol.jpg', isPrimary: true }],
    },
    {
      name: 'Nafsal Isotonic Saline Nasal Drops (15ml)',
      genericName: 'Sodium Chloride 0.9%',
      sku: 'OTC-NAF-15ML',
      price: 95,
      description: 'Safe sterile saline drops for infants, children, and adults to clear stuffy noses, dry nasal passages, and allergen crusts.',
      categoryIds: [otcId, medicinesId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/nafsal.jpg', isPrimary: true }],
    },

    // ─── 4. VITAMINS, MINERALS & DAILY NUTRACEUTICALS ───────────────────────────
    {
      name: 'CaC 1000 Plus Orange Effervescent Tablets (20 Tablets)',
      genericName: 'Calcium Lactate Gluconate 1000mg + Vitamin C 1000mg + Vitamin D3 + B6',
      sku: 'OTC-CAC-1000',
      price: 540,
      description: 'High-potency effervescent drink tablet for strong bones, teeth, enhanced immune resistance, and fatigue recovery.',
      categoryIds: [otcId, vitaminsId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/cac-1000.jpg', isPrimary: true }],
    },
    {
      name: 'Surbex Z High Potency Vitamin B-Complex with Zinc (30 Tablets)',
      genericName: 'Vitamin B-Complex + Vitamin C + Vitamin E + Folic Acid + Zinc 22.5mg',
      sku: 'OTC-SUR-Z30',
      price: 620,
      description: 'Comprehensive daily nutritional supplement formulated to combat physical stress, strengthen hair & nails, and replenish essential micronutrients.',
      categoryIds: [otcId, vitaminsId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/surbex-z.jpg', isPrimary: true }],
    },
    {
      name: 'Redoxon Double Action Effervescent (15 Tablets)',
      genericName: 'Vitamin C 1000mg + Zinc 10mg',
      sku: 'OTC-RED-15T',
      price: 690,
      description: 'Double strength immune defense formula combining high-dose Vitamin C with Zinc for year-round immunity against seasonal infections.',
      categoryIds: [otcId, vitaminsId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/redoxon.jpg', isPrimary: true }],
    },
    {
      name: 'Evion 400mg Vitamin E Capsules (30 Capsules)',
      genericName: 'Vitamin E (Tocopheryl Acetate)',
      sku: 'OTC-EVI-400',
      price: 310,
      description: 'Powerful antioxidant for healthy radiant skin, cellular protection, muscle health, and hair nourishment.',
      categoryIds: [otcId, vitaminsId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/evion.jpg', isPrimary: true }],
    },
    {
      name: 'Neurobion B-Complex Tablets (100 Tablets)',
      genericName: 'Vitamin B1 100mg + Vitamin B6 200mg + Vitamin B12 200mcg',
      sku: 'OTC-NEU-100T',
      price: 880,
      description: 'Nerve nourishing neurotropic B vitamins for peripheral nerve health, numbness, tingling in hands & feet, and neuralgia.',
      categoryIds: [otcId, vitaminsId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/neurobion.jpg', isPrimary: true }],
    },

    // ─── 5. FIRST AID, ANTISEPTICS & DERMA OINTMENTS ────────────────────────────
    {
      name: 'Polyfax Skin Ointment (20g Tube)',
      genericName: 'Polymyxin B Sulphate 10,000 IU + Bacitracin Zinc 500 IU',
      sku: 'OTC-POL-20G',
      price: 160,
      description: 'Broad-spectrum antibiotic ointment for preventing and treating minor skin infections in cuts, scrapes, minor burns, and abrasions.',
      categoryIds: [otcId, dermatologyId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/polyfax.jpg', isPrimary: true }],
    },
    {
      name: 'Polyfax Plus Ointment with Lignocaine (20g)',
      genericName: 'Polymyxin B + Bacitracin + Lignocaine 40mg',
      sku: 'OTC-POL-PLUS',
      price: 190,
      description: 'Dual-action antibacterial ointment with local anesthetic for painless wound healing, scrapes, and soothing insect bites.',
      categoryIds: [otcId, dermatologyId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/polyfax-plus.jpg', isPrimary: true }],
    },
    {
      name: 'Betadine 10% Antiseptic Liquid Solution (60ml)',
      genericName: 'Povidone Iodine 10% w/v',
      sku: 'OTC-BET-60ML',
      price: 210,
      description: 'Gold-standard microbicidal solution for topical disinfection of cuts, wounds, burns, and preoperative skin prep.',
      categoryIds: [otcId, dermatologyId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/betadine.jpg', isPrimary: true }],
    },
    {
      name: 'Pyodine 10% Antiseptic Solution (60ml)',
      genericName: 'Povidone Iodine 10%',
      sku: 'OTC-PYO-60ML',
      price: 180,
      description: 'Trusted household antiseptic solution for rapid sterilization of superficial cuts, scratches, and first aid emergencies.',
      categoryIds: [otcId, dermatologyId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/pyodine.jpg', isPrimary: true }],
    },
    {
      name: 'Dettol Antiseptic Disinfectant Liquid (250ml)',
      genericName: 'Chloroxylenol 4.8% w/v',
      sku: 'OTC-DET-250ML',
      price: 490,
      description: 'Versatile household disinfectant liquid for first aid antiseptic wound cleansing, personal hygiene, and surface sanitation.',
      categoryIds: [otcId, generalId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/dettol.jpg', isPrimary: true }],
    },
    {
      name: 'Saniplast First Aid Medicated Bandages (Pack of 20)',
      genericName: 'Antiseptic Adhesive Strips with Acriflavine Pad',
      sku: 'OTC-SAN-20S',
      price: 150,
      description: 'Sterile, breathable medicated adhesive bandages with non-stick antiseptic pads for clean, protected wound healing.',
      categoryIds: [otcId, surgicalId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/saniplast.jpg', isPrimary: true }],
    },
    {
      name: 'Burnol Antiseptic Burns & Cuts Cream (25g)',
      genericName: 'Aminacrine HCl + Cetrimide',
      sku: 'OTC-BUR-25G',
      price: 140,
      description: 'Quick cooling antiseptic cream for minor burns, scalds, sunburns, blisters, and antiseptic wound care.',
      categoryIds: [otcId, dermatologyId].filter(Boolean),
      stockStatus: 'in_stock',
      active: true,
      images: [{ path: '/images/products/burnol.jpg', isPrimary: true }],
    },
  ];

  console.log(`Upserting ${otcProductsData.length} OTC products...`);

  let addedCount = 0;
  let updatedCount = 0;

  for (const item of otcProductsData) {
    const existing = await Product.findOne({ sku: item.sku });
    if (existing) {
      await Product.updateOne({ sku: item.sku }, { $set: item });
      updatedCount++;
    } else {
      await Product.create(item);
      addedCount++;
    }
  }

  console.log(`Done! Added ${addedCount} new OTC products, updated ${updatedCount} existing products.`);
  process.exit(0);
}

seedOtc().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});