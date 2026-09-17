const mongoose = require("mongoose");

const ContentBlockSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["heading", "paragraph", "table", "list", "faq", "callout", "disclaimer"],
      required: true,
    },
    level: {
      type: Number,
      default: 2,
    },
    text: {
      type: String,
      default: "",
    },
    items: {
      type: [String],
      default: [],
    },
    ordered: {
      type: Boolean,
      default: false,
    },
    tableData: {
      headers: { type: [String], default: [] },
      rows: { type: [[String]], default: [] },
    },
    faqItems: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
  },
  { _id: true }
);

const BlogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Blog slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    summary: {
      type: String,
      required: [true, "Blog summary is required"],
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      default: "",
    },
    bgImageUrl: {
      type: String,
      default: "",
    },
    contentBlocks: {
      type: [ContentBlockSchema],
      default: [],
    },
    content: {
      type: String,
      default: "",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    categoryName: {
      type: String,
      default: "General Health",
      trim: true,
    },
    categorySlug: {
      type: String,
      default: "general-health",
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    relatedProductTags: {
      type: [String],
      default: [],
    },
    relatedProductIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    author: {
      type: String,
      default: "Dr. Ayesha Siddiqui, Pediatrician (FCPS)",
      trim: true,
    },
    authorTitle: {
      type: String,
      default: "Licensed Clinician & Medical Reviewer",
      trim: true,
    },
    readTimeMinutes: {
      type: Number,
      default: 4,
    },
    metaTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

BlogSchema.index({ active: 1, publishedAt: -1 });
BlogSchema.index({ categorySlug: 1, active: 1 });
BlogSchema.index({ tags: 1 });

const Blog = mongoose.models.Blog || mongoose.model("Blog", BlogSchema);

module.exports = Blog;
