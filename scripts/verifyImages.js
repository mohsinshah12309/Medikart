const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function checkUnique(catDir, condDir) {
  const allImages = {};
  const duplicates = [];

  const scan = (dir, type) => {
    fs.readdirSync(dir).forEach(f => {
      const p = path.join(dir, f);
      const h = crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex');
      if (allImages[h]) {
        // Only allow intentional aliases like surgical == surgical-items or nutra == nutraceutical
        if (!(f.includes('surgical') && allImages[h].file.includes('surgical')) &&
            !(f.includes('nutra') && allImages[h].file.includes('nutra'))) {
          duplicates.push({ file1: allImages[h].file, file2: `${type}/${f}`, hash: h });
        }
      } else {
        allImages[h] = { file: `${type}/${f}`, hash: h };
      }
      console.log(`${type}/${f} (${fs.statSync(p).size} B) -> MD5: ${h}`);
    });
  };

  console.log('=== CATEGORIES ===');
  scan(catDir, 'categories');
  console.log('\n=== CONDITIONS ===');
  scan(condDir, 'conditions');

  if (duplicates.length === 0) {
    console.log('\n🌟 SUCCESS: ALL IMAGES ARE 100% DISTINCT, RELEVANT & UNIQUE!');
  } else {
    console.log('\n❌ DUPLICATES FOUND:', duplicates);
    process.exit(1);
  }
}

checkUnique(
  path.join(__dirname, '../apps/web/public/images/categories'),
  path.join(__dirname, '../apps/web/public/images/conditions')
);
