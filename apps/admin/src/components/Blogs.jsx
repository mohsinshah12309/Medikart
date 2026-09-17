import React, { useState, useEffect } from "react";
import { adminFetch } from "../apiClient";

const PRESET_BG_OPTIONS = [
  { label: "Baby & Toddler Food", value: "/images/blogs/baby-food-toddler.jpg" },
  { label: "Baby Weight & Growth", value: "/images/blogs/baby-weight-chart.jpg" },
  { label: "Infant Formula & Milk", value: "/images/blogs/infant-formula-nutrition.jpg" },
  { label: "Diabetes & Sugar Care", value: "/images/blogs/diabetes-management.jpg" },
  { label: "Heart & BP Care", value: "/images/blogs/heart-bp-care.jpg" },
  { label: "Cough, Cold & Smog", value: "/images/blogs/cough-cold-flu.jpg" },
  { label: "Digestive & Gut Health", value: "/images/blogs/digestive-health.jpg" },
  { label: "Skincare & Dermatology", value: "/images/blogs/skincare-dermatology.jpg" },
  { label: "Vitamins & Immunity", value: "/images/blogs/vitamins-immunity.jpg" },
  { label: "Joints & Bone Pain", value: "/images/blogs/joints-mobility.jpg" },
  { label: "Heatwave & Hydration ORS", value: "/images/blogs/heatwave-hydration-ors.jpg" },
  { label: "Medicine Safety & Antibiotics", value: "/images/blogs/medicine-safety-antibiotics.jpg" },
  { label: "Family Wellness", value: "/images/blogs/family-wellness.jpg" },
];

export default function Blogs({ token }) {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Modal / Drawer States
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [saving, setSaving] = useState(false);

  // AI Generator Modal States
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiNotes, setAiNotes] = useState("");
  const [aiCategory, setAiCategory] = useState("");
  const [generatingAi, setGeneratingAi] = useState(false);

  // Thumbnail Generator State
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    summary: "",
    categoryName: "Baby & Child Nutrition",
    author: "Dr. Ayesha Siddiqui, Pediatrician (FCPS)",
    authorTitle: "Licensed Clinician & Medical Reviewer",
    readTimeMinutes: 4,
    bgImageUrl: "/images/blogs/baby-food-toddler.jpg",
    thumbnailUrl: "",
    tags: "",
    relatedProductTags: "",
    contentBlocks: [],
    active: true,
  });

  const flash = (msg, isError = false) => {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => {
      setError("");
      setSuccess("");
    }, 4000);
  };

  useEffect(() => {
    fetchBlogs();
    fetchCategories();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adminFetch("/admin/blogs?limit=100");
      setBlogs(data.data?.blogs || []);
    } catch (err) {
      flash(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await adminFetch("/admin/categories");
      setCategories(data.data?.categories || []);
    } catch (_) {}
  };

  const handleOpenCreate = () => {
    setEditingBlog(null);
    setFormData({
      title: "",
      slug: "",
      summary: "",
      categoryName: categories[0]?.name || "Baby & Child Nutrition",
      author: "Dr. Ayesha Siddiqui, Pediatrician (FCPS)",
      authorTitle: "Licensed Clinician & Medical Reviewer",
      readTimeMinutes: 4,
      bgImageUrl: "/images/blogs/baby-food-toddler.jpg",
      thumbnailUrl: "",
      tags: "Infant Care, Nutrition, Pediatric Guide",
      relatedProductTags: "formula, baby milk, multivitamins",
      contentBlocks: [
        { type: "paragraph", text: "Write the introduction of your clinical article here..." },
        { type: "heading", level: 2, text: "Clinical Guidelines & Overview" },
        { type: "paragraph", text: "Detail the evidence-based advice for Pakistani caregivers..." },
        {
          type: "table",
          text: "Recommended Milestones & Guidelines",
          tableData: {
            headers: ["Age / Stage", "Nutritional Requirement", "Recommended Diet", "Notes / Precautions"],
            rows: [
              ["Stage 1: 0-6 Months", "Exclusive milk feeds", "Breast milk or D-Reg Formula", "On demand"],
              ["Stage 2: 6-12 Months", "Textured purees & iron", "Khichdi, mashed apple, lentils", "2-3 meals daily"],
            ],
          },
        },
        {
          type: "callout",
          text: "Licensed Pharmacist Advisory: Always check DRAP registration numbers and tamper seals prior to administering medicines.",
        },
        { type: "heading", level: 2, text: "Frequently Asked Questions" },
        {
          type: "faq",
          faqItems: [
            { question: "When should weaning begin?", answer: "Pediatric guidelines recommend introducing soft solids at 6 months." },
          ],
        },
        {
          type: "disclaimer",
          text: "Medical Disclaimer: This article is for educational purposes only and does not substitute professional medical advice. Always consult a registered clinician or licensed pharmacist in Pakistan.",
        },
      ],
      active: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (b) => {
    setEditingBlog(b);
    setFormData({
      title: b.title || "",
      slug: b.slug || "",
      summary: b.summary || "",
      categoryName: b.categoryName || "General Health",
      author: b.author || "Dr. Ayesha Siddiqui, Pediatrician (FCPS)",
      authorTitle: b.authorTitle || "Licensed Clinician & Medical Reviewer",
      readTimeMinutes: b.readTimeMinutes || 4,
      bgImageUrl: b.bgImageUrl || "/images/blogs/family-wellness.jpg",
      thumbnailUrl: b.thumbnailUrl || "",
      tags: Array.isArray(b.tags) ? b.tags.join(", ") : "",
      relatedProductTags: Array.isArray(b.relatedProductTags) ? b.relatedProductTags.join(", ") : "",
      contentBlocks: b.contentBlocks && b.contentBlocks.length > 0 ? b.contentBlocks : [
        { type: "paragraph", text: b.content || "" },
      ],
      active: b.active !== false,
    });
    setShowModal(true);
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: !editingBlog ? val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") : prev.slug,
    }));
  };

  // Thumbnail preview generation
  const handleGenerateThumbnail = async () => {
    if (!formData.title) {
      flash("Please enter a blog title first.", true);
      return;
    }
    try {
      setGeneratingThumbnail(true);
      const res = await adminFetch("/admin/blogs/generate-thumbnail", {
        method: "POST",
        body: JSON.stringify({
          title: formData.title,
          slug: formData.slug || "preview",
          category: formData.categoryName,
          author: formData.author,
          readTime: `${formData.readTimeMinutes} min read`,
          bgImage: formData.bgImageUrl,
        }),
      });
      if (res.data?.thumbnailUrl) {
        setFormData((prev) => ({ ...prev, thumbnailUrl: res.data.thumbnailUrl }));
        flash("Branded 1200x630 banner generated successfully!");
      }
    } catch (err) {
      flash("Failed to generate thumbnail: " + err.message, true);
    } finally {
      setGeneratingThumbnail(false);
    }
  };

  // AI Content Assistant
  const handleGenerateAiContent = async () => {
    if (!aiTopic.trim()) {
      flash("Please enter a topic for the AI assistant.", true);
      return;
    }
    try {
      setGeneratingAi(true);
      const res = await adminFetch("/admin/blogs/generate-content", {
        method: "POST",
        body: JSON.stringify({
          topic: aiTopic,
          notes: aiNotes,
          category: aiCategory || formData.categoryName,
        }),
      });

      if (res.data) {
        const generated = res.data;
        setFormData((prev) => ({
          ...prev,
          title: generated.title || prev.title,
          slug: (generated.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
          summary: generated.summary || prev.summary,
          categoryName: generated.categoryName || prev.categoryName,
          author: generated.author || prev.author,
          readTimeMinutes: generated.readTimeMinutes || 4,
          tags: Array.isArray(generated.tags) ? generated.tags.join(", ") : prev.tags,
          relatedProductTags: Array.isArray(generated.relatedProductTags) ? generated.relatedProductTags.join(", ") : prev.relatedProductTags,
          contentBlocks: Array.isArray(generated.contentBlocks) ? generated.contentBlocks : prev.contentBlocks,
        }));
        setShowAiModal(false);
        flash("AI structured content generated and applied! You can now review and edit before saving.");
      }
    } catch (err) {
      flash("AI generation failed: " + err.message, true);
    } finally {
      setGeneratingAi(false);
    }
  };

  // Content block manipulation helpers
  const handleAddBlock = (type) => {
    let newBlock = { type };
    if (type === "paragraph" || type === "callout" || type === "disclaimer") {
      newBlock.text = "";
    } else if (type === "heading") {
      newBlock.level = 2;
      newBlock.text = "";
    } else if (type === "table") {
      newBlock.text = "Comparison Table";
      newBlock.tableData = {
        headers: ["Column 1", "Column 2", "Column 3"],
        rows: [["Item A", "Detail 1", "Note 1"]],
      };
    } else if (type === "faq") {
      newBlock.faqItems = [{ question: "Question here?", answer: "Answer here." }];
    }

    setFormData((prev) => ({
      ...prev,
      contentBlocks: [...prev.contentBlocks, newBlock],
    }));
  };

  const handleRemoveBlock = (index) => {
    setFormData((prev) => ({
      ...prev,
      contentBlocks: prev.contentBlocks.filter((_, i) => i !== index),
    }));
  };

  const handleMoveBlock = (index, direction) => {
    const blocks = [...formData.contentBlocks];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    const temp = blocks[index];
    blocks[index] = blocks[targetIdx];
    blocks[targetIdx] = temp;
    setFormData((prev) => ({ ...prev, contentBlocks: blocks }));
  };

  const handleBlockChange = (index, field, value) => {
    const blocks = [...formData.contentBlocks];
    blocks[index] = { ...blocks[index], [field]: value };
    setFormData((prev) => ({ ...prev, contentBlocks: blocks }));
  };

  // Submit Handler
  const handleSaveBlog = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.summary) {
      flash("Title and summary are required.", true);
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: formData.title,
        slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        summary: formData.summary,
        categoryName: formData.categoryName,
        categorySlug: formData.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        author: formData.author,
        authorTitle: formData.authorTitle,
        readTimeMinutes: Number(formData.readTimeMinutes) || 4,
        bgImageUrl: formData.bgImageUrl,
        thumbnailUrl: formData.thumbnailUrl,
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        relatedProductTags: formData.relatedProductTags.split(",").map((t) => t.trim()).filter(Boolean),
        contentBlocks: formData.contentBlocks,
        active: formData.active,
      };

      if (editingBlog) {
        await adminFetch(`/admin/blogs/${editingBlog._id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        flash("Blog article updated successfully!");
      } else {
        await adminFetch("/admin/blogs", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        flash("New blog article published successfully!");
      }

      setShowModal(false);
      fetchBlogs();
    } catch (err) {
      flash(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlog = async (b) => {
    if (!window.confirm(`Are you sure you want to delete "${b.title}"?`)) return;
    try {
      await adminFetch(`/admin/blogs/${b._id}`, { method: "DELETE" });
      flash("Blog article deleted successfully.");
      fetchBlogs();
    } catch (err) {
      flash(err.message, true);
    }
  };

  const filteredBlogs = blogs.filter((b) => {
    const matchesCat = selectedCategory === "all" || b.categorySlug === selectedCategory || b.categoryName === selectedCategory;
    const matchesSearch = !search || b.title.toLowerCase().includes(search.toLowerCase()) || (b.author && b.author.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1280px", margin: "0 auto" }}>
      {/* ── Header Toolbar ── */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0F172A", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>📰</span> Health Blogs &amp; Articles
          </h2>
          <p style={{ color: "#64748B", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
            Auto-branded 1200x630 thumbnails, AI structured writer &amp; related product store tie-ins.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              setAiTopic("");
              setAiNotes("");
              setShowAiModal(true);
            }}
            style={{
              padding: "0.6rem 1.2rem",
              background: "linear-gradient(135deg, #10B981, #059669)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "10px",
              fontWeight: 800,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              boxShadow: "0 2px 6px rgba(16, 185, 129, 0.25)",
            }}
          >
            <span>✨</span> AI Generate Blog
          </button>

          <button
            onClick={handleOpenCreate}
            style={{
              padding: "0.6rem 1.2rem",
              background: "linear-gradient(135deg, #FFCB05, #F59E0B)",
              color: "#0F172A",
              border: "none",
              borderRadius: "10px",
              fontWeight: 800,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              boxShadow: "0 2px 6px rgba(245, 158, 11, 0.25)",
            }}
          >
            <span>➕</span> New Blog Article
          </button>
        </div>
      </div>

      {/* ── Flash Notifications ── */}
      {error && (
        <div style={{ padding: "0.75rem 1rem", background: "#FEE2E2", color: "#991B1B", border: "1px solid #F87171", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.875rem", fontWeight: 700 }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div style={{ padding: "0.75rem 1rem", background: "#DCFCE7", color: "#166534", border: "1px solid #4ADE80", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.875rem", fontWeight: 700 }}>
          ✓ {success}
        </div>
      )}

      {/* ── Search & Filter Bar ── */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", background: "#FFFFFF", padding: "1rem", borderRadius: "12px", border: "1px solid #E2E8F0", marginBottom: "1.5rem" }}>
        <input
          type="text"
          placeholder="Search articles by title or clinician..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: "1 1 240px", padding: "0.55rem 0.9rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.875rem", outline: "none" }}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: "0.55rem 0.9rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.875rem", outline: "none", background: "#FFFFFF" }}
        >
          <option value="all">All Categories ({blogs.length})</option>
          {Array.from(new Set(blogs.map((b) => b.categoryName).filter(Boolean))).map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* ── Blogs List Grid ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748B" }}>Loading blog articles...</div>
      ) : filteredBlogs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", color: "#64748B" }}>
          No blog articles found. Click "➕ New Blog Article" or "✨ AI Generate Blog" to get started!
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.25rem" }}>
          {filteredBlogs.map((b) => {
            const thumb = b.thumbnailUrl || "/images/blogs/family-wellness.jpg";
            return (
              <div
                key={b._id}
                style={{
                  background: "#FFFFFF",
                  borderRadius: "14px",
                  border: "1px solid #E2E8F0",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  {/* Thumbnail Preview Banner */}
                  <div style={{ position: "relative", height: "160px", background: "#0F172A", overflow: "hidden" }}>
                    <img
                      src={thumb}
                      alt={b.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.src = "/images/blogs/family-wellness.jpg";
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        top: "10px",
                        left: "10px",
                        background: "#FFCB05",
                        color: "#0F172A",
                        fontSize: "0.7rem",
                        fontWeight: 900,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        textTransform: "uppercase",
                      }}
                    >
                      {b.categoryName || "Health"}
                    </span>
                    <span
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        background: b.active ? "#10B981" : "#EF4444",
                        color: "#FFFFFF",
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        padding: "2px 7px",
                        borderRadius: "6px",
                      }}
                    >
                      {b.active ? "Published" : "Draft"}
                    </span>
                  </div>

                  {/* Body Info */}
                  <div style={{ padding: "1rem" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0F172A", margin: "0 0 0.4rem", lineHeight: 1.3 }}>
                      {b.title}
                    </h3>
                    <p style={{ fontSize: "0.8rem", color: "#64748B", margin: 0, lineClamp: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {b.summary}
                    </p>
                    <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "#94A3B8", fontWeight: 600, display: "flex", justifyContent: "space-between" }}>
                      <span>✍️ {b.author ? b.author.split(",")[0] : "Clinician"}</span>
                      <span>⏱️ {b.readTimeMinutes || 4} min read</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div style={{ padding: "0.75rem 1rem", background: "#F8FAFC", borderTop: "1px solid #E2E8F0", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => handleOpenEdit(b)}
                    style={{ padding: "0.4rem 0.8rem", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteBlog(b)}
                    style={{ padding: "0.4rem 0.8rem", background: "#FEE2E2", color: "#991B1B", border: "1px solid #F87171", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE / EDIT BLOG MODAL DRAWER ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "2rem 1rem", overflowY: "auto" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", maxWidth: "860px", width: "100%", padding: "1.75rem", border: "1px solid #E2E8F0", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid #E2E8F0" }}>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 900, color: "#0F172A" }}>
                {editingBlog ? "✏️ Edit Blog Article" : "➕ Create New Blog Article"}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#64748B" }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBlog}>
              {/* Row 1: Title & Slug */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#334155", marginBottom: "0.3rem" }}>
                    Blog Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={handleTitleChange}
                    placeholder="e.g. Baby Food Chart: 2 Years Toddler Meals"
                    style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.9rem", fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#334155", marginBottom: "0.3rem" }}>
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.85rem" }}
                  />
                </div>
              </div>

              {/* Row 2: Category & Author */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#334155", marginBottom: "0.3rem" }}>
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.categoryName}
                    onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                    placeholder="e.g. Baby & Child Nutrition"
                    style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.85rem" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#334155", marginBottom: "0.3rem" }}>
                    Author &amp; Credentials
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.85rem" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#334155", marginBottom: "0.3rem" }}>
                    Read Time
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.readTimeMinutes}
                    onChange={(e) => setFormData({ ...formData, readTimeMinutes: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.85rem" }}
                  />
                </div>
              </div>

              {/* Summary */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#334155", marginBottom: "0.3rem" }}>
                  Clinical Summary (1-2 Key Takeaway Sentences) *
                </label>
                <textarea
                  rows="2"
                  required
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Summary shown in cards and key takeaways callout..."
                  style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.85rem" }}
                />
              </div>

              {/* Row 3: Branded Thumbnail Generator Panel */}
              <div style={{ background: "#FEF9C3", padding: "1rem", borderRadius: "12px", border: "1px solid #FDE047", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 800, color: "#854D0E" }}>
                    🎨 Branded 1200x630 Banner Thumbnail (Dvago-Style Diagonal Yellow)
                  </h4>
                  <button
                    type="button"
                    onClick={handleGenerateThumbnail}
                    disabled={generatingThumbnail}
                    style={{ padding: "0.4rem 0.9rem", background: "#0F172A", color: "#FFCB05", border: "none", borderRadius: "6px", fontWeight: 800, fontSize: "0.75rem", cursor: "pointer" }}
                  >
                    {generatingThumbnail ? "Generating..." : "⚡ Generate / Refresh Banner"}
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1rem", alignItems: "center" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "#713F12", marginBottom: "0.25rem" }}>
                      Select Base Photo
                    </label>
                    <select
                      value={formData.bgImageUrl}
                      onChange={(e) => setFormData({ ...formData, bgImageUrl: e.target.value })}
                      style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #FACC15", fontSize: "0.8rem", background: "#FFFFFF", marginBottom: "0.5rem" }}
                    >
                      {PRESET_BG_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Or custom background image URL..."
                      value={formData.bgImageUrl}
                      onChange={(e) => setFormData({ ...formData, bgImageUrl: e.target.value })}
                      style={{ width: "100%", padding: "0.45rem", borderRadius: "6px", border: "1px solid #FACC15", fontSize: "0.75rem", background: "#FFFFFF" }}
                    />
                  </div>

                  {/* Thumbnail Live Preview */}
                  <div style={{ height: "110px", background: "#0F172A", borderRadius: "8px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #CA8A04" }}>
                    {formData.thumbnailUrl ? (
                      <img src={formData.thumbnailUrl} alt="Thumbnail preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "#FDE68A", textAlign: "center", padding: "0.5rem" }}>
                        Click "Generate Banner" to preview 1200x630 branded image
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 4: Related Products & Tags */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#334155", marginBottom: "0.3rem" }}>
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="Baby Care, Nutrition, Pediatric"
                    style={{ width: "100%", padding: "0.55rem 0.8rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.85rem" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#334155", marginBottom: "0.3rem" }}>
                    Related Product Search Tags (Storefront Tie-In)
                  </label>
                  <input
                    type="text"
                    value={formData.relatedProductTags}
                    onChange={(e) => setFormData({ ...formData, relatedProductTags: e.target.value })}
                    placeholder="formula, lactogen, cerelac, panadol"
                    style={{ width: "100%", padding: "0.55rem 0.8rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.85rem" }}
                  />
                </div>
              </div>

              {/* Structured Content Blocks Editor */}
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 900, color: "#0F172A" }}>
                    📑 Structured Content Blocks ({formData.contentBlocks.length})
                  </label>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    <button type="button" onClick={() => handleAddBlock("paragraph")} style={{ padding: "0.3rem 0.6rem", background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>
                      + Paragraph
                    </button>
                    <button type="button" onClick={() => handleAddBlock("heading")} style={{ padding: "0.3rem 0.6rem", background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>
                      + Heading (H2)
                    </button>
                    <button type="button" onClick={() => handleAddBlock("table")} style={{ padding: "0.3rem 0.6rem", background: "#FEF3C7", color: "#92400E", border: "1px solid #FCD34D", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>
                      + Comparison Table
                    </button>
                    <button type="button" onClick={() => handleAddBlock("faq")} style={{ padding: "0.3rem 0.6rem", background: "#ECFDF5", color: "#065F46", border: "1px solid #A7F3D0", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>
                      + FAQ
                    </button>
                    <button type="button" onClick={() => handleAddBlock("callout")} style={{ padding: "0.3rem 0.6rem", background: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>
                      + Pharmacist Callout
                    </button>
                  </div>
                </div>

                {/* Blocks List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "400px", overflowY: "auto", paddingRight: "0.5rem" }}>
                  {formData.contentBlocks.map((block, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: block.type === "table" ? "#FFFBEB" : block.type === "faq" ? "#F0FDF4" : "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        borderRadius: "10px",
                        padding: "0.75rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "#475569" }}>
                          Block #{idx + 1} &bull; {block.type}
                        </span>
                        <div style={{ display: "flex", gap: "0.3rem" }}>
                          <button type="button" onClick={() => handleMoveBlock(idx, -1)} disabled={idx === 0} style={{ padding: "0.2rem 0.4rem", fontSize: "0.7rem", cursor: "pointer" }}>
                            ▲
                          </button>
                          <button type="button" onClick={() => handleMoveBlock(idx, 1)} disabled={idx === formData.contentBlocks.length - 1} style={{ padding: "0.2rem 0.4rem", fontSize: "0.7rem", cursor: "pointer" }}>
                            ▼
                          </button>
                          <button type="button" onClick={() => handleRemoveBlock(idx)} style={{ padding: "0.2rem 0.4rem", fontSize: "0.7rem", background: "#FEE2E2", color: "#991B1B", border: "1px solid #F87171", borderRadius: "4px", cursor: "pointer" }}>
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Heading Block */}
                      {block.type === "heading" && (
                        <input
                          type="text"
                          value={block.text || ""}
                          onChange={(e) => handleBlockChange(idx, "text", e.target.value)}
                          placeholder="Heading text..."
                          style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.9rem", fontWeight: 800 }}
                        />
                      )}

                      {/* Paragraph / Callout / Disclaimer Block */}
                      {(block.type === "paragraph" || block.type === "callout" || block.type === "disclaimer") && (
                        <textarea
                          rows="3"
                          value={block.text || ""}
                          onChange={(e) => handleBlockChange(idx, "text", e.target.value)}
                          placeholder={`${block.type} content...`}
                          style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.85rem" }}
                        />
                      )}

                      {/* Table Block */}
                      {block.type === "table" && (
                        <div>
                          <input
                            type="text"
                            value={block.text || ""}
                            onChange={(e) => handleBlockChange(idx, "text", e.target.value)}
                            placeholder="Table caption/title..."
                            style={{ width: "100%", padding: "0.4rem", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.5rem" }}
                          />
                          <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                            Headers: {block.tableData?.headers?.join(" | ")}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "0.25rem" }}>
                            Rows: {block.tableData?.rows?.length || 0} data row(s) configured
                          </div>
                        </div>
                      )}

                      {/* FAQ Block */}
                      {block.type === "faq" && (
                        <div>
                          {block.faqItems?.map((faq, fIdx) => (
                            <div key={fIdx} style={{ marginBottom: "0.5rem", padding: "0.5rem", background: "#FFFFFF", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                              <input
                                type="text"
                                value={faq.question}
                                onChange={(e) => {
                                  const items = [...block.faqItems];
                                  items[fIdx].question = e.target.value;
                                  handleBlockChange(idx, "faqItems", items);
                                }}
                                placeholder="FAQ Question?"
                                style={{ width: "100%", padding: "0.4rem", borderRadius: "4px", border: "1px solid #CBD5E1", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}
                              />
                              <textarea
                                rows="2"
                                value={faq.answer}
                                onChange={(e) => {
                                  const items = [...block.faqItems];
                                  items[fIdx].answer = e.target.value;
                                  handleBlockChange(idx, "faqItems", items);
                                }}
                                placeholder="FAQ Answer..."
                                style={{ width: "100%", padding: "0.4rem", borderRadius: "4px", border: "1px solid #CBD5E1", fontSize: "0.8rem" }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit / Cancel Footer */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1rem", borderTop: "1px solid #E2E8F0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  <span>Publish live on storefront</span>
                </label>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ padding: "0.6rem 1.2rem", background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: "8px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: "0.6rem 1.5rem",
                      background: "linear-gradient(135deg, #FFCB05, #F59E0B)",
                      color: "#0F172A",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 900,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(245, 158, 11, 0.3)",
                    }}
                  >
                    {saving ? "Saving..." : editingBlog ? "Update Article" : "Publish Article"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── AI CONTENT GENERATOR MODAL ── */}
      {showAiModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(5px)", display: "flex", justifyContent: "center", alignItems: "center", padding: "1rem" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "16px", maxWidth: "560px", width: "100%", padding: "1.75rem", border: "1px solid #E2E8F0", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, color: "#0F172A", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>✨</span> AI Structured Blog Assistant
              </h3>
              <button onClick={() => setShowAiModal(false)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748B" }}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: "0.85rem", color: "#64748B", margin: "0 0 1rem" }}>
              Enter a clinical topic or raw notes. Google Gemini will draft a structured article complete with headings, tables, FAQs, and medical disclaimers for your review.
            </p>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#334155", marginBottom: "0.3rem" }}>
                Topic / Subject *
              </label>
              <input
                type="text"
                placeholder="e.g. How to Choose Infant Formula in Pakistan: Stage 1, 2 & 3"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.9rem" }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#334155", marginBottom: "0.3rem" }}>
                Category
              </label>
              <input
                type="text"
                placeholder="e.g. Baby & Child Nutrition"
                value={aiCategory}
                onChange={(e) => setAiCategory(e.target.value)}
                style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.85rem" }}
              />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#334155", marginBottom: "0.3rem" }}>
                Key Points / Notes (Optional)
              </label>
              <textarea
                rows="3"
                placeholder="e.g. Compare whey vs casein ratio, explain boiling water to 70C, DRAP registration warning..."
                value={aiNotes}
                onChange={(e) => setAiNotes(e.target.value)}
                style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.85rem" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                style={{ padding: "0.6rem 1.2rem", background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: "8px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateAiContent}
                disabled={generatingAi}
                style={{
                  padding: "0.6rem 1.5rem",
                  background: "linear-gradient(135deg, #10B981, #059669)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 900,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(16, 185, 129, 0.3)",
                }}
              >
                {generatingAi ? "Generating Draft..." : "✨ Generate Article Draft"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
