import React, { useState, useEffect } from "react";
import { adminFetch, API_URL } from "../apiClient";

function Orders({ token, adminUser, initialFilter }) {

  // Role scoping
  const isScopedAdmin = adminUser?.role !== "super_admin" && !!adminUser?.assignedPharmacyId;
  const scopedPharmacyId = adminUser?.assignedPharmacyId;

  // List State
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filter & Search State
  const [filterType, setFilterType] = useState(initialFilter?.filterType || "");
  const [filterStatus, setFilterStatus] = useState(initialFilter?.filterStatus || "");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState(
    initialFilter?.filterPaymentMethod || initialFilter?.paymentMethod || ""
  );
  const [searchQuery, setSearchQuery] = useState(initialFilter?.searchQuery || "");
  const [activeSearch, setActiveSearch] = useState(initialFilter?.searchQuery || "");
  const [dateFilter, setDateFilter] = useState(initialFilter?.dateFilter || "today"); // 'today' | 'yesterday' | '7days' | 'month' | 'custom' | 'all'
  const [startDate, setStartDate] = useState(initialFilter?.startDate || "");
  const [endDate, setEndDate] = useState(initialFilter?.endDate || "");
  const [filterPharmacyId, setFilterPharmacyId] = useState(
    isScopedAdmin ? scopedPharmacyId : (initialFilter?.pharmacyId || initialFilter?.filterPharmacyId || "")
  );

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  // Pharmacies List
  const [pharmacies, setPharmacies] = useState([]);

  // Categories List
  const [categories, setCategories] = useState([]);

  // Active Products for Pricing Picker
  const [products, setProducts] = useState([]);

  // Detail Modal States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [prescriptionBlobUrl, setPrescriptionBlobUrl] = useState("");
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);

  // Pricing Modal States
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [pricingOrder, setPricingOrder] = useState(null);
  const [pricingItems, setPricingItems] = useState([]);
  const [pricingOrderId, setPricingOrderId] = useState(null);
  const [pricingCategoryFilter, setPricingCategoryFilter] = useState("");
  const [pricingSearchQuery, setPricingSearchQuery] = useState("");
  const [pricingPrescriptionBlobUrl, setPricingPrescriptionBlobUrl] = useState("");
  const [pricingLoading, setPricingLoading] = useState(false);

  // Cancel Modal States
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [cancelTargetOrder, setCancelTargetOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

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

  const handleOpenExportModal = () => {
    setExportDatePreset(dateFilter);
    if (dateFilter === "today") {
      setExportStartDate(getPKTDate(0));
      setExportEndDate(getPKTDate(0));
    } else if (dateFilter === "yesterday") {
      setExportStartDate(getPKTDate(1));
      setExportEndDate(getPKTDate(1));
    } else if (dateFilter === "7days") {
      setExportStartDate(getPKTDate(7));
      setExportEndDate(getPKTDate(0));
    } else if (dateFilter === "month") {
      const now = new Date();
      setExportStartDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`);
      setExportEndDate(getPKTDate(0));
    } else if (dateFilter === "all") {
      setExportStartDate("");
      setExportEndDate("");
    } else {
      setExportStartDate(startDate || getPKTDate(0));
      setExportEndDate(endDate || getPKTDate(0));
    }
    setExportStatus(filterStatus);
    setExportType(filterType);
    setExportPaymentMethod(filterPaymentMethod);
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
      if (isScopedAdmin) {
        params.push(`pharmacyId=${encodeURIComponent(scopedPharmacyId)}`);
      } else if (filterPharmacyId) {
        params.push(`pharmacyId=${encodeURIComponent(filterPharmacyId)}`);
      }
      if (activeSearch.trim()) {
        params.push(`search=${encodeURIComponent(activeSearch.trim())}`);
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
    if (initialFilter) {
      if (initialFilter.filterStatus !== undefined) setFilterStatus(initialFilter.filterStatus);
      if (initialFilter.filterType !== undefined) setFilterType(initialFilter.filterType);
      if (initialFilter.filterPaymentMethod !== undefined) setFilterPaymentMethod(initialFilter.filterPaymentMethod);
      if (initialFilter.paymentMethod !== undefined) setFilterPaymentMethod(initialFilter.paymentMethod);
      if (initialFilter.dateFilter !== undefined) setDateFilter(initialFilter.dateFilter);
      if (initialFilter.startDate !== undefined) setStartDate(initialFilter.startDate);
      if (initialFilter.endDate !== undefined) setEndDate(initialFilter.endDate);
      if (initialFilter.pharmacyId !== undefined) {
        setFilterPharmacyId(initialFilter.pharmacyId);
      } else if (initialFilter.filterPharmacyId !== undefined) {
        setFilterPharmacyId(initialFilter.filterPharmacyId);
      }
      if (initialFilter.searchQuery !== undefined) {
        setSearchQuery(initialFilter.searchQuery);
        setActiveSearch(initialFilter.searchQuery);
      }
      setPage(1);
    }
  }, [initialFilter]);

  useEffect(() => {
    fetchOrders();
  }, [filterType, filterStatus, filterPaymentMethod, activeSearch, dateFilter, startDate, endDate, filterPharmacyId, page]);

  useEffect(() => {
    fetchProducts();
    fetchPharmacies();
    fetchCategories();
  }, []);

  // Live dynamic product search when pricing modal is active
  useEffect(() => {
    if (isPricingModalOpen) {
      const timer = setTimeout(() => {
        fetchProducts(pricingSearchQuery, pricingCategoryFilter);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pricingSearchQuery, pricingCategoryFilter, isPricingModalOpen]);



  const fetchPharmacies = async () => {
    try {
      const data = await adminFetch("/admin/pharmacies");
      setPharmacies(data.data?.pharmacies || []);
    } catch (_) {}
  };

  const fetchCategories = async () => {
    try {
      const data = await adminFetch("/admin/categories?limit=100");
      setCategories(data.data?.categories || []);
    } catch (err) {
      console.error("fetchCategories error:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      let endpoint = `/admin/orders?page=${page}&limit=${limit}`;
      if (filterType) endpoint += `&type=${filterType}`;
      if (filterStatus) endpoint += `&status=${filterStatus}`;
      if (filterPaymentMethod) endpoint += `&paymentMethod=${filterPaymentMethod}`;
      if (filterPharmacyId) endpoint += `&pharmacyId=${filterPharmacyId}`;
      if (activeSearch.trim()) endpoint += `&search=${encodeURIComponent(activeSearch.trim())}`;

      let s = startDate;
      let e = endDate;

      if (dateFilter === "today") {
        s = getPKTDate(0);
        e = getPKTDate(0);
      } else if (dateFilter === "yesterday") {
        s = getPKTDate(1);
        e = getPKTDate(1);
      } else if (dateFilter === "7days") {
        s = getPKTDate(7);
        e = getPKTDate(0);
      } else if (dateFilter === "month") {
        const now = new Date();
        s = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
        e = getPKTDate(0);
      } else if (dateFilter === "all") {
        s = "";
        e = "";
      }

      if (s) endpoint += `&startDate=${s}`;
      if (e) endpoint += `&endDate=${e}`;

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

  const handleAssignPharmacy = async (orderId, pharmacyId) => {
    try {
      const res = await adminFetch(`/admin/orders/${orderId}/pharmacy`, {
        method: "PATCH",
        body: JSON.stringify({ pharmacyId }),
      });
      setSuccessMsg("Fulfillment pharmacy branch assigned successfully.");
      await fetchOrders();
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(res.data?.order || null);
      }
    } catch (err) {
      setError(err.message || "Failed to assign pharmacy.");
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    if (newStatus === "cancelled") {
      handleOpenCancelModal(orderId);
      return;
    }

    const confirmMsg =
      newStatus === "completed" || newStatus === "delivered"
        ? "Are you sure you want to mark this order as Completed / Delivered?"
        : `Change status of this order to "${newStatus}"?`;

    if (!window.confirm(confirmMsg)) return;

    setError("");
    setSuccessMsg("");
    setStatusUpdatingId(orderId);

    try {
      const res = await adminFetch(`/admin/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      setSuccessMsg(`Order status successfully updated to "${newStatus}".`);
      await fetchOrders();
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(res.data?.order || null);
      }
    } catch (err) {
      setError(err.message || "Failed to update order status");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const [catalogLoading, setCatalogLoading] = useState(false);

  const fetchProducts = async (query = "", categoryId = "") => {
    try {
      setCatalogLoading(true);
      let endpoint = "/admin/products?limit=50";
      if (query && query.trim()) endpoint += `&search=${encodeURIComponent(query.trim())}`;
      if (categoryId) endpoint += `&categoryId=${categoryId}`;
      const data = await adminFetch(endpoint);
      setProducts(data.data?.products || []);
    } catch (err) {
      console.error("Failed to load products for picker:", err.message);
    } finally {
      setCatalogLoading(false);
    }
  };

  const loadPrescription = async (prescriptionUrl) => {
    if (!prescriptionUrl) {
      setPrescriptionBlobUrl("");
      return;
    }

    setPrescriptionLoading(true);
    try {
      const res = await adminFetch(prescriptionUrl, {
        returnRawResponse: true,
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

  const handleOpenPricingModal = async (target) => {
    let order = null;
    let orderId = null;

    if (typeof target === "string") {
      orderId = target;
      order = orders.find((o) => o._id === target) || (selectedOrder?._id === target ? selectedOrder : null);
    } else if (target && target._id) {
      order = target;
      orderId = target._id;
    }

    setPricingOrderId(orderId);
    setPricingOrder(order);
    setPricingCategoryFilter("");
    setPricingSearchQuery("");
    setPricingPrescriptionBlobUrl("");

    // Initialize items with any existing items on the order or empty array
    if (order && order.items && order.items.length > 0) {
      setPricingItems(
        order.items.map((it) => ({
          productId: it.productId?._id || it.productId || it._id,
          productName: it.name || it.productId?.name || "Medicine",
          price: it.price || 0,
          quantity: it.quantity || 1,
          isNarcotic: !!it.isNarcotic,
          sku: it.sku || "",
        }))
      );
    } else {
      setPricingItems([]);
    }

    setIsPricingModalOpen(true);
    fetchCategories();
    fetchProducts("", "");

    // Fetch prescription if present
    if (order?.prescriptionUrl) {
      try {
        const res = await adminFetch(order.prescriptionUrl, {
          returnRawResponse: true,
        });
        if (res.ok) {
          const blob = await res.blob();
          setPricingPrescriptionBlobUrl(URL.createObjectURL(blob));
        }
      } catch (e) {
        console.error("Pricing prescription preview load error:", e);
      }
    }
  };

  const handleClosePricingModal = () => {
    setIsPricingModalOpen(false);
    setPricingOrderId(null);
    setPricingOrder(null);
    setPricingItems([]);
    if (pricingPrescriptionBlobUrl) {
      URL.revokeObjectURL(pricingPrescriptionBlobUrl);
      setPricingPrescriptionBlobUrl("");
    }
  };

  const handleAddProductToPricing = (product) => {
    const existingIndex = pricingItems.findIndex((item) => item.productId === product._id);
    if (existingIndex > -1) {
      const updated = [...pricingItems];
      updated[existingIndex].quantity = (updated[existingIndex].quantity || 1) + 1;
      setPricingItems(updated);
    } else {
      setPricingItems([
        ...pricingItems,
        {
          productId: product._id,
          productName: product.name,
          price: product.price || 0,
          quantity: 1,
          isNarcotic: !!product.isNarcotic,
          sku: product.sku || "",
        },
      ]);
    }
  };

  const handleRemovePricingItem = (index) => {
    setPricingItems(pricingItems.filter((_, i) => i !== index));
  };

  const handleUpdatePricingQuantity = (index, newQty) => {
    const qty = Math.max(1, parseInt(newQty, 10) || 1);
    const updated = [...pricingItems];
    updated[index].quantity = qty;
    setPricingItems(updated);
  };

  const handlePricingSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (pricingItems.length === 0) {
      setError("Please add at least one medicine from the catalog to quote this order.");
      return;
    }

    try {
      setPricingLoading(true);
      const itemsPayload = pricingItems.map((item) => ({
        productId: item.productId,
        quantity: parseInt(item.quantity, 10),
      }));

      const res = await adminFetch(`/admin/orders/${pricingOrderId}/items`, {
        method: "PATCH",
        body: JSON.stringify({ items: itemsPayload }),
      });

      setSuccessMsg(`Instant order priced successfully! Total: PKR ${res.data?.order?.totals?.total?.toLocaleString() || "calculated"}`);
      handleClosePricingModal();
      await fetchOrders();
      if (selectedOrder && selectedOrder._id === pricingOrderId) {
        setSelectedOrder(res.data?.order || null);
      }
    } catch (err) {
      setError(err.message || "Failed to price instant order.");
    } finally {
      setPricingLoading(false);
    }
  };

  const handleReviewNarcotics = async (orderId, decision) => {
    setError("");
    setSuccessMsg("");

    const action = decision === "approved" ? "Approve" : "Reject";
    if (!window.confirm(`Are you sure you want to ${action} this narcotics prescription order?`)) return;

    try {
      await adminFetch(`/admin/orders/${orderId}/verification`, {
        method: "PATCH",
        body: JSON.stringify({ decision }),
      });

      setSuccessMsg(`Prescription order marked as ${decision.toUpperCase()}.`);
      fetchOrders();
    } catch (err) {
      setError(err.message || "Failed to verify narcotics order.");
    }
  };

  const handleOpenCancelModal = (orderId) => {
    const target = orders.find((o) => o._id === orderId) || (selectedOrder?._id === orderId ? selectedOrder : null);
    setCancelOrderId(orderId);
    setCancelTargetOrder(target);
    setCancelReason("");
    setIsCancelModalOpen(true);
  };

  const handleCloseCancelModal = () => {
    setIsCancelModalOpen(false);
    setCancelOrderId(null);
    setCancelTargetOrder(null);
    setCancelReason("");
    setCancelLoading(false);
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      setError("Please enter a reason note for cancelling this order.");
      return;
    }

    setCancelLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      await adminFetch(`/admin/orders/${cancelOrderId}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });

      setSuccessMsg("Order cancelled successfully. Cancellation notice email sent to the customer.");
      handleCloseCancelModal();
      fetchOrders();
      if (selectedOrder && selectedOrder._id === cancelOrderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: "cancelled" } : null));
      }
    } catch (err) {
      setError(err.message || "Failed to cancel order.");
      setCancelLoading(false);
    }
  };

  const handleMarkRefunded = async (orderId) => {
    if (!window.confirm("Confirm that payment has been manually refunded to the customer?")) return;

    setError("");
    setSuccessMsg("");

    try {
      await adminFetch(`/admin/orders/${orderId}/refund`, {
        method: "PATCH",
      });

      setSuccessMsg("Refund status successfully updated to REFUNDED.");
      fetchOrders();
    } catch (err) {
      setError(err.message || "Failed to mark order as refunded.");
    }
  };

  const handleResetFilters = () => {
    setFilterType("");
    setFilterStatus("");
    setFilterPaymentMethod("");
    setDateFilter("all");
    setStartDate("");
    setEndDate("");
    setFilterPharmacyId("");
    setSearchQuery("");
    setActiveSearch("");
    setPage(1);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "awaiting-pharmacist-pricing": return "badge-pricing-pending";
      case "pending_verification": return "badge-prescription";
      case "pending": return "badge-pending";
      case "packed": return "badge-discount";
      case "shipped": return "badge-discount";
      case "delivered": return "badge-delivered";
      case "cancelled": return "badge-cancelled";
      case "rejected": return "badge-cancelled";
      default: return "badge-pending";
    }
  };

  const isCancelable = (status) => {
    const s = status ? status.toLowerCase() : "";
    return ["pending", "packed", "pending_verification", "awaiting-pharmacist-pricing"].includes(s);
  };

  const PRESET_REASONS = [
    "Prescription invalid, expired, or unreadable.",
    "Requested medicine is currently out of stock.",
    "Customer requested cancellation via phone/chat.",
    "Customer delivery address unreachable / outside coverage.",
    "Narcotics regulatory verification rejected by pharmacist.",
    "Duplicate order placed by customer.",
  ];

  const scopedPharmacy = pharmacies.find((p) => String(p._id) === String(scopedPharmacyId));

  return (
    <div>
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: "1rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "bold" }}>Customer Orders</h2>
          <p style={{ margin: "0.25rem 0 0 0", color: "#64748b", fontSize: "0.9rem" }}>
            Real-time orders queue, status progression, and pharmacy branch fulfillment.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
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
            title="Download date-filtered orders spreadsheet in Excel (.xlsx) format"
          >
            <span>📥</span>
            <span>{exportLoading ? "Exporting..." : "Download Excel"}</span>
          </button>
          <button className="btn btn-secondary" onClick={fetchOrders} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Scoped Pharmacy Admin Notice */}
      {isScopedAdmin && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderLeft: "4px solid #16a34a",
            borderRadius: "8px",
            padding: "0.6rem 0.9rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            fontSize: "0.85rem",
            color: "#166534",
            fontWeight: 600,
          }}
        >
          <span>🏥</span>
          <span>
            <strong>Assigned Pharmacy Scope:</strong> You are viewing and managing orders specifically assigned to <strong>{scopedPharmacy ? `${scopedPharmacy.name} (${scopedPharmacy.city || "Branch"})` : "your designated pharmacy"}</strong>.
          </span>
        </div>
      )}

      {/* Date Filter Toolbar */}
      <div style={{ background: "white", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "1rem", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>📅 View Date:</span>
          {[
            { key: "today", label: "Today (Default)" },
            { key: "yesterday", label: "Yesterday" },
            { key: "7days", label: "Last 7 Days" },
            { key: "month", label: "This Month" },
            { key: "all", label: "All History" },
            { key: "custom", label: "Custom Range" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setDateFilter(item.key);
                setPage(1);
              }}
              style={{
                border: "1px solid",
                borderColor: dateFilter === item.key ? "#facc15" : "#e2e8f0",
                background: dateFilter === item.key ? "#fef9c3" : "#ffffff",
                color: dateFilter === item.key ? "#854d0e" : "#475569",
                fontWeight: dateFilter === item.key ? 700 : 500,
                borderRadius: "6px",
                padding: "0.25rem 0.6rem",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              {item.label}
            </button>
          ))}

          {dateFilter === "custom" && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginLeft: "0.5rem" }}>
              <input
                type="date"
                className="form-control"
                style={{ padding: "0.2rem 0.4rem", fontSize: "0.8rem" }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span style={{ fontSize: "0.8rem" }}>to</span>
              <input
                type="date"
                className="form-control"
                style={{ padding: "0.2rem 0.4rem", fontSize: "0.8rem" }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          )}
        </div>

        {isScopedAdmin ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.25rem 0.6rem",
            borderRadius: "6px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "#166534"
          }}>
            <span>🏥 Branch: {scopedPharmacy ? `${scopedPharmacy.name} (${scopedPharmacy.city || "Branch"})` : "Assigned Branch"}</span>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569" }}>Branch:</span>
            <select
              className="form-control"
              style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
              value={filterPharmacyId}
              onChange={(e) => {
                setFilterPharmacyId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Branches</option>
              <option value="assigned">Assigned to Any Branch</option>
              <option value="unassigned">Unassigned Orders</option>
              {pharmacies.map((ph) => (
                <option key={ph._id} value={ph._id}>
                  {ph.name} ({ph.code})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Active Branch Filter Banner */}
      {!isScopedAdmin && filterPharmacyId && (
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            padding: "0.5rem 0.75rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.85rem",
            color: "#1e40af",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🏥</span>
            <span>
              <strong>Filtered by Branch:</strong>{" "}
              {filterPharmacyId === "assigned"
                ? "All Assigned Branches (Orders assigned to any pharmacy)"
                : filterPharmacyId === "unassigned"
                ? "Unassigned Orders (Awaiting pharmacy branch assignment)"
                : (() => {
                    const matched = pharmacies.find((p) => String(p._id) === String(filterPharmacyId));
                    return matched ? `${matched.name} (${matched.code})` : `Branch ID: ${filterPharmacyId}`;
                  })()}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setFilterPharmacyId("");
              setPage(1);
            }}
            style={{
              background: "#dbeafe",
              border: "1px solid #bfdbfe",
              borderRadius: "4px",
              padding: "0.15rem 0.5rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#1d4ed8",
              cursor: "pointer",
            }}
            title="Clear branch filter to view all orders"
          >
            Clear Branch Filter ✕
          </button>
        </div>
      )}

      {/* Active Payment Method Filter Banner */}
      {filterPaymentMethod && (
        <div
          style={{
            background: filterPaymentMethod === "cod" ? "#f0fdf4" : "#eff6ff",
            border: `1px solid ${filterPaymentMethod === "cod" ? "#86efac" : "#bfdbfe"}`,
            borderRadius: "8px",
            padding: "0.5rem 0.75rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.85rem",
            color: filterPaymentMethod === "cod" ? "#166534" : "#1e40af",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>{filterPaymentMethod === "cod" ? "💵" : "💳"}</span>
            <span>
              <strong>Filtered by Payment Method:</strong>{" "}
              {filterPaymentMethod === "cod"
                ? "Cash on Delivery (COD)"
                : "Credit / Debit Card (CC - Habib Metro)"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setFilterPaymentMethod("");
              setPage(1);
            }}
            style={{
              background: filterPaymentMethod === "cod" ? "#dcfce7" : "#dbeafe",
              border: `1px solid ${filterPaymentMethod === "cod" ? "#86efac" : "#bfdbfe"}`,
              borderRadius: "4px",
              padding: "0.15rem 0.5rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: filterPaymentMethod === "cod" ? "#15803d" : "#1d4ed8",
              cursor: "pointer",
            }}
            title="Clear payment method filter"
          >
            Clear Payment Filter ✕
          </button>
        </div>
      )}

      {/* Active Search Banner */}
      {activeSearch && (
        <div
          style={{
            background: "#fefce8",
            border: "1px solid #fef08a",
            borderRadius: "8px",
            padding: "0.5rem 0.75rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.85rem",
            color: "#854d0e",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🔍</span>
            <span>
              <strong>Active Search Filter:</strong> Showing results matching &ldquo;{activeSearch}&rdquo;
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearSearch}
            style={{
              background: "#fef08a",
              border: "1px solid #fde047",
              borderRadius: "4px",
              padding: "0.15rem 0.5rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#713f12",
              cursor: "pointer",
            }}
            title="Clear search to show standard queue"
          >
            Clear Search ✕
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="filter-bar" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <select
            className="form-control"
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
            style={{ width: "auto", minWidth: "130px" }}
          >
            <option value="">All Types</option>
            <option value="standard">Standard</option>
            <option value="instant">Instant (Rx Upload)</option>
            <option value="narcotics">Controlled / Narcotics</option>
          </select>

          <select
            className="form-control"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            style={{ width: "auto", minWidth: "150px" }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="packed">Packed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="awaiting-pharmacist-pricing">Pricing Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            className="form-control"
            value={filterPaymentMethod}
            onChange={(e) => {
              setFilterPaymentMethod(e.target.value);
              setPage(1);
            }}
            style={{ width: "auto", minWidth: "160px" }}
          >
            <option value="">All Payment Methods</option>
            <option value="cod">💵 Cash on Delivery (COD)</option>
            <option value="card">💳 Card / CC (Habib Metro)</option>
          </select>
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem", flex: 1, maxWidth: "450px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by Order ID / Code, Customer name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingRight: "2rem" }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8" }}
              >
                &times;
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-primary" style={{ background: "#eab308", color: "#0f172a", fontWeight: "bold" }}>
            Search
          </button>
        </form>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: "1rem" }}>{error}</div>}
      {successMsg && <div className="alert alert-success" style={{ marginBottom: "1rem" }}>{successMsg}</div>}

      {/* Orders Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Loading orders queue...</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <span style={{ fontSize: "2rem" }}>📦</span>
            <h3 style={{ margin: "0.5rem 0", color: "#0f172a" }}>No Orders Found</h3>
            <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
              {dateFilter === "today" ? "No customer orders have been placed today." : "No orders matching selected criteria."}
            </p>
            <button className="btn btn-secondary" onClick={handleResetFilters} style={{ marginTop: "0.5rem" }}>
              View All Orders
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Order Code</th>
                  <th>Customer & City</th>
                  <th>Type</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Branch Assignment</th>
                  <th>Status</th>
                  <th>Progression</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const isLocked = order.status === "delivered" || order.status === "cancelled";
                  const isOrderLockedForUser = isLocked && adminUser?.role !== "super_admin";

                  return (
                  <tr key={order._id}>
                    <td>
                      <div style={{ fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "4px" }}>
                        #{order.orderCode || order._id.slice(-6).toUpperCase()}
                        {isLocked && (
                          <span title={isOrderLockedForUser ? "Order is locked (Delivered/Cancelled)" : "Locked (Super Admin has override)"} style={{ fontSize: "0.75rem" }}>
                            {isOrderLockedForUser ? "🔒" : "🔓"}
                          </span>
                        )}
                      </div>
                      <code style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{order._id}</code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.customer?.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        📍 {order.customer?.city} • 📞 {order.customer?.phone}
                      </div>
                    </td>
                    <td style={{ textTransform: "capitalize", fontSize: "0.85rem" }}>{order.type}</td>
                    <td>
                      {order.paymentMethod === "cod" ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "0.2rem 0.5rem",
                            borderRadius: "6px",
                            background: "#ecfdf5",
                            color: "#065f46",
                            border: "1px solid #a7f3d0",
                            whiteSpace: "nowrap",
                          }}
                          title="Cash on Delivery"
                        >
                          <span>💵</span> COD
                          {order.paymentState === "paid" && (
                            <span style={{ fontSize: "0.65rem", background: "#10b981", color: "#fff", padding: "1px 4px", borderRadius: "3px", marginLeft: "2px" }}>
                              Paid
                            </span>
                          )}
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "0.2rem 0.5rem",
                            borderRadius: "6px",
                            background: "#eff6ff",
                            color: "#1e40af",
                            border: "1px solid #bfdbfe",
                            whiteSpace: "nowrap",
                          }}
                          title="Habib Metro Card Payment"
                        >
                          <span>💳</span> Card (CC)
                          {order.paymentState === "paid" && (
                            <span style={{ fontSize: "0.65rem", background: "#2563eb", color: "#fff", padding: "1px 4px", borderRadius: "3px", marginLeft: "2px" }}>
                              Paid
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                    <td>
                      {order.totals?.total !== undefined ? (
                        <strong>PKR {order.totals.total.toLocaleString()}</strong>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>Pending Pricing</span>
                      )}
                    </td>
                    <td>
                      {isScopedAdmin ? (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.5rem",
                          borderRadius: "6px",
                          background: "#eff6ff",
                          color: "#1e40af",
                          border: "1px solid #bfdbfe",
                          whiteSpace: "nowrap",
                        }}>
                          🏥 {typeof order.assignedPharmacyId === "object" ? `${order.assignedPharmacyId?.code || "Branch"} - ${order.assignedPharmacyId?.name}` : (scopedPharmacy ? `${scopedPharmacy.code || "Branch"} - ${scopedPharmacy.name}` : "Assigned Branch")}
                        </span>
                      ) : (
                        <select
                          className="form-control"
                          style={{ fontSize: "0.75rem", padding: "0.2rem 0.4rem", width: "auto" }}
                          value={typeof order.assignedPharmacyId === "object" ? order.assignedPharmacyId?._id || "" : order.assignedPharmacyId || ""}
                          disabled={isOrderLockedForUser}
                          title={isOrderLockedForUser ? "Cannot reassign branch on a locked order" : "Assign pharmacy branch"}
                          onChange={(e) => handleAssignPharmacy(order._id, e.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {pharmacies.map((ph) => (
                            <option key={ph._id} value={ph._id}>
                              {ph.code} - {ph.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <select
                          className="form-control"
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.2rem 0.4rem",
                            width: "auto",
                            minWidth: "125px",
                            fontWeight: 700,
                            borderRadius: "6px",
                            cursor: isOrderLockedForUser ? "not-allowed" : "pointer",
                            opacity: isOrderLockedForUser ? 0.8 : 1,
                            background:
                              order.status === "delivered" ? "#f0fdf4" :
                              order.status === "shipped" ? "#eff6ff" :
                              order.status === "packed" ? "#fefce8" :
                              order.status === "cancelled" ? "#fef2f2" :
                              order.status === "awaiting-pharmacist-pricing" ? "#faf5ff" :
                              order.status === "pending_verification" ? "#fffbeb" : "#f8fafc",
                            borderColor:
                              order.status === "delivered" ? "#86efac" :
                              order.status === "shipped" ? "#93c5fd" :
                              order.status === "packed" ? "#fde047" :
                              order.status === "cancelled" ? "#fca5a5" :
                              order.status === "awaiting-pharmacist-pricing" ? "#d8b4fe" :
                              order.status === "pending_verification" ? "#fde68a" : "#cbd5e1",
                            color:
                              order.status === "delivered" ? "#166534" :
                              order.status === "shipped" ? "#1e40af" :
                              order.status === "packed" ? "#854d0e" :
                              order.status === "cancelled" ? "#991b1b" :
                              order.status === "awaiting-pharmacist-pricing" ? "#6b21a8" :
                              order.status === "pending_verification" ? "#92400e" : "#0f172a",
                          }}
                          value={order.status}
                          disabled={statusUpdatingId === order._id || isOrderLockedForUser}
                          onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                          title={
                            isOrderLockedForUser
                              ? `🔒 Locked (${order.status.toUpperCase()}) - Only Super Admin can modify`
                              : isLocked && adminUser?.role === "super_admin"
                              ? "🔓 Super Admin Override - You can change this locked order"
                              : "Change order status"
                          }
                        >
                          {order.status === "awaiting-pharmacist-pricing" && (
                            <option value="awaiting-pharmacist-pricing" disabled>⚡ Awaiting Pricing (Price items first)</option>
                          )}
                          {order.status === "pending_verification" && (
                            <option value="pending_verification" disabled>📋 Pending Verification (Approve Rx first)</option>
                          )}
                          <option value="pending" disabled={order.status === "awaiting-pharmacist-pricing" || order.status === "pending_verification"}>Pending</option>
                          <option value="packed" disabled={order.status === "awaiting-pharmacist-pricing" || order.status === "pending_verification"}>Packed</option>
                          <option value="shipped" disabled={order.status === "awaiting-pharmacist-pricing" || order.status === "pending_verification"}>Shipped</option>
                          <option value="delivered" disabled={order.status === "awaiting-pharmacist-pricing" || order.status === "pending_verification"}>Delivered / Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                    <td>
                      {!isOrderLockedForUser && order.status === "pending" && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem", background: "#fef3c7", color: "#92400e", border: "1px solid #fde047" }}
                          disabled={statusUpdatingId === order._id}
                          onClick={() => handleUpdateOrderStatus(order._id, "packed")}
                        >
                          → Mark Packed
                        </button>
                      )}
                      {!isOrderLockedForUser && order.status === "packed" && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem", background: "#e0e7ff", color: "#3730a3", border: "1px solid #c7d2fe" }}
                          disabled={statusUpdatingId === order._id}
                          onClick={() => handleUpdateOrderStatus(order._id, "shipped")}
                        >
                          → Mark Shipped
                        </button>
                      )}
                      {!isOrderLockedForUser && order.status === "shipped" && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem", background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }}
                          disabled={statusUpdatingId === order._id}
                          onClick={() => handleUpdateOrderStatus(order._id, "delivered")}
                        >
                          ✓ Mark Delivered
                        </button>
                      )}
                      {order.status === "delivered" && (
                        <span style={{ fontSize: "0.8rem", color: "#166534", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                          {isOrderLockedForUser ? "🔒 " : "✓ "}Completed
                        </span>
                      )}
                      {order.status === "cancelled" && (
                        <span style={{ fontSize: "0.8rem", color: "#dc2626", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                          {isOrderLockedForUser ? "🔒 " : ""}Cancelled
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                          onClick={() => handleOpenDetails(order)}
                        >
                          Details
                        </button>
                        {!isOrderLockedForUser && order.status === "awaiting-pharmacist-pricing" && (
                          <button
                            className="btn btn-primary"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", background: "#8b5cf6" }}
                            onClick={() => handleOpenPricingModal(order._id)}
                          >
                            Price Items
                          </button>
                        )}
                        {!isOrderLockedForUser && order.status === "pending_verification" && (
                          <button
                            className="btn btn-primary"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", background: "#059669" }}
                            onClick={() => handleReviewNarcotics(order._id, "approved")}
                          >
                            Approve Rx
                          </button>
                        )}
                        {!isOrderLockedForUser && isCancelable(order.status) && (
                          <button
                            className="btn btn-danger"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                            onClick={() => handleOpenCancelModal(order._id)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
          <button className="btn btn-outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>← Previous</button>
          <span>Page {page}</span>
          <button className="btn btn-outline" onClick={() => setPage(p => p + 1)} disabled={orders.length < 20}>Next →</button>
        </div>
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "750px" }}>
            <div className="modal-header">
              <h3>Order #{selectedOrder.orderCode || selectedOrder._id}</h3>
              <button className="modal-close" onClick={handleCloseDetails}>&times;</button>
            </div>
            <div className="modal-body">
              {/* Order Lock Banner */}
              {(selectedOrder.status === "delivered" || selectedOrder.status === "cancelled") && (
                adminUser?.role === "super_admin" ? (
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderLeft: "4px solid #16a34a", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem", color: "#166534", fontSize: "0.85rem", fontWeight: 600 }}>
                    <span>🔓</span>
                    <span><strong>Super Admin Override:</strong> This order is currently <strong>{selectedOrder.status.toUpperCase()}</strong>. As Super Admin, you have authority to modify or change its status.</span>
                  </div>
                ) : (
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderLeft: "4px solid #ef4444", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem", color: "#991b1b", fontSize: "0.85rem", fontWeight: 600 }}>
                    <span>🔒</span>
                    <span><strong>Order Locked:</strong> This order is in <strong>{selectedOrder.status.toUpperCase()}</strong> status and is locked. Only Super Admin has permission to modify its status.</span>
                  </div>
                )
              )}

              {/* Instant Order Action Banner if awaiting pricing */}
              {selectedOrder.status === "awaiting-pharmacist-pricing" && (
                <div style={{ background: "#fef9c3", border: "1px solid #facc15", padding: "0.85rem 1rem", borderRadius: "10px", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#854d0e", fontSize: "0.95rem" }}>⚡ Instant Order Awaiting Pharmacist Pricing</div>
                    <div style={{ fontSize: "0.8rem", color: "#a16207" }}>Review prescription and add catalog medicines with real prices.</div>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ background: "#eab308", color: "#0f172a", fontWeight: "bold", padding: "0.45rem 1rem", fontSize: "0.85rem" }}
                    onClick={() => {
                      const cur = selectedOrder;
                      handleCloseDetails();
                      handleOpenPricingModal(cur);
                    }}
                  >
                    ⚡ Price Order Now
                  </button>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem" }}>Customer Information</h4>
                  <p style={{ margin: "0.2rem 0", fontSize: "0.85rem" }}><strong>Name:</strong> {selectedOrder.customer?.name}</p>
                  <p style={{ margin: "0.2rem 0", fontSize: "0.85rem" }}><strong>Phone:</strong> {selectedOrder.customer?.phone}</p>
                  <p style={{ margin: "0.2rem 0", fontSize: "0.85rem" }}><strong>Email:</strong> {selectedOrder.customer?.email}</p>
                  <p style={{ margin: "0.2rem 0", fontSize: "0.85rem" }}><strong>Address:</strong> {selectedOrder.customer?.address}, {selectedOrder.customer?.city}</p>
                </div>
                <div>
                  <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem" }}>Order Details</h4>
                  <p style={{ margin: "0.2rem 0", fontSize: "0.85rem" }}><strong>Type:</strong> <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{selectedOrder.type}</span></p>
                  <p style={{ margin: "0.2rem 0", fontSize: "0.85rem" }}><strong>Payment:</strong> <span style={{ textTransform: "uppercase" }}>{selectedOrder.paymentMethod}</span> ({selectedOrder.paymentState})</p>
                  <div style={{ margin: "0.4rem 0", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <strong style={{ fontSize: "0.85rem" }}>Change Status:</strong>
                    <select
                      className="form-control"
                      style={{
                        fontSize: "0.8rem",
                        padding: "0.25rem 0.5rem",
                        width: "auto",
                        minWidth: "140px",
                        fontWeight: 700,
                        borderRadius: "6px",
                        cursor: ((selectedOrder.status === "delivered" || selectedOrder.status === "cancelled") && adminUser?.role !== "super_admin") ? "not-allowed" : "pointer",
                        opacity: ((selectedOrder.status === "delivered" || selectedOrder.status === "cancelled") && adminUser?.role !== "super_admin") ? 0.8 : 1,
                        background:
                          selectedOrder.status === "delivered" ? "#f0fdf4" :
                          selectedOrder.status === "shipped" ? "#eff6ff" :
                          selectedOrder.status === "packed" ? "#fefce8" :
                          selectedOrder.status === "cancelled" ? "#fef2f2" :
                          selectedOrder.status === "awaiting-pharmacist-pricing" ? "#faf5ff" :
                          selectedOrder.status === "pending_verification" ? "#fffbeb" : "#f8fafc",
                        borderColor:
                          selectedOrder.status === "delivered" ? "#86efac" :
                          selectedOrder.status === "shipped" ? "#93c5fd" :
                          selectedOrder.status === "packed" ? "#fde047" :
                          selectedOrder.status === "cancelled" ? "#fca5a5" :
                          selectedOrder.status === "awaiting-pharmacist-pricing" ? "#d8b4fe" :
                          selectedOrder.status === "pending_verification" ? "#fde68a" : "#cbd5e1",
                        color:
                          selectedOrder.status === "delivered" ? "#166534" :
                          selectedOrder.status === "shipped" ? "#1e40af" :
                          selectedOrder.status === "packed" ? "#854d0e" :
                          selectedOrder.status === "cancelled" ? "#991b1b" :
                          selectedOrder.status === "awaiting-pharmacist-pricing" ? "#6b21a8" :
                          selectedOrder.status === "pending_verification" ? "#92400e" : "#0f172a",
                      }}
                      value={selectedOrder.status}
                      disabled={statusUpdatingId === selectedOrder._id || ((selectedOrder.status === "delivered" || selectedOrder.status === "cancelled") && adminUser?.role !== "super_admin")}
                      onChange={(e) => handleUpdateOrderStatus(selectedOrder._id, e.target.value)}
                      title={
                        ((selectedOrder.status === "delivered" || selectedOrder.status === "cancelled") && adminUser?.role !== "super_admin")
                          ? "🔒 Locked - Only Super Admin can change status"
                          : "Update order status directly"
                      }
                    >
                      {selectedOrder.status === "awaiting-pharmacist-pricing" && (
                        <option value="awaiting-pharmacist-pricing" disabled>⚡ Awaiting Pricing (Price items first)</option>
                      )}
                      {selectedOrder.status === "pending_verification" && (
                        <option value="pending_verification" disabled>📋 Pending Verification (Approve Rx first)</option>
                      )}
                      <option value="pending" disabled={selectedOrder.status === "awaiting-pharmacist-pricing" || selectedOrder.status === "pending_verification"}>Pending</option>
                      <option value="packed" disabled={selectedOrder.status === "awaiting-pharmacist-pricing" || selectedOrder.status === "pending_verification"}>Packed</option>
                      <option value="shipped" disabled={selectedOrder.status === "awaiting-pharmacist-pricing" || selectedOrder.status === "pending_verification"}>Shipped</option>
                      <option value="delivered" disabled={selectedOrder.status === "awaiting-pharmacist-pricing" || selectedOrder.status === "pending_verification"}>Delivered / Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {selectedOrder.prescriptionUrl && (
                <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem" }}>Doctor's Prescription</h4>
                  {prescriptionLoading ? (
                    <p style={{ fontSize: "0.85rem", color: "#64748b" }}>Loading secure prescription...</p>
                  ) : prescriptionBlobUrl ? (
                    <img src={prescriptionBlobUrl} alt="Prescription" style={{ maxHeight: "220px", borderRadius: "6px", objectFit: "contain" }} />
                  ) : (
                    <p style={{ fontSize: "0.85rem", color: "#dc2626" }}>Unable to preview prescription file.</p>
                  )}
                </div>
              )}

              {/* Items Table */}
              <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem" }}>Ordered / Quoted Medicines</h4>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Medicine Name</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th style={{ textAlign: "right" }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((it, idx) => (
                        <tr key={idx}>
                          <td>{it.name || it.productId?.name || "Medicine"}</td>
                          <td>{it.quantity}</td>
                          <td>PKR {it.price?.toLocaleString()}</td>
                          <td style={{ textAlign: "right" }}>PKR {((it.price || 0) * (it.quantity || 1)).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ textAlign: "center", color: "#64748b", padding: "1rem" }}>
                          No medicines priced yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ textAlign: "right", marginTop: "1rem", borderTop: "1px solid #e2e8f0", paddingTop: "0.75rem" }}>
                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Subtotal: PKR {selectedOrder.totals?.subtotal?.toLocaleString() || 0}</div>
                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Delivery: PKR {selectedOrder.totals?.deliveryCharge || 0}</div>
                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Platform Fee: PKR {selectedOrder.totals?.platformFee !== undefined ? selectedOrder.totals.platformFee : 10}</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#0f172a", marginTop: "0.25rem" }}>Total: PKR {selectedOrder.totals?.total?.toLocaleString() || 0}</div>
              </div>
            </div>
            <div className="modal-footer">
              {selectedOrder.status === "awaiting-pharmacist-pricing" && (
                <button
                  className="btn btn-primary"
                  style={{ background: "#eab308", color: "#0f172a", fontWeight: "bold", marginRight: "auto" }}
                  onClick={() => {
                    const cur = selectedOrder;
                    handleCloseDetails();
                    handleOpenPricingModal(cur);
                  }}
                >
                  ⚡ Price Items
                </button>
              )}
              <button className="btn btn-secondary" onClick={handleCloseDetails}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Modal with Searchable Product Picker & Category Filter */}
      {isPricingModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "980px", width: "95vw" }}>
            <div className="modal-header" style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#0f172a" }}>
                  ⚡ Price Instant Prescription Order
                </h3>
                {pricingOrder && (
                  <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem" }}>
                    Order <strong>#{pricingOrder.orderCode || pricingOrder._id}</strong> — Customer: <strong>{pricingOrder.customer?.name}</strong> ({pricingOrder.customer?.phone || pricingOrder.customer?.city})
                  </div>
                )}
              </div>
              <button className="modal-close" onClick={handleClosePricingModal}>&times;</button>
            </div>

            <form onSubmit={handlePricingSubmit}>
              <div className="modal-body" style={{ maxHeight: "75vh", overflowY: "auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                  {/* Left Column: Prescription Preview & Product Catalog Search */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {/* Prescription Preview if present */}
                    {pricingPrescriptionBlobUrl && (
                      <div style={{ background: "#f1f5f9", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155" }}>📋 Doctor's Prescription</span>
                          <a
                            href={pricingPrescriptionBlobUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: "0.75rem", color: "#2563eb", fontWeight: 600, textDecoration: "underline" }}
                          >
                            Open Full Image ↗
                          </a>
                        </div>
                        <img
                          src={pricingPrescriptionBlobUrl}
                          alt="Prescription"
                          style={{ width: "100%", maxHeight: "160px", objectFit: "contain", borderRadius: "4px", background: "#ffffff" }}
                        />
                      </div>
                    )}

                    {/* Product Search & Filter Header */}
                    <div style={{ background: "#ffffff", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.5rem", color: "#0f172a" }}>
                        🔍 Search Catalog Medicines
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        {/* Category Filter */}
                        <div>
                          <select
                            className="form-control"
                            value={pricingCategoryFilter}
                            onChange={(e) => setPricingCategoryFilter(e.target.value)}
                            style={{ fontSize: "0.8rem", width: "100%", padding: "0.45rem" }}
                          >
                            <option value="">All Categories ({categories.length})</option>
                            {categories.map((c) => (
                              <option key={c._id} value={c._id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Search Query Input */}
                        <div>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Type medicine name / SKU..."
                            value={pricingSearchQuery}
                            onChange={(e) => setPricingSearchQuery(e.target.value)}
                            style={{ fontSize: "0.8rem", width: "100%", padding: "0.45rem" }}
                          />
                        </div>
                      </div>

                      {/* Matching Products Scrollable List */}
                      {(() => {
                        if (catalogLoading) {
                          return (
                            <div style={{ padding: "1.5rem", textAlign: "center", color: "#64748b", fontSize: "0.8rem" }}>
                              Searching catalog medicines...
                            </div>
                          );
                        }

                        const filteredCatalog = products.slice(0, 30);

                        return (
                          <div style={{ maxHeight: "240px", overflowY: "auto", border: "1px solid #f1f5f9", borderRadius: "6px" }}>
                            {filteredCatalog.length === 0 ? (
                              <div style={{ padding: "1rem", textAlign: "center", color: "#94a3b8", fontSize: "0.8rem" }}>
                                No medicines match filter or search query.
                              </div>
                            ) : (
                              filteredCatalog.map((p) => (
                                <div
                                  key={p._id}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "0.4rem 0.6rem",
                                    borderBottom: "1px solid #f1f5f9",
                                    fontSize: "0.8rem",
                                  }}
                                >
                                  <div>
                                    <div style={{ fontWeight: 600, color: "#1e293b" }}>
                                      {p.name} {p.isNarcotic ? <span style={{ color: "#dc2626", fontSize: "0.7rem", fontWeight: 700 }}>[Rx Narcotic]</span> : ""}
                                    </div>
                                    <div style={{ color: "#64748b", fontSize: "0.75rem" }}>
                                      PKR {p.price?.toLocaleString()} {p.sku ? `• SKU: ${p.sku}` : ""}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleAddProductToPricing(p)}
                                    style={{
                                      background: "#eab308",
                                      color: "#0f172a",
                                      border: "none",
                                      borderRadius: "6px",
                                      padding: "0.3rem 0.6rem",
                                      fontWeight: 700,
                                      fontSize: "0.75rem",
                                      cursor: "pointer",
                                    }}
                                  >
                                    + Add
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Right Column: Quoted Items & Pricing Summary */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ background: "#ffffff", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>
                          Quoted Medicines ({pricingItems.length})
                        </span>
                        {pricingItems.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setPricingItems([])}
                            style={{ background: "transparent", border: "none", color: "#dc2626", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline" }}
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      {pricingItems.length === 0 ? (
                        <div style={{ padding: "2rem 1rem", textAlign: "center", background: "#f8fafc", borderRadius: "6px", border: "1px dashed #cbd5e1" }}>
                          <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>
                            👉 Select medicines from the catalog on the left to build the order quotation.
                          </p>
                        </div>
                      ) : (
                        <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                          {pricingItems.map((it, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr auto auto",
                                gap: "0.5rem",
                                alignItems: "center",
                                padding: "0.45rem 0.5rem",
                                borderBottom: "1px solid #f1f5f9",
                                fontSize: "0.8rem",
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 600, color: "#0f172a" }}>{it.productName}</div>
                                <div style={{ color: "#64748b", fontSize: "0.75rem" }}>
                                  PKR {it.price?.toLocaleString()} each
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePricingQuantity(idx, Math.max(1, it.quantity - 1))}
                                  style={{ width: "22px", height: "22px", borderRadius: "4px", border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer", fontWeight: 700 }}
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  max="99"
                                  value={it.quantity}
                                  onChange={(e) => handleUpdatePricingQuantity(idx, e.target.value)}
                                  style={{ width: "36px", textAlign: "center", padding: "0.2rem", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "0.8rem" }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePricingQuantity(idx, it.quantity + 1)}
                                  style={{ width: "22px", height: "22px", borderRadius: "4px", border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer", fontWeight: 700 }}
                                >
                                  +
                                </button>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ fontWeight: 700, color: "#0f172a", minWidth: "60px", textAlign: "right" }}>
                                  PKR {((it.price || 0) * (it.quantity || 1)).toLocaleString()}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePricingItem(idx)}
                                  style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", padding: "0 0.25rem" }}
                                  title="Remove item"
                                >
                                  &times;
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Live Pricing Breakdown Card */}
                    {(() => {
                      const subtotal = pricingItems.reduce(
                        (acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 1),
                        0
                      );
                      const delivery = subtotal >= 2000 || subtotal === 0 ? 0 : 200;
                      const platformFee = subtotal > 0 ? 10 : 0;
                      const grandTotal = subtotal + (subtotal > 0 ? delivery : 0) + platformFee;

                      return (
                        <div style={{ background: "#f8fafc", padding: "0.85rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.25rem", color: "#64748b" }}>
                            <span>Subtotal ({pricingItems.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0)} items):</span>
                            <span>PKR {subtotal.toLocaleString()}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.25rem", color: "#64748b" }}>
                            <span>Delivery Fee:</span>
                            <span>{delivery === 0 && subtotal > 0 ? "FREE (PKR 0)" : `PKR ${delivery}`}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.5rem", color: "#64748b" }}>
                            <span>Platform Fee:</span>
                            <span>PKR {platformFee}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", borderTop: "1px solid #cbd5e1", paddingTop: "0.5rem" }}>
                            <span>Estimated Total Quote:</span>
                            <span style={{ color: "#059669" }}>PKR {grandTotal.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
                <button type="button" className="btn btn-secondary" onClick={handleClosePricingModal} disabled={pricingLoading}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: "#eab308", color: "#0f172a", fontWeight: "bold" }}
                  disabled={pricingLoading || pricingItems.length === 0}
                >
                  {pricingLoading ? "Submitting Pricing..." : "Submit Pricing & Notify Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {isCancelModalOpen && cancelTargetOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "560px" }}>
            <div className="modal-header" style={{ borderBottom: "1px solid #fee2e2", background: "#fef2f2", borderRadius: "12px 12px 0 0" }}>
              <h3 style={{ color: "#991b1b", margin: 0 }}>
                Cancel Order #{cancelTargetOrder.orderCode || cancelTargetOrder._id}
              </h3>
              <button className="modal-close" onClick={handleCloseCancelModal}>&times;</button>
            </div>
            <form onSubmit={handleCancelSubmit}>
              <div className="modal-body">
                <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "8px", padding: "0.75rem", marginBottom: "1rem", fontSize: "0.85rem" }}>
                  <p style={{ margin: 0, color: "#9a3412" }}>
                    ⚠️ Cancelling will notify <strong>{cancelTargetOrder.customer?.name}</strong> ({cancelTargetOrder.customer?.email}) with your cancellation reason note.
                  </p>
                </div>

                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                  Select Preset Cancellation Reason:
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.75rem" }}>
                  {PRESET_REASONS.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCancelReason(r)}
                      style={{
                        padding: "0.25rem 0.5rem",
                        fontSize: "0.75rem",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        background: cancelReason === r ? "#0f172a" : "#f8fafc",
                        color: cancelReason === r ? "#ffffff" : "#475569",
                        cursor: "pointer",
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                  Reason Note to Customer *
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Explain why this order is being cancelled..."
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseCancelModal} disabled={cancelLoading}>
                  Keep Order
                </button>
                <button type="submit" className="btn btn-danger" disabled={cancelLoading}>
                  {cancelLoading ? "Cancelling..." : "Confirm Cancellation & Send Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
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
                    Export comprehensive order data including customer contacts, delivery addresses, pricing breakdown, platform fees, and pharmacy commissions into a Microsoft Excel (.xlsx) file.
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

                {/* Scope Notice */}
                {isScopedAdmin && (
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", padding: "0.5rem 0.75rem", fontSize: "0.8rem", color: "#166534" }}>
                    ℹ️ <strong>Scope Notice:</strong> Only orders assigned to <strong>{scopedPharmacy ? scopedPharmacy.name : "your assigned branch"}</strong> will be exported.
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

export default Orders;
