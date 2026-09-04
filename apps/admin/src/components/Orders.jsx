import React, { useState, useEffect } from "react";
import { adminFetch } from "../apiClient";

function Orders({ token }) {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

  // List States
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters & Search State
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  // Active Products for Pricing Dropdown
  const [products, setProducts] = useState([]);

  // Detail Modal States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [prescriptionBlobUrl, setPrescriptionBlobUrl] = useState("");
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);

  // Pricing Modal States
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [pricingItems, setPricingItems] = useState([{ productId: "", quantity: 1 }]);
  const [pricingOrderId, setPricingOrderId] = useState(null);

  // Cancel Modal States
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [cancelTargetOrder, setCancelTargetOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [filterType, filterStatus, activeSearch, page]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      let endpoint = `/admin/orders?page=${page}&limit=${limit}`;
      if (filterType) endpoint += `&type=${filterType}`;
      if (filterStatus) endpoint += `&status=${filterStatus}`;
      if (activeSearch.trim()) endpoint += `&search=${encodeURIComponent(activeSearch.trim())}`;

      const data = await adminFetch(endpoint);
      setOrders(data.data?.orders || []);
      setTotal(data.data?.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    setActiveSearch(searchQuery.trim());
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setActiveSearch("");
    setPage(1);
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    if (newStatus === "cancelled") {
      handleOpenCancelModal(orderId);
      return;
    }

    const confirmMsg = newStatus === "completed" || newStatus === "delivered" 
      ? "Are you sure you want to mark this order as Completed / Delivered?" 
      : `Change status of this order to "${newStatus}"?`;

    if (!window.confirm(confirmMsg)) return;

    setError("");
    setSuccessMsg("");
    setStatusUpdatingId(orderId);

    try {
      await adminFetch(`/admin/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      setSuccessMsg(`Order status successfully updated to "${newStatus}".`);
      await fetchOrders();
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status: newStatus === "completed" ? "delivered" : newStatus } : null);
      }
    } catch (err) {
      setError(err.message || "Failed to update order status");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await adminFetch("/admin/products?limit=100");
      setProducts(data.data?.products || []);
    } catch (err) {
      console.error("Failed to load products for dropdown:", err.message);
    }
  };

  // Safe authenticated prescription loader
  const loadPrescription = async (prescriptionUrl) => {
    if (!prescriptionUrl) {
      setPrescriptionBlobUrl("");
      return;
    }

    setPrescriptionLoading(true);
    try {
      const baseApiUrl = apiUrl.replace("/api/v1", "");
      const fullUrl = prescriptionUrl.startsWith("http") ? prescriptionUrl : `${baseApiUrl}${prescriptionUrl}`;

      const res = await fetch(fullUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Unauthorized or invalid prescription access");

      const blob = await res.blob();
      const localUrl = URL.createObjectURL(blob);
      setPrescriptionBlobUrl(localUrl);
    } catch (err) {
      console.error("Prescription fetch error:", err.message);
      setPrescriptionBlobUrl("");
    } finally {
      setPrescriptionLoading(false);
    }
  };

  const handleOpenDetails = async (order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
    if (order.prescriptionUrl) {
      await loadPrescription(order.prescriptionUrl);
    } else {
      setPrescriptionBlobUrl("");
    }
  };

  const handleCloseDetails = () => {
    setIsDetailModalOpen(false);
    setSelectedOrder(null);
    if (prescriptionBlobUrl) {
      URL.revokeObjectURL(prescriptionBlobUrl);
      setPrescriptionBlobUrl("");
    }
  };

  // narcotics approval / rejection
  const handleReviewNarcotics = async (orderId, decision) => {
    if (!window.confirm(`Are you sure you want to ${decision} this narcotics order prescription?`)) return;

    setError("");
    setSuccessMsg("");

    try {
      await adminFetch(`/admin/orders/${orderId}/verification`, {
        method: "PATCH",
        body: JSON.stringify({ decision }),
      });

      setSuccessMsg(`Narcotics order has been successfully ${decision}!`);
      fetchOrders();
      if (isDetailModalOpen) {
        handleCloseDetails();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Cancel order trigger
  const handleOpenCancelModal = (orderOrId) => {
    let target = null;
    let id = null;
    if (orderOrId && typeof orderOrId === "object") {
      target = orderOrId;
      id = orderOrId._id;
    } else {
      id = orderOrId;
      target = orders.find((o) => o._id === id) || (selectedOrder?._id === id ? selectedOrder : null);
    }
    setCancelOrderId(id);
    setCancelTargetOrder(target);
    setCancelReason("");
    setIsCancelModalOpen(true);
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      setError("Please provide a reason for cancelling the order.");
      return;
    }

    setError("");
    setSuccessMsg("");
    setCancelLoading(true);

    try {
      await adminFetch(`/admin/orders/${cancelOrderId}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });

      setSuccessMsg("Order cancelled successfully and cancellation email dispatched to customer.");
      setIsCancelModalOpen(false);
      setCancelTargetOrder(null);
      setCancelReason("");
      fetchOrders();
      if (isDetailModalOpen) {
        handleCloseDetails();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelLoading(false);
    }
  };

  // Manual refund
  const handleMarkRefunded = async (orderId) => {
    if (!window.confirm("Are you sure you want to mark this cancelled order as manually refunded?")) return;

    setError("");
    setSuccessMsg("");

    try {
      await adminFetch(`/admin/orders/${orderId}/refund`, {
        method: "PATCH",
      });

      setSuccessMsg("Order payment marked refunded.");
      fetchOrders();
      if (isDetailModalOpen) {
        handleCloseDetails();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Pricing Modal trigger
  const handleOpenPricingModal = (orderId) => {
    setPricingOrderId(orderId);
    setPricingItems([{ productId: products[0]?._id || "", quantity: 1 }]);
    setIsPricingModalOpen(true);
  };

  const handlePricingItemChange = (index, field, val) => {
    const updated = [...pricingItems];
    updated[index][field] = field === "quantity" ? parseInt(val) || 1 : val;
    setPricingItems(updated);
  };

  const addPricingRow = () => {
    setPricingItems([...pricingItems, { productId: products[0]?._id || "", quantity: 1 }]);
  };

  const removePricingRow = (index) => {
    if (pricingItems.length === 1) return;
    setPricingItems(pricingItems.filter((_, i) => i !== index));
  };

  const handlePricingSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    // Validate pricing input
    const invalid = pricingItems.some((i) => !i.productId);
    if (invalid) {
      setError("Please select a product for all rows.");
      return;
    }

    try {
      await adminFetch(`/admin/orders/${pricingOrderId}/items`, {
        method: "PATCH",
        body: JSON.stringify({ items: pricingItems }),
      });

      setSuccessMsg("Instant order priced successfully.");
      setIsPricingModalOpen(false);
      fetchOrders();
      if (isDetailModalOpen) {
        handleCloseDetails();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "awaiting-pharmacist-pricing": return "badge-narcotic";
      case "pending_verification": return "badge-prescription";
      case "pending": return "badge-discount";
      case "packed": return "badge-narcotic";
      case "shipped": return "badge-discount";
      case "delivered": return "badge-discount";
      case "rejected": return "badge-prescription";
      case "cancelled": return "badge-prescription";
      default: return "";
    }
  };

  const isCancelable = (status) => {
    const s = status ? status.toLowerCase() : "";
    return s === "pending" || s === "packed";
  };

  const handleResetFilters = () => {
    setFilterType("");
    setFilterStatus("");
    setSearchQuery("");
    setActiveSearch("");
    setPage(1);
  };

  return (
    <div>
      <div className="page-header" style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "stretch" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <h2 className="page-title" style={{ margin: 0 }}>Manage Orders</h2>
          
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <select className="form-control" style={{ width: "150px" }} value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}>
              <option value="">All Types</option>
              <option value="standard">Standard</option>
              <option value="instant">Instant</option>
              <option value="narcotics">Narcotics</option>
            </select>

            <select className="form-control" style={{ width: "170px" }} value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              <option value="awaiting-pharmacist-pricing">Awaiting Pricing</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="pending">Pending Fulfillment</option>
              <option value="packed">Packed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered / Completed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Search Toolbar */}
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: "480px" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by Customer Name, Order ID, Email, Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", paddingRight: searchQuery ? "2.5rem" : "0.75rem" }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  fontSize: "1.1rem",
                  lineHeight: 1,
                  padding: "2px 6px",
                }}
                title="Clear search"
              >
                &times;
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span>🔍</span>
            <span>Search</span>
          </button>
          {activeSearch && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClearSearch}
              style={{ padding: "0.5rem 0.85rem", fontSize: "0.875rem" }}
            >
              Reset Search
            </button>
          )}
        </form>
      </div>

      {activeSearch && (
        <div style={{ marginBottom: "1rem", fontSize: "0.875rem", color: "#475569", background: "#f1f5f9", padding: "0.5rem 0.75rem", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Showing results for search: <strong>"{activeSearch}"</strong></span>
          <button onClick={handleClearSearch} style={{ background: "none", border: "none", color: "#0284c7", cursor: "pointer", textDecoration: "underline", fontSize: "0.85rem" }}>
            Clear Search Filter
          </button>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="card">
        {loading ? (
          <div style={{ padding: "3rem 2rem", textAlign: "center", color: "#64748b" }}>
            <div style={{ display: "inline-block", width: "24px", height: "24px", border: "3px solid #eab308", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "0.5rem" }} />
            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem" }}>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "2.5rem" }}>📦</span>
            <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "#0f172a" }}>No Orders Found</h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.875rem", maxWidth: "400px" }}>
              {filterType || filterStatus || activeSearch
                ? "There are no orders matching your selected search or filter criteria." 
                : "No customer orders have been placed in the system yet."}
            </p>
            {(filterType || filterStatus || activeSearch) && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ marginTop: "0.5rem", fontSize: "0.85rem", padding: "0.4rem 0.85rem" }}
                onClick={handleResetFilters}
              >
                Reset All Filters & Search
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Name</th>
                  <th>Type</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th style={{ minWidth: "170px" }}>Change State</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td><code style={{ fontSize: "0.85rem" }}>{order._id}</code></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.customer?.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{order.customer?.phone}</div>
                    </td>
                    <td style={{ textTransform: "capitalize" }}>{order.type}</td>
                    <td>
                      {order.totals?.total !== undefined ? (
                        <strong>PKR {order.totals.total.toFixed(2)}</strong>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>Pending Pricing</span>
                      )}
                    </td>
                    <td>
                      <div style={{ textTransform: "uppercase", fontSize: "0.8rem", fontWeight: 600 }}>{order.paymentMethod}</div>
                      <div style={{ textTransform: "capitalize", fontSize: "0.75rem", color: order.paymentState === "paid" ? "#16a34a" : "#64748b" }}>
                        {order.paymentState}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      {/* State update dropdown for active fulfillments */}
                      {order.status === "awaiting-pharmacist-pricing" ? (
                        <span style={{ fontSize: "0.8rem", color: "#8b5cf6", fontStyle: "italic" }}>Price Items First</span>
                      ) : order.status === "pending_verification" ? (
                        <span style={{ fontSize: "0.8rem", color: "#059669", fontStyle: "italic" }}>Verify Prescription</span>
                      ) : order.status === "cancelled" ? (
                        <span style={{ fontSize: "0.8rem", color: "#dc2626", fontWeight: 600 }}>Cancelled</span>
                      ) : order.status === "rejected" ? (
                        <span style={{ fontSize: "0.8rem", color: "#dc2626", fontWeight: 600 }}>Rejected</span>
                      ) : (
                        <select
                          className="form-control"
                          style={{
                            fontSize: "0.8rem",
                            padding: "0.25rem 0.4rem",
                            height: "auto",
                            borderColor: order.status === "delivered" ? "#16a34a" : "#cbd5e1",
                            background: order.status === "delivered" ? "#f0fdf4" : "white",
                            fontWeight: 600,
                          }}
                          value={order.status}
                          disabled={statusUpdatingId === order._id}
                          onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="packed">Packed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Completed / Delivered</option>
                          <option value="cancelled">Cancel Order...</option>
                        </select>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem" }}
                          onClick={() => handleOpenDetails(order)}
                        >
                          Details
                        </button>

                        {/* Instant order pharmacist pricing */}
                        {order.status === "awaiting-pharmacist-pricing" && (
                          <button
                            className="btn btn-primary"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem", background: "#8b5cf6" }}
                            onClick={() => handleOpenPricingModal(order._id)}
                          >
                            Price Items
                          </button>
                        )}

                        {/* Narcotics prescription review */}
                        {order.status === "pending_verification" && (
                          <>
                            <button
                              className="btn btn-primary"
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem", background: "#059669" }}
                              onClick={() => handleReviewNarcotics(order._id, "approved")}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem" }}
                              onClick={() => handleReviewNarcotics(order._id, "rejected")}
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {/* Cancellation action */}
                        {isCancelable(order.status) && (
                          <button
                            className="btn btn-danger"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem" }}
                            onClick={() => handleOpenCancelModal(order._id)}
                          >
                            Cancel
                          </button>
                        )}

                        {/* Refund action */}
                        {order.status === "cancelled" && order.cancellation?.refundStatus === "refund_pending" && (
                          <button
                            className="btn btn-primary"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem", background: "#d97706" }}
                            onClick={() => handleMarkRefunded(order._id)}
                          >
                            Mark Refunded
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Details */}
      <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#64748b", fontSize: "0.875rem" }}>
          Showing {orders.length} of {total} orders
        </span>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-secondary" style={{ padding: "0.25rem 0.5rem" }} disabled={page === 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <button className="btn btn-secondary" style={{ padding: "0.25rem 0.5rem" }} disabled={orders.length < limit} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      </div>

      {/* Order Detail Modal */}
      {isDetailModalOpen && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "700px" }}>
            <div className="modal-header">
              <h3>Order Detail: #{selectedOrder._id}</h3>
              <button className="modal-close" onClick={handleCloseDetails}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              {/* Grid with 2 columns */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                <div>
                  <h4 style={{ margin: "0 0 0.5rem 0", color: "#475569" }}>Customer Info</h4>
                  <p style={{ margin: "0.25rem 0" }}><strong>Name:</strong> {selectedOrder.customer?.name}</p>
                  <p style={{ margin: "0.25rem 0" }}><strong>Email:</strong> {selectedOrder.customer?.email}</p>
                  <p style={{ margin: "0.25rem 0" }}><strong>Phone:</strong> {selectedOrder.customer?.phone}</p>
                  <p style={{ margin: "0.25rem 0" }}><strong>City:</strong> {selectedOrder.customer?.city}</p>
                  <p style={{ margin: "0.25rem 0" }}><strong>Address:</strong> {selectedOrder.customer?.address}</p>
                </div>
                <div>
                  <h4 style={{ margin: "0 0 0.5rem 0", color: "#475569" }}>Order Info</h4>
                  <p style={{ margin: "0.25rem 0" }}><strong>Type:</strong> <span style={{ textTransform: "capitalize" }}>{selectedOrder.type}</span></p>
                  <p style={{ margin: "0.25rem 0" }}><strong>Payment Method:</strong> <span style={{ textTransform: "uppercase" }}>{selectedOrder.paymentMethod}</span></p>
                  <p style={{ margin: "0.25rem 0" }}><strong>Payment State:</strong> <span style={{ textTransform: "capitalize" }}>{selectedOrder.paymentState}</span></p>
                  <p style={{ margin: "0.25rem 0" }}><strong>Order Status:</strong> <span className={`badge ${getStatusBadgeClass(selectedOrder.status)}`} style={{ marginLeft: "0.25rem" }}>{selectedOrder.status}</span></p>
                  
                  {/* Status update widget inside modal */}
                  {!["awaiting-pharmacist-pricing", "pending_verification", "cancelled", "rejected"].includes(selectedOrder.status) && (
                    <div style={{ marginTop: "0.75rem", padding: "0.6rem", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.35rem" }}>
                        Update Order State:
                      </label>
                      <select
                        className="form-control"
                        style={{ fontSize: "0.85rem", padding: "0.35rem 0.5rem" }}
                        value={selectedOrder.status}
                        disabled={statusUpdatingId === selectedOrder._id}
                        onChange={(e) => handleUpdateOrderStatus(selectedOrder._id, e.target.value)}
                      >
                        <option value="pending">Pending Fulfillment</option>
                        <option value="packed">Packed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Completed / Delivered</option>
                        <option value="cancelled">Cancel Order...</option>
                      </select>
                    </div>
                  )}

                  {selectedOrder.cancellation && (
                    <div style={{ background: "#fee2e2", padding: "0.5rem", borderRadius: "4px", marginTop: "0.5rem" }}>
                      <p style={{ margin: "0.125rem 0", color: "#991b1b" }}><strong>Cancelled Reason:</strong> {selectedOrder.cancellation.reason || "N/A"}</p>
                      <p style={{ margin: "0.125rem 0", color: "#991b1b" }}><strong>Refund Status:</strong> {selectedOrder.cancellation.refundStatus}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Prescription view */}
              {selectedOrder.prescriptionUrl && (
                <div style={{ marginBottom: "1.5rem", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "1rem", background: "#f8fafc" }}>
                  <h4 style={{ margin: "0 0 0.5rem 0", color: "#475569" }}>Uploaded Prescription</h4>
                  {prescriptionLoading ? (
                    <div>Loading secure prescription image...</div>
                  ) : prescriptionBlobUrl ? (
                    selectedOrder.prescriptionUrl.toLowerCase().endsWith(".pdf") ? (
                      <div>
                        <span style={{ marginRight: "1rem" }}>PDF Prescription attached:</span>
                        <a href={prescriptionBlobUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem" }}>
                          Open PDF in New Tab
                        </a>
                      </div>
                    ) : (
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <img
                          src={prescriptionBlobUrl}
                          alt="Prescription"
                          style={{ maxWidth: "100%", maxHeight: "300px", objectFit: "contain", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                        />
                      </div>
                    )
                  ) : (
                    <div style={{ color: "#ef4444" }}>Failed to load prescription image secure buffer.</div>
                  )}
                </div>
              )}

              {/* Order Items */}
              <div>
                <h4 style={{ margin: "0 0 0.5rem 0", color: "#475569" }}>Order Items</h4>
                {selectedOrder.items?.length === 0 ? (
                  <div style={{ color: "#94a3b8", fontStyle: "italic" }}>No items loaded yet. Awaiting pharmacist pricing.</div>
                ) : (
                  <table style={{ minWidth: "100%" }}>
                    <thead>
                      <tr>
                        <th style={{ padding: "0.5rem" }}>Product Name</th>
                        <th style={{ padding: "0.5rem", textAlign: "center" }}>Qty</th>
                        <th style={{ padding: "0.5rem", textAlign: "right" }}>Price</th>
                        <th style={{ padding: "0.5rem", textAlign: "right" }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: "0.5rem" }}>{item.name}</td>
                          <td style={{ padding: "0.5rem", textAlign: "center" }}>{item.quantity}</td>
                          <td style={{ padding: "0.5rem", textAlign: "right" }}>PKR {item.price.toFixed(2)}</td>
                          <td style={{ padding: "0.5rem", textAlign: "right" }}>PKR {(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                      {selectedOrder.totals && (
                        <>
                          <tr style={{ borderTop: "2px solid #cbd5e1" }}>
                            <td colSpan="3" style={{ padding: "0.5rem", textAlign: "right", fontWeight: 600 }}>Subtotal:</td>
                            <td style={{ padding: "0.5rem", textAlign: "right", fontWeight: 600 }}>PKR {selectedOrder.totals.subtotal.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td colSpan="3" style={{ padding: "0.5rem", textAlign: "right", fontWeight: 600 }}>Delivery Charge:</td>
                            <td style={{ padding: "0.5rem", textAlign: "right", fontWeight: 600 }}>PKR {selectedOrder.totals.deliveryCharge.toFixed(2)}</td>
                          </tr>
                          <tr style={{ background: "#f8fafc" }}>
                            <td colSpan="3" style={{ padding: "0.5rem", textAlign: "right", fontWeight: 700, fontSize: "1.1rem" }}>Total:</td>
                            <td style={{ padding: "0.5rem", textAlign: "right", fontWeight: 700, fontSize: "1.1rem" }}>PKR {selectedOrder.totals.total.toFixed(2)}</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <div style={{ display: "flex", gap: "0.5rem", width: "100%", justifyContent: "flex-end" }}>
                {/* Instant pricing in details modal */}
                {selectedOrder.status === "awaiting-pharmacist-pricing" && (
                  <button
                    className="btn btn-primary"
                    style={{ background: "#8b5cf6" }}
                    onClick={() => {
                      handleCloseDetails();
                      handleOpenPricingModal(selectedOrder._id);
                    }}
                  >
                    Price items
                  </button>
                )}

                {/* Narcotics approval in details modal */}
                {selectedOrder.status === "pending_verification" && (
                  <>
                    <button
                      className="btn btn-primary"
                      style={{ background: "#059669" }}
                      onClick={() => handleReviewNarcotics(selectedOrder._id, "approved")}
                    >
                      Approve Prescription
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleReviewNarcotics(selectedOrder._id, "rejected")}
                    >
                      Reject Prescription
                    </button>
                  </>
                )}

                {/* Cancel action in details modal */}
                {isCancelable(selectedOrder.status) && (
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      handleCloseDetails();
                      handleOpenCancelModal(selectedOrder._id);
                    }}
                  >
                    Cancel Order
                  </button>
                )}

                {/* Refund in details modal */}
                {selectedOrder.status === "cancelled" && selectedOrder.cancellation?.refundStatus === "refund_pending" && (
                  <button
                    className="btn btn-primary"
                    style={{ background: "#d97706" }}
                    onClick={() => handleMarkRefunded(selectedOrder._id)}
                  >
                    Mark Refunded
                  </button>
                )}

                <button className="btn btn-secondary" onClick={handleCloseDetails}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      {isPricingModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <h3>Price Instant Order</h3>
              <button className="modal-close" onClick={() => setIsPricingModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handlePricingSubmit}>
              <div className="modal-body">
                <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1rem" }}>
                  Select the medicines and quantities. The backend will automatically compute the correct discounted prices, delivery charges, and final order total.
                </p>

                {pricingItems.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", alignItems: "flex-end" }}>
                    <div style={{ flex: 2 }}>
                      {idx === 0 && <label style={{ fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>Product</label>}
                      <select
                        className="form-control"
                        required
                        value={item.productId}
                        onChange={(e) => handlePricingItemChange(idx, "productId", e.target.value)}
                      >
                        <option value="">-- Select Product --</option>
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} (PKR {p.price}) {p.isNarcotic ? "[NARCOTIC]" : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ flex: 1, maxWidth: "100px" }}>
                      {idx === 0 && <label style={{ fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>Qty</label>}
                      <input
                        type="number"
                        className="form-control"
                        required
                        min="1"
                        max="99"
                        value={item.quantity}
                        onChange={(e) => handlePricingItemChange(idx, "quantity", e.target.value)}
                      />
                    </div>

                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ padding: "0.5rem 0.75rem" }}
                      disabled={pricingItems.length === 1}
                      onClick={() => removePricingRow(idx)}
                    >
                      Delete
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ marginTop: "0.5rem", padding: "0.5rem 1rem", fontSize: "0.9rem" }}
                  onClick={addPricingRow}
                >
                  + Add Item
                </button>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsPricingModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: "#8b5cf6" }}>
                  Submit Pricing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Reason Modal */}
      {isCancelModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "560px" }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.25rem" }}>⚠️</span>
                <h3 style={{ margin: 0, color: "#dc2626" }}>Cancel Order</h3>
              </div>
              <button
                className="modal-close"
                onClick={() => !cancelLoading && setIsCancelModalOpen(false)}
                disabled={cancelLoading}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCancelSubmit}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {cancelTargetOrder && (
                  <div
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fee2e2",
                      borderRadius: "8px",
                      padding: "0.85rem 1rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                      <span style={{ fontWeight: 600, color: "#991b1b" }}>
                        Order #{cancelTargetOrder._id.slice(-6).toUpperCase()}
                      </span>
                      <span style={{ color: "#7f1d1d", textTransform: "capitalize" }}>
                        Status: <strong>{cancelTargetOrder.status}</strong>
                      </span>
                    </div>
                    <div style={{ color: "#475569", fontSize: "0.82rem", lineHeight: "1.4" }}>
                      <div>
                        <strong>Customer:</strong>{" "}
                        {cancelTargetOrder.shippingAddress?.fullName || cancelTargetOrder.userId?.name || "Customer"}
                      </div>
                      <div>
                        <strong>Email:</strong>{" "}
                        {cancelTargetOrder.shippingAddress?.email || cancelTargetOrder.userId?.email || "N/A"}
                      </div>
                      <div>
                        <strong>Payment:</strong>{" "}
                        {cancelTargetOrder.paymentMethod === "online" ? "💳 Online Prepaid" : "💵 Cash on Delivery"} (
                        {cancelTargetOrder.paymentStatus || "pending"})
                      </div>
                    </div>
                  </div>
                )}

                <div
                  style={{
                    background: "#eff6ff",
                    border: "1px solid #dbeafe",
                    borderRadius: "8px",
                    padding: "0.75rem 1rem",
                    fontSize: "0.82rem",
                    color: "#1e40af",
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>✉️</span>
                  <div>
                    <strong>Customer Notification Note:</strong> An official cancellation email will be immediately sent to
                    the customer containing this cancellation note, refund guidance (if prepaid), and support contact info.
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: "0" }}>
                  <label style={{ fontWeight: 600, marginBottom: "0.4rem", display: "block", fontSize: "0.875rem" }}>
                    Select Quick Reason Preset:
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.75rem" }}>
                    {[
                      "Prescription invalid or unreadable",
                      "Medicine out of stock / unavailable",
                      "Customer requested cancellation",
                      "Delivery address unreachable",
                      "Narcotics verification rejected",
                      "Duplicate order placed by customer",
                    ].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        className="btn"
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.3rem 0.6rem",
                          background: cancelReason === preset ? "#fee2e2" : "#f1f5f9",
                          color: cancelReason === preset ? "#991b1b" : "#334155",
                          border: cancelReason === preset ? "1px solid #ef4444" : "1px solid #cbd5e1",
                          borderRadius: "16px",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        onClick={() => setCancelReason(preset)}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <label style={{ fontWeight: 600, marginBottom: "0.35rem", display: "block", fontSize: "0.875rem" }}>
                    Cancellation Reason / Note to Customer <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    required
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Enter clear, polite details for the customer regarding why this order is being cancelled..."
                    disabled={cancelLoading}
                    style={{ width: "100%", borderRadius: "6px", padding: "0.5rem", border: "1px solid #cbd5e1", fontSize: "0.875rem" }}
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: "1rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCancelModalOpen(false)}
                  disabled={cancelLoading}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={cancelLoading || !cancelReason.trim()}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                >
                  {cancelLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Cancelling & Sending Email...
                    </>
                  ) : (
                    "Confirm Cancellation"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
