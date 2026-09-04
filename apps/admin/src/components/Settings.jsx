import React, { useState, useEffect } from "react";

/**
 * Settings screen — Phase 24d
 *
 * Sections:
 *   1. Storewide Discount — wired to existing GET/PUT /api/v1/admin/settings/discount (Phase 8)
 *   2. About / Contact Content — wired to new GET/PUT /api/v1/admin/settings/content (Phase 24)
 *
 * NOTE (flagged, not invented): The About/Contact persistence required adding
 * aboutText, contactEmail, contactPhone fields to the Settings model on the
 * backend (same singleton document, no migration needed). A new backend
 * endpoint GET/PUT /api/v1/admin/settings/content was added explicitly as part
 * of Phase 24 — it was not previously existing.
 */
function Settings({ token }) {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  // Discount state
  const [discountValue, setDiscountValue] = useState(0);
  const [discountActive, setDiscountActive] = useState(false);
  const [discountLoading, setDiscountLoading] = useState(true);
  const [discountSaving, setDiscountSaving] = useState(false);

  // Content state
  const [aboutText, setAboutText] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contentLoading, setContentLoading] = useState(true);
  const [contentSaving, setContentSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchDiscount();
    fetchContent();
  }, []);

  const flash = (msg, isError = false) => {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => { setError(""); setSuccess(""); }, 4000);
  };

  const fetchDiscount = async () => {
    try {
      setDiscountLoading(true);
      const res = await fetch(`${apiUrl}/admin/settings/discount`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load discount");
      // The GET /discount endpoint returns storewideDiscountPercent (active value or 0)
      // We need the full discount object for toggle — fetch it differently:
      // Actually the GET returns just the active percent. We'll display that.
      // Active state is inferred from value > 0 on GET. For PUT we send both.
      // Re-fetch full settings via PUT flow is not needed; we just track local toggle.
      setDiscountValue(data.data?.storewideDiscountPercent ?? 0);
      setDiscountActive((data.data?.storewideDiscountPercent ?? 0) > 0);
    } catch (err) {
      flash(err.message, true);
    } finally {
      setDiscountLoading(false);
    }
  };

  const fetchContent = async () => {
    try {
      setContentLoading(true);
      const res = await fetch(`${apiUrl}/admin/settings/content`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load content");
      setAboutText(data.data?.aboutText ?? "");
      setContactEmail(data.data?.contactEmail ?? "");
      setContactPhone(data.data?.contactPhone ?? "");
    } catch (err) {
      flash(err.message, true);
    } finally {
      setContentLoading(false);
    }
  };

  const saveDiscount = async (e) => {
    e.preventDefault();
    setDiscountSaving(true);
    try {
      const res = await fetch(`${apiUrl}/admin/settings/discount`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ value: Number(discountValue), active: discountActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");
      flash("Storewide discount updated");
    } catch (err) {
      flash(err.message, true);
    } finally {
      setDiscountSaving(false);
    }
  };

  const saveContent = async (e) => {
    e.preventDefault();
    setContentSaving(true);
    try {
      const res = await fetch(`${apiUrl}/admin/settings/content`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ aboutText, contactEmail, contactPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");
      flash("Page content updated");
    } catch (err) {
      flash(err.message, true);
    } finally {
      setContentSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Settings</h2>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* ── Section 1: Storewide Discount ── */}
      <div className="card" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
        <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", fontWeight: 700 }}>
          🏷️ Storewide Discount
        </h3>
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
          Applied as a fallback discount across all catalog products when no specific product or category discount is active.
        </p>
        {discountLoading ? (
          <div style={{ color: "#64748b" }}>Loading discount settings...</div>
        ) : (
          <form onSubmit={saveDiscount}>
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                  Discount Percentage (0–100)
                </label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  max="100"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  style={{ maxWidth: "150px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                  Active
                </label>
                <select
                  className="form-control"
                  value={discountActive ? "true" : "false"}
                  onChange={(e) => setDiscountActive(e.target.value === "true")}
                  style={{ maxWidth: "100px" }}
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={discountSaving}>
                {discountSaving ? "Saving..." : "Save Discount"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Section 2: About / Contact Content ── */}
      <div className="card" style={{ padding: "2rem" }}>
        <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", fontWeight: 700 }}>
          📄 About & Contact Page Content
        </h3>
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
          Manage the public business information, pharmacy credentials, and support channels displayed on the About and Contact pages.
        </p>
        {contentLoading ? (
          <div style={{ color: "#64748b" }}>Loading content settings...</div>
        ) : (
          <form onSubmit={saveContent}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                  About Text
                </label>
                <textarea
                  className="form-control"
                  rows={5}
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  placeholder="Write about Medikart — mission, values, clinical licensing, and history..."
                  style={{ resize: "vertical", fontFamily: "inherit" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                  Contact Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="medikart.com@gmail.com"
                  style={{ maxWidth: "320px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                  Contact Phone
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+92 331 4170744"
                  style={{ maxWidth: "220px" }}
                />
              </div>
              <div>
                <button type="submit" className="btn btn-primary" disabled={contentSaving}>
                  {contentSaving ? "Saving..." : "Save Content"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Settings;
