const fs = require("fs");
const path = require("path");
const Blog = require("./blog.model");
const Category = require("../categories/category.model");
const Product = require("../products/product.model");
const { generateBrandedBlogThumbnail } = require("./blogThumbnail.service");

/**
 * Creates a slug from a string.
 */
function slugify(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Ensures unique slug in database.
 */
async function getUniqueSlug(title, existingId = null) {
  let baseSlug = slugify(title);
  if (!baseSlug) baseSlug = "blog-" + Date.now();
  let uniqueSlug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug: uniqueSlug };
    if (existingId) {
      query._id = { $ne: existingId };
    }
    const found = await Blog.findOne(query).select("_id").lean();
    if (!found) break;
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }
  return uniqueSlug;
}

/**
 * Finds related products for a blog post based on relatedProductTags, category, or title keywords.
 */
async function getRelatedProductsForBlog(blog) {
  const queryOr = [];

  if (blog.relatedProductIds && blog.relatedProductIds.length > 0) {
    queryOr.push({ _id: { $in: blog.relatedProductIds } });
  }

  if (blog.relatedProductTags && blog.relatedProductTags.length > 0) {
    const tagRegexes = blog.relatedProductTags.map((t) => new RegExp(t.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "i"));
    queryOr.push({ name: { $in: tagRegexes } });
    queryOr.push({ genericName: { $in: tagRegexes } });
    queryOr.push({ tags: { $in: tagRegexes } });
  }

  if (blog.category) {
    queryOr.push({ categoryIds: blog.category });
  }

  const query = {
    active: true,
    ...(queryOr.length > 0 ? { $or: queryOr } : {}),
  };

  const products = await Product.find(query)
    .select("name price discountPercent coverImage images stock stockStatus isNarcotic genericName categoryIds")
    .limit(4)
    .lean();

  return products.map((p) => {
    const effectivePrice = p.discountPercent > 0 ? Math.round(p.price * (1 - p.discountPercent / 100)) : p.price;
    return {
      ...p,
      effectivePrice,
    };
  });
}

/**
 * Creates a new blog post and auto-generates branded thumbnail if needed.
 */
async function createBlog(data) {
  const slug = data.slug ? slugify(data.slug) : await getUniqueSlug(data.title);

  // Link Category if category ID or name is provided
  let categoryDoc = null;
  if (data.category) {
    categoryDoc = await Category.findById(data.category).lean();
  } else if (data.categorySlug) {
    categoryDoc = await Category.findOne({ slug: data.categorySlug, active: true }).lean();
  }

  const categoryName = categoryDoc ? categoryDoc.name : data.categoryName || "General Health";
  const categorySlug = categoryDoc ? categoryDoc.slug : slugify(categoryName);
  const categoryId = categoryDoc ? categoryDoc._id : null;

  // Auto-generate branded thumbnail
  let thumbnailUrl = data.thumbnailUrl;
  if (!thumbnailUrl) {
    try {
      const genResult = await generateBrandedBlogThumbnail({
        title: data.title,
        slug,
        category: categoryName,
        author: data.author,
        readTime: data.readTimeMinutes ? `${data.readTimeMinutes} min read` : "4 min read",
        bgImage: data.bgImageUrl || null,
        useAiImage: Boolean(data.useAiImage),
      });
      thumbnailUrl = genResult.thumbnailUrl;
    } catch (err) {
      console.warn("[BlogService] Automatic thumbnail generation skipped:", err.message);
    }
  }

  const blog = new Blog({
    ...data,
    slug,
    category: categoryId,
    categoryName,
    categorySlug,
    thumbnailUrl,
  });

  return await blog.save();
}

/**
 * Updates an existing blog and regenerates thumbnail if title or background changed.
 */
async function updateBlog(id, data) {
  const blog = await Blog.findById(id);
  if (!blog) return null;

  let newSlug = blog.slug;
  if (data.slug && data.slug !== blog.slug) {
    newSlug = await getUniqueSlug(data.slug, id);
  } else if (data.title && data.title !== blog.title && !data.slug) {
    newSlug = await getUniqueSlug(data.title, id);
  }

  const titleChanged = Boolean(data.title && data.title !== blog.title);
  const bgChanged = Boolean(data.bgImageUrl && data.bgImageUrl !== blog.bgImageUrl);
  const shouldRegenThumbnail = Boolean(data.regenerateThumbnail || (titleChanged && !data.thumbnailUrl) || (bgChanged && !data.thumbnailUrl));

  let thumbnailUrl = data.thumbnailUrl || blog.thumbnailUrl;
  if (shouldRegenThumbnail) {
    try {
      const genResult = await generateBrandedBlogThumbnail({
        title: data.title || blog.title,
        slug: newSlug,
        category: data.categoryName || blog.categoryName,
        author: data.author || blog.author,
        readTime: (data.readTimeMinutes || blog.readTimeMinutes) ? `${data.readTimeMinutes || blog.readTimeMinutes} min read` : "4 min read",
        bgImage: data.bgImageUrl || blog.bgImageUrl || null,
        useAiImage: Boolean(data.useAiImage),
      });
      thumbnailUrl = genResult.thumbnailUrl;
    } catch (err) {
      console.warn("[BlogService] Update thumbnail generation skipped:", err.message);
    }
  }

  Object.assign(blog, data, {
    slug: newSlug,
    thumbnailUrl,
  });

  return await blog.save();
}

/**
 * Seeds initial blog dataset if MongoDB collection is empty.
 */
async function seedInitialBlogsIfEmpty() {
  try {
    const count = await Blog.countDocuments();
    if (count > 0) return;

    // Load static blogs data from apps/web
    const blogsDataPath = path.resolve(__dirname, "../../../../apps/web/data/blogsData.js");
    if (!fs.existsSync(blogsDataPath)) return;

    const fileContent = fs.readFileSync(blogsDataPath, "utf8");
    // Extract array JSON from export const BLOGS_DATA = [...]
    const match = fileContent.match(/export\s+const\s+BLOGS_DATA\s*=\s*(\[[\s\S]*?\]);/);
    if (!match) return;

    const rawData = eval(match[1]);
    console.log(`[BlogService] Seeding ${rawData.length} initial healthcare blogs into MongoDB...`);

    for (const item of rawData) {
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

      await Blog.create({
        title: item.title,
        slug: item.slug,
        summary: item.summary,
        thumbnailUrl: item.image,
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
      });
    }

    console.log("[BlogService] Initial blogs seeded successfully.");
  } catch (err) {
    console.warn("[BlogService] Seed initial blogs error:", err.message);
  }
}

module.exports = {
  createBlog,
  updateBlog,
  getUniqueSlug,
  getRelatedProductsForBlog,
  seedInitialBlogsIfEmpty,
};
