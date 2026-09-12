import React, { useState, useEffect } from "react";
import { adminFetch } from "../apiClient";

function Overview({ token, adminUser, onNavigateToOrders, onNavigateToProducts, onNavigateToPharmacies }) {
  const apiUrl = import.meta.env.VITE_API_URL || "/api/v1";

  const isSuperAdmin = adminUser?.role === "super_admin";
  const userPerms = Array.isArray(adminUser?.permissions) ? adminUser.permissions : [];
  const canAccess = (...perms) => isSuperAdmin || perms.some((p) => userPerms.includes(p));

  const canViewOrders = canAccess("view_orders", "manage_orders");
  const canViewProducts = canAccess("view_products", "manage_products");

  const [stats, setStats] = useState({
    todayOrders: 0,
    totalOrders: 0,
    totalProducts: 0,
    narcoticsPending: 0,
    pricingPending: 0,
    totalSale: 0,
    todaySale: 0,
    medikartCommission: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Excel Export States
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportDatePreset, setExportDatePreset] = useState("today");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportStatus, setExportStatus] = useState("");
  const [exportType, setExportType] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  // Calculate PKT dates helper
  const getPKTDate = (offsetDays = 0) => {
    const now = new Date();
    const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;
    const pktTime = new Date(now.getTime() + PKT_OFFSET_MS - offsetDays * 24 * 60 * 60 * 1000);
    return pktTime.toISOString().split("T")[0];
  };

  const handleOpenExportModal = () => {
    setExportDatePreset("today");
    setExportStartDate(getPKTDate(0));
    setExportEndDate(getPKTDate(0));
    setExportStatus("");
    setExportType("");
    setIsExportModalOpen(true);
  };

  const handleExportPresetChange = (preset) => {
    setExportDatePreset(preset);
    if (preset === "today") {
      setExportStartDate(getPKTDate(0));
      setExportEndDate(getPKTDate(0));
    } else if (preset === "yesterday") {
      setExportStartDate(getPKTDate(1));
      setExportEndDate(getPKTDate(1));
    } else if (preset === "7days") {
      setExportStartDate(getPKTDate(7));
      setExportEndDate(getPKTDate(0));
    } else if (preset === "month") {
      const now = new Date();
      setExportStartDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`);
      setExportEndDate(getPKTDate(0));
    } else if (preset === "all") {
      setExportStartDate("");
      setExportEndDate("");
    }
  };

  const handleDownloadExcel = async (e) => {
    if (e) e.preventDefault();
    try {
      setExportLoading(true);
      setError("");

      let s = exportStartDate;
      let eDate = exportEndDate;

      if (exportDatePreset === "today") {
        s = getPKTDate(0);
        eDate = getPKTDate(0);
      } else if (exportDatePreset === "yesterday") {
        s = getPKTDate(1);
        eDate = getPKTDate(1);
      } else if (exportDatePreset === "7days") {
        s = getPKTDate(7);
        eDate = getPKTDate(0);
      } else if (exportDatePreset === "month") {
        const now = new Date();
        s = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
        eDate = getPKTDate(0);
      } else if (exportDatePreset === "all") {
        s = "";
        eDate = "";
      }

      const params = [];
      if (s) params.push(`startDate=${encodeURIComponent(s)}`);
      if (eDate) params.push(`endDate=${encodeURIComponent(eDate)}`);
      if (exportStatus) params.push(`status=${encodeURIComponent(exportStatus)}`);
      if (exportType) params.push(`type=${encodeURIComponent(exportType)}`);

      let endpoint = `/admin/orders/export/excel${params.length > 0 ? `?${params.join("&")}` : ""}`;
      const fullUrl = endpoint.startsWith("http") ? endpoint : `${apiUrl}${endpoint}`;

      const res = await fetch(fullUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Export failed with status ${res.status}`);
      }

      let filename = `Medikart_Orders_${s || "all"}_to_${eDate || "all"}.xlsx`;
      const disposition = res.headers.get("Content-Disposition");
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setSuccessMsg(`Excel report "${filename}" downloaded successfully.`);
      setIsExportModalOpen(false);
    } catch (err) {
      setError(err.message || "Failed to download Excel report.");
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [adminUser]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError("");

      let orderStats = {
        todayOrders: 0,
        totalOrders: 0,
        narcoticsPending: 0,
        pricingPending: 0,
        totalSale: 0,
        todaySale: 0,
        medikartCommission: 0,
      };
      let productCount = 0;

      // 1. Fetch order stats only if authorized
      if (canViewOrders || canAccess("view_pharmacies", "manage_pharmacies")) {
        try {
          const dataStats = await adminFetch("/admin/orders/stats");
          if (dataStats.data) {
            orderStats = dataStats.data;
          }
        } catch (err) {
          console.error("Order stats fetch error:", err);
        }
      }

      // 2. Fetch product count only if authorized
      if (canViewProducts) {
        try {
          const dataProducts = await adminFetch("/admin/products?limit=1");
          productCount = dataProducts.pagination?.total || 0;
        } catch (err) {
          console.error("Products count fetch error:", err);
        }
      }

      setStats({
        todayOrders: orderStats.todayOrders ?? 0,
        totalOrders: orderStats.totalOrders ?? 0,
        narcoticsPending: orderStats.narcoticsPending ?? 0,
        pricingPending: orderStats.pricingPending ?? 0,
        totalSale: orderStats.totalSale ?? 0,
        todaySale: orderStats.todaySale ?? 0,
        medikartCommission: orderStats.medikartCommission ?? 0,
        totalProducts: productCount,
      });
    } catch (err) {
      setError("Failed to fetch dashboard statistics: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Overview Dashboard</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {canViewOrders && (
            <button
              className="btn btn-primary"
              onClick={handleOpenExportModal}
              disabled={exportLoading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "#059669",
                borderColor: "#047857",
                color: "#ffffff",
                fontWeight: "bold",
                boxShadow: "0 2px 4px rgba(5, 150, 105, 0.2)",
              }}
              title="Download Orders Excel (.xlsx) report"
            >
              <span>📥</span>
              <span>{exportLoading ? "Exporting..." : "Download Excel"}</span>
            </button>
          )}
          <button className="btn btn-secondary" onClick={fetchStats}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", fontSize: "1.2rem", color: "#64748b" }}>
          Loading dashboard metrics...
        </div>
      ) : (
        <>
          {/* Subadmin Role & Scope Banner */}
          {!isSuperAdmin && (
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderLeft: "4px solid #f59e0b",
                borderRadius: "10px",
                padding: "1rem 1.25rem",
                marginBottom: "1.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>
                    👋 Welcome, {adminUser?.name || "Sub-Admin"}
                  </h4>
                  <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.8rem", color: "#64748b" }}>
                    Your account is configured with specific role-based permissions granted by the Super Admin.
                  </p>
                </div>
                <span
                  style={{
                    background: "#fef3c7",
                    color: "#92400e",
                    border: "1px solid #fde047",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "0.25rem 0.65rem",
                    borderRadius: "9999px",
                    textTransform: "uppercase",
                  }}
                >
                  Role: Sub-Admin
                </span>
              </div>

              {userPerms.length > 0 && (
                <div style={{ marginTop: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>Granted Permissions:</span>
                  {userPerms.map((perm) => (
                    <span
                      key={perm}
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        background: "#ffffff",
                        color: "#334155",
                        border: "1px solid #cbd5e1",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "6px",
                      }}
                    >
                      ✓ {perm.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>

            {/* Today's Orders (Orders Permission) */}
            {canViewOrders && (
              <div
                className="card"
                role="button"
                tabIndex={0}
                onClick={() => onNavigateToOrders && onNavigateToOrders({ dateFilter: "today", filterStatus: "", filterType: "" })}
                style={{
                  padding: "1.5rem",
                  borderLeft: "5px solid #eab308",
                  background: "#ffffff",
                  cursor: "pointer",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase" }}>
                    Today's Orders
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "#ca8a04", fontWeight: 700 }}>Open →</span>
                </div>
                <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#0f172a", margin: "0.5rem 0" }}>
                  {stats.todayOrders}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>
                  Orders placed since midnight PKT
                </div>
              </div>
            )}

            {/* Total Orders (Orders Permission) */}
            {canViewOrders && (
              <div
                className="card"
                role="button"
                tabIndex={0}
                onClick={() => onNavigateToOrders && onNavigateToOrders({ dateFilter: "all", filterStatus: "", filterType: "" })}
                style={{
                  padding: "1.5rem",
                  borderLeft: "5px solid #facc15",
                  background: "#ffffff",
                  cursor: "pointer",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase" }}>
                    Total Orders (All Time)
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "#ca8a04", fontWeight: 700 }}>Open →</span>
                </div>
                <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#0f172a", margin: "0.5rem 0" }}>
                  {stats.totalOrders}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>
                  Cumulative order count in database
                </div>
              </div>
            )}

            {/* Total Sale Card (Orders Permission) */}
            {canViewOrders && (
              <div
                className="card"
                role="button"
                tabIndex={0}
                onClick={() => onNavigateToOrders && onNavigateToOrders({ dateFilter: "all", filterStatus: "", filterType: "" })}
                style={{
                  padding: "1.5rem",
                  borderLeft: "5px solid #10b981",
                  background: "#ffffff",
                  cursor: "pointer",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: "#065f46", fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase" }}>
                    💰 Total Sale
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 700 }}>Orders →</span>
                </div>
                <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#065f46", margin: "0.5rem 0" }}>
                  PKR {stats.totalSale ? stats.totalSale.toLocaleString() : "0"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#047857", fontWeight: 500 }}>
                  Today: <strong>PKR {stats.todaySale ? stats.todaySale.toLocaleString() : "0"}</strong> • Gross revenue
                </div>
              </div>
            )}

            {/* Medikart Commission Card (Orders or Pharmacies Permission) */}
            {(canViewOrders || canAccess("view_pharmacies", "manage_pharmacies")) && (
              <div
                className="card"
                role="button"
                tabIndex={0}
                onClick={() => onNavigateToPharmacies ? onNavigateToPharmacies() : (onNavigateToOrders && onNavigateToOrders({ dateFilter: "all" }))}
                style={{
                  padding: "1.5rem",
                  borderLeft: "5px solid #6366f1",
                  background: "#ffffff",
                  cursor: "pointer",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: "#3730a3", fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase" }}>
                    📈 Medikart Commission
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "#4f46e5", fontWeight: 700 }}>Branches →</span>
                </div>
                <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#3730a3", margin: "0.5rem 0" }}>
                  PKR {stats.medikartCommission ? stats.medikartCommission.toLocaleString() : "0"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#4338ca", fontWeight: 500 }}>
                  Platform share from partner fulfillment
                </div>
              </div>
            )}

            {/* Total Products (Products Permission) */}
            {canViewProducts && (
              <div
                className="card"
                role="button"
                tabIndex={0}
                onClick={() => onNavigateToProducts && onNavigateToProducts()}
                style={{
                  padding: "1.5rem",
                  borderLeft: "5px solid #0f172a",
                  background: "#ffffff",
                  cursor: "pointer",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase" }}>
                    Total Products
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "#0f172a", fontWeight: 700 }}>Manage →</span>
                </div>
                <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#0f172a", margin: "0.5rem 0" }}>
                  {stats.totalProducts}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>
                  Total active catalog size
                </div>
              </div>
            )}

            {/* Narcotics Needing Review (Orders Permission) */}
            {canViewOrders && (
              <div
                className="card"
                role="button"
                tabIndex={0}
                onClick={() => onNavigateToOrders && onNavigateToOrders({ filterStatus: "pending_verification", dateFilter: "all" })}
                style={{
                  padding: "1.5rem",
                  borderLeft: "5px solid #d97706",
                  background: "#ffffff",
                  cursor: "pointer",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: "#854d0e", fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase" }}>
                    Narcotics Verification
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "#b45309", fontWeight: 700 }}>Review →</span>
                </div>
                <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#b45309", margin: "0.5rem 0" }}>
                  {stats.narcoticsPending}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#854d0e", fontWeight: 600 }}>
                  Orders awaiting prescription check
                </div>
              </div>
            )}

            {/* Instant Orders Needing Pricing (Orders Permission) */}
            {canViewOrders && (
              <div
                className="card"
                role="button"
                tabIndex={0}
                onClick={() => onNavigateToOrders && onNavigateToOrders({ filterStatus: "awaiting-pharmacist-pricing", dateFilter: "all" })}
                style={{
                  padding: "1.5rem",
                  borderLeft: "5px solid #ca8a04",
                  background: "#ffffff",
                  cursor: "pointer",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: "#854d0e", fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase" }}>
                    Awaiting Pharmacist Pricing
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "#ca8a04", fontWeight: 700 }}>Price Now →</span>
                </div>
                <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#854d0e", margin: "0.5rem 0" }}>
                  {stats.pricingPending}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#854d0e", fontWeight: 600 }}>
                  Instant orders needing priced items
                </div>
              </div>
            )}

          </div>

          {/* Quick Info & Action Needed Summary (Only for Order managers) */}
          {canViewOrders && (
            <div className="card" style={{ padding: "2rem", background: "#ffffff" }}>
              <h3 style={{ margin: "0 0 1rem 0", color: "#0f172a", fontSize: "1.2rem", fontWeight: 800 }}>🔔 Immediate Action Required</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 1rem", background: "#fef9c3", borderRadius: "10px", border: "1px solid #fde047" }}>
                  <span style={{ color: "#854d0e", fontWeight: 700 }}>Narcotics Prescriptions to Verify</span>
                  <span className="badge badge-narcotic" style={{ padding: "0.3rem 0.85rem", fontSize: "0.85rem" }}>
                    {stats.narcoticsPending} pending review
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 1rem", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <span style={{ color: "#0f172a", fontWeight: 700 }}>Unpriced Instant Orders</span>
                  <span className="badge" style={{ background: "#fef08a", color: "#854d0e", padding: "0.3rem 0.85rem", fontSize: "0.85rem", fontWeight: 700, borderRadius: '9999px', border: '1px solid #facc15' }}>
                    {stats.pricingPending} awaiting items
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Excel Export Modal */}
      {isExportModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "580px" }}>
            <div className="modal-header" style={{ borderBottom: "1px solid #bbf7d0", background: "#f0fdf4", borderRadius: "12px 12px 0 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.3rem" }}>📊</span>
                <h3 style={{ color: "#166534", margin: 0, fontSize: "1.15rem", fontWeight: 800 }}>
                  Download Orders Excel Spreadsheet
                </h3>
              </div>
              <button className="modal-close" onClick={() => setIsExportModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleDownloadExcel}>
              <div className="modal-body" style={{ padding: "1.25rem" }}>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.85rem", color: "#475569" }}>
                  <p style={{ margin: 0 }}>
                    Export comprehensive order records, pricing breakdowns, platform commissions, and customer delivery information into a Microsoft Excel (.xlsx) file.
                  </p>
                </div>

                {/* Date Presets */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.4rem", color: "#1e293b" }}>
                    Select Date Range Preset:
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                    {[
                      { key: "today", label: "Today" },
                      { key: "yesterday", label: "Yesterday" },
                      { key: "7days", label: "Last 7 Days" },
                      { key: "month", label: "This Month" },
                      { key: "all", label: "All Orders History" },
                      { key: "custom", label: "Custom Dates" },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleExportPresetChange(item.key)}
                        style={{
                          border: "1px solid",
                          borderColor: exportDatePreset === item.key ? "#059669" : "#cbd5e1",
                          background: exportDatePreset === item.key ? "#ecfdf5" : "#ffffff",
                          color: exportDatePreset === item.key ? "#047857" : "#475569",
                          fontWeight: exportDatePreset === item.key ? 700 : 500,
                          borderRadius: "6px",
                          padding: "0.35rem 0.65rem",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Explicit Start / End Date Pickers */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.25rem", color: "#475569" }}>
                      From (Start Date):
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={exportStartDate}
                      onChange={(e) => {
                        setExportStartDate(e.target.value);
                        setExportDatePreset("custom");
                      }}
                      style={{ fontSize: "0.85rem", padding: "0.4rem 0.6rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.25rem", color: "#475569" }}>
                      To (End Date):
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={exportEndDate}
                      onChange={(e) => {
                        setExportEndDate(e.target.value);
                        setExportDatePreset("custom");
                      }}
                      style={{ fontSize: "0.85rem", padding: "0.4rem 0.6rem" }}
                    />
                  </div>
                </div>

                {/* Filter Options */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.25rem", color: "#475569" }}>
                      Order Status Filter (Optional):
                    </label>
                    <select
                      className="form-control"
                      value={exportStatus}
                      onChange={(e) => setExportStatus(e.target.value)}
                      style={{ fontSize: "0.85rem", padding: "0.4rem 0.6rem" }}
                    >
                      <option value="">All Statuses</option>
                      <option value="delivered">Delivered / Completed</option>
                      <option value="pending">Pending Fulfillment</option>
                      <option value="packed">Packed</option>
                      <option value="shipped">Shipped</option>
                      <option value="awaiting-pharmacist-pricing">Awaiting Pharmacist Pricing</option>
                      <option value="pending_verification">Pending Narcotics Review</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.25rem", color: "#475569" }}>
                      Order Type Filter (Optional):
                    </label>
                    <select
                      className="form-control"
                      value={exportType}
                      onChange={(e) => setExportType(e.target.value)}
                      style={{ fontSize: "0.85rem", padding: "0.4rem 0.6rem" }}
                    >
                      <option value="">All Order Types</option>
                      <option value="standard">Standard Catalog Orders</option>
                      <option value="instant">Instant Prescription Orders</option>
                      <option value="narcotics">Narcotics Prescription Orders</option>
                    </select>
                  </div>
                </div>

                {!isSuperAdmin && adminUser?.assignedPharmacyId && (
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", padding: "0.5rem 0.75rem", fontSize: "0.8rem", color: "#166534" }}>
                    ℹ️ <strong>Scope Notice:</strong> Only orders assigned to your designated pharmacy branch will be exported.
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsExportModalOpen(false)}
                  disabled={exportLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    background: "#059669",
                    borderColor: "#047857",
                    color: "#ffffff",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.5rem 1.25rem",
                  }}
                  disabled={exportLoading}
                >
                  <span>📥</span>
                  <span>{exportLoading ? "Generating Excel..." : "Download Excel (.xlsx)"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Overview;
