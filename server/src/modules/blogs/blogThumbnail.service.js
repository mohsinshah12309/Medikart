const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const axios = require("axios");
const { getApiKey } = require("../../config/geminiClient");

const UPLOADS_DIR = path.resolve(__dirname, "../../../uploads/blogs");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const PRESET_BACKGROUNDS = [
  "baby-food-toddler.jpg",
  "baby-weight-chart.jpg",
  "cough-cold-flu.jpg",
  "diabetes-management.jpg",
  "digestive-health.jpg",
  "family-wellness.jpg",
  "hair-growth.jpg",
  "heart-bp-care.jpg",
  "heatwave-hydration-ors.jpg",
  "infant-formula-nutrition.jpg",
  "joints-mobility.jpg",
  "medicine-safety-antibiotics.jpg",
  "otc-first-aid.jpg",
  "pharmacist-guidance.jpg",
  "skincare-dermatology.jpg",
  "vitamins-immunity.jpg",
];

/**
 * Escapes XML special characters for SVG text.
 */
function escapeXml(unsafe) {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Word wraps title string into lines of maxChars length.
 */
function wrapText(text, maxChars = 24, maxLines = 4) {
  const words = (text || "").split(/\s+/);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= maxChars) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines - 1) break;
    }
  }
  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  // If there were remaining words that exceeded maxLines, add ellipsis to last line
  if (lines.length === maxLines && words.length > lines.join(" ").split(" ").length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\.*$/, "") + "...";
  }

  return lines;
}

/**
 * Resolves a background image buffer from local file, upload path, or preset.
 */
async function resolveBackgroundBuffer(bgImagePathOrUrl, title = "", category = "") {
  // If a URL or file path was given
  if (bgImagePathOrUrl) {
    // 1. Direct absolute or relative filesystem path
    if (fs.existsSync(bgImagePathOrUrl)) {
      return fs.readFileSync(bgImagePathOrUrl);
    }
    // 2. Relative to server uploads
    const serverUploadPath = path.resolve(__dirname, "../../../", bgImagePathOrUrl.replace(/^\//, ""));
    if (fs.existsSync(serverUploadPath)) {
      return fs.readFileSync(serverUploadPath);
    }
    // 3. Relative to web public images
    const webPublicPath = path.resolve(__dirname, "../../../../apps/web/public", bgImagePathOrUrl.replace(/^\//, ""));
    if (fs.existsSync(webPublicPath)) {
      return fs.readFileSync(webPublicPath);
    }
    // 4. Remote HTTP URL
    if (bgImagePathOrUrl.startsWith("http://") || bgImagePathOrUrl.startsWith("https://")) {
      try {
        const response = await axios.get(bgImagePathOrUrl, { responseType: "arraybuffer", timeout: 8000 });
        return Buffer.from(response.data);
      } catch (err) {
        console.warn("[ThumbnailService] Failed to download remote background image:", err.message);
      }
    }
  }

  // Fallback: match an existing preset based on category / title keywords
  const lower = (category + " " + title).toLowerCase();
  let matchedPreset = "family-wellness.jpg";

  if (lower.includes("baby") || lower.includes("infant") || lower.includes("toddler") || lower.includes("formula")) {
    matchedPreset = lower.includes("weight") ? "baby-weight-chart.jpg" : "baby-food-toddler.jpg";
  } else if (lower.includes("diabet") || lower.includes("sugar") || lower.includes("insulin")) {
    matchedPreset = "diabetes-management.jpg";
  } else if (lower.includes("heart") || lower.includes("bp") || lower.includes("pressure") || lower.includes("cardio")) {
    matchedPreset = "heart-bp-care.jpg";
  } else if (lower.includes("skin") || lower.includes("sunscreen") || lower.includes("dermatology") || lower.includes("acne")) {
    matchedPreset = "skincare-dermatology.jpg";
  } else if (lower.includes("cough") || lower.includes("cold") || lower.includes("flu") || lower.includes("smog")) {
    matchedPreset = "cough-cold-flu.jpg";
  } else if (lower.includes("vitamin") || lower.includes("supplement") || lower.includes("immunity")) {
    matchedPreset = "vitamins-immunity.jpg";
  } else if (lower.includes("joint") || lower.includes("bone") || lower.includes("arthritis") || lower.includes("mobility")) {
    matchedPreset = "joints-mobility.jpg";
  } else if (lower.includes("stomach") || lower.includes("digest") || lower.includes("gut") || lower.includes("gerd")) {
    matchedPreset = "digestive-health.jpg";
  } else if (lower.includes("heat") || lower.includes("dehydration") || lower.includes("ors")) {
    matchedPreset = "heatwave-hydration-ors.jpg";
  }

  const presetPath = path.resolve(__dirname, "../../../../apps/web/public/images/blogs", matchedPreset);
  if (fs.existsSync(presetPath)) {
    return fs.readFileSync(presetPath);
  }

  // Create clean solid slate backdrop if no image file exists
  return await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 },
    },
  })
    .jpeg()
    .toBuffer();
}

/**
 * Attempts to generate a background image using Google Gemini / Imagen API if configured.
 */
async function generateAiBackgroundImage(title, category = "") {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const prompt = `Professional clean clinical photography representing "${title}" in the context of "${category || "healthcare and pharmacy in Pakistan"}". Authentic medical atmosphere, soft warm studio lighting, 8k resolution, photorealistic, no text.`;
    
    // Call Google Imagen 3 API endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
    const payload = {
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: "16:9",
        outputMimeType: "image/jpeg",
      },
    };

    const res = await axios.post(url, payload, { timeout: 25000 });
    const b64 = res.data?.predictions?.[0]?.bytesBase64Encoded;
    if (b64) {
      return Buffer.from(b64, "base64");
    }
  } catch (err) {
    console.warn("[ThumbnailService] Gemini Imagen generation skipped or failed:", err.response?.data?.error?.message || err.message);
  }
  return null;
}

/**
 * Generates a 1200x630 branded Medikart blog banner thumbnail.
 *
 * @param {Object} params
 * @param {string} params.title - Blog post title
 * @param {string} params.slug - Blog slug
 * @param {string} [params.category] - Category name
 * @param {string} [params.author] - Author name
 * @param {string} [params.readTime] - e.g. "4 min read"
 * @param {string|Buffer} [params.bgImage] - Background image path, URL, or buffer
 * @param {boolean} [params.useAiImage] - Whether to attempt AI image generation
 * @returns {Promise<{ thumbnailUrl: string, localPath: string }>}
 */
async function generateBrandedBlogThumbnail({
  title,
  slug,
  category = "Healthcare Guide",
  author = "Dr. Ayesha Siddiqui (FCPS)",
  readTime = "4 min read",
  bgImage = null,
  useAiImage = false,
}) {
  const safeSlug = (slug || "blog-" + Date.now()).toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  const filename = `banner-${safeSlug}-${Date.now()}.webp`;
  const outputPath = path.join(UPLOADS_DIR, filename);

  // 1. Obtain Background Buffer
  let bgBuffer = null;
  if (useAiImage) {
    bgBuffer = await generateAiBackgroundImage(title, category);
  }
  if (!bgBuffer) {
    bgBuffer = await resolveBackgroundBuffer(bgImage, title, category);
  }

  // 2. Resize background to 1200x630
  const resizedBg = await sharp(bgBuffer)
    .resize(1200, 630, { fit: "cover", position: "center" })
    .toBuffer();

  // 3. Save clean full-bleed 1200x630 webp thumbnail (no diagonal sidebar overlay)
  const finalImageBuffer = await sharp(resizedBg)
    .webp({ quality: 90 })
    .toBuffer();

  fs.writeFileSync(outputPath, finalImageBuffer);

  const relativeUrl = `/uploads/blogs/${filename}`;
  return {
    thumbnailUrl: relativeUrl,
    localPath: outputPath,
  };
}

module.exports = {
  generateBrandedBlogThumbnail,
  resolveBackgroundBuffer,
  generateAiBackgroundImage,
  PRESET_BACKGROUNDS,
};
