import React, { useState, useEffect, useRef, useMemo } from "react";
import { adminFetch, API_URL } from "../apiClient";
import SearchableSelect from "./SearchableSelect";

export default function Pharmacies({ token, adminUser, initialTab, onNavigateToOrders }) {
  const isSuperAdmin = adminUser?.role === "super_admin";
  const assignedPharmacyId = typeof adminUser?.assignedPharmacyId === "object"
    ? adminUser?.assignedPharmacyId?._id?.toString()
    : adminUser?.assignedPharmacyId?.toString() || null;
  const isBranchScoped = !isSuperAdmin && Boolean(assignedPharmacyId);
  const userPerms = Array.isArray(adminUser?.permissions) ? adminUser.permissions : [];
  const canManagePharmacies = isSuperAdmin || (!isBranchScoped && userPerms.includes("manage_pharmacies"));

  const [activeTab, setActiveTab] = useState(initialTab?.tab || "directory"); // 'directory' | 'reports' | 'commissions'
  const [allPharmacies, setAllPharmacies] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Directory Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState(null);
  const [cityFilter, setCityFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    cityIds: [],
    medikartPercentage: 5,
    accountTitle: "",
    accountNumber: "",
    active: true,
  });
  const [saving, setSaving] = useState(false);

  // Secure Account Number Reveal state (Super Admin only)
  const [revealedAccounts, setRevealedAccounts] = useState({}); // { [pharmacyId]: accountNumber }
  const [revealingId, setRevealingId] = useState("");
  const revealTimers = useRef({});

  // Reports state
  const [reportsData, setReportsData] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPharmacyFilter, setSelectedPharmacyFilter] = useState(assignedPharmacyId || "");

  // Commission Tracking state
  const [selectedCommPharmacy, setSelectedCommPharmacy] = useState(assignedPharmacyId || "");
  const [commissionBalance, setCommissionBalance] = useState(null);
  const [commissionPayments, setCommissionPayments] = useState([]);
  const [commissionLoading, setCommissionLoading] = useState(false);
  const [commDateFilter, setCommDateFilter] = useState("all");
  const [commStartDate, setCommStartDate] = useState("");
  const [commEndDate, setCommEndDate] = useState("");

  // Submit Payment Modal state (Subadmin and Super Admin)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: "",
    paidOnDate: new Date().toISOString().split("T")[0],
    periodFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    periodTo: new Date().toISOString().split("T")[0],
    notes: "",
    screenshotFile: null,
    screenshotPreview: "",
  });

  // Super Admin: Verify / Reject & Lightbox state
  const [verifyingPayment, setVerifyingPayment] = useState(null);
  const [rejectingPayment, setRejectingPayment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  useEffect(() => {
    fetchCities();
    fetchPharmacies();
  }, []);

  useEffect(() => {
    if (initialTab?.tab) {
      setActiveTab(initialTab.tab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (activeTab === "reports") {
      fetchReports();
    }
  }, [activeTab, dateFilter, startDate, endDate, selectedPharmacyFilter, cityFilter, assignedPharmacyId]);

  // Set default selected pharmacy for commissions when pharmacies load
  useEffect(() => {
    if (isBranchScoped && assignedPharmacyId) {
      setSelectedCommPharmacy(assignedPharmacyId);
      setSelectedPharmacyFilter(assignedPharmacyId);
    } else if (!selectedCommPharmacy && allPharmacies.length > 0) {
      setSelectedCommPharmacy(allPharmacies[0]._id);
    }
  }, [allPharmacies, assignedPharmacyId, isBranchScoped, selectedCommPharmacy]);

  useEffect(() => {
    const targetPharmacy = isBranchScoped ? assignedPharmacyId : selectedCommPharmacy;
    if (activeTab === "commissions" && targetPharmacy) {
      fetchCommissionData(targetPharmacy);
    }
  }, [activeTab, selectedCommPharmacy, assignedPharmacyId, isBranchScoped]);

  // Cleanup reveal timers on unmount
  useEffect(() => {
    return () => {
      Object.values(revealTimers.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const flash = (msg, isError = false) => {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => {
      setError("");
      setSuccess("");
    }, 4000);
  };

  const fetchCities = async () => {
    try {
      const data = await adminFetch("/admin/cities");
      setCities(data.data?.cities || data.data || []);
    } catch (_) {}
  };

  const fetchPharmacies = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adminFetch("/admin/pharmacies");
      const list = data.data?.pharmacies || [];
      setAllPharmacies(list);
    } catch (err) {
      flash(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Matched assigned pharmacy object
  const assignedPharmacyObj = allPharmacies.find((p) => p._id === assignedPharmacyId) ||
    (typeof adminUser?.assignedPharmacyId === "object" ? adminUser?.assignedPharmacyId : null);

  const baseFilteredPharmacies = isBranchScoped
    ? (assignedPharmacyObj
        ? [assignedPharmacyObj]
        : (allPharmacies.filter((p) => p._id === assignedPharmacyId).length > 0
            ? allPharmacies.filter((p) => p._id === assignedPharmacyId)
            : allPharmacies.slice(0, 1)))
    : (cityFilter
        ? allPharmacies.filter((p) => {
            if (!Array.isArray(p.cityIds)) return false;
            return p.cityIds.some((c) => {
              const cId = c && typeof c === "object" ? c._id : c;
              return cId === cityFilter;
            });
          })
        : allPharmacies);

  const filteredPharmacies = searchQuery.trim()
    ? baseFilteredPharmacies.filter((p) => {
        const q = searchQuery.toLowerCase();
        return (
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.code && p.code.toLowerCase().includes(q)) ||
          (p.phone && p.phone.toLowerCase().includes(q)) ||
          (p.contactPerson && p.contactPerson.toLowerCase().includes(q)) ||
          (p.email && p.email.toLowerCase().includes(q)) ||
          (p.address && p.address.toLowerCase().includes(q)) ||
          (p.city && p.city.toLowerCase().includes(q))
        );
      })
    : baseFilteredPharmacies;

  const pharmacyReportOptions = useMemo(() => {
    return [
      { value: "", label: "All Pharmacies", icon: "🌐" },
      ...allPharmacies.map((ph) => ({
        value: ph._id,
        label: `${ph.name} (${ph.code || "Branch"})`,
        sublabel: ph.city ? `${ph.city} ${ph.address ? `• ${ph.address}` : ""}` : ph.address || "",
        badge: ph.active ? "Active" : "Inactive",
        icon: "🏥",
        code: ph.code,
        city: ph.city,
      })),
    ];
  }, [allPharmacies]);

  const citySelectOptions = useMemo(() => {
    return [
      { value: "", label: "All Cities (Show All)", icon: "🏙️" },
      ...cities.map((c) => ({
        value: c._id,
        label: c.name,
        badge: c.code || "",
        icon: "📍",
      })),
    ];
  }, [cities]);

  const commPharmacyOptions = useMemo(() => {
    return allPharmacies.map((ph) => ({
      value: ph._id,
      label: `${ph.name} (${ph.code || "Branch"})`,
      sublabel: ph.city ? `${ph.city} ${ph.address ? `• ${ph.address}` : ""}` : ph.address || "",
      badge: ph.active ? "Active" : "Inactive",
      icon: "🏥",
      code: ph.code,
      city: ph.city,
    }));
  }, [allPharmacies]);

  const fetchReports = async () => {
    try {
      setReportsLoading(true);
      const params = new URLSearchParams();
      const targetPharmacyId = isBranchScoped ? assignedPharmacyId : selectedPharmacyFilter;
      if (targetPharmacyId) params.append("pharmacyId", targetPharmacyId);
      if (!isBranchScoped && cityFilter) params.append("city", cityFilter);

      let s = startDate;
      let e = endDate;

      const now = new Date();
      if (dateFilter === "today") {
        s = now.toISOString().split("T")[0];
        e = now.toISOString().split("T")[0];
      } else if (dateFilter === "7days") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        s = d.toISOString().split("T")[0];
        e = now.toISOString().split("T")[0];
      } else if (dateFilter === "month") {
        const d = new Date(now.getFullYear(), now.getMonth(), 1);
        s = d.toISOString().split("T")[0];
        e = now.toISOString().split("T")[0];
      }

      if (s) params.append("startDate", s);
      if (e) params.append("endDate", e);

      const data = await adminFetch(`/admin/pharmacies/reports?${params.toString()}`);
      setReportsData(data.data || null);
    } catch (err) {
      flash(err.message, true);
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchCommissionData = async (pharmacyId) => {
    const targetPharmacy = isBranchScoped ? assignedPharmacyId : pharmacyId;
    if (!targetPharmacy) return;
    try {
      setCommissionLoading(true);
      const [balRes, payRes] = await Promise.all([
        adminFetch(`/admin/commissions/pharmacy/${targetPharmacy}/balance`),
        adminFetch(`/admin/commissions/pharmacy/${targetPharmacy}`),
      ]);

      setCommissionBalance(balRes.data?.balance || balRes.data || { outstandingBalance: 0 });
      setCommissionPayments(payRes.data?.payments || payRes.data || []);
    } catch (err) {
      flash(err.message, true);
    } finally {
      setCommissionLoading(false);
    }
  };

  // Secure Reveal Handler (Super Admin only)
  const handleRevealAccount = async (pharmacyId) => {
    if (!isSuperAdmin) {
      flash("Only Super Admin can reveal encrypted bank account numbers.", true);
      return;
    }
    try {
      setRevealingId(pharmacyId);
      const data = await adminFetch(`/admin/pharmacies/${pharmacyId}/reveal-account`);
      const fullNum = data.data?.accountNumber || data.accountNumber || "N/A";
      
      setRevealedAccounts((prev) => ({ ...prev, [pharmacyId]: fullNum }));

      // Clear existing timer if any
      if (revealTimers.current[pharmacyId]) {
        clearTimeout(revealTimers.current[pharmacyId]);
      }

      // Auto-hide after 10 seconds
      revealTimers.current[pharmacyId] = setTimeout(() => {
        handleHideAccount(pharmacyId);
      }, 10000);
    } catch (err) {
      flash(err.message, true);
    } finally {
      setRevealingId("");
    }
  };

  const handleHideAccount = (pharmacyId) => {
    if (revealTimers.current[pharmacyId]) {
      clearTimeout(revealTimers.current[pharmacyId]);
      delete revealTimers.current[pharmacyId];
    }
    setRevealedAccounts((prev) => {
      const next = { ...prev };
      delete next[pharmacyId];
      return next;
    });
  };

  const handleOpenCreate = () => {
    setEditingPharmacy(null);
    setFormData({
      name: "",
      code: `PH-${Math.floor(100 + Math.random() * 900)}`,
      contactPerson: "",
      phone: "03244489159",
      email: "",
      address: "",
      cityIds: [],
      medikartPercentage: 5,
      accountTitle: "",
      accountNumber: "",
      active: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditingPharmacy(p);
    setFormData({
      name: p.name || "",
      code: p.code || "",
      contactPerson: p.contactPerson || "",
      phone: p.phone || "",
      email: p.email || "",
      address: p.address || "",
      cityIds: p.cityIds ? p.cityIds.map((c) => (typeof c === "object" ? c._id : c)) : [],
      medikartPercentage: p.medikartPercentage !== undefined ? p.medikartPercentage : 5,
      accountTitle: p.accountTitle || "",
      accountNumber: "", // Keep blank so we don't accidentally wipe it unless admin explicitly types a new one
      active: p.active !== false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim() || !formData.address.trim()) {
      flash("Name, Code, and Address are required.", true);
      return;
    }

    try {
      setSaving(true);
      const endpoint = editingPharmacy
        ? `/admin/pharmacies/${editingPharmacy._id}`
        : `/admin/pharmacies`;
      const method = editingPharmacy ? "PUT" : "POST";

      const payload = { ...formData };
      // If editing and accountNumber was untouched, remove it so existing ciphertext remains intact
      if (editingPharmacy && !payload.accountNumber) {
        delete payload.accountNumber;
      }

      await adminFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      flash(editingPharmacy ? "Pharmacy updated successfully!" : "Pharmacy registered successfully!");
      setShowModal(false);
      fetchPharmacies();
    } catch (err) {
      flash(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCity = (cityId) => {
    const current = [...formData.cityIds];
    const idx = current.indexOf(cityId);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(cityId);
    }
    setFormData({ ...formData, cityIds: current });
  };

  const handleToggleActive = async (p) => {
    if (!canManagePharmacies) return;
    try {
      await adminFetch(`/admin/pharmacies/${p._id}`, {
        method: "PUT",
        body: JSON.stringify({ active: !p.active }),
      });
      flash(`Pharmacy "${p.name}" is now ${!p.active ? "Active" : "Disabled"}.`);
      fetchPharmacies();
    } catch (err) {
      flash(err.message, true);
    }
  };

  const handleDelete = async (id, name) => {
    if (!canManagePharmacies) return;
    if (!window.confirm(`Are you sure you want to delete pharmacy "${name}"?`)) return;
    try {
      await adminFetch(`/admin/pharmacies/${id}`, {
        method: "DELETE",
      });
      flash("Pharmacy deleted successfully!");
      fetchPharmacies();
    } catch (err) {
      flash(err.message, true);
    }
  };

  // Payment Proof Submission Handler (Available to Subadmins & Super Admins)
  const handleOpenPaymentModal = () => {
    setPaymentFormData({
      amount: "",
      paidOnDate: new Date().toISOString().split("T")[0],
      periodFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
      periodTo: new Date().toISOString().split("T")[0],
      notes: "",
      screenshotFile: null,
      screenshotPreview: "",
    });
    setShowPaymentModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentFormData((prev) => ({
        ...prev,
        screenshotFile: file,
        screenshotPreview: URL.createObjectURL(file),
      }));
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCommPharmacy) {
      flash("Please select a pharmacy.", true);
      return;
    }
    if (!paymentFormData.amount || Number(paymentFormData.amount) <= 0) {
      flash("Please enter a valid payment amount.", true);
      return;
    }
    if (!paymentFormData.screenshotFile) {
      flash("Please upload a payment screenshot/proof.", true);
      return;
    }

    try {
      setPaymentSubmitting(true);
      const fd = new FormData();
      fd.append("pharmacyId", selectedCommPharmacy);
      fd.append("amount", paymentFormData.amount);
      fd.append("paidOnDate", paymentFormData.paidOnDate);
      fd.append("periodFrom", paymentFormData.periodFrom);
      fd.append("periodTo", paymentFormData.periodTo);
      if (paymentFormData.notes) {
        fd.append("notes", paymentFormData.notes);
      }
      fd.append("screenshot", paymentFormData.screenshotFile);

      await adminFetch("/admin/commissions", {
        method: "POST",
        body: fd,
      });

      flash(
        isSuperAdmin
          ? "Payment proof recorded and automatically approved & verified! Balance updated."
          : "Payment proof uploaded successfully! Queued for Super Admin verification."
      );
      setShowPaymentModal(false);
      fetchCommissionData(selectedCommPharmacy);
    } catch (err) {
      flash(err.message, true);
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyingPayment) return;
    try {
      setActionLoading(true);
      await adminFetch(`/admin/commissions/${verifyingPayment._id}/verify`, {
        method: "PATCH",
      });
      flash(`Payment of PKR ${verifyingPayment.amount?.toLocaleString()} verified successfully! Balance updated.`);
      setVerifyingPayment(null);
      fetchCommissionData(selectedCommPharmacy);
    } catch (err) {
      flash(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingPayment) return;
    if (!rejectionReason.trim()) {
      flash("Rejection reason is required.", true);
      return;
    }
    try {
      setActionLoading(true);
      await adminFetch(`/admin/commissions/${rejectingPayment._id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
      });
      flash(`Payment of PKR ${rejectingPayment.amount?.toLocaleString()} rejected.`);
      setRejectingPayment(null);
      setRejectionReason("");
      fetchCommissionData(selectedCommPharmacy);
    } catch (err) {
      flash(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const resolveImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const base = API_URL.replace(/\/api\/v1\/?$/, "");
    return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  const activePharmacyObj = allPharmacies.find((p) => p._id === selectedCommPharmacy);

  return (
    <div className="section-container">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>
            🏥 Pharmacies & Commissions
          </h1>
          <p style={{ color: "#64748b", margin: "0.25rem 0 0 0", fontSize: "0.9rem" }}>
            Manage pharmacy branches, sales reports, and commission payments.
          </p>
        </div>
        {activeTab === "directory" && isSuperAdmin && (
          <button
            className="btn btn-primary"
            onClick={handleOpenCreate}
            style={{ background: "#FFCB05", color: "#1E293B", fontWeight: "800", border: "1px solid rgba(245, 158, 11, 0.4)" }}
          >
            + Add Branch
          </button>
        )}
        {activeTab === "commissions" && (
          <button
            className="btn btn-primary"
            onClick={handleOpenPaymentModal}
            style={{ background: "#FFCB05", color: "#1E293B", fontWeight: "800", border: "1px solid rgba(245, 158, 11, 0.4)" }}
          >
            + Submit Payment Proof
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && <div className="alert alert-danger" style={{ marginBottom: "1rem" }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: "1rem" }}>{success}</div>}

      {/* Navigation Mode Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setActiveTab("directory")}
          style={{
            padding: "0.5rem 1.2rem",
            borderRadius: "9999px",
            border: "none",
            fontSize: "0.9rem",
            fontWeight: 800,
            cursor: "pointer",
            background: activeTab === "directory" ? "#FFCB05" : "transparent",
            color: activeTab === "directory" ? "#1E293B" : "#64748b",
            boxShadow: activeTab === "directory" ? "0 4px 14px rgba(245, 158, 11, 0.25)" : "none",
          }}
        >
          📍 Branches ({allPharmacies.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          style={{
            padding: "0.5rem 1.2rem",
            borderRadius: "9999px",
            border: "none",
            fontSize: "0.9rem",
            fontWeight: 800,
            cursor: "pointer",
            background: activeTab === "reports" ? "#FFCB05" : "transparent",
            color: activeTab === "reports" ? "#1E293B" : "#64748b",
            boxShadow: activeTab === "reports" ? "0 4px 14px rgba(245, 158, 11, 0.25)" : "none",
          }}
        >
          📊 Sales & Reports
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("commissions")}
          style={{
            padding: "0.5rem 1.2rem",
            borderRadius: "9999px",
            border: "none",
            fontSize: "0.9rem",
            fontWeight: 800,
            cursor: "pointer",
            background: activeTab === "commissions" ? "#FFCB05" : "transparent",
            color: activeTab === "commissions" ? "#1E293B" : "#64748b",
            boxShadow: activeTab === "commissions" ? "0 4px 14px rgba(245, 158, 11, 0.25)" : "none",
          }}
        >
          💰 Commission & Payments
        </button>
      </div>

      {/* TAB 1: PHARMACY DIRECTORY */}
      {activeTab === "directory" && (
        <>
          {/* City Filter Toolbar / Scoped View Notice */}
          <div
            style={{
              background: "#ffffff",
              padding: "0.85rem 1.25rem",
              borderRadius: "14px",
              border: "1px solid #F3EFE6",
              marginBottom: "1.25rem",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", flex: 1 }}>
              <div style={{ position: "relative", minWidth: "240px", flex: 1, maxWidth: "420px" }}>
                <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem", color: "#64748b" }}>🔍</span>
                <input
                  type="text"
                  placeholder="Search branch name, code, contact, phone, city..."
                  className="form-control"
                  style={{ width: "100%", margin: 0, padding: "0.45rem 2rem 0.45rem 2.2rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    style={{ position: "absolute", right: "0.6rem", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.8rem" }}
                  >
                    ✕
                  </button>
                )}
              </div>
            {isSuperAdmin ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1E293B", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  🏙️ City:
                </span>
                <SearchableSelect
                  options={citySelectOptions}
                  value={cityFilter}
                  onChange={(val) => setCityFilter(val)}
                  placeholder="All Cities (Show All)"
                  searchPlaceholder="Search city..."
                  size="md"
                  minWidth="200px"
                  maxWidth="260px"
                />
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1E293B" }}>
                  🏥 Assigned Branch:
                </span>
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#2563eb", background: "#eff6ff", padding: "0.2rem 0.6rem", borderRadius: "6px" }}>
                  {allPharmacies.length > 0 ? `${allPharmacies[0].name} (${allPharmacies[0].code})` : "No branch assigned"}
                </span>
              </div>
            )}
            </div>

            <div style={{ fontSize: "0.825rem", color: "#64748b", fontWeight: 600 }}>
              Showing <strong>{filteredPharmacies.length}</strong> {filteredPharmacies.length === 1 ? "pharmacy" : "pharmacies"}
              {isSuperAdmin && cityFilter && cities.find((c) => c._id === cityFilter) ? (
                <span> in <strong style={{ color: "#1E293B" }}>{cities.find((c) => c._id === cityFilter)?.name}</strong></span>
              ) : ""}
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>Loading pharmacies...</div>
          ) : filteredPharmacies.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
              <p style={{ color: "#64748b", fontWeight: 500 }}>
                {cityFilter ? "No pharmacies found matching the selected city." : "No pharmacy branches registered yet."}
              </p>
              {cityFilter ? (
                <button
                  className="btn btn-secondary"
                  onClick={() => setCityFilter("")}
                  style={{ marginTop: "0.75rem" }}
                >
                  Clear City Filter
                </button>
              ) : canManagePharmacies ? (
                <button className="btn btn-primary" onClick={handleOpenCreate} style={{ marginTop: "0.75rem", background: "#FFCB05", color: "#1E293B", fontWeight: 800 }}>
                  + Add First Pharmacy
                </button>
              ) : null}
            </div>
          ) : (
            <div className="table-responsive" style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <table className="table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "0.75rem 1rem" }}>Branch Code</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Pharmacy Name & Contact</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Bank Account 🔒</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Address</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Assigned Cities</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Medikart %</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPharmacies.map((p) => (
                    <tr key={p._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "0.75rem 1rem", fontWeight: "bold" }}>
                        <code style={{ background: "#f1f5f9", padding: "0.2rem 0.4rem", borderRadius: "4px" }}>{p.code}</code>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{p.name}</div>
                        <div style={{ color: "#64748b", fontSize: "0.8rem" }}>
                          📞 {p.phone} {p.contactPerson ? `• ${p.contactPerson}` : ""}
                        </div>
                      </td>
                      {/* Secure Bank Account Cell */}
                      <td style={{ padding: "0.75rem 1rem", minWidth: "160px" }}>
                        {p.accountTitle && (
                          <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.82rem", marginBottom: "0.2rem" }}>
                            🏛️ {p.accountTitle}
                          </div>
                        )}
                        {revealedAccounts[p._id] ? (
                          <div style={{ background: "#f8fafc", padding: "0.35rem 0.5rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                              <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "0.85rem", color: "#0f172a" }}>
                                {revealedAccounts[p._id]}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleHideAccount(p._id)}
                                style={{
                                  background: "#e2e8f0",
                                  border: "none",
                                  borderRadius: "4px",
                                  padding: "0.15rem 0.35rem",
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                                title="Hide Account Number"
                              >
                                ✕ Hide
                              </button>
                            </div>
                            <div style={{ fontSize: "0.68rem", color: "#d97706", fontWeight: 600, marginTop: "0.2rem" }}>
                              🔒 Auto-hides in 10s (Logged in Audit)
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: p.accountNumberLast4 ? "#334155" : "#94a3b8" }}>
                              {p.accountNumberLast4 ? `•••• ${p.accountNumberLast4}` : "Not Set"}
                            </span>
                            {isSuperAdmin && p.accountNumberLast4 && (
                              <button
                                type="button"
                                onClick={() => handleRevealAccount(p._id)}
                                disabled={revealingId === p._id}
                                style={{
                                  background: "#fef3c7",
                                  color: "#92400e",
                                  border: "1px solid #fde68a",
                                  borderRadius: "4px",
                                  padding: "0.15rem 0.45rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                                title="Reveal encrypted account number (Super Admin only)"
                              >
                                {revealingId === p._id ? "..." : "👁️ Reveal"}
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#475569", fontSize: "0.85rem", maxWidth: "200px" }}>
                        {p.address}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        {p.cityIds && p.cityIds.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                            {p.cityIds.map((c) => (
                              <span
                                key={typeof c === "object" ? c._id : c}
                                style={{
                                  background: "#fef3c7",
                                  color: "#92400e",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  padding: "0.15rem 0.45rem",
                                  borderRadius: "999px",
                                }}
                              >
                                {typeof c === "object" ? c.name : "City"}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "0.8rem", fontStyle: "italic" }}>All unassigned cities</span>
                        )}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span
                          style={{
                            background: "#fef9c3",
                            color: "#854d0e",
                            fontSize: "0.8rem",
                            fontWeight: 800,
                            padding: "0.2rem 0.55rem",
                            borderRadius: "6px",
                            border: "1px solid #fde047",
                            display: "inline-block",
                          }}
                        >
                          {p.medikartPercentage !== undefined ? p.medikartPercentage : 0}%
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        {canManagePharmacies ? (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(p)}
                            style={{
                              padding: "0.25rem 0.6rem",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              border: "none",
                              cursor: "pointer",
                              background: p.active ? "#dcfce7" : "#fee2e2",
                              color: p.active ? "#166534" : "#991b1b",
                            }}
                          >
                            {p.active ? "✓ Active" : "✕ Disabled"}
                          </button>
                        ) : (
                          <span
                            style={{
                              padding: "0.25rem 0.6rem",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              background: p.active ? "#dcfce7" : "#fee2e2",
                              color: p.active ? "#166534" : "#991b1b",
                              display: "inline-block",
                            }}
                          >
                            {p.active ? "✓ Active" : "✕ Disabled"}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", marginRight: "0.4rem", background: "#f8fafc" }}
                          onClick={() => onNavigateToOrders && onNavigateToOrders({ pharmacyId: p._id, dateFilter: "all" })}
                          title={`View orders assigned to ${p.name}`}
                        >
                          📦 Orders
                        </button>
                        {canManagePharmacies && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", marginRight: "0.4rem" }}
                            onClick={() => handleOpenEdit(p)}
                          >
                            Edit
                          </button>
                        )}
                        {isSuperAdmin && (
                          <button
                            className="btn btn-danger"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                            onClick={() => handleDelete(p._id, p.name)}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* TAB 2: REPORTS & ANALYTICS */}
      {activeTab === "reports" && (
        <div>
          {/* Reports Filter Controls */}
          <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>Date Period:</span>
              {[
                { key: "all", label: "All Time" },
                { key: "today", label: "Today" },
                { key: "7days", label: "Last 7 Days" },
                { key: "month", label: "This Month" },
                { key: "custom", label: "Custom Range" },
              ].map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setDateFilter(filter.key)}
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: dateFilter === filter.key ? "#0f172a" : "#f8fafc",
                    color: dateFilter === filter.key ? "#ffffff" : "#475569",
                  }}
                >
                  {filter.label}
                </button>
              ))}

              {dateFilter === "custom" && (
                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", marginLeft: "0.5rem" }}>
                  <input
                    type="date"
                    className="form-control"
                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <span>to</span>
                  <input
                    type="date"
                    className="form-control"
                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              )}
            </div>

            {isSuperAdmin ? (
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>🏙️ City:</span>
                  <SearchableSelect
                    options={citySelectOptions}
                    value={cityFilter}
                    onChange={(val) => setCityFilter(val)}
                    placeholder="All Cities"
                    searchPlaceholder="Search city..."
                    size="sm"
                    minWidth="180px"
                    maxWidth="240px"
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>🏥 Pharmacy:</span>
                  <SearchableSelect
                    options={pharmacyReportOptions}
                    value={selectedPharmacyFilter}
                    onChange={(val) => setSelectedPharmacyFilter(val)}
                    placeholder="All Pharmacies"
                    searchPlaceholder="Search pharmacy name, code, city..."
                    size="sm"
                    minWidth="200px"
                    maxWidth="280px"
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>🏥 Scoped Branch:</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", background: "#f1f5f9", padding: "0.25rem 0.6rem", borderRadius: "6px" }}>
                  {allPharmacies.length > 0 ? `${allPharmacies[0].name} (${allPharmacies[0].code})` : "Your Branch"}
                </span>
              </div>
            )}
          </div>

          {/* KPI Summary Cards */}
          {reportsData?.summary && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              {/* Total Assigned Orders */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (onNavigateToOrders) {
                    onNavigateToOrders({
                      pharmacyId: selectedPharmacyFilter || "assigned",
                      dateFilter: dateFilter || "all",
                      startDate: dateFilter === "custom" ? startDate : "",
                      endDate: dateFilter === "custom" ? endDate : "",
                    });
                  }
                }}
                style={{
                  background: "white",
                  padding: "1.25rem",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  cursor: "pointer",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1)";
                  e.currentTarget.style.borderColor = "#3b82f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
                title={
                  selectedPharmacyFilter
                    ? "Click to view orders assigned to this pharmacy in Orders queue"
                    : "Click to view all assigned orders across branches in Orders queue"
                }
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase" }}>
                    Total Assigned Orders
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#2563eb", fontWeight: 700, display: "flex", alignItems: "center", gap: "2px" }}>
                    View &rarr;
                  </span>
                </div>
                <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0f172a", marginTop: "0.25rem" }}>
                  {reportsData.summary.totalAssignedOrders}
                </div>
              </div>

              {/* Total Revenue Fulfilled */}
              <div style={{ background: "white", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <span style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase" }}>Total Revenue Fulfilled</span>
                <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#16a34a", marginTop: "0.25rem" }}>
                  PKR {reportsData.summary.totalRevenueSum.toLocaleString()}
                </div>
              </div>

              {/* Total Medikart Share */}
              <div style={{ background: "white", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <span style={{ color: "#854d0e", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>Medikart Commission Share</span>
                <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#d97706", marginTop: "0.25rem" }}>
                  PKR {(reportsData.summary.totalMedikartShare || 0).toLocaleString()}
                </div>
              </div>

              {/* Delivered Orders */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (onNavigateToOrders) {
                    onNavigateToOrders({
                      pharmacyId: selectedPharmacyFilter || "assigned",
                      filterStatus: "delivered",
                      dateFilter: dateFilter || "all",
                      startDate: dateFilter === "custom" ? startDate : "",
                      endDate: dateFilter === "custom" ? endDate : "",
                    });
                  }
                }}
                style={{
                  background: "white",
                  padding: "1.25rem",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  cursor: "pointer",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1)";
                  e.currentTarget.style.borderColor = "#0284c7";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
                title="Click to view delivered orders in Orders queue"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase" }}>Delivered Orders</span>
                  <span style={{ fontSize: "0.75rem", color: "#0284c7", fontWeight: 700 }}>Open &rarr;</span>
                </div>
                <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0284c7", marginTop: "0.25rem" }}>
                  {reportsData.summary.totalDelivered}
                </div>
              </div>

              {/* Cancelled Orders */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (onNavigateToOrders) {
                    onNavigateToOrders({
                      pharmacyId: selectedPharmacyFilter || "assigned",
                      filterStatus: "cancelled",
                      dateFilter: dateFilter || "all",
                      startDate: dateFilter === "custom" ? startDate : "",
                      endDate: dateFilter === "custom" ? endDate : "",
                    });
                  }
                }}
                style={{
                  background: "white",
                  padding: "1.25rem",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  cursor: "pointer",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1)";
                  e.currentTarget.style.borderColor = "#dc2626";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
                title="Click to view cancelled orders in Orders queue"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase" }}>Cancelled Orders</span>
                  <span style={{ fontSize: "0.75rem", color: "#dc2626", fontWeight: 700 }}>Open &rarr;</span>
                </div>
                <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#dc2626", marginTop: "0.25rem" }}>
                  {reportsData.summary.totalCancelled}
                </div>
              </div>
            </div>
          )}

          {/* Reports Breakdown Table */}
          {reportsLoading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>Loading fulfillment metrics...</div>
          ) : !reportsData?.breakdown || reportsData.breakdown.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", background: "white", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
              <p style={{ color: "#64748b" }}>No order data available for the selected filters.</p>
            </div>
          ) : (
            <div className="table-responsive" style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <table className="table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "0.75rem 1rem" }}>Branch</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Assigned Orders</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Fulfilled Revenue</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Medikart % Rate</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Medikart Share (PKR)</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Delivered</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Pending</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Cancelled</th>
                  </tr>
                </thead>
                <tbody>
                  {reportsData.breakdown.map((r) => (
                    <tr key={r.pharmacyId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{r.name}</div>
                        <code style={{ fontSize: "0.75rem", color: "#64748b" }}>{r.code}</code>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>{r.assignedOrders}</td>
                      <td style={{ padding: "0.75rem 1rem", color: "#16a34a", fontWeight: 700 }}>
                        PKR {r.totalRevenue.toLocaleString()}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>{r.medikartPercentage}%</td>
                      <td style={{ padding: "0.75rem 1rem", fontWeight: 900, color: "#b45309" }}>
                        PKR {r.medikartRevenueShare.toLocaleString()}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", background: "#f8fafc" }}
                          onClick={() => {
                            if (onNavigateToOrders) {
                              onNavigateToOrders({
                                pharmacyId: r.pharmacyId,
                                dateFilter: dateFilter || "all",
                                startDate: dateFilter === "custom" ? startDate : "",
                                endDate: dateFilter === "custom" ? endDate : "",
                              });
                            }
                          }}
                        >
                          📦 View Orders
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMMISSION TRACKING & PAYMENTS */}
      {activeTab === "commissions" && (
        <div>
          {/* Top Bar / Pharmacy Selection */}
          <div
            style={{
              background: "#ffffff",
              padding: "0.85rem 1.25rem",
              borderRadius: "14px",
              border: "1px solid #F3EFE6",
              marginBottom: "1.25rem",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1E293B" }}>
                🏥 Select Pharmacy Branch:
              </span>
              {isSuperAdmin ? (
                <SearchableSelect
                  options={commPharmacyOptions}
                  value={selectedCommPharmacy}
                  onChange={(val) => {
                    setSelectedCommPharmacy(val);
                    fetchCommissionData(val);
                  }}
                  placeholder="Select Pharmacy Branch..."
                  searchPlaceholder="Search branch name, code, city..."
                  size="md"
                  minWidth="240px"
                  maxWidth="340px"
                  showClear={false}
                />
              ) : (
                <div style={{ background: "#f1f5f9", padding: "0.4rem 0.75rem", borderRadius: "8px", fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>
                  {activePharmacyObj ? `${activePharmacyObj.name} (${activePharmacyObj.code})` : "Your Assigned Branch"}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fetchCommissionData(selectedCommPharmacy)}
                style={{ fontSize: "0.85rem", padding: "0.45rem 0.85rem" }}
              >
                🔄 Refresh
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleOpenPaymentModal}
                style={{ background: "#FFCB05", color: "#1E293B", fontWeight: "800", border: "1px solid rgba(245, 158, 11, 0.4)", fontSize: "0.85rem", padding: "0.45rem 1rem" }}
              >
                + Submit Payment Proof
              </button>
            </div>
          </div>

          {/* Commission Balance KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
            {/* Outstanding Balance (Hero Card) */}
            <div
              style={{
                background: commissionBalance?.outstandingBalance > 0 ? "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)" : "#f0fdf4",
                padding: "1.5rem",
                borderRadius: "14px",
                border: commissionBalance?.outstandingBalance > 0 ? "1px solid #fde68a" : "1px solid #bbf7d0",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 800, color: commissionBalance?.outstandingBalance > 0 ? "#92400e" : "#166534", textTransform: "uppercase" }}>
                  Outstanding Balance
                </span>
                <span style={{ fontSize: "1.2rem" }}>
                  {commissionBalance?.outstandingBalance > 0 ? "⚠️" : "✅"}
                </span>
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 900, color: commissionBalance?.outstandingBalance > 0 ? "#b45309" : "#15803d", marginTop: "0.4rem" }}>
                PKR {(commissionBalance?.outstandingBalance || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: "0.78rem", color: commissionBalance?.outstandingBalance > 0 ? "#78350f" : "#166534", marginTop: "0.25rem" }}>
                {commissionBalance?.outstandingBalance > 0
                  ? `Amount owed to Medikart: PKR ${(commissionBalance?.outstandingBalance || 0).toLocaleString()}`
                  : "All settled! No balance due."}
              </div>
            </div>

            {/* Total Accrued Commission */}
            <div style={{ background: "white", padding: "1.5rem", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <span style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>
                Total Commission
              </span>
              <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0f172a", marginTop: "0.4rem" }}>
                PKR {(commissionBalance?.totalAccruedCommission ?? commissionBalance?.cumulativeAccrued ?? 0).toLocaleString()}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                From delivered orders
              </div>
            </div>

            {/* Total Verified Payments */}
            <div style={{ background: "white", padding: "1.5rem", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <span style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>
                Total Paid
              </span>
              <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#16a34a", marginTop: "0.4rem" }}>
                PKR {(commissionBalance?.totalPaidCommission ?? commissionBalance?.totalPaidVerified ?? 0).toLocaleString()}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                Verified by Super Admin
              </div>
            </div>

            {/* Last Verified Payment */}
            <div style={{ background: "white", padding: "1.5rem", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <span style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>
                Last Payment
              </span>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", marginTop: "0.4rem" }}>
                {commissionBalance?.lastPaymentAmount ? `PKR ${commissionBalance.lastPaymentAmount.toLocaleString()}` : "None"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                {commissionBalance?.lastPaymentDate ? new Date(commissionBalance.lastPaymentDate).toLocaleDateString() : "No verified transactions"}
              </div>
            </div>
          </div>

          {/* Payment Proof Submissions Table (Visible to both Super Admin and Subadmin) */}
          <div style={{ background: "white", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                  📋 Payment Submissions & History
                </h3>
                <p style={{ margin: "0.2rem 0 0 0", color: "#64748b", fontSize: "0.8rem" }}>
                  {isSuperAdmin
                    ? "Review submitted receipts and verify commission payments."
                    : "Track your branch payment receipts and verification status."}
                </p>
              </div>

              {/* Date Filter Toolbar */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                {[
                  { key: "all", label: "All Time" },
                  { key: "today", label: "Today" },
                  { key: "7days", label: "7 Days" },
                  { key: "month", label: "This Month" },
                  { key: "custom", label: "Custom" },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setCommDateFilter(f.key)}
                    style={{
                      padding: "0.25rem 0.6rem",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      background: commDateFilter === f.key ? "#0f172a" : "#f8fafc",
                      color: commDateFilter === f.key ? "#ffffff" : "#475569",
                    }}
                  >
                    {f.label}
                  </button>
                ))}

                {commDateFilter === "custom" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginLeft: "0.25rem" }}>
                    <input
                      type="date"
                      className="form-control"
                      value={commStartDate}
                      onChange={(e) => setCommStartDate(e.target.value)}
                      style={{ fontSize: "0.75rem", padding: "0.2rem 0.4rem" }}
                    />
                    <span style={{ fontSize: "0.75rem" }}>to</span>
                    <input
                      type="date"
                      className="form-control"
                      value={commEndDate}
                      onChange={(e) => setCommEndDate(e.target.value)}
                      style={{ fontSize: "0.75rem", padding: "0.2rem 0.4rem" }}
                    />
                  </div>
                )}
              </div>
            </div>

            {commissionLoading ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Loading payment history...</div>
            ) : commissionPayments.length === 0 ? (
              <div style={{ padding: "3.5rem 1.5rem", textAlign: "center", color: "#64748b" }}>
                <span style={{ fontSize: "2.5rem" }}>🧾</span>
                <p style={{ marginTop: "0.75rem", fontWeight: 600 }}>No payment receipts submitted yet for this branch.</p>
                <button
                  className="btn btn-primary"
                  onClick={handleOpenPaymentModal}
                  style={{ marginTop: "0.5rem", background: "#FFCB05", color: "#1E293B", fontWeight: "800", border: "1px solid rgba(245, 158, 11, 0.4)" }}
                >
                  + Submit Payment Proof
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "0.75rem 1rem" }}>Submitted Date</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Paid Date</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Period</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Amount (PKR)</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Receipt</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Notes / Submitter</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Status Details</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissionPayments
                      .filter((pm) => {
                        if (commDateFilter === "all") return true;
                        const itemDate = pm.paidOnDate ? new Date(pm.paidOnDate) : new Date(pm.createdAt);
                        const now = new Date();
                        if (commDateFilter === "today") {
                          return itemDate.toISOString().split("T")[0] === now.toISOString().split("T")[0];
                        } else if (commDateFilter === "7days") {
                          return itemDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        } else if (commDateFilter === "month") {
                          return itemDate >= new Date(now.getFullYear(), now.getMonth(), 1);
                        } else if (commDateFilter === "custom") {
                          if (commStartDate && itemDate < new Date(commStartDate)) return false;
                          if (commEndDate) {
                            const endD = new Date(commEndDate);
                            endD.setHours(23, 59, 59, 999);
                            if (itemDate > endD) return false;
                          }
                          return true;
                        }
                        return true;
                      })
                      .map((pm) => (
                      <tr key={pm._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "0.75rem 1rem", color: "#475569", fontSize: "0.82rem" }}>
                          {new Date(pm.createdAt).toLocaleDateString()} {new Date(pm.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>
                          {pm.paidOnDate ? new Date(pm.paidOnDate).toLocaleDateString() : "—"}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "#475569" }}>
                          {new Date(pm.periodFrom).toLocaleDateString()} &rarr; {new Date(pm.periodTo).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", fontWeight: 900, color: "#0f172a", fontSize: "0.95rem" }}>
                          PKR {pm.amount?.toLocaleString()}
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          {pm.screenshotUrl ? (
                            <button
                              type="button"
                              onClick={() => setPreviewImage(resolveImageUrl(pm.screenshotUrl))}
                              style={{
                                background: "none",
                                border: "1px solid #cbd5e1",
                                borderRadius: "6px",
                                padding: "2px",
                                cursor: "pointer",
                                display: "inline-block",
                              }}
                              title="Click to view full screenshot receipt"
                            >
                              <img
                                src={resolveImageUrl(pm.screenshotUrl)}
                                alt="Receipt thumbnail"
                                style={{ width: "48px", height: "36px", objectFit: "cover", borderRadius: "4px", display: "block" }}
                              />
                            </button>
                          ) : (
                            <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>No image</span>
                          )}
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          {pm.status === "pending" && (
                            <span style={{ background: "#fef3c7", color: "#92400e", padding: "0.25rem 0.6rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 800, border: "1px solid #fde68a", display: "inline-block" }}>
                              ⏳ Pending Review
                            </span>
                          )}
                          {pm.status === "verified" && (
                            <span style={{ background: "#dcfce7", color: "#166534", padding: "0.25rem 0.6rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 800, border: "1px solid #bbf7d0", display: "inline-block" }}>
                              ✓ Approved & Verified
                            </span>
                          )}
                          {pm.status === "rejected" && (
                            <span style={{ background: "#fee2e2", color: "#991b1b", padding: "0.25rem 0.6rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 800, border: "1px solid #fecaca", display: "inline-block" }}>
                              ✕ Rejected
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", fontSize: "0.82rem", maxWidth: "200px" }}>
                          {pm.notes && <div style={{ color: "#334155", fontStyle: "italic", marginBottom: "0.2rem" }}>"{pm.notes}"</div>}
                          <div style={{ color: "#64748b", fontSize: "0.75rem" }}>
                            By: {pm.submittedBy?.name || "Admin"}
                          </div>
                        </td>
                        <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem" }}>
                          {pm.status === "verified" && (
                            <div style={{ color: "#166534" }}>
                              <strong>✓ Approved by</strong> {pm.verifiedBy?.name || "Super Admin"}
                              <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                                {pm.verifiedAt ? new Date(pm.verifiedAt).toLocaleDateString() : ""}
                              </div>
                            </div>
                          )}
                          {pm.status === "rejected" && (
                            <div style={{ color: "#991b1b" }}>
                              <strong>✕ Reason:</strong> {pm.rejectionReason || "No reason specified"}
                              <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                                By {pm.verifiedBy?.name || "Super Admin"}
                              </div>
                            </div>
                          )}
                          {pm.status === "pending" && (
                            <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Awaiting Super Admin review</span>
                          )}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right", whiteSpace: "nowrap" }}>
                          {isSuperAdmin && pm.status === "pending" ? (
                            <div style={{ display: "flex", gap: "0.35rem", justifyContent: "flex-end" }}>
                              <button
                                type="button"
                                onClick={() => setVerifyingPayment(pm)}
                                style={{
                                  background: "#dcfce7",
                                  color: "#166534",
                                  border: "1px solid #86efac",
                                  borderRadius: "6px",
                                  padding: "0.3rem 0.6rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 800,
                                  cursor: "pointer",
                                }}
                              >
                                ✓ Verify
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingPayment(pm);
                                  setRejectionReason("");
                                }}
                                style={{
                                  background: "#fee2e2",
                                  color: "#991b1b",
                                  border: "1px solid #fca5a5",
                                  borderRadius: "6px",
                                  padding: "0.3rem 0.6rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 800,
                                  cursor: "pointer",
                                }}
                              >
                                ✕ Reject
                              </button>
                            </div>
                          ) : pm.screenshotUrl ? (
                            <button
                              type="button"
                              onClick={() => setPreviewImage(resolveImageUrl(pm.screenshotUrl))}
                              className="btn btn-secondary"
                              style={{ padding: "0.25rem 0.55rem", fontSize: "0.75rem", fontWeight: 700 }}
                            >
                              👁️ View Receipt
                            </button>
                          ) : (
                            <span style={{ color: "#cbd5e1" }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT PHARMACY MODAL */}
      {showModal && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div className="modal-card" style={{ background: "white", borderRadius: "16px", padding: "1.5rem", maxWidth: "580px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: "0 0 1rem 0" }}>
              {editingPharmacy ? "Edit Pharmacy Branch" : "Register Pharmacy Branch"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div className="form-group">
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Pharmacy Name *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Medikart Main Branch Lahore"
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Branch Code * {isBranchScoped && <span style={{ fontSize: "0.75rem", color: "#64748b" }}>(Locked)</span>}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1", textTransform: "uppercase", background: isBranchScoped ? "#f1f5f9" : "white" }}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="LHR-01"
                    disabled={isBranchScoped}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div className="form-group">
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Contact Phone *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="03244489159"
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Contact Person
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Dr. Ahmed"
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Medikart % {isBranchScoped && <span style={{ fontSize: "0.75rem", color: "#64748b" }}>(Locked)</span>}
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      className="form-control"
                      style={{ width: "100%", padding: "0.5rem 1.75rem 0.5rem 0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: 700, background: isBranchScoped ? "#f1f5f9" : "white" }}
                      value={formData.medikartPercentage}
                      onChange={(e) => setFormData({ ...formData, medikartPercentage: e.target.value === "" ? "" : Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })}
                      placeholder="e.g. 5"
                      disabled={isBranchScoped}
                    />
                    <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontWeight: 800, fontSize: "0.85rem" }}>%</span>
                  </div>
                </div>
              </div>

              {/* Bank Account Title Field */}
              <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  Bank Account Title / Beneficiary Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  value={formData.accountTitle}
                  onChange={(e) => setFormData({ ...formData, accountTitle: e.target.value })}
                  placeholder="e.g. Medikart Health Pharmacy (Pvt) Ltd"
                />
              </div>

              {/* Secure Bank Account Field */}
              <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  Pharmacy Bank Account Number 🔒 (Encrypted on Save)
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontFamily: "monospace" }}
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="e.g. PK36SCBL0000001123456701"
                />
                {editingPharmacy && (
                  <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem", display: "block" }}>
                    Currently saved: <strong>{editingPharmacy.accountNumberLast4 ? `•••• ${editingPharmacy.accountNumberLast4}` : "None set"}</strong> (Leave blank to keep unchanged).
                  </span>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  Physical Address *
                </label>
                <textarea
                  className="form-control"
                  rows="2"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, Sector, City..."
                  required
                />
              </div>

              {/* City Multi-Select Association */}
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                  Delivery Cities Served by this Branch {isBranchScoped && <span style={{ fontSize: "0.75rem", color: "#64748b" }}>(Locked to HQ)</span>}
                </label>
                <div style={{ maxHeight: "120px", overflowY: "auto", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "0.5rem", background: isBranchScoped ? "#f1f5f9" : "#f8fafc" }}>
                  {cities.length === 0 ? (
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>No delivery cities available.</span>
                  ) : (
                    cities.map((c) => (
                      <label key={c._id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0", fontSize: "0.85rem", cursor: isBranchScoped ? "default" : "pointer" }}>
                        <input
                          type="checkbox"
                          checked={formData.cityIds.includes(c._id)}
                          onChange={() => !isBranchScoped && handleToggleCity(c._id)}
                          disabled={isBranchScoped}
                        />
                        <span>{c.name} (PKR {c.deliveryCharge})</span>
                      </label>
                    ))
                  )}
                </div>
                <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem", display: "block" }}>
                  🔒 Confidential: City associations are internal to admin routing and never shown to storefront customers.
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                <input
                  type="checkbox"
                  id="pharmacyActiveToggle"
                  checked={formData.active}
                  onChange={(e) => !isBranchScoped && setFormData({ ...formData, active: e.target.checked })}
                  disabled={isBranchScoped}
                  style={{ width: "16px", height: "16px" }}
                />
                <label htmlFor="pharmacyActiveToggle" style={{ fontSize: "0.85rem", fontWeight: 600, cursor: isBranchScoped ? "default" : "pointer" }}>
                  Active Branch (Available for Order Fulfillment Assignment) {isBranchScoped && <span style={{ fontSize: "0.75rem", color: "#64748b" }}>(Managed by Super Admin)</span>}
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: "#FFCB05", color: "#1E293B", fontWeight: "800", border: "1px solid rgba(245, 158, 11, 0.4)" }}
                  disabled={saving}
                >
                  {saving ? "Saving..." : editingPharmacy ? "Save Changes" : "Register Pharmacy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMIT PAYMENT PROOF MODAL */}
      {showPaymentModal && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div className="modal-card" style={{ background: "white", borderRadius: "16px", padding: "1.5rem", maxWidth: "520px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: "0 0 0.5rem 0" }}>
              💳 Submit Commission Payment Proof
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0 0 1.25rem 0" }}>
              {isSuperAdmin
                ? "As Super Admin, uploading payment proof will automatically approve and verify the transaction and credit the commission balance immediately."
                : "Upload proof of bank transfer or cash deposit settling the Medikart commission balance for Super Admin review."}
            </p>

            <form onSubmit={handlePaymentSubmit}>
              <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  Pharmacy Branch
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", fontWeight: 700 }}
                  value={activePharmacyObj ? `${activePharmacyObj.name} (${activePharmacyObj.code})` : "Selected Branch"}
                  disabled
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div className="form-group">
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Payment Amount (PKR) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="form-control"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: 700 }}
                    value={paymentFormData.amount}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                    placeholder="e.g. 15000"
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Paid On Date *
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    value={paymentFormData.paidOnDate}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paidOnDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div className="form-group">
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Period Covered From *
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    value={paymentFormData.periodFrom}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, periodFrom: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Period Covered To *
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    value={paymentFormData.periodTo}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, periodTo: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  Payment Screenshot / Receipt Proof *
                </label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="form-control"
                  style={{ width: "100%", padding: "0.4rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  onChange={handleFileChange}
                  required
                />
                {paymentFormData.screenshotPreview && (
                  <div style={{ marginTop: "0.5rem", textAlign: "center" }}>
                    <img
                      src={paymentFormData.screenshotPreview}
                      alt="Proof Preview"
                      style={{ maxHeight: "140px", maxWidth: "100%", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  Notes / Bank Reference ID (Optional)
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                  placeholder="e.g. Meezan Bank FT #987654321"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={paymentSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: "#FFCB05", color: "#1E293B", fontWeight: "800", border: "1px solid rgba(245, 158, 11, 0.4)" }}
                  disabled={paymentSubmitting}
                >
                  {paymentSubmitting
                    ? (isSuperAdmin ? "Approving & Recording..." : "Uploading Proof...")
                    : (isSuperAdmin ? "Approve & Record Payment" : "Submit Proof")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPER ADMIN: VERIFY CONFIRMATION MODAL */}
      {verifyingPayment && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: "1rem" }}>
          <div className="modal-card" style={{ background: "white", borderRadius: "16px", padding: "1.5rem", maxWidth: "440px", width: "100%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: "0 0 0.5rem 0", color: "#166534" }}>
              ✓ Verify Commission Payment
            </h3>
            <p style={{ color: "#475569", fontSize: "0.9rem", margin: "0 0 1rem 0" }}>
              Are you sure you want to verify this payment of <strong>PKR {verifyingPayment.amount?.toLocaleString()}</strong>?
            </p>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.75rem", borderRadius: "8px", fontSize: "0.825rem", color: "#166534", marginBottom: "1.25rem" }}>
              ℹ️ This will atomically decrement the pharmacy's outstanding balance by <strong>PKR {verifyingPayment.amount?.toLocaleString()}</strong> and record your verification in the audit trail.
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setVerifyingPayment(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleVerify}
                style={{ background: "#16a34a", color: "white", fontWeight: 700, border: "none" }}
                disabled={actionLoading}
              >
                {actionLoading ? "Verifying..." : "Confirm Verification"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUPER ADMIN: REJECT MODAL */}
      {rejectingPayment && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: "1rem" }}>
          <div className="modal-card" style={{ background: "white", borderRadius: "16px", padding: "1.5rem", maxWidth: "460px", width: "100%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: "0 0 0.5rem 0", color: "#991b1b" }}>
              ✕ Reject Commission Payment Proof
            </h3>
            <p style={{ color: "#475569", fontSize: "0.9rem", margin: "0 0 0.75rem 0" }}>
              Rejecting payment proof of <strong>PKR {rejectingPayment.amount?.toLocaleString()}</strong>.
            </p>
            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem", color: "#0f172a" }}>
                Reason for Rejection *
              </label>
              <textarea
                className="form-control"
                rows="3"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Screenshot illegible, transaction ID not found in bank statement, incorrect amount..."
                required
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setRejectingPayment(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleReject}
                style={{ background: "#dc2626", color: "white", fontWeight: 700, border: "none" }}
                disabled={actionLoading}
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX SCREENSHOT PREVIEW MODAL */}
      {previewImage && (
        <div
          className="modal-overlay"
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: "1.5rem" }}
          onClick={() => setPreviewImage("")}
        >
          <div
            style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh", background: "white", borderRadius: "12px", padding: "0.5rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage("")}
              style={{
                position: "absolute",
                top: "-14px",
                right: "-14px",
                background: "#0f172a",
                color: "white",
                border: "2px solid white",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                fontWeight: 900,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
            <img
              src={previewImage}
              alt="Full Payment Proof"
              style={{ maxHeight: "80vh", maxWidth: "100%", borderRadius: "8px", display: "block" }}
            />
            <div style={{ textAlign: "right", marginTop: "0.5rem", padding: "0 0.5rem" }}>
              <a
                href={previewImage}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: "0.8rem", color: "#2563eb", fontWeight: 700, textDecoration: "underline" }}
              >
                Open in new tab ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
