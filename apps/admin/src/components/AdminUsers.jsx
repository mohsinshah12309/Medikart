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

  // Each permission with human-readable label, icon, and description
  const PERMISSION_META = [
    { key: "view_orders",       icon: "📋", label: "View Orders",      desc: "Read order list & details" },
    { key: "manage_orders",     icon: "✏️",  label: "Manage Orders",    desc: "Update order status & info" },
    { key: "view_products",     icon: "💊", label: "View Products",    desc: "Browse the product catalog" },
    { key: "manage_products",   icon: "📦", label: "Manage Products",  desc: "Create, edit & delete products" },
    { key: "view_categories",   icon: "🗂️", label: "View Categories",  desc: "Browse product categories" },
    { key: "manage_categories", icon: "🏷️", label: "Manage Categories", desc: "Create & edit categories" },
    { key: "view_cities",       icon: "🏙️", label: "View Cities",      desc: "Browse delivery cities" },
    { key: "manage_cities",     icon: "🗺️", label: "Manage Cities",    desc: "Add & edit cities/delivery charges" },
    { key: "view_settings",     icon: "⚙️", label: "View Settings",    desc: "Read store-wide settings" },
    { key: "manage_settings",   icon: "🔧", label: "Manage Settings",  desc: "Edit discounts, content & settings" },
    { key: "view_activity_logs", icon: "📜", label: "Activity Logs",   desc: "View admin audit trail" },
  ];

  const AVAILABLE_PERMISSIONS = PERMISSION_META.map(p => p.key);

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

  const selectAll = (form, setForm) => setForm({ ...form, permissions: [...AVAILABLE_PERMISSIONS] });
  const clearAll  = (form, setForm) => setForm({ ...form, permissions: [] });

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
      flash(`✅ Admin created successfully.\nTemporary password: ${data.data?.temporaryPassword || "(check server logs)"}`);
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

  // ── Permission toggle grid with dark-theme aware styles ──────────────────────
  const PermissionCheckboxes = ({ form, setForm }) => (
    <div>
      {/* Quick actions */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <button
          type="button"
          onClick={() => selectAll(form, setForm)}
          style={{ fontSize: "0.7rem", padding: "0.2rem 0.6rem", borderRadius: "6px",
            background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)",
            cursor: "pointer", fontWeight: 600 }}
        >
          ✅ Select All
        </button>
        <button
          type="button"
          onClick={() => clearAll(form, setForm)}
          style={{ fontSize: "0.7rem", padding: "0.2rem 0.6rem", borderRadius: "6px",
            background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)",
            cursor: "pointer", fontWeight: 600 }}
        >
          ✕ Clear All
        </button>
        <span style={{ fontSize: "0.7rem", color: "#64748b", alignSelf: "center" }}>
          {form.permissions?.length || 0} / {AVAILABLE_PERMISSIONS.length} selected
        </span>
      </div>

      {/* Permission cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "0.5rem" }}>
        {PERMISSION_META.map(({ key, icon, label, desc }) => {
          const active = form.permissions?.includes(key);
          return (
            <label
              key={key}
              style={{
                display: "flex", alignItems: "flex-start", gap: "0.5rem",
                padding: "0.6rem 0.75rem", borderRadius: "10px", cursor: "pointer",
                background: active ? "rgba(13,148,136,0.18)" : "rgba(15,23,42,0.35)",
                border: active ? "1px solid rgba(45,212,191,0.45)" : "1px solid rgba(45,212,191,0.1)",
                transition: "all 0.15s ease",
              }}
            >
              <input
                type="checkbox"
                checked={active || false}
                onChange={() => togglePermission(key, form, setForm)}
                style={{ marginTop: "2px", accentColor: "#2dd4bf", width: "14px", height: "14px", flexShrink: 0 }}
              />
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: active ? "#5eead4" : "#94a3b8" }}>
                  {icon} {label}
                </div>
                <div style={{ fontSize: "0.67rem", color: "#64748b", marginTop: "1px" }}>{desc}</div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );

  // ── Compact permission badge display in table ─────────────────────────────────
  const PermissionBadges = ({ permissions }) => {
    if (!permissions?.length) return <span style={{ color: "#475569", fontSize: "0.75rem" }}>No permissions</span>;
    const displayed = permissions.slice(0, 2);
    const rest = permissions.length - 2;
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
        {displayed.map(p => {
          const meta = PERMISSION_META.find(m => m.key === p);
          return (
            <span key={p} style={{
              fontSize: "0.65rem", padding: "0.15rem 0.45rem", borderRadius: "6px",
              background: "rgba(45,212,191,0.12)", color: "#2dd4bf",
              border: "1px solid rgba(45,212,191,0.2)", fontWeight: 600,
            }}>
              {meta?.icon} {meta?.label || p.replace(/_/g, " ")}
            </span>
          );
        })}
        {rest > 0 && (
          <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem", borderRadius: "6px",
            background: "rgba(100,116,139,0.15)", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.2)" }}>
            +{rest} more
          </span>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Admin Users</h2>
        <button className="btn btn-primary" onClick={() => { setShowCreate(true); setEditId(null); }}>
          + New Admin
        </button>
      </div>

      {/* Super Admin notice */}
      <div style={{
        background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)",
        borderRadius: "10px", padding: "0.85rem 1.1rem", marginBottom: "1.25rem",
        color: "#fbbf24", fontSize: "0.82rem", lineHeight: 1.5,
      }}>
        <strong>🔒 Super Admin only.</strong> This screen is visible only to Super Admins in the UI.
        The backend API enforces the same restriction server-side (Phase 20 <code style={{ background: "rgba(251,191,36,0.1)", padding: "0 4px", borderRadius: "3px" }}>requireSuperAdmin</code> middleware) —
        a regular admin's token will be rejected even if they call the API directly.
      </div>

      {error   && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success" style={{ whiteSpace: "pre-wrap" }}>{success}</div>}

      {/* Create Form */}
      {showCreate && (
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1rem", fontWeight: 700, color: "#f1f5f9" }}>
            ➕ Create New Admin User
          </h3>
          <form onSubmit={handleCreate}>
            {/* Name + Email row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.3rem", color: "#94a3b8" }}>Full Name *</label>
                <input
                  className="form-control"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.3rem", color: "#94a3b8" }}>Email *</label>
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

            {/* Role selector */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.3rem", color: "#94a3b8" }}>Role</label>
              <select
                className="form-control"
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                style={{ maxWidth: "180px" }}
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <p style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.3rem" }}>
                {createForm.role === "super_admin"
                  ? "⚠️ Super Admins have full access — permissions below are ignored."
                  : "Regular Admins are limited to the modules you select below."}
              </p>
            </div>

            {/* Module Permissions */}
            {createForm.role === "admin" && (
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.5rem", color: "#94a3b8" }}>
                  Module Permissions
                </label>
                <PermissionCheckboxes form={createForm} setForm={setCreateForm} />
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
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
          <span>⚠️ Delete this admin user? This cannot be undone.</span>
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
                  <td colSpan={6} style={{ textAlign: "center", color: "#64748b", padding: "2rem" }}>
                    No admin users found.
                  </td>
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
                      <td style={{ minWidth: "320px" }}>
                        {editForm.role === "super_admin" ? (
                          <span style={{ fontSize: "0.75rem", color: "#fbbf24" }}>
                            ✦ Full access — Super Admins bypass permissions
                          </span>
                        ) : (
                          <PermissionCheckboxes form={editForm} setForm={setEditForm} />
                        )}
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
                      <td style={{ fontWeight: 600, color: "#f1f5f9" }}>{user.name}</td>
                      <td style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{user.email}</td>
                      <td>
                        <span style={{
                          display: "inline-block", padding: "0.2rem 0.7rem", borderRadius: "9999px",
                          fontSize: "0.72rem", fontWeight: 700,
                          background: user.role === "super_admin" ? "rgba(251,191,36,0.15)" : "rgba(45,212,191,0.12)",
                          color: user.role === "super_admin" ? "#fbbf24" : "#2dd4bf",
                          border: `1px solid ${user.role === "super_admin" ? "rgba(251,191,36,0.3)" : "rgba(45,212,191,0.25)"}`,
                        }}>
                          {user.role === "super_admin" ? "⭐ Super Admin" : "👤 Admin"}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: "9999px",
                          fontSize: "0.72rem", fontWeight: 700,
                          background: user.active ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.1)",
                          color: user.active ? "#34d399" : "#f87171",
                          border: `1px solid ${user.active ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.2)"}`,
                        }}>
                          {user.active ? "● Active" : "○ Inactive"}
                        </span>
                      </td>
                      <td>
                        {user.role === "super_admin"
                          ? <span style={{ fontSize: "0.72rem", color: "#fbbf24" }}>✦ Full access</span>
                          : <PermissionBadges permissions={user.permissions} />
                        }
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
