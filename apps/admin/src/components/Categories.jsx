import React, { useState, useEffect } from "react";
import { adminFetch } from "../apiClient";

function Categories({ token }) {

  // List State
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'active' | 'disabled'
  const [filterNarcotic, setFilterNarcotic] = useState("all"); // 'all' | 'narcotic' | 'standard'

  // Modals Visibility
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

  // Selected Category
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Form States — Category Create/Edit
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    isNarcotic: false,
    active: true,
  });

  // Form States — Discount
  const [discountData, setDiscountData] = useState({
    value: 0,
    active: false,
  });
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adminFetch("/admin/categories?limit=100");
      setCategories(data.data.categories || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setEditId(null);
    setFormData({
      name: "",
      slug: "",
      isNarcotic: false,
      active: true,
    });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditModal = (category) => {
    setIsEditMode(true);
    setEditId(category._id);
    setFormData({
      name: category.name || "",
      slug: category.slug || "",
      isNarcotic: !!category.isNarcotic,
      active: !!category.active,
    });
    setIsCategoryModalOpen(true);
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // remove invalid chars
      .replace(/\s+/g, "-") // replace spaces with hyphens
      .replace(/-+/g, "-"); // merge multiple hyphens

    setFormData((prev) => ({
      ...prev,
      name,
      // Auto-generate slug only if not in edit mode (or let user edit it)
      slug: isEditMode ? prev.slug : slug,
    }));
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      isNarcotic: formData.isNarcotic,
      active: formData.active,
    };

    try {
      setSaving(true);
      const endpoint = isEditMode
        ? `/admin/categories/${editId}`
        : `/admin/categories`;
      const method = isEditMode ? "PUT" : "POST";

      await adminFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      setSuccessMsg(`Category successfully ${isEditMode ? "updated" : "created"}!`);
      setIsCategoryModalOpen(false);
      fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    setError("");
    setSuccessMsg("");

    try {
      await adminFetch(`/admin/categories/${id}`, { method: "DELETE" });
      setSuccessMsg("Category deleted successfully.");
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenDiscountModal = (category) => {
    setSelectedCategory(category);
    setDiscountData({
      value: category.discount?.value || 0,
      active: !!category.discount?.active,
    });
    setIsDiscountModalOpen(true);
  };

  const handleDiscountSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    try {
      setSaving(true);
      await adminFetch(`/admin/categories/${selectedCategory._id}/discount`, {
        method: "PATCH",
        body: JSON.stringify({
          value: parseFloat(discountData.value),
          active: discountData.active,
        }),
      });

      setSuccessMsg(`Discount updated for category: ${selectedCategory.name}`);
      setIsDiscountModalOpen(false);
      fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCategoryActive = async (category) => {
    try {
      await adminFetch(`/admin/categories/${category._id}`, {
        method: "PUT",
        body: JSON.stringify({ active: !category.active }),
      });
      setSuccessMsg(`Category "${category.name}" is now ${!category.active ? "Active" : "Disabled"}.`);
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (filterStatus === "active" && !c.active) return false;
    if (filterStatus === "disabled" && c.active) return false;
    if (filterNarcotic === "narcotic" && !c.isNarcotic) return false;
    if (filterNarcotic === "standard" && c.isNarcotic) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name && c.name.toLowerCase().includes(q);
      const matchSlug = c.slug && c.slug.toLowerCase().includes(q);
      return matchName || matchSlug;
    }
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Manage Categories</h2>
        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          + Add Category
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

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
              placeholder="Search category name or slug..."
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

          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569" }}>Status:</span>
            <select
              className="form-control"
              style={{ padding: "0.35rem 0.6rem", fontSize: "0.8rem", width: "auto" }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="disabled">Disabled Only</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569" }}>Type:</span>
            <select
              className="form-control"
              style={{ padding: "0.35rem 0.6rem", fontSize: "0.8rem", width: "auto" }}
              value={filterNarcotic}
              onChange={(e) => setFilterNarcotic(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="standard">Standard</option>
              <option value="narcotic">Narcotic Default</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>
          Showing <strong style={{ color: "#0f172a" }}>{filteredCategories.length}</strong> of {categories.length} categories
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center" }}>Loading categories...</div>
        ) : filteredCategories.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
            {searchQuery || filterStatus !== "all" || filterNarcotic !== "all"
              ? "No categories match the active search/filters."
              : "No categories found. Add some to get started."}
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Default Narcotics Flag</th>
                  <th>Discount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <tr key={category._id}>
                    <td style={{ fontWeight: 600 }}>{category.name}</td>
                    <td><code>{category.slug}</code></td>
                    <td>
                      {category.isNarcotic ? (
                        <span className="badge badge-narcotic">Narcotic Default</span>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>Standard</span>
                      )}
                    </td>
                    <td>
                      {category.discount && category.discount.active ? (
                        <span className="badge badge-discount">
                          {category.discount.value}% Off
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>No Discount</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleCategoryActive(category)}
                        style={{
                          padding: "0.25rem 0.6rem",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          border: "none",
                          cursor: "pointer",
                          background: category.active ? "#dcfce7" : "#fee2e2",
                          color: category.active ? "#166534" : "#991b1b",
                        }}
                      >
                        {category.active ? "✓ Active" : "✕ Disabled"}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem" }}
                          onClick={() => handleOpenEditModal(category)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-primary"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem", background: "#059669" }}
                          onClick={() => handleOpenDiscountModal(category)}
                        >
                          Discount
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem" }}
                          onClick={() => handleDeleteCategory(category._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category Create/Edit Modal */}
      {isCategoryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{isEditMode ? "Edit Category" : "Add New Category"}</h3>
              <button className="modal-close" onClick={() => setIsCategoryModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCategorySubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Category Name</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="e.g. Cough Syrups"
                  />
                </div>
                <div className="form-group">
                  <label>Slug (lowercase alphanumeric and hyphens)</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="e.g. cough-syrups"
                  />
                </div>

                <div className="form-group">
                  <div className="switch-group">
                    <label style={{ margin: 0 }}>Default isNarcotic flag for new products</label>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={formData.isNarcotic}
                        onChange={(e) => setFormData((prev) => ({ ...prev, isNarcotic: e.target.checked }))}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <div className="switch-group">
                    <label style={{ margin: 0 }}>Category Active Status</label>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCategoryModalOpen(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {isEditMode ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discount Management Modal */}
      {isDiscountModalOpen && selectedCategory && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Set Discount for "{selectedCategory.name}"</h3>
              <button className="modal-close" onClick={() => setIsDiscountModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleDiscountSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Discount Value (%)</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    min="0"
                    max="100"
                    step="0.01"
                    value={discountData.value}
                    onChange={(e) => setDiscountData((prev) => ({ ...prev, value: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <div className="switch-group">
                    <label style={{ margin: 0 }}>Activate Discount</label>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={discountData.active}
                        onChange={(e) => setDiscountData((prev) => ({ ...prev, active: e.target.checked }))}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsDiscountModalOpen(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  Update Discount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Categories;
