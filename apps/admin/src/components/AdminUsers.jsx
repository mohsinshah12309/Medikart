import React, { useState, useEffect } from "react";
import PasswordInput from "./PasswordInput";
import { adminFetch, API_URL } from "../apiClient";

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

  const [users, setUsers] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
    assignedPharmacyId: "",
    permissions: [],
  });
  const [creating, setCreating] = useState(false);

  // Edit modal state
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "admin",
    assignedPharmacyId: "",
    active: true,
    permissions: [],
  });
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Each permission with human-readable label, icon, and description
  const PERMISSION_META = [
    { key: "view_orders",        icon: "📋", label: "View Orders",        desc: "Read order list & details" },
    { key: "manage_orders",      icon: "✏️",  label: "Manage Orders",      desc: "Update order status & info" },
    { key: "view_products",      icon: "💊", label: "View Products",      desc: "Browse the product catalog" },
    { key: "manage_products",    icon: "📦", label: "Manage Products",    desc: "Create, edit & delete products" },
    { key: "view_categories",    icon: "🗂️", label: "View Categories",    desc: "Browse product categories" },
    { key: "manage_categories",  icon: "🏷️", label: "Manage Categories",  desc: "Create & edit categories" },
    { key: "view_conditions",    icon: "🩺", label: "View Conditions",    desc: "Browse health conditions" },
    { key: "manage_conditions",  icon: "🩹", label: "Manage Conditions",  desc: "Add & edit health conditions" },
    { key: "view_banners",       icon: "🖼️", label: "View Banners",       desc: "Browse promotional banners" },
    { key: "manage_banners",     icon: "🎨", label: "Manage Banners",     desc: "Upload & edit banners" },
    { key: "view_pharmacies",    icon: "🏥", label: "View Pharmacies",    desc: "Browse pharmacy branches" },
    { key: "manage_pharmacies",  icon: "🏢", label: "Manage Pharmacies",  desc: "Add & edit pharmacy branches" },
    { key: "view_cities",        icon: "🏙️", label: "View Cities",        desc: "Browse delivery cities" },
    { key: "manage_cities",      icon: "🗺️", label: "Manage Cities",      desc: "Add & edit cities/delivery charges" },
    { key: "view_settings",      icon: "⚙️", label: "View Settings",      desc: "Read store-wide settings" },
    { key: "manage_settings",    icon: "🔧", label: "Manage Settings",    desc: "Edit discounts, content & settings" },
    { key: "view_activity_logs", icon: "📜", label: "Activity Logs",     desc: "View admin audit trail" },
    { key: "view_messages",      icon: "💬", label: "View Messages",     desc: "Read customer contact inquiries" },
  ];

  const AVAILABLE_PERMISSIONS = PERMISSION_META.map((p) => p.key);

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    fetchUsers();
    fetchPharmacies();
  }, []);

  const flash = (msg, isError = false) => {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => {
      setError("");
      setSuccess("");
    }, 5000);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_URL}/admin/users`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load admin users");
      setUsers(data.data || []);
    } catch (err) {
      flash(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const fetchPharmacies = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/pharmacies`, { headers });
      const data = await res.json();
      if (res.ok) {
        setPharmacies(data.data?.pharmacies || []);
      }
    } catch (err) {
      console.error("fetchPharmacies error:", err);
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

  const selectAll = (form, setForm) =>
    setForm({ ...form, permissions: [...AVAILABLE_PERMISSIONS] });
  const clearAll = (form, setForm) => setForm({ ...form, permissions: [] });

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        name: createForm.name.trim(),
        email: createForm.email.trim().toLowerCase(),
        role: createForm.role,
        permissions: createForm.permissions,
      };
      if (createForm.password && createForm.password.trim()) {
        payload.password = createForm.password.trim();
      }
      if (createForm.assignedPharmacyId) {
        payload.assignedPharmacyId = createForm.assignedPharmacyId;
      }
      const res = await fetch(`${API_URL}/admin/users`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Create failed");
      flash(`✅ Admin user created successfully.`);
      setShowCreate(false);
      setCreateForm({
        name: "",
        email: "",
        password: "",
        role: "admin",
        assignedPharmacyId: "",
        permissions: [],
      });
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
      assignedPharmacyId:
        user.assignedPharmacyId?._id || user.assignedPharmacyId || "",
      active: user.active,
      permissions: user.permissions || [],
    });
  };

  const handleSave = async (id) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/users/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          name: editForm.name.trim(),
          email: editForm.email.trim().toLowerCase(),
          role: editForm.role,
          assignedPharmacyId: editForm.assignedPharmacyId || null,
          active: editForm.active,
          permissions: editForm.permissions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      flash("✅ Admin user access & details updated successfully.");
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
      const res = await fetch(`${API_URL}/admin/users/${id}`, {
        method: "DELETE",
        headers,
      });
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

  // ── Clean Permission Grid Component ───────────────────────────────────────
  const PermissionCheckboxes = ({ form, setForm }) => (
    <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
      {/* Quick actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => selectAll(form, setForm)}
            style={{
              fontSize: "0.75rem",
              padding: "0.3rem 0.75rem",
              borderRadius: "6px",
              background: "#dcfce7",
              color: "#166534",
              border: "1px solid #86efac",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            ✅ Select All
          </button>
          <button
            type="button"
            onClick={() => clearAll(form, setForm)}
            style={{
              fontSize: "0.75rem",
              padding: "0.3rem 0.75rem",
              borderRadius: "6px",
              background: "#fee2e2",
              color: "#991b1b",
              border: "1px solid #fca5a5",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            ✕ Clear All
          </button>
        </div>
        <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>
          {form.permissions?.length || 0} / {AVAILABLE_PERMISSIONS.length} selected
        </span>
      </div>

      {/* Permission cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "0.6rem",
          maxHeight: "340px",
          overflowY: "auto",
          paddingRight: "4px",
        }}
      >
        {PERMISSION_META.map(({ key, icon, label, desc }) => {
          const active = form.permissions?.includes(key);
          return (
            <label
              key={key}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.55rem",
                padding: "0.65rem 0.8rem",
                borderRadius: "10px",
                cursor: "pointer",
                background: active ? "#fef9c3" : "#ffffff",
                border: active ? "1.5px solid #facc15" : "1px solid #e2e8f0",
                boxShadow: active ? "0 2px 6px rgba(234, 179, 8, 0.15)" : "0 1px 3px rgba(0,0,0,0.02)",
                transition: "all 0.15s ease",
              }}
            >
              <input
                type="checkbox"
                checked={active || false}
                onChange={() => togglePermission(key, form, setForm)}
                style={{
                  marginTop: "2px",
                  accentColor: "#eab308",
                  width: "15px",
                  height: "15px",
                  flexShrink: 0,
                  cursor: "pointer",
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: active ? "#854d0e" : "#1e293b",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>{icon}</span> <span>{label}</span>
                </div>
                <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: "2px", lineHeight: 1.3 }}>
                  {desc}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );

  // ── Compact permission badge display in table ──────────────────────────────
  const PermissionBadges = ({ permissions }) => {
    if (!permissions?.length)
      return <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>No permissions</span>;
    const displayed = permissions.slice(0, 2);
    const rest = permissions.length - 2;
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
        {displayed.map((p) => {
          const meta = PERMISSION_META.find((m) => m.key === p);
          return (
            <span
              key={p}
              style={{
                fontSize: "0.68rem",
                padding: "0.2rem 0.5rem",
                borderRadius: "6px",
                background: "#f0fdf4",
                color: "#166534",
                border: "1px solid #bbf7d0",
                fontWeight: 700,
              }}
            >
              {meta?.icon} {meta?.label || p.replace(/_/g, " ")}
            </span>
          );
        })}
        {rest > 0 && (
          <span
            style={{
              fontSize: "0.68rem",
              padding: "0.2rem 0.45rem",
              borderRadius: "6px",
              background: "#f1f5f9",
              color: "#475569",
              border: "1px solid #cbd5e1",
              fontWeight: 700,
            }}
          >
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
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowCreate(true);
            setEditId(null);
          }}
        >
          + New Admin
        </button>
      </div>

      {/* Super Admin notice */}
      <div
        style={{
          background: "#fef9c3",
          border: "1px solid #fde047",
          borderRadius: "10px",
          padding: "0.85rem 1.1rem",
          marginBottom: "1.25rem",
          color: "#854d0e",
          fontSize: "0.82rem",
          lineHeight: 1.5,
          fontWeight: 600,
        }}
      >
        🔒 <strong>Super Admin Access Only.</strong> This user management console and permission controls are restricted exclusively to Super Administrators.
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && (
        <div className="alert alert-success" style={{ whiteSpace: "pre-wrap" }}>
          {success}
        </div>
      )}

      {/* ── CREATE ADMIN USER FORM ────────────────────────────────────────── */}
      {showCreate && (
        <div className="card" style={{ padding: "1.75rem", marginBottom: "1.75rem", border: "1px solid #fde047", background: "#ffffff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
              ➕ Create New Admin User
            </h3>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowCreate(false)}
            >
              ✕ Close
            </button>
          </div>

          <form onSubmit={handleCreate}>
            {/* Name + Email + Password grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.35rem", color: "#334155" }}>
                  Full Name *
                </label>
                <input
                  className="form-control"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                  placeholder="e.g. Ali Shah"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.35rem", color: "#334155" }}>
                  Staff Email *
                </label>
                <input
                  type="email"
                  className="form-control"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                  placeholder="admin@medikart.pk"
                />
              </div>

              <div>
                <PasswordInput
                  id="create-admin-password"
                  name="password"
                  label="Assign Initial Password *"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Min 8 characters (e.g. Pass@1234)"
                  required
                  minLength={8}
                />
              </div>
            </div>

            {/* Role & Pharmacy assignment row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.35rem", color: "#334155" }}>
                  Role
                </label>
                <select
                  className="form-control"
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                >
                  <option value="admin">Admin (Subadmin)</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                <p style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.3rem" }}>
                  {createForm.role === "super_admin"
                    ? "⚠️ Super Admins have full global access across all branches."
                    : "Regular Admins can be assigned to a specific pharmacy branch or granted global access."}
                </p>
              </div>

              {createForm.role === "admin" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.35rem", color: "#334155" }}>
                    🏥 Assigned Pharmacy Scope
                  </label>
                  <select
                    className="form-control"
                    value={createForm.assignedPharmacyId}
                    onChange={(e) => setCreateForm({ ...createForm, assignedPharmacyId: e.target.value })}
                  >
                    <option value="">🌐 Global Access (All Pharmacies)</option>
                    {pharmacies.map((pharmacy) => (
                      <option key={pharmacy._id} value={pharmacy._id}>
                        {pharmacy.name} ({pharmacy.city || "Branch"}) - {pharmacy.code || "Code"}
                      </option>
                    ))}
                  </select>
                  <p style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.3rem" }}>
                    {createForm.assignedPharmacyId
                      ? "🔒 Admin will ONLY see and update orders for this specific pharmacy."
                      : "🌐 Unassigned admin has access to view all pharmacy orders."}
                  </p>
                </div>
              )}
            </div>

            {/* Module Permissions */}
            {createForm.role === "admin" && (
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.5rem", color: "#334155" }}>
                  Module Permissions
                </label>
                <PermissionCheckboxes form={createForm} setForm={setCreateForm} />
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? "Creating Admin..." : "Create Admin User"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── EDIT ADMIN USER MODAL ─────────────────────────────────────────── */}
      {editId && (
        <div
          className="modal-overlay"
          onClick={() => setEditId(null)}
          style={{ zIndex: 1100 }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "820px", width: "95%", borderRadius: "20px" }}
          >
            <div className="modal-header">
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>
                ✏️ Edit Admin User: {editForm.name || "Staff Member"}
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setEditId(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="modal-body" style={{ padding: "1.5rem" }}>
              {/* Row 1: Name + Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.35rem", color: "#334155" }}>
                    Full Name *
                  </label>
                  <input
                    className="form-control"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.35rem", color: "#334155" }}>
                    Staff Email *
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Row 2: Role, Pharmacy, Status */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.35rem", color: "#334155" }}>
                    Role
                  </label>
                  <select
                    className="form-control"
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    disabled={editId === adminUser?._id}
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.35rem", color: "#334155" }}>
                    🏥 Assigned Pharmacy Scope
                  </label>
                  {editForm.role === "super_admin" ? (
                    <div style={{ padding: "0.625rem 0.875rem", background: "#fef9c3", borderRadius: "8px", border: "1px solid #fde047", fontSize: "0.85rem", color: "#854d0e", fontWeight: 700 }}>
                      🌐 Global Access (All Pharmacies)
                    </div>
                  ) : (
                    <select
                      className="form-control"
                      value={editForm.assignedPharmacyId || ""}
                      onChange={(e) => setEditForm({ ...editForm, assignedPharmacyId: e.target.value })}
                    >
                      <option value="">🌐 Global Access (All)</option>
                      {pharmacies.map((pharmacy) => (
                        <option key={pharmacy._id} value={pharmacy._id}>
                          {pharmacy.name} ({pharmacy.city || "Branch"})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.35rem", color: "#334155" }}>
                    Account Status
                  </label>
                  <select
                    className="form-control"
                    value={editForm.active ? "true" : "false"}
                    onChange={(e) => setEditForm({ ...editForm, active: e.target.value === "true" })}
                    disabled={editId === adminUser?._id}
                  >
                    <option value="true">● Active</option>
                    <option value="false">○ Inactive (Suspended)</option>
                  </select>
                </div>
              </div>

              {/* Permissions Section */}
              <div style={{ marginTop: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.5rem", color: "#334155" }}>
                  Module Permissions & Access Control
                </label>
                {editForm.role === "super_admin" ? (
                  <div style={{ padding: "1rem", background: "#fef9c3", borderRadius: "12px", border: "1px solid #fde047", color: "#854d0e", fontSize: "0.85rem", fontWeight: 700 }}>
                    ⭐ Super Admins have full access across all system modules and bypass granular permissions.
                  </div>
                ) : (
                  <PermissionCheckboxes form={editForm} setForm={setEditForm} />
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ background: "#f8fafc" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving}
                onClick={() => handleSave(editId)}
              >
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION ALERT ─────────────────────────────────────── */}
      {deleteId && (
        <div
          className="alert alert-danger"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <span>⚠️ Are you sure you want to delete this admin user? This action cannot be undone.</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className="btn btn-danger btn-sm"
              disabled={deleting}
              onClick={() => handleDelete(deleteId)}
            >
              {deleting ? "Deleting..." : "Yes, Delete"}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── USERS TABLE (CLEAN & BEAUTIFUL) ───────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
          Loading admin users...
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-responsive">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Assigned Pharmacy</th>
                  <th>Status</th>
                  <th>Permissions</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{ textAlign: "center", color: "#64748b", padding: "2.5rem" }}
                    >
                      No admin users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id}>
                      <td style={{ fontWeight: 700, color: "#0f172a" }}>{user.name}</td>
                      <td style={{ color: "#475569", fontSize: "0.85rem" }}>{user.email}</td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.25rem 0.7rem",
                            borderRadius: "9999px",
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            background:
                              user.role === "super_admin"
                                ? "#fef9c3"
                                : "#eff6ff",
                            color:
                              user.role === "super_admin"
                                ? "#854d0e"
                                : "#1d4ed8",
                            border: `1px solid ${
                              user.role === "super_admin"
                                ? "#fde047"
                                : "#bfdbfe"
                            }`,
                          }}
                        >
                          {user.role === "super_admin" ? "⭐ Super Admin" : "👤 Admin"}
                        </span>
                      </td>
                      <td>
                        {user.role === "super_admin" ? (
                          <span
                            style={{
                              display: "inline-block",
                              padding: "0.2rem 0.6rem",
                              borderRadius: "9999px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              background: "#fef9c3",
                              color: "#854d0e",
                              border: "1px solid #fde047",
                            }}
                          >
                            🌐 All Pharmacies
                          </span>
                        ) : user.assignedPharmacyId ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "0.2rem 0.6rem",
                              borderRadius: "9999px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              background: "#eff6ff",
                              color: "#2563eb",
                              border: "1px solid #bfdbfe",
                            }}
                          >
                            🏥 {typeof user.assignedPharmacyId === "object"
                              ? `${user.assignedPharmacyId.name} (${user.assignedPharmacyId.city || "Branch"})`
                              : "Assigned Pharmacy"}
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-block",
                              padding: "0.2rem 0.6rem",
                              borderRadius: "9999px",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              background: "#f1f5f9",
                              color: "#64748b",
                              border: "1px solid #cbd5e1",
                            }}
                          >
                            🌐 Global (All)
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.2rem 0.6rem",
                            borderRadius: "9999px",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            background: user.active ? "#dcfce7" : "#fee2e2",
                            color: user.active ? "#166534" : "#991b1b",
                            border: `1px solid ${user.active ? "#86efac" : "#fca5a5"}`,
                          }}
                        >
                          {user.active ? "● Active" : "○ Inactive"}
                        </span>
                      </td>
                      <td>
                        {user.role === "super_admin" ? (
                          <span style={{ fontSize: "0.75rem", color: "#854d0e", fontWeight: 700 }}>
                            ✦ Full Access
                          </span>
                        ) : (
                          <PermissionBadges permissions={user.permissions} />
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => startEdit(user)}
                          >
                            Edit
                          </button>
                          {user._id !== adminUser?._id && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => setDeleteId(user._id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
