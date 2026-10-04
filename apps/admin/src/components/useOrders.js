import { useState, useEffect } from "react";
import { adminFetch } from "../apiClient";

/**
 * Calculate PKT date strings with optional day offset (helper)
 */
export const getPKTDate = (offsetDays = 0) => {
  const now = new Date();
  const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;
  const pktTime = new Date(now.getTime() + PKT_OFFSET_MS - offsetDays * 24 * 60 * 60 * 1000);
  return pktTime.toISOString().split("T")[0];
};

/**
 * Custom hook encapsulating order listing, filtering, pagination, and pharmacy metadata (SRP).
 */
export function useOrders({ token, adminUser, initialFilter }) {
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
  const [dateFilter, setDateFilter] = useState(initialFilter?.dateFilter || "today");
  const [startDate, setStartDate] = useState(initialFilter?.startDate || "");
  const [endDate, setEndDate] = useState(initialFilter?.endDate || "");
  const [filterPharmacyId, setFilterPharmacyId] = useState(
    isScopedAdmin ? scopedPharmacyId : initialFilter?.pharmacyId || initialFilter?.filterPharmacyId || ""
  );

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Meta resources
  const [pharmacies, setPharmacies] = useState([]);
  const [categories, setCategories] = useState([]);

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
    fetchPharmacies();
    fetchCategories();
  }, []);

  return {
    isScopedAdmin,
    scopedPharmacyId,
    orders,
    setOrders,
    loading,
    setLoading,
    error,
    setError,
    successMsg,
    setSuccessMsg,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    filterPaymentMethod,
    setFilterPaymentMethod,
    searchQuery,
    setSearchQuery,
    activeSearch,
    setActiveSearch,
    dateFilter,
    setDateFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    filterPharmacyId,
    setFilterPharmacyId,
    page,
    setPage,
    total,
    setTotal,
    limit,
    pharmacies,
    categories,
    fetchOrders,
  };
}
