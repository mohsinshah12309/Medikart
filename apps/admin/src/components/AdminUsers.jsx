import React, { useState, useEffect } from "react";

/**
 * AdminUsers screen — Phase 24c
 *
 * Super Admin only:
 *   - UI tab is hidden for regular admins in Layout.jsx (role check on adminUser.role)
 *   - The underlying API still enforces requireSuperAdmin server-side (Phase 20/21) —
 *     this UI hides the tab but is NOT the only guard. The backend rejects a regular
 *     admin's token at the API level regardless of what the UI shows.
 *
 * Wired to Phase 20 endpoints (all behind requireSuperAdmin middleware):
 *   GET    /api/v1/admin/users
 *   POST   /api/v1/admin/users
 *   PUT    /api/v1/admin/users/:id
 *   DELETE /api/v1/admin/users/:id
 */
function AdminUsers({ token, adminUser }) {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", role: "admin", permissions: [] });
  const [creating, setCreating] = useState(false);

  // Edit state
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "admin", active: true, permissions: [] });
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const AVAILABLE_PERMISSIONS = [
    "view_orders", "manage_orders",
    "view_products", "manage_products",
    "view_categories", "manage_categories",
    "view_cities", "manage_cities",
    "view_settings", "manage_settings",
    "view_activity_logs",
  ];

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    fetchUsers();
  }, []);

  const flash = (msg, isError = false) => {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => { setError(""); setSuccess(""); }, 5000);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${apiUrl}/admin/users`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load admin users");
      setUsers(data.data || []);
    } catch (err) {
      flash(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (perm, form, setForm) => {
    const current = form.permissions || [];
    if (current.includes(perm)) {
      setForm({ ...form, permissions: current.filter((p) => p !== perm) });
    } else {
      setForm({ ...form, permissions: [...current, perm] });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch(`${apiUrl}/admin/users`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: createForm.name.trim(),
          email: createForm.email.trim().toLowerCase(),
          role: createForm.role,
          permissions: createForm.permissions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Create failed");
      flash(`Admin user created. Temporary password: ${data.data?.temporaryPassword || "(check server logs)"}`);
      setShowCreate(false);
      setCreateForm({ name: "", email: "", role: "admin", permissions: [] });
      fetchUsers();
    } catch (err) {
      flash(err.message, true);
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (user) => {
    setEditId(user._id);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      permissions: user.permissions || [],
    });
  };

  const handleSave = async (id) => {
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/admin/users/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          name: editForm.name.trim(),
          email: editForm.email.trim().toLowerCase(),
          role: editForm.role,
          active: editForm.active,
          permissions: editForm.permissions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      flash("Admin user updated");
      setEditId(null);
      fetchUsers();
    } catch (err) {
      flash(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      const res = await fetch(`${apiUrl}/admin/users/${id}`, { method: "DELETE", headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");
      flash("Admin user deleted");
      setDeleteId(null);
      fetchUsers();
    } catch (err) {
      flash(err.message, true);
    } finally {
      setDeleting(false);
    }
  };

  const PermissionCheckboxes = ({ form, setForm }) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
      {AVAILABLE_PERMISSIONS.map((perm) => (
        <label key={perm} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem",
          background: form.permissions?.includes(perm) ? "#dbeafe" : "#f1f5f9",
          padding: "0.2rem 0.5rem", borderRadius: "4px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={form.permissions?.includes(perm) || false}
            onChange={() => togglePermission(perm, form, setForm)}
          />
          {perm.replace(/_/g, " ")}
        </label>
      ))}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Admin Users</h2>
        <button className="btn btn-primary" onClick={() => { setShowCreate(true); setEditId(null); }}>
          + New Admin
        </button>
      </div>

      <div className="alert" style={{ background: "#fffbeb", borderColor: "#fef3c7", color: "#92400e", marginBottom: "1rem" }}>
        <strong>🔒 Super Admin only.</strong> This screen is visible only to Super Admins in the UI.
        The backend API enforces the same restriction server-side (Phase 20 <code>requireSuperAdmin</code> middleware) —
        a regular admin's token will be rejected even if they call the API directly.
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success" style={{ whiteSpace: "pre-wrap" }}>{success}</div>}

      {/* Create Form */}
      {showCreate && (
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", fontWeight: 700 }}>Create New Admin User</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.25rem" }}>Full Name *</label>
                <input
                  className="form-control"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.25rem" }}>Email *</label>
                <input
                  type="email"
                  className="form-control"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                  placeholder="jane@medikart.pk"
                />
              </div>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.25rem" }}>Role</label>
              <select
                className="form-control"
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                style={{ maxWidth: "160px" }}
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.25rem" }}>Module Permissions</label>
              <PermissionCheckboxes form={createForm} setForm={setCreateForm} />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? "Creating..." : "Create Admin"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="alert alert-danger" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Delete this admin user? This cannot be undone.</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-danger btn-sm" disabled={deleting} onClick={() => handleDelete(deleteId)}>
              {deleting ? "Deleting..." : "Yes, Delete"}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setDeleteId(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>Loading admin users...</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Permissions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "#64748b", padding: "2rem" }}>No admin users found.</td>
                </tr>
              ) : users.map((user) => (
                <tr key={user._id}>
                  {editId === user._id ? (
                    <>
                      <td>
                        <input
                          className="form-control"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          style={{ maxWidth: "160px" }}
                        />
                      </td>
                      <td>
                        <input
                          type="email"
                          className="form-control"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          style={{ maxWidth: "200px" }}
                        />
                      </td>
                      <td>
                        <select
                          className="form-control"
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                          style={{ maxWidth: "130px" }}
                          disabled={user._id === adminUser?._id}
                        >
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-control"
                          value={editForm.active ? "true" : "false"}
                          onChange={(e) => setEditForm({ ...editForm, active: e.target.value === "true" })}
                          style={{ maxWidth: "100px" }}
                          disabled={user._id === adminUser?._id}
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </td>
                      <td>
                        <PermissionCheckboxes form={editForm} setForm={setEditForm} />
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button className="btn btn-primary btn-sm" disabled={saving} onClick={() => handleSave(user._id)}>
                            {saving ? "..." : "Save"}
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ fontWeight: 600 }}>{user.name}</td>
                      <td style={{ color: "#64748b" }}>{user.email}</td>
                      <td>
                        <span style={{
                          display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: "9999px",
                          fontSize: "0.75rem", fontWeight: 600,
                          background: user.role === "super_admin" ? "#fef3c7" : "#dbeafe",
                          color: user.role === "super_admin" ? "#92400e" : "#1e40af",
                        }}>
                          {user.role === "super_admin" ? "Super Admin" : "Admin"}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: "9999px",
                          fontSize: "0.75rem", fontWeight: 600,
                          background: user.active ? "#d1fae5" : "#fee2e2",
                          color: user.active ? "#065f46" : "#991b1b",
                        }}>
                          {user.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {user.permissions?.length ? user.permissions.join(", ") : "—"}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => startEdit(user)}>Edit</button>
                          {user._id !== adminUser?._id && (
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(user._id)}>Delete</button>
                          )}
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

export default AdminUsers;
