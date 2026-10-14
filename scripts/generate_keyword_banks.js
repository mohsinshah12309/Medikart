import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from '../server/node_modules/mongoose/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medikart_dev';

const GSC_QUERIES_PATH = 'D:/Mohsin/Downloads/gsc_export/Queries.csv';
const OUTPUT_DIR = path.resolve(__dirname, '../keyword-bank');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Read GSC Queries if available
const gscData = new Map();
if (fs.existsSync(GSC_QUERIES_PATH)) {
  const gscContent = fs.readFileSync(GSC_QUERIES_PATH, 'utf-8');
  const lines = gscContent.split('\n').filter(l => l.trim().length > 0);
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length >= 3) {
      const q = parts[0].trim().replace(/^"|"$/g, '').toLowerCase();
      const impressions = parts[2].trim();
      gscData.set(q, impressions);
    }
  }
  console.log(`Loaded ${gscData.size} queries from Google Search Console export.`);
}

// Approved Seeds (15 per category)
const CATEGORY_SEEDS = {
  dermatology: [
    'skin care products', 'acne treatment', 'medicated face wash', 'sunblock spf 50',
    'moisturizer for dry skin', 'brightening cream', 'anti-aging serum', 'eczema cream',
    'hair loss spray', 'medicated shampoo', 'topical skin cream', 'dermatologist recommended cream',
    'antifungal skin ointment', 'salicylic acid cleanser', 'melasma treatment'
  ],
  otc: [
    'over the counter medicines', 'pain relief tablets', 'fever medicine', 'panadol tablets',
    'cough syrup', 'flu and cold relief', 'digestive tablets', 'antacid syrup',
    'first aid supplies', 'allergy tablets', 'anti-diarrhea medicine', 'throat lozenges',
    'headache medicine', 'motion sickness tablets', 'antiseptic liquid'
  ],
  vitamins: [
    'multivitamins in pakistan', 'vitamin d3 supplements', 'calcium tablets', 'vitamin c tablets',
    'iron supplements', 'zinc tablets', 'daily energy vitamins', 'prenatal vitamins',
    'biotin for hair growth', 'vitamin b complex', 'fish oil capsules', 'immunity booster supplements',
    'men multivitamins', 'women multivitamins', 'chewable vitamin gummies'
  ],
  nutraceutical: [
    'dietary supplements pakistan', 'omega-3 fish oil', 'coenzyme q10', 'collagen powder',
    'joint care glucosamine', 'probiotics capsules', 'antioxidant supplements', 'liver support supplements',
    'amino acid supplements', 'sports nutrition supplements', 'memory booster supplements',
    'herbal extract capsules', 'heart health supplements', 'bone density formulas', 'wellness capsules'
  ],
  herbal: [
    'herbal medicines pakistan', 'gripe water', 'castor oil pure', 'johar joshanda',
    'natural cough syrup', 'digestive carminative syrup', 'ispaghol husk', 'herbal hair oil',
    'unani medicines', 'natural immunity boosters', 'herbal blood purifier', 'herbal liver tonic',
    'neem extract products', 'senna leaf tea', 'herbal pain relief oil'
  ],
  'diapers-napkins': [
    'baby diapers pakistan', 'pampers newborn', 'baby pant diapers', 'baby wet wipes',
    'adult diapers', 'incontinence underpads', 'sanitary pads for women', 'maxi thick pads',
    'overnight sanitary napkins', 'diaper rash cream', 'rash soothing powder', 'ultra thin sanitary pads',
    'pull up diapers', 'maternity pads', 'cotton baby wipes'
  ],
  'milk-powder': [
    'baby formula milk', 'infant formula stage 1', 'follow on formula stage 2', 'growing up formula stage 3',
    'powdered milk for babies', 'pediasure nutrition drink', 'lactogen milk powder', 'meiji infant milk',
    'hypoallergenic baby milk', 'adult nutritional milk', 'lactose free infant formula',
    'high protein nutritional powder', 'fortified milk powder', 'premature infant formula', 'cereal baby food'
  ],
  diagnostics: [
    'blood glucose monitor', 'sugar test strips', 'digital bp monitor', 'blood pressure apparatus',
    'digital thermometer', 'pulse oximeter', 'nebulizer machine', 'lancets and lancing device',
    'accuchek test strips', 'certeza bp apparatus', 'pregnancy test strip', 'uric acid test meter',
    'cholesterol test strips', 'infrared forehead thermometer', 'asthma spacer chamber'
  ],
  'patient-supports': [
    'orthopedic supports pakistan', 'knee brace support', 'lumbar back support belt',
    'cervical collar neck brace', 'ankle support brace', 'wrist splint', 'elbow support strap',
    'walking stick for elderly', 'compression stockings', 'post-surgery abdominal binder',
    'shoulder immobilizer sling', 'silicone heel cushions', 'posture corrector belt',
    'crutches for walking', 'tennis elbow brace'
  ],
  'surgical-items': [
    'surgical disposables pakistan', 'disposable syringes', 'latex examination gloves',
    'sterile gauze bandages', 'surgical cotton roll', 'adhesive surgical tape', 'cannula iv catheter',
    'surgical face masks', 'antiseptic dressings', 'paraffin gauze dressings', '3 way stopcock stopper',
    'surgical suture needles', 'sterile wound dressing pads', 'surgical scalpel blades', 'micropore surgical tape'
  ]
};

// Website-confirmed express delivery cities
const CONFIRMED_CITIES = [
  'lahore', 'karachi', 'islamabad', 'rawalpindi', 'faisalabad',
  'multan', 'peshawar', 'quetta', 'gujranwala', 'sahiwal'
];

// Unsafe words / safety filter
const UNSAFE_PATTERNS = [
  'without prescription', 'sleeping pills', 'narcotic', 'tramadol', 'xanax', 'valium',
  'diazepam', 'alprazolam', 'viagra', 'cialis', 'weight loss injection', 'ozempic',
  'abortion', 'misoprostol', 'steroid injection', 'morphine', 'codeine', 'antibiotic'
];

function isSafeQuery(kw) {
  const lower = kw.toLowerCase();
  if (lower.includes(',') || lower.includes(':') || lower.includes(';') || lower.includes('contains')) return false;
  if (lower.includes('each') || lower.includes('b.p.') || lower.includes('u.s.p.')) return false;
  if (lower.split(' ').length > 7) return false;
  if (lower.length < 3 || lower.length > 60) return false;
  for (const p of UNSAFE_PATTERNS) {
    if (lower.includes(p)) return false;
  }
  return true;
}

function escapeCsv(val) {
  if (!val) return '';
  const str = String(val).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function run() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const Category = mongoose.model('Category', new mongoose.Schema({ name: String, slug: String }), 'categories');
  const Product = mongoose.model('Product', new mongoose.Schema({
    name: String,
    slug: String,
    genericName: String,
    categoryIds: [mongoose.Schema.Types.ObjectId]
  }), 'products');

  const globalKeywordRegistry = new Map();
  const summaryReport = [];

  for (const [slug, seeds] of Object.entries(CATEGORY_SEEDS)) {
    const catDoc = await Category.findOne({ slug });
    if (!catDoc) continue;

    const prods = await Product.find({ categoryIds: catDoc._id }).select('name slug genericName').lean();
    console.log(`\nProcessing ${slug} (${prods.length} DB products)...`);

    const keywordRows = [];
    const seenKeywordsInCat = new Set();

    function addRow(kw, type, intent, cluster, target, priority, source, notes) {
      const normalized = kw.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ');
      if (!isSafeQuery(normalized)) return;
      if (seenKeywordsInCat.has(normalized)) return;
      if (globalKeywordRegistry.has(normalized)) return; // Strictly prevent duplicate cross-page assignment

      let volume = '';
      let finalSource = source;
      if (gscData.has(normalized)) {
        volume = `${gscData.get(normalized)} impr`;
        finalSource = 'search-console';
      }

      seenKeywordsInCat.add(normalized);
      globalKeywordRegistry.set(normalized, target);

      keywordRows.push({
        keyword: normalized,
        type,
        intent,
        cluster,
        assignedTarget: target,
        priority,
        volume,
        source: finalSource,
        notes
      });
    }

    const categoryTarget = `https://medikart.pk/categories/${slug}`;

    // 1. Approved Seeds with Modifiers
    for (const seed of seeds) {
      addRow(seed, 'informational', 'commercial-investigation', `${slug}-core`, categoryTarget, 'high', 'template', 'Approved seed term');
      addRow(`buy ${seed} online`, 'transactional', 'purchase', `${slug}-transactional`, categoryTarget, 'high', 'template', 'Core purchase intent');
      addRow(`${seed} price in pakistan`, 'transactional', 'price-check', `${slug}-pricing`, categoryTarget, 'high', 'template', 'Price check intent');
      addRow(`order ${seed} online pakistan`, 'transactional', 'purchase', `${slug}-transactional`, categoryTarget, 'medium', 'template', 'Online order');
      addRow(`${seed} cash on delivery`, 'transactional', 'purchase', `${slug}-cod`, categoryTarget, 'medium', 'template', 'COD intent');
      addRow(`best ${seed} in pakistan`, 'informational', 'comparison', `${slug}-comparison`, categoryTarget, 'medium', 'template', 'Best in class');
      addRow(`affordable ${seed}`, 'transactional', 'price-check', `${slug}-pricing`, categoryTarget, 'low', 'template', 'Affordable value');
      addRow(`${seed} home delivery`, 'transactional', 'purchase', `${slug}-delivery`, categoryTarget, 'medium', 'template', 'Delivery intent');

      // Local city modifiers (Confirmed cities)
      for (const city of CONFIRMED_CITIES.slice(0, 5)) {
        addRow(`${seed} in ${city}`, 'local', 'local-delivery', `${slug}-local-${city}`, categoryTarget, 'medium', 'template', `1-5 hr delivery in ${city}`);
      }

      // AEO / Question intent
      const faqTarget = `https://medikart.pk/categories/${slug}#faqs`;
      addRow(`what is ${seed}`, 'question', 'informational', `${slug}-aeo`, faqTarget, 'medium', 'template', 'AEO direct answer');
      addRow(`how to choose ${seed}`, 'question', 'informational', `${slug}-aeo`, faqTarget, 'medium', 'template', 'AEO selection guide');
      addRow(`how to use ${seed}`, 'question', 'informational', `${slug}-aeo`, faqTarget, 'medium', 'template', 'AEO usage guide');
      addRow(`is ${seed} available in pakistan`, 'question', 'commercial-investigation', `${slug}-aeo`, faqTarget, 'low', 'template', 'Availability question');
      addRow(`where to buy ${seed} in pakistan`, 'question', 'purchase', `${slug}-aeo`, faqTarget, 'medium', 'template', 'Vendor lookup');

      // Roman Urdu (~5%)
      addRow(`${seed} sasti`, 'roman-urdu', 'price-check', `${slug}-roman-urdu`, categoryTarget, 'low', 'template', 'Pakistani vernacular');
      addRow(`${seed} ki price kitni hai`, 'roman-urdu', 'price-check', `${slug}-roman-urdu`, faqTarget, 'low', 'template', 'Vernacular price query');
      addRow(`${seed} online mangwana`, 'roman-urdu', 'purchase', `${slug}-roman-urdu`, categoryTarget, 'low', 'template', 'Vernacular delivery query');
      addRow(`${seed} delivery timing`, 'roman-urdu', 'local-delivery', `${slug}-roman-urdu`, categoryTarget, 'low', 'template', 'Vernacular timing query');
    }

    // 2. Real Catalog Product Entities
    for (const prod of prods.slice(0, 90)) {
      if (!prod.name) continue;
      const cleanProdName = prod.name
        .replace(/\(.*?\)/g, '')
        .replace(/\b(1s|2s|10s|20s|30s|100s|ml|mg|gm|gm)\b/gi, '')
        .trim();

      if (!cleanProdName || cleanProdName.length < 3) continue;
      const prodTarget = `https://medikart.pk/products/${prod.slug || prod._id}`;

      addRow(cleanProdName, 'product', 'brand-search', `${slug}-product`, prodTarget, 'high', 'catalog', 'Direct catalog product');
      addRow(`buy ${cleanProdName} online`, 'transactional', 'purchase', `${slug}-product-transactional`, prodTarget, 'high', 'template', 'Product purchase intent');
      addRow(`${cleanProdName} price in pakistan`, 'transactional', 'price-check', `${slug}-product-pricing`, prodTarget, 'high', 'template', 'Product price lookup');
      addRow(`${cleanProdName} cash on delivery`, 'transactional', 'purchase', `${slug}-product-cod`, prodTarget, 'medium', 'template', 'Product COD');

      if (prod.genericName) {
        const cleanGeneric = prod.genericName
          .replace(/\(.*?\)/g, '')
          .replace(/[^\w\s-]/g, '')
          .trim();
        if (cleanGeneric && cleanGeneric.length >= 3 && cleanGeneric.split(' ').length <= 4) {
          addRow(cleanGeneric, 'brand', 'generic-search', `${slug}-generic`, categoryTarget, 'medium', 'catalog', 'Generic formulation');
          addRow(`${cleanGeneric} in pakistan`, 'informational', 'generic-search', `${slug}-generic`, categoryTarget, 'low', 'template', 'Generic availability');
        }
      }
    }

    // Write clean CSV
    const csvHeader = 'keyword,type,intent,cluster,assigned target,priority,volume,source,notes\n';
    const csvLines = keywordRows.map(r => [
      escapeCsv(r.keyword),
      escapeCsv(r.type),
      escapeCsv(r.intent),
      escapeCsv(r.cluster),
      escapeCsv(r.assignedTarget),
      escapeCsv(r.priority),
      escapeCsv(r.volume),
      escapeCsv(r.source),
      escapeCsv(r.notes)
    ].join(','));

    const filePath = path.join(OUTPUT_DIR, `${slug}.csv`);
    fs.writeFileSync(filePath, csvHeader + csvLines.join('\n'), 'utf-8');

    console.log(`  ✓ Generated keyword-bank/${slug}.csv: ${keywordRows.length} keywords`);

    summaryReport.push({
      slug,
      count: keywordRows.length,
      topKeywords: keywordRows.slice(0, 15).map(r => r.keyword),
      clusters: [...new Set(keywordRows.map(r => r.cluster))].slice(0, 6)
    });
  }

  await mongoose.disconnect();

  console.log('\n====================================================');
  console.log('KEYWORD BANK GENERATION COMPLETE');
  console.log('====================================================');
  for (const s of summaryReport) {
    console.log(`\n• Category: ${s.slug} | Total: ${s.count} keywords`);
    console.log(`  Clusters: ${s.clusters.join(', ')}`);
    console.log(`  Sample: ${s.topKeywords.slice(0, 5).join(' | ')}`);
  }
}

run().catch(console.error);
