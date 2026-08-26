import React, { useState, useEffect } from "react";

/**
 * Cities screen — Phase 24a
 * Full CRUD wired to Phase 7's city endpoints:
 *   GET    /api/v1/admin/cities
 *   POST   /api/v1/admin/cities
 *   PUT    /api/v1/admin/cities/:id
 *   DELETE /api/v1/admin/cities/:id
 */
function Cities({ token }) {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state for create
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", deliveryCharge: "", active: true });
  const [creating, setCreating] = useState(false);

  // Edit state
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", deliveryCharge: "", active: true });
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${apiUrl}/admin/cities`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load cities");
      setCities(data.data?.cities || data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const flash = (msg, isError = false) => {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => { setError(""); setSuccess(""); }, 4000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch(`${apiUrl}/admin/cities`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: createForm.name.trim(),
          deliveryCharge: Number(createForm.deliveryCharge),
          active: createForm.active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Create failed");
      flash("City created successfully");
      setShowCreate(false);
      setCreateForm({ name: "", deliveryCharge: "", active: true });
      fetchCities();
    } catch (err) {
      flash(err.message, true);
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (city) => {
    setEditId(city._id);
    setEditForm({ name: city.name, deliveryCharge: city.deliveryCharge, active: city.active });
  };

  const handleSave = async (id) => {
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/admin/cities/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          name: editForm.name.trim(),
          deliveryCharge: Number(editForm.deliveryCharge),
          active: editForm.active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      flash("City updated successfully");
      setEditId(null);
      fetchCities();
    } catch (err) {
      flash(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      const res = await fetch(`${apiUrl}/admin/cities/${id}`, { method: "DELETE", headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");
      flash("City deleted");
      setDeleteId(null);
      fetchCities();
    } catch (err) {
      flash(err.message, true);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Cities & Delivery Charges</h2>
        <button className="btn btn-primary" onClick={() => { setShowCreate(true); setEditId(null); }}>
          + Add City
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Create Form */}
      {showCreate && (
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", fontWeight: 700 }}>New City</h3>
          <form onSubmit={handleCreate} style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.25rem" }}>City Name *</label>
              <input
                className="form-control"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                required
                placeholder="e.g. Karachi"
                style={{ minWidth: "180px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.25rem" }}>Delivery Charge (PKR) *</label>
              <input
                className="form-control"
                type="number"
                min="0"
                value={createForm.deliveryCharge}
                onChange={(e) => setCreateForm({ ...createForm, deliveryCharge: e.target.value })}
                required
                placeholder="150"
                style={{ minWidth: "140px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.25rem" }}>Active</label>
              <select
                className="form-control"
                value={createForm.active ? "true" : "false"}
                onChange={(e) => setCreateForm({ ...createForm, active: e.target.value === "true" })}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? "Saving..." : "Create"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="alert alert-danger" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Delete this city? This cannot be undone.</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-danger btn-sm" disabled={deleting} onClick={() => handleDelete(deleteId)}>
              {deleting ? "Deleting..." : "Yes, Delete"}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setDeleteId(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Cities Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>Loading cities...</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>City Name</th>
                <th>Delivery Charge (PKR)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cities.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "#64748b", padding: "2rem" }}>
                    No cities found. Add one above.
                  </td>
                </tr>
              ) : cities.map((city) => (
                <tr key={city._id}>
                  {editId === city._id ? (
                    <>
                      <td>
                        <input
                          className="form-control"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          style={{ maxWidth: "180px" }}
                        />
                      </td>
                      <td>
                        <input
                          className="form-control"
                          type="number"
                          min="0"
                          value={editForm.deliveryCharge}
                          onChange={(e) => setEditForm({ ...editForm, deliveryCharge: e.target.value })}
                          style={{ maxWidth: "120px" }}
                        />
                      </td>
                      <td>
                        <select
                          className="form-control"
                          value={editForm.active ? "true" : "false"}
                          onChange={(e) => setEditForm({ ...editForm, active: e.target.value === "true" })}
                          style={{ maxWidth: "100px" }}
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button className="btn btn-primary btn-sm" disabled={saving} onClick={() => handleSave(city._id)}>
                            {saving ? "..." : "Save"}
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ fontWeight: 600 }}>{city.name}</td>
                      <td>PKR {city.deliveryCharge}</td>
                      <td>
                        <span style={{
                          display: "inline-block",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          background: city.active ? "#d1fae5" : "#fee2e2",
                          color: city.active ? "#065f46" : "#991b1b",
                        }}>
                          {city.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => startEdit(city)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(city._id)}>Delete</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Cities;
