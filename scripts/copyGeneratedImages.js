const fs = require('fs');
const path = require('path');

const brainDir = 'C:/Users/Mohsin/.gemini/antigravity/brain/a33608f3-311a-4631-95fb-b40fc54e2bdc';
const catDir = path.join(__dirname, '../apps/web/public/images/categories');
const condDir = path.join(__dirname, '../apps/web/public/images/conditions');

// 1. Copy the newly generated AI commercial studio photography images
const aiFiles = [
  { src: 'cat_medicines_1789831905653.jpg', dest: 'medicines.jpg' },
  { src: 'cat_vitamins_1789831927902.jpg', dest: 'vitamins.jpg' },
  { src: 'cat_milk_powder_1789831948968.jpg', dest: 'milk-powder.jpg' }
];

aiFiles.forEach(({ src, dest }) => {
  const srcPath = path.join(brainDir, src);
  const destPath = path.join(catDir, dest);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copied AI Studio image -> ${dest} (${fs.statSync(destPath).size} bytes)`);
  }
});
