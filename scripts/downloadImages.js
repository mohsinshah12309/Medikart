const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Curated list of high-quality, distinctive Unsplash photos specifically tailored for each category and condition
const CATEGORY_IMAGES = {
  'medicines': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&h=400&q=85', // Authentic blister packs & capsules
  'vitamins': 'https://images.unsplash.com/photo-1577401239170-897942555fb3?auto=format&fit=crop&w=400&h=400&q=85', // Amber vitamin bottle with golden softgels
  'milk-powder': 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=400&h=400&q=85', // Baby nutrition formula tin & measuring scoop
  'herbal': 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=400&h=400&q=85', // Mortar pestle with green medicinal herbs & organic extracts
  'flat-items': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=400&h=400&q=85', // Sterile medical gauze bandages, wound dressings & surgical tape
  'consumer': 'https://images.unsplash.com/photo-1583947581924-860bda6a26df?auto=format&fit=crop&w=400&h=400&q=85', // Personal hygiene hand wash, sanitizer & daily consumer care
  'fridge-items': 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&h=400&q=85', // Cold-chain refrigerated insulin vials & temperature sensitive medicine
  'surgical-items': 'https://images.unsplash.com/photo-1583912267670-6575ad472688?auto=format&fit=crop&w=400&h=400&q=85', // Surgical instruments, stainless steel scissors & sterile gloves
  'surgical': 'https://images.unsplash.com/photo-1583912267670-6575ad472688?auto=format&fit=crop&w=400&h=400&q=85',
  'dermatology': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&h=400&q=85', // Dermatological skincare serum bottle & clinical cosmetics
  'diagnostics': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=400&h=400&q=85', // Digital blood pressure monitor, stethoscope & diagnostics
  'diapers-napkins': 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=400&h=400&q=85', // Baby diapers package & wipes
  'patient-supports': 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=400&h=400&q=85', // Orthopedic support brace & compression wrap
  'general-items': 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=400&h=400&q=85', // First aid kit, antiseptic and cotton rolls
  'beverages': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&h=400&q=85', // Electrolyte hydration drink & citrus wellness
  'nutraceutical': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=400&h=400&q=85', // Herbal wellness supplement capsules
  'nutraceuticals': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=400&h=400&q=85',
  'nutra': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=400&h=400&q=85',
  'otc': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&h=400&q=85', // Over the counter medicines & remedies
  'surgical-furniture': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&h=400&q=85' // Hospital bed & clinic furniture
};

const CONDITION_IMAGES = {
  'acne-and-skin-care': 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=400&h=400&q=85', // Clear skin serum & skincare tube
  'pain-and-body-aches': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&h=400&q=85', // Muscular therapy & pain relief balm
  'sleep-disorders': 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=400&h=400&q=85', // Lavender herbal sleep tea & relaxation
  'digestive-health': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=400&h=400&q=85', // Probiotics & soothing gut digestive care
  'diabetes-care': 'https://images.unsplash.com/photo-1508847154043-be5407fcaa5a?auto=format&fit=crop&w=400&h=400&q=85', // Glucometer & blood glucose test kit
  'hair-fall': 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=400&h=400&q=85', // Scalp serum dropper & hair wellness
  'cough-and-cold': 'https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&w=400&h=400&q=85', // Cough syrup, honey lemon & vapor relief
  'bones-and-joints-pain': 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=400&h=400&q=85', // Bone joints mobility & calcium support
  'heart-care': 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=400&h=400&q=85' // Heart stethoscope & cardiovascular care
};

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error('Failed with status ' + res.statusCode + ' for ' + url));
      }
      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close(() => resolve(destPath));
      });
    }).on('error', reject);
  });
}

async function run() {
  const catDir = path.join(__dirname, '../apps/web/public/images/categories');
  const condDir = path.join(__dirname, '../apps/web/public/images/conditions');

  if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });
  if (!fs.existsSync(condDir)) fs.mkdirSync(condDir, { recursive: true });

  console.log('--- Downloading Category images ---');
  for (const [key, url] of Object.entries(CATEGORY_IMAGES)) {
    const dest = path.join(catDir, `${key}.jpg`);
    try {
      await downloadImage(url, dest);
      console.log(`✅ Category [${key}] downloaded (${fs.statSync(dest).size} bytes)`);
    } catch (err) {
      console.error(`❌ Category [${key}] error:`, err.message);
    }
  }

  console.log('--- Downloading Condition images ---');
  for (const [key, url] of Object.entries(CONDITION_IMAGES)) {
    const dest = path.join(condDir, `${key}.jpg`);
    try {
      await downloadImage(url, dest);
      console.log(`✅ Condition [${key}] downloaded (${fs.statSync(dest).size} bytes)`);
    } catch (err) {
      console.error(`❌ Condition [${key}] error:`, err.message);
    }
  }
}

run();
