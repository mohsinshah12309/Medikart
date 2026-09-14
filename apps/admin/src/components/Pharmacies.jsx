import React, { useState, useEffect } from "react";
import { adminFetch, API_URL } from "../apiClient";

export default function Pharmacies({ token, onNavigateToOrders }) {

  const [activeTab, setActiveTab] = useState("directory"); // 'directory' | 'reports'
  const [pharmacies, setPharmacies] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Directory Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState(null);
  const [cityFilter, setCityFilter] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    cityIds: [],
    medikartPercentage: 5,
    active: true,
  });
  const [saving, setSaving] = useState(false);

  // Reports state
  const [reportsData, setReportsData] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPharmacyFilter, setSelectedPharmacyFilter] = useState("");

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    fetchPharmacies(cityFilter);
  }, [cityFilter]);

  useEffect(() => {
    if (activeTab === "reports") {
      fetchReports();
    }
  }, [activeTab, dateFilter, startDate, endDate, selectedPharmacyFilter, cityFilter]);

  const flash = (msg, isError = false) => {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => {
      setError("");
      setSuccess("");
    }, 4000);
  };

  const fetchCities = async () => {
    try {
      const data = await adminFetch("/admin/cities");
      setCities(data.data?.cities || data.data || []);
    } catch (_) {}
  };

  const fetchPharmacies = async (cityId = cityFilter) => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (cityId) params.append("city", cityId);
      const data = await adminFetch(`/admin/pharmacies${params.toString() ? `?${params.toString()}` : ""}`);
      setPharmacies(data.data?.pharmacies || []);
    } catch (err) {
      flash(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setReportsLoading(true);
      const params = new URLSearchParams();
      if (selectedPharmacyFilter) params.append("pharmacyId", selectedPharmacyFilter);
      if (cityFilter) params.append("city", cityFilter);

      let s = startDate;
      let e = endDate;

      const now = new Date();
      if (dateFilter === "today") {
        s = now.toISOString().split("T")[0];
        e = now.toISOString().split("T")[0];
      } else if (dateFilter === "7days") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        s = d.toISOString().split("T")[0];
        e = now.toISOString().split("T")[0];
      } else if (dateFilter === "month") {
        const d = new Date(now.getFullYear(), now.getMonth(), 1);
        s = d.toISOString().split("T")[0];
        e = now.toISOString().split("T")[0];
      }

      if (s) params.append("startDate", s);
      if (e) params.append("endDate", e);

      const data = await adminFetch(`/admin/pharmacies/reports?${params.toString()}`);
      setReportsData(data.data || null);
    } catch (err) {
      flash(err.message, true);
    } finally {
      setReportsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingPharmacy(null);
    setFormData({
      name: "",
      code: `PH-${Math.floor(100 + Math.random() * 900)}`,
      contactPerson: "",
      phone: "03314170744",
      email: "",
      address: "",
      cityIds: [],
      medikartPercentage: 5,
      active: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditingPharmacy(p);
    setFormData({
      name: p.name || "",
      code: p.code || "",
      contactPerson: p.contactPerson || "",
      phone: p.phone || "",
      email: p.email || "",
      address: p.address || "",
      cityIds: p.cityIds ? p.cityIds.map((c) => (typeof c === "object" ? c._id : c)) : [],
      medikartPercentage: p.medikartPercentage !== undefined ? p.medikartPercentage : 5,
      active: p.active !== false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim() || !formData.address.trim()) {
      flash("Name, Code, and Address are required.", true);
      return;
    }

    try {
      setSaving(true);
      const endpoint = editingPharmacy
        ? `/admin/pharmacies/${editingPharmacy._id}`
        : `/admin/pharmacies`;
      const method = editingPharmacy ? "PUT" : "POST";

      await adminFetch(endpoint, {
        method,
        body: JSON.stringify(formData),
      });

      flash(editingPharmacy ? "Pharmacy updated successfully!" : "Pharmacy registered successfully!");
      setShowModal(false);
      fetchPharmacies();
    } catch (err) {
      flash(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCity = (cityId) => {
    const current = [...formData.cityIds];
    const idx = current.indexOf(cityId);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(cityId);
    }
    setFormData({ ...formData, cityIds: current });
  };

  const handleToggleActive = async (p) => {
    try {
      await adminFetch(`/admin/pharmacies/${p._id}`, {
        method: "PUT",
        body: JSON.stringify({ active: !p.active }),
      });
      flash(`Pharmacy "${p.name}" is now ${!p.active ? "Active" : "Disabled"}.`);
      fetchPharmacies();
    } catch (err) {
      flash(err.message, true);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete pharmacy "${name}"?`)) return;
    try {
      await adminFetch(`/admin/pharmacies/${id}`, {
        method: "DELETE",
      });
      flash("Pharmacy deleted successfully!");
      fetchPharmacies();
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
            🏥 Pharmacy Management & Reports
          </h1>
          <p style={{ color: "#64748b", margin: "0.25rem 0 0 0", fontSize: "0.9rem" }}>
            Manage fulfillment branches, city delivery routing, and order performance metrics.
          </p>
        </div>
        {activeTab === "directory" && (
          <button
            className="btn btn-primary"
            onClick={handleOpenCreate}
            style={{ background: "#FFCB05", color: "#1E293B", fontWeight: "800", border: "1px solid rgba(245, 158, 11, 0.4)" }}
          >
            + Register Pharmacy Branch
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && <div className="alert alert-danger" style={{ marginBottom: "1rem" }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: "1rem" }}>{success}</div>}

      {/* Navigation Mode Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.5rem" }}>
        <button
          type="button"
          onClick={() => setActiveTab("directory")}
          style={{
            padding: "0.5rem 1.2rem",
            borderRadius: "9999px",
            border: "none",
            fontSize: "0.9rem",
            fontWeight: 800,
            cursor: "pointer",
            background: activeTab === "directory" ? "#FFCB05" : "transparent",
            color: activeTab === "directory" ? "#1E293B" : "#64748b",
            boxShadow: activeTab === "directory" ? "0 4px 14px rgba(245, 158, 11, 0.25)" : "none",
          }}
        >
          📍 Pharmacy Branches ({pharmacies.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          style={{
            padding: "0.5rem 1.2rem",
            borderRadius: "9999px",
            border: "none",
            fontSize: "0.9rem",
            fontWeight: 800,
            cursor: "pointer",
            background: activeTab === "reports" ? "#FFCB05" : "transparent",
            color: activeTab === "reports" ? "#1E293B" : "#64748b",
            boxShadow: activeTab === "reports" ? "0 4px 14px rgba(245, 158, 11, 0.25)" : "none",
          }}
        >
          📊 Fulfillment Reports & Analytics
        </button>
      </div>

      {/* TAB 1: PHARMACY DIRECTORY */}
      {activeTab === "directory" && (
        <>
          {/* City Filter Toolbar */}
          <div
            style={{
              background: "#ffffff",
              padding: "0.85rem 1.25rem",
              borderRadius: "14px",
              border: "1px solid #F3EFE6",
              marginBottom: "1.25rem",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1E293B", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                🏙️ Filter by City:
              </span>
              <select
                className="form-control"
                style={{
                  padding: "0.45rem 0.85rem",
                  fontSize: "0.875rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  minWidth: "180px",
                  maxWidth: "260px",
                  fontWeight: 600,
                }}
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              >
                <option value="">All Cities (Show All)</option>
                {cities.map((city) => (
                  <option key={city._id} value={city._id}>
                    {city.name} {city.code ? `(${city.code})` : ""}
                  </option>
                ))}
              </select>

              {cityFilter && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCityFilter("")}
                  style={{
                    padding: "0.4rem 0.75rem",
                    fontSize: "0.8rem",
                    borderRadius: "8px",
                    fontWeight: 600,
                    background: "#f1f5f9",
                    color: "#475569",
                  }}
                >
                  ✕ Clear Filter
                </button>
              )}
            </div>

            <div style={{ fontSize: "0.825rem", color: "#64748b", fontWeight: 600 }}>
              Showing <strong>{pharmacies.length}</strong> {pharmacies.length === 1 ? "pharmacy" : "pharmacies"}
              {cityFilter && cities.find((c) => c._id === cityFilter) ? (
                <span> in <strong style={{ color: "#1E293B" }}>{cities.find((c) => c._id === cityFilter)?.name}</strong></span>
              ) : ""}
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>Loading pharmacies...</div>
          ) : pharmacies.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
              <p style={{ color: "#64748b", fontWeight: 500 }}>
                {cityFilter ? "No pharmacies found matching the selected city." : "No pharmacy branches registered yet."}
              </p>
              {cityFilter ? (
                <button
                  className="btn btn-secondary"
                  onClick={() => setCityFilter("")}
                  style={{ marginTop: "0.75rem" }}
                >
                  Clear City Filter
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleOpenCreate} style={{ marginTop: "0.75rem", background: "#FFCB05", color: "#1E293B", fontWeight: 800 }}>
                  + Add First Pharmacy
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive" style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <table className="table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "0.75rem 1rem" }}>Branch Code</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Pharmacy Name & Contact</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Address</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Assigned Cities</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Medikart %</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pharmacies.map((p) => (
                    <tr key={p._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "0.75rem 1rem", fontWeight: "bold" }}>
                        <code style={{ background: "#f1f5f9", padding: "0.2rem 0.4rem", borderRadius: "4px" }}>{p.code}</code>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{p.name}</div>
                        <div style={{ color: "#64748b", fontSize: "0.8rem" }}>
                          📞 {p.phone} {p.contactPerson ? `• ${p.contactPerson}` : ""}
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#475569", fontSize: "0.85rem", maxWidth: "240px" }}>
                        {p.address}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        {p.cityIds && p.cityIds.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                            {p.cityIds.map((c) => (
                              <span
                                key={typeof c === "object" ? c._id : c}
                                style={{
                                  background: "#fef3c7",
                                  color: "#92400e",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  padding: "0.15rem 0.45rem",
                                  borderRadius: "999px",
                                }}
                              >
                                {typeof c === "object" ? c.name : "City"}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "0.8rem", fontStyle: "italic" }}>All unassigned cities</span>
                        )}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span
                          style={{
                            background: "#fef9c3",
                            color: "#854d0e",
                            fontSize: "0.8rem",
                            fontWeight: 800,
                            padding: "0.2rem 0.55rem",
                            borderRadius: "6px",
                            border: "1px solid #fde047",
                            display: "inline-block",
                          }}
                        >
                          {p.medikartPercentage !== undefined ? p.medikartPercentage : 0}%
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p)}
                          style={{
                            padding: "0.25rem 0.6rem",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            border: "none",
                            cursor: "pointer",
                            background: p.active ? "#dcfce7" : "#fee2e2",
                            color: p.active ? "#166534" : "#991b1b",
                          }}
                        >
                          {p.active ? "✓ Active" : "✕ Disabled"}
                        </button>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", marginRight: "0.4rem", background: "#f8fafc" }}
                          onClick={() => onNavigateToOrders && onNavigateToOrders({ pharmacyId: p._id, dateFilter: "all" })}
                          title={`View orders assigned to ${p.name}`}
                        >
                          📦 Orders
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", marginRight: "0.4rem" }}
                          onClick={() => handleOpenEdit(p)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                          onClick={() => handleDelete(p._id, p.name)}
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
        </>
      )}

      {/* TAB 2: REPORTS & ANALYTICS */}
      {activeTab === "reports" && (
        <div>
          {/* Reports Filter Controls */}
          <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>Date Period:</span>
              {[
                { key: "all", label: "All Time" },
                { key: "today", label: "Today" },
                { key: "7days", label: "Last 7 Days" },
                { key: "month", label: "This Month" },
                { key: "custom", label: "Custom Range" },
              ].map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setDateFilter(filter.key)}
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: dateFilter === filter.key ? "#0f172a" : "#f8fafc",
                    color: dateFilter === filter.key ? "#ffffff" : "#475569",
                  }}
                >
                  {filter.label}
                </button>
              ))}

              {dateFilter === "custom" && (
                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", marginLeft: "0.5rem" }}>
                  <input
                    type="date"
                    className="form-control"
                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <span>to</span>
                  <input
                    type="date"
                    className="form-control"
                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>🏙️ City:</span>
                <select
                  className="form-control"
                  style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                >
                  <option value="">All Cities</option>
                  {cities.map((city) => (
                    <option key={city._id} value={city._id}>
                      {city.name} {city.code ? `(${city.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>🏥 Pharmacy:</span>
                <select
                  className="form-control"
                  style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}
                  value={selectedPharmacyFilter}
                  onChange={(e) => setSelectedPharmacyFilter(e.target.value)}
                >
                  <option value="">All Pharmacies</option>
                  {pharmacies.map((ph) => (
                    <option key={ph._id} value={ph._id}>
                      {ph.name} ({ph.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          {reportsData?.summary && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              {/* Total Assigned Orders */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (onNavigateToOrders) {
                    onNavigateToOrders({
                      pharmacyId: selectedPharmacyFilter || "assigned",
                      dateFilter: dateFilter || "all",
                      startDate: dateFilter === "custom" ? startDate : "",
                      endDate: dateFilter === "custom" ? endDate : "",
                    });
                  }
                }}
                style={{
                  background: "white",
                  padding: "1.25rem",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  cursor: "pointer",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1)";
                  e.currentTarget.style.borderColor = "#3b82f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
                title={
                  selectedPharmacyFilter
                    ? "Click to view orders assigned to this pharmacy in Orders queue"
                    : "Click to view all assigned orders across branches in Orders queue"
                }
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase" }}>
                    Total Assigned Orders
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#2563eb", fontWeight: 700, display: "flex", alignItems: "center", gap: "2px" }}>
                    View &rarr;
                  </span>
                </div>
                <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0f172a", marginTop: "0.25rem" }}>
                  {reportsData.summary.totalAssignedOrders}
                </div>
              </div>

              {/* Total Revenue Fulfilled */}
              <div style={{ background: "white", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <span style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase" }}>Total Revenue Fulfilled</span>
                <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#16a34a", marginTop: "0.25rem" }}>
                  PKR {reportsData.summary.totalRevenueSum.toLocaleString()}
                </div>
              </div>

              {/* Total Medikart Share */}
              <div style={{ background: "white", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <span style={{ color: "#854d0e", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>Medikart Commission Share</span>
                <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#d97706", marginTop: "0.25rem" }}>
                  PKR {(reportsData.summary.totalMedikartShare || 0).toLocaleString()}
                </div>
              </div>

              {/* Delivered Orders */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (onNavigateToOrders) {
                    onNavigateToOrders({
                      pharmacyId: selectedPharmacyFilter || "assigned",
                      filterStatus: "delivered",
                      dateFilter: dateFilter || "all",
                      startDate: dateFilter === "custom" ? startDate : "",
                      endDate: dateFilter === "custom" ? endDate : "",
                    });
                  }
                }}
                style={{
                  background: "white",
                  padding: "1.25rem",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  cursor: "pointer",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1)";
                  e.currentTarget.style.borderColor = "#0284c7";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
                title="Click to view delivered orders in Orders queue"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase" }}>Delivered Orders</span>
                  <span style={{ fontSize: "0.75rem", color: "#0284c7", fontWeight: 700 }}>Open &rarr;</span>
                </div>
                <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0284c7", marginTop: "0.25rem" }}>
                  {reportsData.summary.totalDelivered}
                </div>
              </div>

              {/* Cancelled Orders */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (onNavigateToOrders) {
                    onNavigateToOrders({
                      pharmacyId: selectedPharmacyFilter || "assigned",
                      filterStatus: "cancelled",
                      dateFilter: dateFilter || "all",
                      startDate: dateFilter === "custom" ? startDate : "",
                      endDate: dateFilter === "custom" ? endDate : "",
                    });
                  }
                }}
                style={{
                  background: "white",
                  padding: "1.25rem",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  cursor: "pointer",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1)";
                  e.currentTarget.style.borderColor = "#dc2626";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
                title="Click to view cancelled orders in Orders queue"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase" }}>Cancelled Orders</span>
                  <span style={{ fontSize: "0.75rem", color: "#dc2626", fontWeight: 700 }}>Open &rarr;</span>
                </div>
                <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#dc2626", marginTop: "0.25rem" }}>
                  {reportsData.summary.totalCancelled}
                </div>
              </div>
            </div>
          )}

          {/* Reports Breakdown Table */}
          {(() => {
            const filteredReports = (reportsData?.reports || []).filter((r) => {
              if (!selectedPharmacyFilter) return true;
              return String(r.pharmacyId) === String(selectedPharmacyFilter);
            });

            if (reportsLoading) {
              return <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>Loading performance metrics...</div>;
            }

            if (filteredReports.length === 0) {
              return (
                <div style={{ padding: "2rem", textAlign: "center", background: "#f8fafc", borderRadius: "12px" }}>
                  No orders assigned to the selected pharmacy branch for this date range.
                </div>
              );
            }

            return (
              <div className="table-responsive" style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <table className="table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "0.75rem 1rem" }}>Branch</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Assigned Orders</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Total Revenue</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Medikart %</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Delivered</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Pending</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Cancelled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((r) => (
                    <tr key={r.pharmacyId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{r.name}</div>
                        <code style={{ fontSize: "0.75rem", color: "#64748b" }}>{r.code}</code>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateToOrders) {
                              onNavigateToOrders({
                                pharmacyId: r.pharmacyId,
                                dateFilter: dateFilter || "all",
                                startDate: dateFilter === "custom" ? startDate : "",
                                endDate: dateFilter === "custom" ? endDate : "",
                              });
                            }
                          }}
                          style={{
                            background: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            padding: "0.25rem 0.65rem",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: 700,
                            color: "#1d4ed8",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            fontSize: "0.875rem",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#dbeafe";
                            e.currentTarget.style.borderColor = "#93c5fd";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#eff6ff";
                            e.currentTarget.style.borderColor = "#bfdbfe";
                          }}
                          title={`Click to view all ${r.totalOrders} orders assigned to ${r.name}`}
                        >
                          <span>{r.totalOrders}</span>
                          <span style={{ fontSize: "0.75rem", color: "#2563eb", fontWeight: 700 }}>View &rarr;</span>
                        </button>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#16a34a" }}>
                        PKR {r.totalRevenue.toLocaleString()}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                          <span
                            style={{
                              background: "#fef9c3",
                              color: "#854d0e",
                              fontSize: "0.85rem",
                              fontWeight: 800,
                              padding: "0.2rem 0.55rem",
                              borderRadius: "6px",
                              border: "1px solid #fde047",
                            }}
                          >
                            {r.medikartPercentage !== undefined ? r.medikartPercentage : 0}%
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                            (PKR {(r.medikartRevenueShare !== undefined ? r.medikartRevenueShare : Math.round(((r.totalRevenue || 0) * (r.medikartPercentage || 0)) / 100)).toLocaleString()})
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        {r.deliveredOrders > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              onNavigateToOrders &&
                              onNavigateToOrders({
                                pharmacyId: r.pharmacyId,
                                filterStatus: "delivered",
                                dateFilter: dateFilter || "all",
                                startDate: dateFilter === "custom" ? startDate : "",
                                endDate: dateFilter === "custom" ? endDate : "",
                              })
                            }
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#0284c7",
                              fontWeight: 700,
                              cursor: "pointer",
                              textDecoration: "underline",
                              padding: 0,
                            }}
                            title={`View ${r.deliveredOrders} delivered orders for ${r.name}`}
                          >
                            {r.deliveredOrders}
                          </button>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>0</span>
                        )}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        {r.pendingOrders > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              onNavigateToOrders &&
                              onNavigateToOrders({
                                pharmacyId: r.pharmacyId,
                                filterStatus: "pending",
                                dateFilter: dateFilter || "all",
                                startDate: dateFilter === "custom" ? startDate : "",
                                endDate: dateFilter === "custom" ? endDate : "",
                              })
                            }
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#d97706",
                              fontWeight: 700,
                              cursor: "pointer",
                              textDecoration: "underline",
                              padding: 0,
                            }}
                            title={`View ${r.pendingOrders} pending orders for ${r.name}`}
                          >
                            {r.pendingOrders}
                          </button>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>0</span>
                        )}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        {r.cancelledOrders > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              onNavigateToOrders &&
                              onNavigateToOrders({
                                pharmacyId: r.pharmacyId,
                                filterStatus: "cancelled",
                                dateFilter: dateFilter || "all",
                                startDate: dateFilter === "custom" ? startDate : "",
                                endDate: dateFilter === "custom" ? endDate : "",
                              })
                            }
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#dc2626",
                              fontWeight: 700,
                              cursor: "pointer",
                              textDecoration: "underline",
                              padding: 0,
                            }}
                            title={`View ${r.cancelledOrders} cancelled orders for ${r.name}`}
                          >
                            {r.cancelledOrders}
                          </button>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
        </div>
      )}

      {/* Create / Edit Pharmacy Modal */}
      {showModal && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div className="modal-card" style={{ background: "white", borderRadius: "16px", padding: "1.5rem", maxWidth: "580px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: "0 0 1rem 0" }}>
              {editingPharmacy ? "Edit Pharmacy Branch" : "Register Pharmacy Branch"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div className="form-group">
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Pharmacy Name *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Medikart Main Branch Lahore"
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Branch Code *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1", textTransform: "uppercase" }}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="LHR-01"
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div className="form-group">
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Contact Phone *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="03314170744"
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Contact Person
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Dr. Ahmed"
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Medikart % Commission
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      className="form-control"
                      style={{ width: "100%", padding: "0.5rem 1.75rem 0.5rem 0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: 700 }}
                      value={formData.medikartPercentage}
                      onChange={(e) => setFormData({ ...formData, medikartPercentage: e.target.value === "" ? "" : Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })}
                      placeholder="e.g. 5"
                    />
                    <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontWeight: 800, fontSize: "0.85rem" }}>%</span>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  Physical Address *
                </label>
                <textarea
                  className="form-control"
                  rows="2"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, Sector, City..."
                  required
                />
              </div>

              {/* City Multi-Select Association */}
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                  Delivery Cities Served by this Branch
                </label>
                <div style={{ maxHeight: "120px", overflowY: "auto", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "0.5rem", background: "#f8fafc" }}>
                  {cities.length === 0 ? (
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>No delivery cities available.</span>
                  ) : (
                    cities.map((c) => (
                      <label key={c._id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0", fontSize: "0.85rem", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={formData.cityIds.includes(c._id)}
                          onChange={() => handleToggleCity(c._id)}
                        />
                        <span>{c.name} (PKR {c.deliveryCharge})</span>
                      </label>
                    ))
                  )}
                </div>
                <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem", display: "block" }}>
                  🔒 Confidential: City associations are internal to admin routing and never shown to storefront customers.
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                <input
                  type="checkbox"
                  id="pharmacyActiveToggle"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  style={{ width: "16px", height: "16px" }}
                />
                <label htmlFor="pharmacyActiveToggle" style={{ fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                  Active Branch (Available for Order Fulfillment Assignment)
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
                  style={{ background: "#FFCB05", color: "#1E293B", fontWeight: "800", border: "1px solid rgba(245, 158, 11, 0.4)" }}
                  disabled={saving}
                >
                  {saving ? "Saving..." : editingPharmacy ? "Save Changes" : "Register Pharmacy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
