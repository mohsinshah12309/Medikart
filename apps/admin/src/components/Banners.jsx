import React, { useState, useEffect } from "react";
import { adminFetch } from "../apiClient";

export default function Banners({ token }) {

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterPlacement, setFilterPlacement] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    imageUrl: "",
    linkUrl: "",
    placement: "hero",
    displayOrder: 0,
    active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const flash = (msg, isError = false) => {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => {
      setError("");
      setSuccess("");
    }, 4000);
  };

  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adminFetch("/admin/banners");
      setBanners(data.data?.banners || []);
    } catch (err) {
      flash(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setFormData({
      title: "",
      subtitle: "",
      imageUrl: "/uploads/placeholder.webp",
      linkUrl: "/instant-order",
      placement: "hero",
      displayOrder: banners.length + 1,
      active: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (b) => {
    setEditingBanner(b);
    setFormData({
      title: b.title || "",
      subtitle: b.subtitle || "",
      imageUrl: b.imageUrl || "",
      linkUrl: b.linkUrl || "",
      placement: b.placement || "hero",
      displayOrder: b.displayOrder || 0,
      active: b.active !== false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.imageUrl.trim()) {
      flash("Title and Image URL are required.", true);
      return;
    }

    try {
      setSaving(true);
      const endpoint = editingBanner
        ? `/admin/banners/${editingBanner._id}`
        : `/admin/banners`;
      const method = editingBanner ? "PUT" : "POST";

      await adminFetch(endpoint, {
        method,
        body: JSON.stringify(formData),
      });

      flash(editingBanner ? "Banner updated successfully!" : "Banner created successfully!");
      setShowModal(false);
      fetchBanners();
    } catch (err) {
      flash(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (b) => {
    try {
      await adminFetch(`/admin/banners/${b._id}`, {
        method: "PUT",
        body: JSON.stringify({ active: !b.active }),
      });
      flash(`Banner "${b.title}" is now ${!b.active ? "Active" : "Disabled"}.`);
      fetchBanners();
    } catch (err) {
      flash(err.message, true);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete banner "${title}"?`)) return;
    try {
      await adminFetch(`/admin/banners/${id}`, { method: "DELETE" });
      flash("Banner deleted successfully!");
      fetchBanners();
    } catch (err) {
      flash(err.message, true);
    }
  };

  const filteredBanners = banners.filter((b) => {
    if (filterPlacement !== "all" && b.placement !== filterPlacement) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = b.title && b.title.toLowerCase().includes(q);
      const matchSubtitle = b.subtitle && b.subtitle.toLowerCase().includes(q);
      const matchLink = b.linkUrl && b.linkUrl.toLowerCase().includes(q);
      return matchTitle || matchSubtitle || matchLink;
    }
    return true;
  });

  return (
    <div className="section-container">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>
            🖼️ Homepage Banners
          </h1>
          <p style={{ color: "#64748b", margin: "0.25rem 0 0 0", fontSize: "0.9rem" }}>
            Manage hero rotating carousel and mid-page promotional banners without code deploys.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleOpenCreate}
          style={{ background: "#eab308", color: "#0f172a", fontWeight: "bold" }}
        >
          + Add New Banner
        </button>
      </div>

      {/* Notifications */}
      {error && <div className="alert alert-danger" style={{ marginBottom: "1rem" }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: "1rem" }}>{success}</div>}

      {/* Search & Filter Toolbar */}
      <div
        className="card"
        style={{
          padding: "0.85rem 1.25rem",
          marginBottom: "1.25rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", flex: 1 }}>
          <div style={{ position: "relative", minWidth: "220px", flex: 1, maxWidth: "360px" }}>
            <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem", color: "#64748b" }}>🔍</span>
            <input
              type="text"
              placeholder="Search banner title, subtitle, link..."
              className="form-control"
              style={{ width: "100%", margin: 0, padding: "0.45rem 2rem 0.45rem 2.2rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{ position: "absolute", right: "0.6rem", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.8rem" }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Placement Tabs */}
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
            {[
              { key: "all", label: "All Banners" },
              { key: "hero", label: "Hero Carousel" },
              { key: "mid-page", label: "Mid-Page Promo" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterPlacement(tab.key)}
                style={{
                  padding: "0.35rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  background: filterPlacement === tab.key ? "#0f172a" : "#ffffff",
                  color: filterPlacement === tab.key ? "#ffffff" : "#475569",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>
          Showing <strong style={{ color: "#0f172a" }}>{filteredBanners.length}</strong> of {banners.length} banners
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>Loading banners...</div>
      ) : filteredBanners.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
          <p style={{ color: "#64748b", fontWeight: 500 }}>
            {searchQuery || filterPlacement !== "all"
              ? "No banners match the active search/filter."
              : "No banners found. Click '+ Add New Banner' to create one."}
          </p>
        </div>
      ) : (
        <div className="table-responsive" style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <table className="table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "0.75rem 1rem" }}>Order</th>
                <th style={{ padding: "0.75rem 1rem" }}>Title & Subtitle</th>
                <th style={{ padding: "0.75rem 1rem" }}>Placement</th>
                <th style={{ padding: "0.75rem 1rem" }}>Target Link</th>
                <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBanners.map((b) => (
                <tr key={b._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: "bold" }}>#{b.displayOrder}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ fontWeight: 600, color: "#0f172a" }}>{b.title}</div>
                    <div style={{ color: "#64748b", fontSize: "0.8rem" }}>{b.subtitle}</div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span
                      style={{
                        padding: "0.2rem 0.6rem",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background: b.placement === "hero" ? "#fef3c7" : "#e0e7ff",
                        color: b.placement === "hero" ? "#92400e" : "#3730a3",
                      }}
                    >
                      {b.placement === "hero" ? "Hero Carousel" : "Mid-Page Promo"}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "#0284c7" }}>
                    {b.linkUrl || "—"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(b)}
                      style={{
                        padding: "0.25rem 0.6rem",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                        background: b.active ? "#dcfce7" : "#fee2e2",
                        color: b.active ? "#166534" : "#991b1b",
                      }}
                    >
                      {b.active ? "✓ Active" : "✕ Disabled"}
                    </button>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", marginRight: "0.4rem" }}
                      onClick={() => handleOpenEdit(b)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                      onClick={() => handleDelete(b._id, b.title)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div className="modal-card" style={{ background: "white", borderRadius: "16px", padding: "1.5rem", maxWidth: "540px", width: "100%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: "0 0 1rem 0" }}>
              {editingBanner ? "Edit Banner" : "Create New Homepage Banner"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  Banner Title *
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. 100% Genuine Certified Medicines"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  Subtitle / Description
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g. Fast delivery across Pakistan with verified pharmacy care"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div className="form-group">
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Placement
                  </label>
                  <select
                    className="form-control"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    value={formData.placement}
                    onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                  >
                    <option value="hero">Hero Carousel (Top)</option>
                    <option value="mid-page">Mid-Page Promo (Middle)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Display Order (1, 2, 3...)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  Target Link URL
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  placeholder="e.g. /instant-order or /#catalog"
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  Image URL / Asset Path *
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1", marginBottom: "0.5rem" }}
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="/banners/hero-1.jpg or https://..."
                  required
                />

                {/* Preset Banner Selectors */}
                <div style={{ marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Or Pick High-Quality Preset:</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.25rem" }}>
                    {[
                      { label: "Hero 1: Pharmacist", url: "/banners/hero-1.jpg", type: "hero" },
                      { label: "Hero 2: Family Wellness", url: "/banners/hero-2.jpg", type: "hero" },
                      { label: "Hero 3: Skincare", url: "/banners/hero-3.jpg", type: "hero" },
                      { label: "Hero 4: Express Delivery", url: "/banners/hero-4.jpg", type: "hero" },
                      { label: "Mid 1: Care Essentials", url: "/banners/mid-promo-1.jpg", type: "mid-page" },
                      { label: "Mid 2: Mega Savings", url: "/banners/mid-promo-2.jpg", type: "mid-page" },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: preset.url, placement: preset.type })}
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          border: "1px solid #cbd5e1",
                          background: formData.imageUrl === preset.url ? "#eab308" : "#f1f5f9",
                          color: formData.imageUrl === preset.url ? "#0f172a" : "#475569",
                          cursor: "pointer",
                          fontWeight: formData.imageUrl === preset.url ? 700 : 500,
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Image Preview */}
                {formData.imageUrl && (
                  <div style={{ marginTop: "0.5rem", padding: "0.5rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>Live Image Preview:</div>
                    <img
                      src={formData.imageUrl}
                      alt="Banner Preview"
                      style={{ maxHeight: "110px", maxWidth: "100%", borderRadius: "6px", objectFit: "cover" }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                <input
                  type="checkbox"
                  id="activeToggle"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  style={{ width: "16px", height: "16px" }}
                />
                <label htmlFor="activeToggle" style={{ fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                  Active & Visible on Storefront
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: "#eab308", color: "#0f172a", fontWeight: "bold" }}
                  disabled={saving}
                >
                  {saving ? "Saving..." : editingBanner ? "Save Changes" : "Create Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
