import React, { useState, useEffect } from "react";

function Categories({ token }) {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

  // List State
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${apiUrl}/admin/categories?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch categories");
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
      const url = isEditMode
        ? `${apiUrl}/admin/categories/${editId}`
        : `${apiUrl}/admin/categories`;

      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Failed to ${isEditMode ? "update" : "create"} category`);

      setSuccessMsg(`Category successfully ${isEditMode ? "updated" : "created"}!`);
      setIsCategoryModalOpen(false);
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch(`${apiUrl}/admin/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete category");

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
      const res = await fetch(`${apiUrl}/admin/categories/${selectedCategory._id}/discount`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          value: parseFloat(discountData.value),
          active: discountData.active,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update category discount");

      setSuccessMsg(`Discount updated for category: ${selectedCategory.name}`);
      setIsDiscountModalOpen(false);
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

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

      <div className="card">
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center" }}>Loading categories...</div>
        ) : categories.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center" }}>No categories found. Add some to get started.</div>
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
                {categories.map((category) => (
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
                      {category.active ? (
                        <span className="badge badge-discount" style={{ background: "#e2e8f0", color: "#475569" }}>
                          Active
                        </span>
                      ) : (
                        <span className="badge badge-prescription">Inactive</span>
                      )}
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
                <button type="button" className="btn btn-secondary" onClick={() => setIsCategoryModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
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
                <button type="button" className="btn btn-secondary" onClick={() => setIsDiscountModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
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
