const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

async function generateFavicons() {
  const iconPath = "D:/Projects/Medikart/apps/web/public/logo-icon.png";
  const iconBuffer = fs.readFileSync(iconPath);
  
  // Clean mascot resize
  const resizedMascot = await sharp(iconBuffer)
    .resize(300, 240, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const svgText = `
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <!-- Crisp White Background with soft rounded corners -->
    <rect width="512" height="512" rx="100" fill="#FFFFFF" />
    <rect x="8" y="8" width="496" height="496" rx="92" fill="none" stroke="#FFCB05" stroke-width="14" opacity="0.75" />
    
    <!-- Large, bold, high-contrast brand font -->
    <text x="256" y="435" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="78" font-weight="900" fill="#D97706" text-anchor="middle" letter-spacing="-0.01em">medikart</text>
  </svg>
  `;

  const bg = Buffer.from(svgText);
  const final512 = await sharp(bg)
    .composite([
      {
        input: resizedMascot,
        top: 60,
        left: 106,
      },
    ])
    .png()
    .toBuffer();

  // Save 512x512
  fs.writeFileSync("D:/Projects/Medikart/apps/web/app/icon.png", final512);
  fs.writeFileSync("D:/Projects/Medikart/apps/web/app/apple-icon.png", final512);
  fs.writeFileSync("D:/Projects/Medikart/apps/web/public/icon-512.png", final512);
  fs.writeFileSync("D:/Projects/Medikart/apps/web/public/logo-square.png", final512);

  // Save 192x192
  const final192 = await sharp(final512).resize(192, 192).png().toBuffer();
  fs.writeFileSync("D:/Projects/Medikart/apps/web/public/icon-192.png", final192);

  // Save 180x180
  const final180 = await sharp(final512).resize(180, 180).png().toBuffer();
  fs.writeFileSync("D:/Projects/Medikart/apps/web/public/apple-touch-icon.png", final180);

  // Save 32x32
  const final32 = await sharp(final512).resize(32, 32).png().toBuffer();
  fs.writeFileSync("D:/Projects/Medikart/apps/web/public/favicon-32x32.png", final32);
  fs.writeFileSync("D:/Projects/Medikart/apps/web/public/favicon.ico", final32);

  // Save 16x16
  const final16 = await sharp(final512).resize(16, 16).png().toBuffer();
  fs.writeFileSync("D:/Projects/Medikart/apps/web/public/favicon-16x16.png", final16);

  console.log("Successfully generated all favicon and app icons with prominent, large font!");
}

generateFavicons().catch((err) => {
  console.error("Favicon generation error:", err);
  process.exit(1);
});
