const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const fs = require("fs");
const mongoose = require("mongoose");
const Blog = require("../src/modules/blogs/blog.model");
const { generateBrandedBlogThumbnail } = require("../src/modules/blogs/blogThumbnail.service");
const { BLOGS_DATA } = require("../../apps/web/data/blogsData");

async function run() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/medikart_dev";
  console.log("Connecting to MongoDB:", mongoUri);
  await mongoose.connect(mongoUri);

  console.log(`Processing ${BLOGS_DATA.length} blogs to generate unique branded thumbnails...`);

  for (let i = 0; i < BLOGS_DATA.length; i++) {
    const item = BLOGS_DATA[i];
    console.log(`[${i + 1}/${BLOGS_DATA.length}] Generating unique banner for: "${item.title}"`);

    try {
      const genResult = await generateBrandedBlogThumbnail({
        title: item.title,
        slug: item.slug,
        category: item.category,
        author: item.author,
        readTime: item.readTime || "4 min read",
        bgImage: item.image,
      });

      const contentBlocks = [
        {
          type: "paragraph",
          text: item.content,
        },
        {
          type: "heading",
          level: 2,
          text: "Doctor & Pharmacist Guidance for Pakistani Families",
        },
        {
          type: "paragraph",
          text: "Healthcare management in Pakistan requires balancing cultural lifestyle habits with modern evidence-based clinical protocols. Whether preparing meals, administering pediatric formulations, or taking chronic daily prescription therapies, consistency and patient education are the most effective tools for preventing acute complications.",
        },
        {
          type: "callout",
          text: "Licensed Pharmacist Advisory: Always inspect medicine packaging for DRAP registration numbers (D-Reg), lot numbers, and intact tamper seals. If symptoms persist beyond 48 hours or you observe high fever, dyspnea, or severe pain, consult your physician immediately.",
        },
        {
          type: "disclaimer",
          text: "Medical Disclaimer: The information provided in this article is for educational purposes only and does not substitute for professional medical advice, clinical diagnosis, or treatment. Always seek the advice of a qualified healthcare provider or licensed pharmacist regarding any medical condition or prescription regimen in Pakistan.",
        },
      ];

      await Blog.findOneAndUpdate(
        { slug: item.slug },
        {
          title: item.title,
          slug: item.slug,
          summary: item.summary,
          thumbnailUrl: genResult.thumbnailUrl,
          bgImageUrl: item.image,
          categoryName: item.category,
          categorySlug: item.categorySlug,
          author: item.author,
          readTimeMinutes: parseInt(item.readTime) || 4,
          tags: item.tags || [],
          relatedProductTags: (item.tags || []).map((t) => t.toLowerCase()),
          contentBlocks,
          content: item.content,
          active: true,
          publishedAt: new Date(item.date || Date.now()),
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.error(`Failed to generate thumbnail for ${item.slug}:`, err.message);
    }
  }

  console.log("All 60 blog thumbnails generated and synchronized in MongoDB successfully!");
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Batch thumbnail script error:", err);
  process.exit(1);
});
