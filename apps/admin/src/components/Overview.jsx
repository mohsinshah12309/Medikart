import React, { useState, useEffect } from "react";
import { adminFetch } from "../apiClient";

function Overview({ token }) {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

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
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError("");

      // 1. GET /admin/orders/stats — single DB aggregation for all order counts.
      const dataStats = await adminFetch("/admin/orders/stats");

      // 2. Fetch total products using the pagination total field (limit=1)
      const dataProducts = await adminFetch("/admin/products?limit=1");
      const productCount = dataProducts.pagination?.total || 0;

      setStats({
        todayOrders: dataStats.data?.todayOrders ?? 0,
        totalOrders: dataStats.data?.totalOrders ?? 0,
        narcoticsPending: dataStats.data?.narcoticsPending ?? 0,
        pricingPending: dataStats.data?.pricingPending ?? 0,
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>

            {/* Today's Orders */}
            <div className="card" style={{ padding: "1.5rem", borderLeft: "5px solid #eab308", background: "#ffffff" }}>
              <div style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase" }}>
                Today's Orders
              </div>
              <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#0f172a", margin: "0.5rem 0" }}>
                {stats.todayOrders}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>
                Orders placed since midnight PKT
              </div>
            </div>

            {/* Total Orders */}
            <div className="card" style={{ padding: "1.5rem", borderLeft: "5px solid #facc15", background: "#ffffff" }}>
              <div style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase" }}>
                Total Orders (All Time)
              </div>
              <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#0f172a", margin: "0.5rem 0" }}>
                {stats.totalOrders}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>
                Cumulative order count in database
              </div>
            </div>

            {/* Total Products */}
            <div className="card" style={{ padding: "1.5rem", borderLeft: "5px solid #0f172a", background: "#ffffff" }}>
              <div style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase" }}>
                Total Products
              </div>
              <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#0f172a", margin: "0.5rem 0" }}>
                {stats.totalProducts}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>
                Total active catalog size
              </div>
            </div>

            {/* Narcotics Needing Review */}
            <div className="card" style={{ padding: "1.5rem", borderLeft: "5px solid #d97706", background: "#ffffff" }}>
              <div style={{ color: "#854d0e", fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase" }}>
                Narcotics Verification
              </div>
              <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#b45309", margin: "0.5rem 0" }}>
                {stats.narcoticsPending}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#854d0e", fontWeight: 600 }}>
                Orders awaiting prescription check
              </div>
            </div>

            {/* Instant Orders Needing Pricing */}
            <div className="card" style={{ padding: "1.5rem", borderLeft: "5px solid #ca8a04", background: "#ffffff" }}>
              <div style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase" }}>
                Awaiting Pharmacist Pricing
              </div>
              <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#854d0e", margin: "0.5rem 0" }}>
                {stats.pricingPending}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#854d0e", fontWeight: 600 }}>
                Instant orders needing priced items
              </div>
            </div>

          </div>

          {/* Quick Info & Action Needed Summary */}
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
        </>
      )}
    </div>
  );
}

export default Overview;
