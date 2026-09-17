/**
 * blogs.test.js
 * 
 * Test suite for Medikart Blog Content System:
 *  1. Blog CRUD, Slugification & Collision Resistance
 *  2. Branded 1200x630 Thumbnail Generation with Sharp & SVG
 *  3. AI-Assisted Structured Content Generation (contentBlocks schema validation)
 *  4. Storefront Endpoints (/api/v1/blogs, /api/v1/blogs/:slug with related categories & products)
 */

jest.setTimeout(60000);

require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });

const mongoose = require("mongoose");
const request = require("supertest");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const app = require("../../src/app");
const Blog = require("../../src/modules/blogs/blog.model");
const Category = require("../../src/modules/categories/category.model");
const Product = require("../../src/modules/products/product.model");
const AdminUser = require("../../src/modules/admin-users/adminUser.model");
const { generateBrandedBlogThumbnail } = require("../../src/modules/blogs/blogThumbnail.service");
const { generateStructuredBlogContent, generateStructuredBlogFallback } = require("../../src/modules/blogs/blogAi.service");
const jwt = require("jsonwebtoken");

let superAdminToken;
let testCategory;
let testProduct;

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || "mongodb://localhost:27017/medikart_test";
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // Create super admin for admin endpoint tests
  let admin = await AdminUser.findOne({ role: "super_admin", active: true }).lean();
  if (!admin) {
    admin = await AdminUser.create({
      name: "Blog Super Admin Test",
      email: "blogs_superadmin@medikart.test",
      role: "super_admin",
      permissions: ["products", "orders", "pharmacies", "reports", "settings"],
      passwordHash: "dummy-hash",
      active: true,
    });
  }

  superAdminToken = jwt.sign(
    { sub: admin._id.toString(), role: "super_admin", email: admin.email },
    process.env.JWT_SECRET || "default_jwt_secret_for_test",
    { expiresIn: "2h" }
  );

  // Create test category and test product for related-product queries
  testCategory = await Category.create({
    name: "Pediatric Care Test",
    slug: "pediatric-care-test-" + Date.now(),
    active: true,
  });

  testProduct = await Product.create({
    name: "Baby Multivitamin Drops 30ml",
    genericName: "Multivitamin Pediatric",
    sku: "SKU-PED-TEST-" + Date.now(),
    slug: "baby-multivitamin-drops-" + Date.now(),
    price: 450,
    discountPercent: 10,
    categoryIds: [testCategory._id],
    tags: ["pediatric", "infant", "vitamins", "baby"],
    active: true,
    stock: 50,
  });
});

afterAll(async () => {
  if (testCategory) await Category.findByIdAndDelete(testCategory._id);
  if (testProduct) await Product.findByIdAndDelete(testProduct._id);
  await Blog.deleteMany({ title: /Test Blog/i });
  await mongoose.disconnect();
});

describe("1. Blog CRUD & Unique Slug Generation", () => {
  let createdBlogId;

  it("should create a blog post via admin API and auto-generate unique slug", async () => {
    const res = await request(app)
      .post("/api/v1/admin/blogs")
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({
        title: "Test Blog: Essential Infant Nutrition Guidelines",
        summary: "A test clinical summary on infant feeding.",
        category: testCategory._id,
        categoryName: "Pediatric Care Test",
        author: "Dr. Ayesha Siddiqui (FCPS)",
        tags: ["infant", "nutrition", "baby"],
        relatedProductTags: ["vitamins", "pediatric"],
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data.blog).toBeDefined();
    expect(res.body.data.blog.slug).toContain("test-blog-essential-infant-nutrition-guidelines");
    expect(res.body.data.blog.thumbnailUrl).toMatch(/\/uploads\/blogs\/banner-/);

    createdBlogId = res.body.data.blog._id;
  });

  it("should generate a suffixed slug if another blog has the same title", async () => {
    const res = await request(app)
      .post("/api/v1/admin/blogs")
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({
        title: "Test Blog: Essential Infant Nutrition Guidelines",
        summary: "Second post with duplicate title.",
        categoryName: "Pediatric Care Test",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.blog.slug).toMatch(/test-blog-essential-infant-nutrition-guidelines-\d+/);
    await Blog.findByIdAndDelete(res.body.data.blog._id);
  });

  it("should fetch the blog by ID via admin API", async () => {
    const res = await request(app)
      .get(`/api/v1/admin/blogs/${createdBlogId}`)
      .set("Authorization", `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.blog._id).toBe(createdBlogId);
  });

  it("should update blog and regenerate thumbnail if requested", async () => {
    const res = await request(app)
      .put(`/api/v1/admin/blogs/${createdBlogId}`)
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({
        title: "Test Blog: Updated Pediatric Care Protocol",
        regenerateThumbnail: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.blog.title).toBe("Test Blog: Updated Pediatric Care Protocol");
    expect(res.body.data.blog.slug).toContain("test-blog-updated-pediatric-care-protocol");
  });
});

describe("2. Branded 1200x630 Thumbnail Generation", () => {
  it("should generate an image file with exact 1200x630 dimensions", async () => {
    const result = await generateBrandedBlogThumbnail({
      title: "Baby Food Chart: 2 Years Toddler Meals & Portions",
      slug: "test-thumbnail-slug",
      category: "Baby Nutrition",
      author: "Dr. Mahnoor Tariq",
      readTime: "5 min read",
    });

    expect(result.thumbnailUrl).toBeDefined();
    expect(fs.existsSync(result.localPath)).toBe(true);

    const metadata = await sharp(result.localPath).metadata();
    expect(metadata.width).toBe(1200);
    expect(metadata.height).toBe(630);
    expect(metadata.format).toBe("webp");

    // Clean up test file
    try {
      fs.unlinkSync(result.localPath);
    } catch (_) {}
  });
});

describe("3. AI-Assisted Structured Content Generation", () => {
  it("should return valid structured contentBlocks with headings, tables, FAQ, and medical disclaimer", async () => {
    const generated = await generateStructuredBlogContent({
      topic: "Safe Teething Remedies for Infants in Pakistan",
      notes: "Explain silicone teether rings vs unsafe lidocaine gels",
      category: "Baby & Child Care",
    });

    expect(generated.title).toBeDefined();
    expect(generated.summary).toBeDefined();
    expect(Array.isArray(generated.contentBlocks)).toBe(true);

    // Verify structured block types
    const types = generated.contentBlocks.map((b) => b.type);
    expect(types).toContain("paragraph");
    expect(types).toContain("heading");
    expect(types).toContain("table");
    expect(types).toContain("faq");
    expect(types).toContain("disclaimer");

    // Verify table structure
    const tableBlock = generated.contentBlocks.find((b) => b.type === "table");
    expect(tableBlock.tableData.headers.length).toBeGreaterThan(0);
    expect(tableBlock.tableData.rows.length).toBeGreaterThan(0);

    // Verify FAQ structure
    const faqBlock = generated.contentBlocks.find((b) => b.type === "faq");
    expect(faqBlock.faqItems.length).toBeGreaterThan(0);
    expect(faqBlock.faqItems[0].question).toBeDefined();
    expect(faqBlock.faqItems[0].answer).toBeDefined();
  });
});

describe("4. Storefront Endpoints & Related Products / Categories", () => {
  let testBlogSlug;

  beforeAll(async () => {
    const blog = await Blog.create({
      title: "Test Blog: Winter Pediatric Health Tips",
      slug: "test-blog-winter-pediatric-health-tips-" + Date.now(),
      summary: "Protecting toddlers from cold and flu.",
      category: testCategory._id,
      categoryName: "Pediatric Care Test",
      categorySlug: testCategory.slug,
      tags: ["winter", "pediatric", "infant"],
      relatedProductTags: ["vitamins", "pediatric"],
      contentBlocks: [
        { type: "paragraph", text: "Winter health tips for kids." },
      ],
      active: true,
      publishedAt: new Date(),
    });
    testBlogSlug = blog.slug;
  });

  it("should list active blogs via GET /api/v1/blogs", async () => {
    const res = await request(app).get("/api/v1/blogs?limit=5");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(Array.isArray(res.body.data.blogs)).toBe(true);
  });

  it("should retrieve single blog with relatedCategories and relatedProducts via GET /api/v1/blogs/:slug", async () => {
    const res = await request(app).get(`/api/v1/blogs/${testBlogSlug}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.blog.slug).toBe(testBlogSlug);

    // Related Categories
    expect(Array.isArray(res.body.data.relatedCategories)).toBe(true);

    // Related Products (should match testProduct)
    expect(Array.isArray(res.body.data.relatedProducts)).toBe(true);
    expect(res.body.data.relatedProducts.length).toBeGreaterThan(0);
    expect(res.body.data.relatedProducts[0].name).toContain("Multivitamin");
  });
});
