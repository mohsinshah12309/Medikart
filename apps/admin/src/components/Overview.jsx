import React, { useState, useEffect } from "react";

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

      const headers = { Authorization: `Bearer ${token}` };

      // 1. GET /admin/orders/stats — single DB aggregation for all order counts.
      const resStats = await fetch(`${apiUrl}/admin/orders/stats`, { headers });
      if (!resStats.ok) throw new Error(`Stats endpoint returned ${resStats.status}`);
      const dataStats = await resStats.json();

      // 2. Fetch total products using the new pagination total field (limit=1)
      const resProducts = await fetch(`${apiUrl}/admin/products?limit=1`, { headers });
      const dataProducts = await resProducts.json();
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
            <div className="card" style={{ padding: "1.5rem", borderLeft: "5px solid #10b981" }}>
              <div style={{ color: "#94a3b8", fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase" }}>
                Today's Orders
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#f1f5f9", margin: "0.5rem 0" }}>
                {stats.todayOrders}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                Orders placed since midnight PKT
              </div>
            </div>

            {/* Total Orders */}
            <div className="card" style={{ padding: "1.5rem", borderLeft: "5px solid #2dd4bf" }}>
              <div style={{ color: "#94a3b8", fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase" }}>
                Total Orders (All Time)
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#f1f5f9", margin: "0.5rem 0" }}>
                {stats.totalOrders}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                Cumulative order count in database
              </div>
            </div>

            {/* Total Products */}
            <div className="card" style={{ padding: "1.5rem", borderLeft: "5px solid #0d9488" }}>
              <div style={{ color: "#94a3b8", fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase" }}>
                Total Products
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#f1f5f9", margin: "0.5rem 0" }}>
                {stats.totalProducts}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                Total active catalog size
              </div>
            </div>

            {/* Narcotics Needing Review */}
            <div className="card" style={{ padding: "1.5rem", borderLeft: "5px solid #f59e0b" }}>
              <div style={{ color: "#94a3b8", fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase" }}>
                Narcotics Verification
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#f59e0b", margin: "0.5rem 0" }}>
                {stats.narcoticsPending}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#d97706", fontWeight: 500 }}>
                Orders awaiting prescription check
              </div>
            </div>

            {/* Instant Orders Needing Pricing */}
            <div className="card" style={{ padding: "1.5rem", borderLeft: "5px solid #8b5cf6" }}>
              <div style={{ color: "#94a3b8", fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase" }}>
                Awaiting Pharmacist Pricing
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#a78bfa", margin: "0.5rem 0" }}>
                {stats.pricingPending}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#8b5cf6", fontWeight: 500 }}>
                Instant orders needing priced items
              </div>
            </div>

          </div>

          {/* Quick Info & Action Needed Summary */}
          <div className="card" style={{ padding: "2rem" }}>
            <h3 style={{ margin: "0 0 1rem 0", color: "#f1f5f9", fontSize: "1.2rem" }}>🔔 Immediate Action Required</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 1rem", background: "rgba(245, 158, 11, 0.08)", borderRadius: "8px", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                <span style={{ color: "#f59e0b", fontWeight: 600 }}>Narcotics Prescriptions to Verify</span>
                <span className="badge badge-narcotic" style={{ padding: "0.25rem 0.75rem", fontSize: "0.85rem" }}>
                  {stats.narcoticsPending} pending review
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 1rem", background: "rgba(139, 92, 246, 0.08)", borderRadius: "8px", border: "1px solid rgba(139, 92, 246, 0.2)" }}>
                <span style={{ color: "#a78bfa", fontWeight: 600 }}>Unpriced Instant Orders</span>
                <span className="badge" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#a78bfa", padding: "0.25rem 0.75rem", fontSize: "0.85rem", fontWeight: 650, borderRadius: '9999px', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
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
