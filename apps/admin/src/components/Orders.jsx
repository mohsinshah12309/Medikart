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

  // Filters State
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

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
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    fetchOrders();
  }, [filterType, filterStatus, page]);

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

      const data = await adminFetch(endpoint);
      setOrders(data.data?.orders || []);
      setTotal(data.data?.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
  const handleOpenCancelModal = (orderId) => {
    setCancelOrderId(orderId);
    setCancelReason("");
    setIsCancelModalOpen(true);
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    try {
      await adminFetch(`/admin/orders/${cancelOrderId}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ reason: cancelReason }),
      });

      setSuccessMsg("Order cancelled successfully.");
      setIsCancelModalOpen(false);
      fetchOrders();
      if (isDetailModalOpen) {
        handleCloseDetails();
      }
    } catch (err) {
      setError(err.message);
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
    setPage(1);
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Manage Orders</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <select className="form-control" style={{ width: "160px" }} value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            <option value="standard">Standard</option>
            <option value="instant">Instant</option>
            <option value="narcotics">Narcotics</option>
          </select>

          <select className="form-control" style={{ width: "180px" }} value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="awaiting-pharmacist-pricing">Awaiting Pricing</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="pending">Pending Fulfillment</option>
            <option value="packed">Packed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

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
              {filterType || filterStatus 
                ? "There are no orders matching your selected filter criteria." 
                : "No customer orders have been placed in the system yet."}
            </p>
            {(filterType || filterStatus) && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ marginTop: "0.5rem", fontSize: "0.85rem", padding: "0.4rem 0.85rem" }}
                onClick={handleResetFilters}
              >
                Reset All Filters
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
                  <th>Payment Method</th>
                  <th>Payment State</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td><code style={{ fontSize: "0.85rem" }}>{order._id}</code></td>
                    <td style={{ fontWeight: 600 }}>{order.customer?.name}</td>
                    <td style={{ textTransform: "capitalize" }}>{order.type}</td>
                    <td>
                      {order.totals?.total !== undefined ? (
                        <strong>PKR {order.totals.total.toFixed(2)}</strong>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>Pending Pricing</span>
                      )}
                    </td>
                    <td style={{ textTransform: "uppercase" }}>{order.paymentMethod}</td>
                    <td style={{ textTransform: "capitalize" }}>{order.paymentState}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem" }}
                          onClick={() => handleOpenDetails(order)}
                        >
                          View Details
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
                  <p style={{ margin: "0.25rem 0" }}><strong>Order Status:</strong> {selectedOrder.status}</p>
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
          <div className="modal-content" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h3>Cancel Order</h3>
              <button className="modal-close" onClick={() => setIsCancelModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCancelSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Cancellation Reason</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    required
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Enter reason for cancelling this order..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCancelModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger">
                  Cancel Order
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
