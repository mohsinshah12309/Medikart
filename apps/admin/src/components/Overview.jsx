import React, { useState, useEffect } from "react";

function Overview({ token }) {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

  const [stats, setStats] = useState({
    totalProducts: 0,
    narcoticsPending: 0,
    pricingPending: 0,
    totalOrders: 0,
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

      // 1. Fetch total products (with a high limit because the API doesn't return a direct total/count metadata)
      const resProducts = await fetch(`${apiUrl}/admin/products?limit=1000`, { headers });
      const dataProducts = await resProducts.json();
      const productCount = dataProducts.data?.products?.length || 0;

      // 2. Fetch narcotics orders pending verification
      const resNarcotics = await fetch(`${apiUrl}/admin/orders?status=pending_verification&limit=1`, { headers });
      const dataNarcotics = await resNarcotics.json();
      const narcoticsCount = dataNarcotics.data?.total || 0;

      // 3. Fetch orders awaiting pharmacist pricing
      const resPricing = await fetch(`${apiUrl}/admin/orders?status=awaiting-pharmacist-pricing&limit=1`, { headers });
      const dataPricing = await resPricing.json();
      const pricingCount = dataPricing.data?.total || 0;

      // 4. Fetch total orders count
      const resTotalOrders = await fetch(`${apiUrl}/admin/orders?limit=1`, { headers });
      const dataTotalOrders = await resTotalOrders.json();
      const totalOrdersCount = dataTotalOrders.data?.total || 0;

      setStats({
        totalProducts: productCount,
        narcoticsPending: narcoticsCount,
        pricingPending: pricingCount,
        totalOrders: totalOrdersCount,
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

      {/* Backend Gap Warnings */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2.0rem" }}>
        <div className="alert alert-danger" style={{ margin: 0 }}>
          <strong>⚠️ Date Filter Gap:</strong> Today's order count cannot be queried from the backend. The <code>/admin/orders</code> endpoint strips all unknown query parameters and does not support date filtering.
        </div>
        <div className="alert alert-success" style={{ margin: 0, background: "#e0f2fe", color: "#0369a1", borderColor: "#bae6fd" }}>
          <strong>ℹ️ Product Count Gap:</strong> The product API doesn't return a total count in the response metadata (only returning the page results). We fetch with a high limit (1000) to gauge the current catalog size.
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", fontSize: "1.2rem", color: "#64748b" }}>
          Loading dashboard metrics...
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
            
            {/* Today's Orders (Gap Card) */}
            <div className="card" style={{ padding: "1.5rem", borderLeft: "5px solid #ef4444" }}>
              <div style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase" }}>
                Today's Orders
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#1e293b", margin: "0.5rem 0" }}>
                GAP
              </div>
              <div style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: 500 }}>
                API endpoint missing date range filter
              </div>
            </div>

            {/* Total Orders */}
            <div className="card" style={{ padding: "1.5rem", borderLeft: "5px solid #2563eb" }}>
              <div style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase" }}>
                Total Orders (All Time)
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#1e293b", margin: "0.5rem 0" }}>
                {stats.totalOrders}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                Cumulative order counts in database
              </div>
            </div>

            {/* Total Products */}
            <div className="card" style={{ padding: "1.5rem", borderLeft: "5px solid #10b981" }}>
              <div style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase" }}>
                Total Products
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#1e293b", margin: "0.5rem 0" }}>
                {stats.totalProducts}+
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                Catalog size (fetched with limit=1000)
              </div>
            </div>

            {/* Narcotics Needing Review */}
            <div className="card" style={{ padding: "1.5rem", borderLeft: "5px solid #f59e0b" }}>
              <div style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase" }}>
                Narcotics Verification
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#f59e0b", margin: "0.5rem 0" }}>
                {stats.narcoticsPending}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#d97706", fontWeight: 500 }}>
                Orders awaiting prescription check
              </div>
            </div>

            {/* Instant Orders Needing Pricing */}
            <div className="card" style={{ padding: "1.5rem", borderLeft: "5px solid #8b5cf6" }}>
              <div style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase" }}>
                Awaiting Pharmacist Pricing
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#8b5cf6", margin: "0.5rem 0" }}>
                {stats.pricingPending}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#7c3aed", fontWeight: 500 }}>
                Instant orders needing priced items
              </div>
            </div>

          </div>

          {/* Quick Info & Action Needed Summary */}
          <div className="card" style={{ padding: "2rem" }}>
            <h3 style={{ margin: "0 0 1rem 0", color: "#0f172a", fontSize: "1.2rem" }}>🔔 Immediate Action Required</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 1rem", background: "#fffbeb", borderRadius: "6px", border: "1px solid #fef3c7" }}>
                <span style={{ color: "#b45309", fontWeight: 600 }}>Narcotics Prescriptions to Verify</span>
                <span className="badge badge-narcotic" style={{ padding: "0.25rem 0.75rem", fontSize: "0.85rem" }}>
                  {stats.narcoticsPending} pending review
                </span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 1rem", background: "#f5f3ff", borderRadius: "6px", border: "1px solid #ede9fe" }}>
                <span style={{ color: "#6d28d9", fontWeight: 600 }}>Unpriced Instant Orders</span>
                <span className="badge" style={{ background: "#ede9fe", color: "#6d28d9", padding: "0.25rem 0.75rem", fontSize: "0.85rem", fontWeight: 600 }}>
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
