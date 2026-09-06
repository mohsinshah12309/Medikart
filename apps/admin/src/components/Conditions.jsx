import React, { useState, useEffect } from "react";

export default function Conditions({ token }) {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCondition, setEditingCondition] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    icon: "🩺",
    imageUrl: "",
    description: "",
    displayOrder: 0,
    active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConditions();
  }, []);

  const flash = (msg, isError = false) => {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => {
      setError("");
      setSuccess("");
    }, 4000);
  };

  const fetchConditions = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${apiUrl}/admin/conditions`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load health conditions");
      setConditions(data.data?.conditions || []);
    } catch (err) {
      flash(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCondition(null);
    setFormData({
      name: "",
      slug: "",
      icon: "🩺",
      imageUrl: "",
      description: "",
      displayOrder: conditions.length + 1,
      active: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCondition(c);
    setFormData({
      name: c.name || "",
      slug: c.slug || "",
      icon: c.icon || "🩺",
      imageUrl: c.imageUrl || "",
      description: c.description || "",
      displayOrder: c.displayOrder || 0,
      active: c.active !== false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      flash("Condition name is required.", true);
      return;
    }

    try {
      setSaving(true);
      const url = editingCondition
        ? `${apiUrl}/admin/conditions/${editingCondition._id}`
        : `${apiUrl}/admin/conditions`;
      const method = editingCondition ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save condition");

      flash(editingCondition ? "Condition updated successfully!" : "Condition created successfully!");
      setShowModal(false);
      fetchConditions();
    } catch (err) {
      flash(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (c) => {
    try {
      const res = await fetch(`${apiUrl}/admin/conditions/${c._id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ active: !c.active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update condition status");
      flash(`Condition "${c.name}" is now ${!c.active ? "Active" : "Disabled"}.`);
      fetchConditions();
    } catch (err) {
      flash(err.message, true);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete health condition "${name}"?`)) return;
    try {
      const res = await fetch(`${apiUrl}/admin/conditions/${id}`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete condition");
      flash("Condition deleted successfully!");
      fetchConditions();
    } catch (err) {
      flash(err.message, true);
    }
  };

  return (
    <div className="section-container">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>
            🩺 Health Conditions (Care By Condition)
          </h1>
          <p style={{ color: "#64748b", margin: "0.25rem 0 0 0", fontSize: "0.9rem" }}>
            Manage health condition categories (Hair Fall, Acne, Pain, Diabetes, etc.) rendered on the homepage.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleOpenCreate}
          style={{ background: "#eab308", color: "#0f172a", fontWeight: "bold" }}
        >
          + Add New Condition
        </button>
      </div>

      {/* Notifications */}
      {error && <div className="alert alert-danger" style={{ marginBottom: "1rem" }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: "1rem" }}>{success}</div>}

      {/* Table */}
      {loading ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>Loading conditions...</div>
      ) : conditions.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
          <p style={{ color: "#64748b", fontWeight: 500 }}>No health conditions found. Click "+ Add New Condition" to create one.</p>
        </div>
      ) : (
        <div className="table-responsive" style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <table className="table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "0.75rem 1rem" }}>Order</th>
                <th style={{ padding: "0.75rem 1rem" }}>Icon & Condition</th>
                <th style={{ padding: "0.75rem 1rem" }}>Slug</th>
                <th style={{ padding: "0.75rem 1rem" }}>Description</th>
                <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {conditions.map((c) => (
                <tr key={c._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: "bold" }}>#{c.displayOrder}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "1.25rem" }}>{c.icon || "🩺"}</span>
                      <span style={{ fontWeight: 600, color: "#0f172a" }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#64748b", fontSize: "0.85rem" }}>
                    <code>{c.slug}</code>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#475569", fontSize: "0.85rem", maxWidth: "250px" }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.description || "—"}
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(c)}
                      style={{
                        padding: "0.25rem 0.6rem",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                        background: c.active ? "#dcfce7" : "#fee2e2",
                        color: c.active ? "#166534" : "#991b1b",
                      }}
                    >
                      {c.active ? "✓ Active" : "✕ Disabled"}
                    </button>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", marginRight: "0.4rem" }}
                      onClick={() => handleOpenEdit(c)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                      onClick={() => handleDelete(c._id, c.name)}
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
              {editingCondition ? "Edit Health Condition" : "Create New Health Condition"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div className="form-group">
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Condition Name *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Hair Fall & Scalp Care"
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Icon Emoji
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1", textAlign: "center" }}
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="💇"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div className="form-group">
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Custom Slug (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. hair-fall"
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Display Order
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
                  Image URL / Asset Path
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="Leave empty to use icon emoji"
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  Description
                </label>
                <textarea
                  className="form-control"
                  rows="2"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short summary of medical conditions and products..."
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                <input
                  type="checkbox"
                  id="condActiveToggle"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  style={{ width: "16px", height: "16px" }}
                />
                <label htmlFor="condActiveToggle" style={{ fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                  Active & Display on Homepage
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
                  {saving ? "Saving..." : editingCondition ? "Save Changes" : "Create Condition"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
