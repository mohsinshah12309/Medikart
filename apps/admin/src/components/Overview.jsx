import React, { useState, useEffect } from "react";
import { adminFetch } from "../apiClient";

function Overview({ token, adminUser, onNavigateToOrders, onNavigateToProducts }) {
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
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, [adminUser]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError("");

      let orderStats = { todayOrders: 0, totalOrders: 0, narcoticsPending: 0, pricingPending: 0 };
      let productCount = 0;

      // 1. Fetch order stats only if authorized
      if (canViewOrders) {
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
        <button className="btn btn-secondary" onClick={fetchStats}>
          🔄 Refresh
        </button>
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
    </div>
  );
}

export default Overview;
