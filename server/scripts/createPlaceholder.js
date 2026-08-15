/**
 * Create Placeholder WebP Asset
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

async function createPlaceholder() {
  const dir = path.join(__dirname, "../uploads");
  fs.mkdirSync(dir, { recursive: true });
  const placeholderPath = path.join(dir, "placeholder.webp");

  const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f1f5f9"/>
    <text x="50%" y="45%" font-family="Arial, sans-serif" font-weight="bold" font-size="24" fill="#64748b" text-anchor="middle">Medikart</text>
    <text x="50%" y="58%" font-family="Arial, sans-serif" font-size="18" fill="#94a3b8" text-anchor="middle">No Product Image</text>
  </svg>`;

  await sharp(Buffer.from(svg))
    .webp({ quality: 80 })
    .toFile(placeholderPath);

  const stats = fs.statSync(placeholderPath);
  console.log(`✅ Created placeholder at ${placeholderPath} (${stats.size} bytes)`);
}

createPlaceholder().catch(console.error);
