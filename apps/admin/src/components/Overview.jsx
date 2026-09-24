import React, { useState, useEffect } from "react";
import { adminFetch, API_URL } from "../apiClient";

function Overview({ token, adminUser, onNavigateToOrders, onNavigateToProducts, onNavigateToPharmacies }) {

  const isSuperAdmin = adminUser?.role === "super_admin";
  const userPerms = Array.isArray(adminUser?.permissions) ? adminUser.permissions : [];
  const canAccess = (...perms) => isSuperAdmin || perms.some((p) => userPerms.includes(p));

  const canViewOrders = canAccess("view_orders", "manage_orders");
  const canViewProducts = canAccess("view_products", "manage_products");

  const [filterPaymentMethod, setFilterPaymentMethod] = useState("");
  const [filterPharmacyId, setFilterPharmacyId] = useState(
    !isSuperAdmin && adminUser?.assignedPharmacyId ? adminUser.assignedPharmacyId : ""
  );
  const [pharmacies, setPharmacies] = useState([]);

  const [stats, setStats] = useState({
    todayOrders: 0,
    totalOrders: 0,
    totalProducts: 0,
    narcoticsPending: 0,
    pricingPending: 0,
    totalSale: 0,
    todaySale: 0,
    medikartCommission: 0,
    totalCommissionPaid: 0,
    cod: { totalOrders: 0, todayOrders: 0, totalSale: 0, todaySale: 0 },
    card: { totalOrders: 0, todayOrders: 0, totalSale: 0, todaySale: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Commission Paid Breakdown Modal States
  const [isCommissionPaidModalOpen, setIsCommissionPaidModalOpen] = useState(false);
  const [commPaidDatePreset, setCommPaidDatePreset] = useState("all");
  const [commPaidStartDate, setCommPaidStartDate] = useState("");
  const [commPaidEndDate, setCommPaidEndDate] = useState("");
  const [commPaidPharmacyFilter, setCommPaidPharmacyFilter] = useState("");
  const [commPaidLoading, setCommPaidLoading] = useState(false);
  const [commPaidData, setCommPaidData] = useState(null);
  const [commPaidError, setCommPaidError] = useState("");
  const [expandedBranchId, setExpandedBranchId] = useState(null);
  const [previewScreenshot, setPreviewScreenshot] = useState("");

  // Excel Export States
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportDatePreset, setExportDatePreset] = useState("today");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportStatus, setExportStatus] = useState("");
  const [exportType, setExportType] = useState("");
  const [exportPaymentMethod, setExportPaymentMethod] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  // Calculate PKT dates helper
  const getPKTDate = (offsetDays = 0) => {
    const now = new Date();
    const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;
    const pktTime = new Date(now.getTime() + PKT_OFFSET_MS - offsetDays * 24 * 60 * 60 * 1000);
    return pktTime.toISOString().split("T")[0];
  };

  const resolveImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const base = API_URL.replace(/\/api\/v1\/?$/, "");
    return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  const handleOpenCommissionPaidModal = () => {
    setIsCommissionPaidModalOpen(true);
    fetchCommissionPaidSummary(commPaidDatePreset, commPaidStartDate, commPaidEndDate, commPaidPharmacyFilter);
  };

  const fetchCommissionPaidSummary = async (preset = commPaidDatePreset, sDate = commPaidStartDate, eDate = commPaidEndDate, phFilter = commPaidPharmacyFilter) => {
    try {
      setCommPaidLoading(true);
      setCommPaidError("");

      const params = new URLSearchParams();
      if (preset && preset !== "custom") params.append("datePreset", preset);
      if (preset === "custom") {
        if (sDate) params.append("startDate", sDate);
        if (eDate) params.append("endDate", eDate);
      }
      if (phFilter) params.append("pharmacyId", phFilter);

      const res = await adminFetch(`/admin/commissions/paid-summary?${params.toString()}`);
      setCommPaidData(res.data || null);
    } catch (err) {
      setCommPaidError(err.message || "Failed to load commission payment breakdown");
    } finally {
      setCommPaidLoading(false);
    }
  };

  const handleCommPaidPresetChange = (preset) => {
    setCommPaidDatePreset(preset);
    let s = "";
    let e = "";
    if (preset === "today") {
      s = getPKTDate(0);
      e = getPKTDate(0);
    } else if (preset === "yesterday") {
      s = getPKTDate(1);
      e = getPKTDate(1);
    } else if (preset === "7days") {
      s = getPKTDate(7);
      e = getPKTDate(0);
    } else if (preset === "month") {
      const now = new Date();
      s = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      e = getPKTDate(0);
    }
    setCommPaidStartDate(s);
    setCommPaidEndDate(e);
    fetchCommissionPaidSummary(preset, s, e, commPaidPharmacyFilter);
  };

  const handleOpenExportModal = () => {
    setExportDatePreset("today");
    setExportStartDate(getPKTDate(0));
    setExportEndDate(getPKTDate(0));
    setExportStatus("");
    setExportType("");
    setExportPaymentMethod(filterPaymentMethod || "");
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
      if (exportPaymentMethod) params.push(`paymentMethod=${encodeURIComponent(exportPaymentMethod)}`);
      if (!isSuperAdmin && adminUser?.assignedPharmacyId) {
        params.push(`pharmacyId=${encodeURIComponent(adminUser.assignedPharmacyId)}`);
      } else if (filterPharmacyId) {
        params.push(`pharmacyId=${encodeURIComponent(filterPharmacyId)}`);
      }

      let endpoint = `/admin/orders/export/excel${params.length > 0 ? `?${params.join("&")}` : ""}`;
      const res = await adminFetch(endpoint, {
        returnRawResponse: true,
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
    if (isSuperAdmin) {
      adminFetch("/admin/pharmacies")
        .then((res) => setPharmacies(res.data?.pharmacies || []))
        .catch(() => {});
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchStats();
  }, [adminUser, filterPaymentMethod, filterPharmacyId]);

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
        totalCommissionPaid: 0,
        cod: { totalOrders: 0, todayOrders: 0, totalSale: 0, todaySale: 0 },
        card: { totalOrders: 0, todayOrders: 0, totalSale: 0, todaySale: 0 },
      };
      let productCount = 0;

      // 1. Fetch order stats only if authorized
      if (canViewOrders || canAccess("view_pharmacies", "manage_pharmacies")) {
        try {
          const params = new URLSearchParams();
          if (filterPaymentMethod) params.append("paymentMethod", filterPaymentMethod);
          if (filterPharmacyId && isSuperAdmin) params.append("pharmacyId", filterPharmacyId);

          const dataStats = await adminFetch(`/admin/orders/stats${params.toString() ? `?${params.toString()}` : ""}`);
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
        totalCommissionPaid: orderStats.totalCommissionPaid ?? 0,
        totalProducts: productCount,
        cod: orderStats.cod || { totalOrders: 0, todayOrders: 0, totalSale: 0, todaySale: 0 },
        card: orderStats.card || { totalOrders: 0, todayOrders: 0, totalSale: 0, todaySale: 0 },
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

      {/* Global Dashboard Filters Bar (Payment Method & Branch Scoping) */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "0.85rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        {/* Payment Method Filter */}
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155", display: "flex", alignItems: "center", gap: "4px" }}>
            💳 Payment Filter:
          </span>
          {[
            { key: "", label: "All Payment Methods" },
            { key: "cod", label: "💵 Cash on Delivery (COD)" },
            { key: "card", label: "💳 Card / CC (Credit/Debit)" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilterPaymentMethod(item.key)}
              style={{
                border: "1px solid",
                borderColor: filterPaymentMethod === item.key ? "#0284c7" : "#cbd5e1",
                background: filterPaymentMethod === item.key ? "#e0f2fe" : "#ffffff",
                color: filterPaymentMethod === item.key ? "#0369a1" : "#475569",
                fontWeight: filterPaymentMethod === item.key ? 700 : 500,
                borderRadius: "6px",
                padding: "0.3rem 0.65rem",
                fontSize: "0.8rem",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Pharmacy Branch Scoping Filter (Super Admin Only) or Branch Badge (Subadmin) */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {isSuperAdmin ? (
            <>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>
                🏥 Pharmacy Branch:
              </span>
              <select
                className="form-control"
                value={filterPharmacyId}
                onChange={(e) => setFilterPharmacyId(e.target.value)}
                style={{ fontSize: "0.85rem", padding: "0.3rem 0.6rem", width: "auto", minWidth: "180px" }}
              >
                <option value="">All Pharmacy Branches</option>
                {pharmacies.map((ph) => (
                  <option key={ph._id} value={ph._id}>
                    {ph.name} ({ph.code})
                  </option>
                ))}
              </select>
            </>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.3rem 0.75rem",
                borderRadius: "6px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "#166534",
              }}
            >
              <span>🏥 Branch Scope:</span>
              <span>{adminUser?.assignedPharmacyName || "Designated Pharmacy"}</span>
            </div>
          )}
        </div>
      </div>

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
                    Your account metrics are scoped specifically to your assigned pharmacy branch.
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
                onClick={() => onNavigateToOrders && onNavigateToOrders({ dateFilter: "today", filterStatus: "", filterType: "", filterPaymentMethod })}
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
                onClick={() => onNavigateToOrders && onNavigateToOrders({ dateFilter: "all", filterStatus: "", filterType: "", filterPaymentMethod })}
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

            {/* Medikart Commission (Accrued) Card (Orders or Pharmacies Permission) */}
            {(canViewOrders || canAccess("view_pharmacies", "manage_pharmacies")) && (
              <div
                className="card"
                role="button"
                tabIndex={0}
                onClick={() => onNavigateToPharmacies ? onNavigateToPharmacies("commissions") : (onNavigateToOrders && onNavigateToOrders({ dateFilter: "all" }))}
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
                    📈 Commission Accrued
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

            {/* Medikart Commission Paid Functional Card (Redirects to Pharmacy Commission section) */}
            {(canViewOrders || canAccess("view_pharmacies", "manage_pharmacies")) && (
              <div
                className="card"
                role="button"
                tabIndex={0}
                onClick={() => onNavigateToPharmacies ? onNavigateToPharmacies("commissions") : null}
                style={{
                  padding: "1.5rem",
                  borderLeft: "5px solid #059669",
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
                title="Click to open Pharmacy Commission & Payments section"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: "#065f46", fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase" }}>
                    💵 Commission Paid
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 700, background: "#ecfdf5", padding: "0.15rem 0.45rem", borderRadius: "4px" }}>
                    Branches →
                  </span>
                </div>
                <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#065f46", margin: "0.5rem 0" }}>
                  PKR {stats.totalCommissionPaid ? stats.totalCommissionPaid.toLocaleString() : "0"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#047857", fontWeight: 500 }}>
                  Total verified receipts received • <strong>Click to manage</strong>
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

          {/* COD vs CC Sales & Order Performance Breakdown */}
          {canViewOrders && (
            <div className="card" style={{ padding: "1.75rem", background: "#ffffff", marginBottom: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ margin: 0, color: "#0f172a", fontSize: "1.2rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span>💳</span> Payment Methods & Sales Analysis (COD vs CC)
                  </h3>
                  <p style={{ margin: "0.25rem 0 0 0", color: "#64748b", fontSize: "0.85rem" }}>
                    Comparative breakdown of Cash on Delivery (COD) vs Habib Metro Credit/Debit Card (CC) fulfillment and volume.
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
                    onClick={() => onNavigateToOrders && onNavigateToOrders({ dateFilter: "all", filterPaymentMethod: "" })}
                  >
                    View All Orders →
                  </button>
                </div>
              </div>

              {/* Dual Cards: COD vs CC */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "1.25rem" }}>
                {/* COD Card */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                    border: "1px solid #86efac",
                    borderRadius: "12px",
                    padding: "1.25rem",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <div>
                      <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#166534", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Payment Method
                      </span>
                      <h4 style={{ margin: "0.15rem 0 0 0", color: "#14532d", fontSize: "1.15rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>💵</span> Cash on Delivery (COD)
                      </h4>
                    </div>
                    <span
                      style={{
                        background: "#16a34a",
                        color: "#ffffff",
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        padding: "0.2rem 0.55rem",
                        borderRadius: "9999px",
                      }}
                    >
                      {((stats.cod?.totalOrders || 0) + (stats.card?.totalOrders || 0)) > 0
                        ? `${Math.round(((stats.cod?.totalOrders || 0) / ((stats.cod?.totalOrders || 0) + (stats.card?.totalOrders || 0))) * 100)}% of orders`
                        : "COD"}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                    <div style={{ background: "rgba(255,255,255,0.7)", padding: "0.75rem", borderRadius: "8px" }}>
                      <div style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 700 }}>Total COD Sale</div>
                      <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#14532d", marginTop: "0.2rem" }}>
                        PKR {(stats.cod?.totalSale || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#15803d", marginTop: "0.15rem" }}>
                        Today: <strong>PKR {(stats.cod?.todaySale || 0).toLocaleString()}</strong>
                      </div>
                    </div>

                    <div style={{ background: "rgba(255,255,255,0.7)", padding: "0.75rem", borderRadius: "8px" }}>
                      <div style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 700 }}>Total COD Orders</div>
                      <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#14532d", marginTop: "0.2rem" }}>
                        {stats.cod?.totalOrders || 0}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#15803d", marginTop: "0.15rem" }}>
                        Today: <strong>{stats.cod?.todayOrders || 0} placed</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateToOrders && onNavigateToOrders({ dateFilter: "all", filterPaymentMethod: "cod" })}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      background: "#16a34a",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.3rem",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#15803d")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#16a34a")}
                  >
                    <span>View COD Orders</span>
                    <span>→</span>
                  </button>
                </div>

                {/* CC / Card Card */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                    border: "1px solid #93c5fd",
                    borderRadius: "12px",
                    padding: "1.25rem",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <div>
                      <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Payment Method
                      </span>
                      <h4 style={{ margin: "0.15rem 0 0 0", color: "#1e3a8a", fontSize: "1.15rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>💳</span> Card / CC (Credit/Debit)
                      </h4>
                    </div>
                    <span
                      style={{
                        background: "#2563eb",
                        color: "#ffffff",
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        padding: "0.2rem 0.55rem",
                        borderRadius: "9999px",
                      }}
                    >
                      {((stats.cod?.totalOrders || 0) + (stats.card?.totalOrders || 0)) > 0
                        ? `${Math.round(((stats.card?.totalOrders || 0) / ((stats.cod?.totalOrders || 0) + (stats.card?.totalOrders || 0))) * 100)}% of orders`
                        : "CC"}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                    <div style={{ background: "rgba(255,255,255,0.7)", padding: "0.75rem", borderRadius: "8px" }}>
                      <div style={{ fontSize: "0.75rem", color: "#1e40af", fontWeight: 700 }}>Total CC Sale</div>
                      <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#1e3a8a", marginTop: "0.2rem" }}>
                        PKR {(stats.card?.totalSale || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#1d4ed8", marginTop: "0.15rem" }}>
                        Today: <strong>PKR {(stats.card?.todaySale || 0).toLocaleString()}</strong>
                      </div>
                    </div>

                    <div style={{ background: "rgba(255,255,255,0.7)", padding: "0.75rem", borderRadius: "8px" }}>
                      <div style={{ fontSize: "0.75rem", color: "#1e40af", fontWeight: 700 }}>Total CC Orders</div>
                      <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#1e3a8a", marginTop: "0.2rem" }}>
                        {stats.card?.totalOrders || 0}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#1d4ed8", marginTop: "0.15rem" }}>
                        Today: <strong>{stats.card?.todayOrders || 0} placed</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateToOrders && onNavigateToOrders({ dateFilter: "all", filterPaymentMethod: "card" })}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      background: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.3rem",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#1d4ed8")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#2563eb")}
                  >
                    <span>View Card / CC Orders</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              {/* Revenue Distribution Comparison Bar */}
              {((stats.cod?.totalSale || 0) + (stats.card?.totalSale || 0)) > 0 && (
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "0.85rem 1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                    <span style={{ color: "#166534" }}>
                      💵 COD Revenue: {Math.round(((stats.cod?.totalSale || 0) / ((stats.cod?.totalSale || 0) + (stats.card?.totalSale || 0))) * 100)}% (PKR {(stats.cod?.totalSale || 0).toLocaleString()})
                    </span>
                    <span style={{ color: "#1e40af" }}>
                      💳 CC Revenue: {Math.round(((stats.card?.totalSale || 0) / ((stats.cod?.totalSale || 0) + (stats.card?.totalSale || 0))) * 100)}% (PKR {(stats.card?.totalSale || 0).toLocaleString()})
                    </span>
                  </div>
                  <div style={{ height: "10px", width: "100%", background: "#e2e8f0", borderRadius: "9999px", overflow: "hidden", display: "flex" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.round(((stats.cod?.totalSale || 0) / ((stats.cod?.totalSale || 0) + (stats.card?.totalSale || 0))) * 100)}%`,
                        background: "#16a34a",
                      }}
                      title="COD Share"
                    />
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.round(((stats.card?.totalSale || 0) / ((stats.cod?.totalSale || 0) + (stats.card?.totalSale || 0))) * 100)}%`,
                        background: "#2563eb",
                      }}
                      title="CC Card Share"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

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
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.25rem", color: "#475569" }}>
                      Order Status:
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
                      Order Type:
                    </label>
                    <select
                      className="form-control"
                      value={exportType}
                      onChange={(e) => setExportType(e.target.value)}
                      style={{ fontSize: "0.85rem", padding: "0.4rem 0.6rem" }}
                    >
                      <option value="">All Types</option>
                      <option value="standard">Standard Catalog</option>
                      <option value="instant">Instant Prescription</option>
                      <option value="narcotics">Narcotics Prescription</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.25rem", color: "#475569" }}>
                      Payment Method:
                    </label>
                    <select
                      className="form-control"
                      value={exportPaymentMethod}
                      onChange={(e) => setExportPaymentMethod(e.target.value)}
                      style={{ fontSize: "0.85rem", padding: "0.4rem 0.6rem" }}
                    >
                      <option value="">All Methods</option>
                      <option value="cod">💵 Cash on Delivery (COD)</option>
                      <option value="card">💳 Card / CC</option>
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

      {/* ── MODAL: MEDIKART COMMISSION PAID BREAKDOWN & HISTORY ──────────── */}
      {isCommissionPaidModalOpen && (
        <div className="modal-backdrop" style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1050 }}>
          <div className="modal-content" style={{ maxWidth: "900px", width: "95%", maxHeight: "90vh", display: "flex", flexDirection: "column", borderRadius: "16px", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <div className="modal-header" style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "1.25rem 1.5rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#065f46", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  💵 Medikart Commission Paid — Branch Breakdown
                </h3>
                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                  Inspect total verified commission receipts collected from pharmacy branches with custom date filtering.
                </p>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsCommissionPaidModalOpen(false)}
                style={{ fontSize: "1.5rem", background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                &times;
              </button>
            </div>

            <div className="modal-body" style={{ padding: "1.25rem 1.5rem", overflowY: "auto", flex: 1, background: "#f8fafc" }}>
              {commPaidError && (
                <div className="alert alert-danger" style={{ marginBottom: "1rem" }}>
                  {commPaidError}
                </div>
              )}

              {/* Date Filter Bar */}
              <div
                style={{
                  background: "#ffffff",
                  padding: "0.85rem 1rem",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  marginBottom: "1.25rem",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginRight: "0.25rem" }}>
                    📅 Date Filter:
                  </span>
                  {[
                    { key: "all", label: "All Time" },
                    { key: "today", label: "Today" },
                    { key: "yesterday", label: "Yesterday" },
                    { key: "7days", label: "Last 7 Days" },
                    { key: "month", label: "This Month" },
                    { key: "custom", label: "Custom Range" },
                  ].map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => handleCommPaidPresetChange(preset.key)}
                      style={{
                        padding: "0.3rem 0.65rem",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        background: commPaidDatePreset === preset.key ? "#065f46" : "#ffffff",
                        color: commPaidDatePreset === preset.key ? "#ffffff" : "#475569",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Custom Date Range Inputs */}
                {commPaidDatePreset === "custom" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                    <input
                      type="date"
                      className="form-control"
                      value={commPaidStartDate}
                      onChange={(e) => setCommPaidStartDate(e.target.value)}
                      style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                    />
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>to</span>
                    <input
                      type="date"
                      className="form-control"
                      value={commPaidEndDate}
                      onChange={(e) => setCommPaidEndDate(e.target.value)}
                      style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => fetchCommissionPaidSummary("custom", commPaidStartDate, commPaidEndDate, commPaidPharmacyFilter)}
                      style={{ fontSize: "0.75rem", padding: "0.3rem 0.75rem", background: "#065f46", border: "none" }}
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Summary Metric KPI Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                <div style={{ background: "#ffffff", padding: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0", borderLeft: "4px solid #059669" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#065f46", textTransform: "uppercase" }}>
                    Total Commission Paid
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#065f46", margin: "0.3rem 0" }}>
                    PKR {commPaidData?.summary?.totalPaidInPeriod ? commPaidData.summary.totalPaidInPeriod.toLocaleString() : "0"}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                    In selected date filter
                  </div>
                </div>

                <div style={{ background: "#ffffff", padding: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0", borderLeft: "4px solid #6366f1" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#3730a3", textTransform: "uppercase" }}>
                    Active Contributing Branches
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#3730a3", margin: "0.3rem 0" }}>
                    {commPaidData?.summary?.activePharmaciesCount || 0}{" "}
                    <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "#64748b" }}>
                      / {commPaidData?.summary?.totalPharmaciesCount || 0}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                    Branches with payments in period
                  </div>
                </div>

                <div style={{ background: "#ffffff", padding: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0", borderLeft: "4px solid #f59e0b" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#92400e", textTransform: "uppercase" }}>
                    Verified Receipts
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#92400e", margin: "0.3rem 0" }}>
                    {commPaidData?.summary?.totalVerifiedCount || 0}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                    Verified submission records
                  </div>
                </div>
              </div>

              {/* Pharmacy Branch Breakdown List */}
              {commPaidLoading ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "#64748b", background: "#ffffff", borderRadius: "12px" }}>
                  🔄 Loading commission breakdown...
                </div>
              ) : !commPaidData?.branches || commPaidData.branches.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", background: "#ffffff", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                  <p style={{ color: "#64748b", margin: 0 }}>No pharmacy branches found.</p>
                </div>
              ) : (
                <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={{ padding: "0.85rem 1.25rem", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>
                      🏥 Pharmacy Branch Contributions ({commPaidData.branches.length})
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      Click on any branch to view individual payment proofs
                    </span>
                  </div>

                  <div className="table-responsive">
                    <table className="table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", margin: 0 }}>
                      <thead>
                        <tr style={{ background: "#f1f5f9", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                          <th style={{ padding: "0.65rem 1rem" }}>Branch</th>
                          <th style={{ padding: "0.65rem 1rem" }}>Total Paid (Filtered)</th>
                          <th style={{ padding: "0.65rem 1rem" }}>Receipts</th>
                          <th style={{ padding: "0.65rem 1rem" }}>Outstanding Balance</th>
                          <th style={{ padding: "0.65rem 1rem" }}>Last Payment</th>
                          <th style={{ padding: "0.65rem 1rem", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commPaidData.branches.map((b) => {
                          const isExpanded = expandedBranchId === b.pharmacyId;
                          return (
                            <React.Fragment key={b.pharmacyId}>
                              <tr
                                style={{
                                  borderBottom: "1px solid #f1f5f9",
                                  background: isExpanded ? "#f0fdf4" : b.totalPaidInPeriod > 0 ? "#ffffff" : "#fafafa",
                                  cursor: "pointer",
                                }}
                                onClick={() => setExpandedBranchId(isExpanded ? null : b.pharmacyId)}
                              >
                                <td style={{ padding: "0.75rem 1rem" }}>
                                  <div style={{ fontWeight: 700, color: "#0f172a" }}>
                                    {b.pharmacyName}
                                  </div>
                                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                    <code style={{ background: "#f1f5f9", padding: "0.1rem 0.3rem", borderRadius: "3px" }}>{b.pharmacyCode}</code> • Commission Rate: {b.medikartPercentage}%
                                  </div>
                                </td>
                                <td style={{ padding: "0.75rem 1rem", fontWeight: 800, color: b.totalPaidInPeriod > 0 ? "#059669" : "#64748b" }}>
                                  PKR {b.totalPaidInPeriod.toLocaleString()}
                                </td>
                                <td style={{ padding: "0.75rem 1rem" }}>
                                  <span style={{
                                    background: b.verifiedPaymentsCount > 0 ? "#ecfdf5" : "#f1f5f9",
                                    color: b.verifiedPaymentsCount > 0 ? "#065f46" : "#64748b",
                                    padding: "0.2rem 0.5rem",
                                    borderRadius: "9999px",
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                  }}>
                                    {b.verifiedPaymentsCount} {b.verifiedPaymentsCount === 1 ? "receipt" : "receipts"}
                                  </span>
                                </td>
                                <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: b.outstandingBalance > 0 ? "#dc2626" : "#059669" }}>
                                  PKR {b.outstandingBalance ? b.outstandingBalance.toLocaleString() : "0"}
                                </td>
                                <td style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "#475569" }}>
                                  {b.lastPaymentDate ? new Date(b.lastPaymentDate).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" }) : "None"}
                                </td>
                                <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedBranchId(isExpanded ? null : b.pharmacyId);
                                    }}
                                    style={{ fontSize: "0.75rem", padding: "0.25rem 0.55rem" }}
                                  >
                                    {isExpanded ? "▲ Hide Details" : `▼ Receipts (${b.payments?.length || 0})`}
                                  </button>
                                </td>
                              </tr>

                              {/* Expanded Receipts Sub-Table */}
                              {isExpanded && (
                                <tr style={{ background: "#f8fafc" }}>
                                  <td colSpan={6} style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e2e8f0" }}>
                                    <div style={{ background: "#ffffff", borderRadius: "8px", border: "1px solid #cbd5e1", padding: "0.85rem" }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                                        <h5 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 800, color: "#0f172a" }}>
                                          🧾 Verified Payment Proofs for {b.pharmacyName}
                                        </h5>
                                        {onNavigateToPharmacies && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setIsCommissionPaidModalOpen(false);
                                              onNavigateToPharmacies("commissions");
                                            }}
                                            style={{
                                              background: "none",
                                              border: "none",
                                              color: "#2563eb",
                                              fontSize: "0.75rem",
                                              fontWeight: 700,
                                              cursor: "pointer",
                                              textDecoration: "underline",
                                            }}
                                          >
                                            Go to Pharmacy Commission Tab →
                                          </button>
                                        )}
                                      </div>

                                      {!b.payments || b.payments.length === 0 ? (
                                        <p style={{ color: "#64748b", fontSize: "0.8rem", margin: "0.5rem 0" }}>
                                          No verified payment receipts found for this pharmacy in the selected date range.
                                        </p>
                                      ) : (
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.75rem" }}>
                                          {b.payments.map((p) => (
                                            <div
                                              key={p._id}
                                              style={{
                                                background: "#f8fafc",
                                                border: "1px solid #e2e8f0",
                                                borderRadius: "8px",
                                                padding: "0.75rem",
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "space-between",
                                                gap: "0.5rem",
                                              }}
                                            >
                                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                <div>
                                                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "#065f46" }}>
                                                    PKR {p.amount.toLocaleString()}
                                                  </div>
                                                  <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                                                    Paid: {new Date(p.paidOnDate).toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" })}
                                                  </div>
                                                </div>
                                                <span style={{ fontSize: "0.7rem", fontWeight: 700, background: "#dcfce7", color: "#15803d", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>
                                                  ✓ Verified
                                                </span>
                                              </div>

                                              {p.periodFrom && p.periodTo && (
                                                <div style={{ fontSize: "0.7rem", color: "#475569", background: "#ffffff", padding: "0.25rem 0.5rem", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                                                  Period: {new Date(p.periodFrom).toLocaleDateString("en-PK", { month: "short", day: "numeric" })} - {new Date(p.periodTo).toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" })}
                                                </div>
                                              )}

                                              {p.notes && (
                                                <div style={{ fontSize: "0.7rem", color: "#64748b", fontStyle: "italic" }}>
                                                  "{p.notes}"
                                                </div>
                                              )}

                                              {p.screenshotUrl && (
                                                <div style={{ marginTop: "0.25rem" }}>
                                                  <button
                                                    type="button"
                                                    onClick={() => setPreviewScreenshot(resolveImageUrl(p.screenshotUrl))}
                                                    style={{
                                                      display: "inline-flex",
                                                      alignItems: "center",
                                                      gap: "0.3rem",
                                                      fontSize: "0.75rem",
                                                      fontWeight: 700,
                                                      color: "#2563eb",
                                                      background: "#eff6ff",
                                                      border: "1px solid #bfdbfe",
                                                      borderRadius: "6px",
                                                      padding: "0.25rem 0.5rem",
                                                      cursor: "pointer",
                                                      width: "100%",
                                                      justifyContent: "center",
                                                    }}
                                                  >
                                                    🖼️ View Bank Receipt
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: "1px solid #e2e8f0", background: "#f8fafc", padding: "0.85rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {onNavigateToPharmacies ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsCommissionPaidModalOpen(false);
                    onNavigateToPharmacies("commissions");
                  }}
                  style={{ fontSize: "0.85rem" }}
                >
                  Manage All Commissions in Branches Tab →
                </button>
              ) : <div />}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsCommissionPaidModalOpen(false)}
                style={{ fontSize: "0.85rem", background: "#065f46", border: "none" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LIGHTBOX PREVIEW MODAL ────────────────────────────────────── */}
      {previewScreenshot && (
        <div
          className="modal-backdrop"
          onClick={() => setPreviewScreenshot("")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            background: "rgba(0,0,0,0.8)",
            cursor: "zoom-out",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
              background: "#ffffff",
              borderRadius: "12px",
              padding: "0.5rem",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5)",
              cursor: "default",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.75rem", borderBottom: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>📄 Bank Payment Proof Screenshot</span>
              <button
                type="button"
                onClick={() => setPreviewScreenshot("")}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.25rem",
                  cursor: "pointer",
                  color: "#64748b",
                  fontWeight: "bold",
                }}
              >
                &times;
              </button>
            </div>
            <div style={{ padding: "0.5rem", display: "flex", justifyContent: "center", overflow: "auto", maxHeight: "80vh" }}>
              <img
                src={previewScreenshot}
                alt="Bank Proof"
                style={{ maxWidth: "100%", maxHeight: "75vh", objectFit: "contain", borderRadius: "8px" }}
              />
            </div>
            <div style={{ textAlign: "center", padding: "0.4rem" }}>
              <a
                href={previewScreenshot}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.75rem" }}
              >
                Open Original Image in New Tab ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Overview;
