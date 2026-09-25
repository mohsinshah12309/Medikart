import React, { useState, useEffect } from "react";
import { adminFetch } from "../apiClient";

/**
 * ActivityLogs screen — Phase 24e
 *
 * Read-only view of the activityLog collection.
 * Wired to Phase 11's endpoint: GET /api/v1/admin/activity-logs
 *
 * Displays: actor, action, entityType, before/after state, timestamp
 * Supports filtering by entityType and pagination.
 */
function ActivityLogs({ token }) {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterEntityType, setFilterEntityType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const ENTITY_TYPES = ["product", "category", "order", "admin_user", "settings", "city", "pharmacy", "banner", "condition"];

  useEffect(() => {
    fetchLogs();
  }, [filterEntityType, currentPage]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ page: currentPage, limit: 20 });
      if (filterEntityType) params.set("entityType", filterEntityType);
      const data = await adminFetch(`/admin/activity-logs?${params}`);
      setLogs(data.data || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 20, pages: 1 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleString("en-PK", { timeZone: "Asia/Karachi" });
  };

  const formatJson = (obj) => {
    if (!obj) return "—";
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const actionBadgeColor = (action) => {
    if (action?.includes("delete") || action?.includes("removed") || action?.includes("rejected") || action?.includes("cancelled")) {
      return { background: "#fee2e2", color: "#991b1b" };
    }
    if (action?.includes("create") || action?.includes("added") || action?.includes("approved")) {
      return { background: "#d1fae5", color: "#065f46" };
    }
    return { background: "#dbeafe", color: "#1e40af" };
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchActor = (log.actorEmail && log.actorEmail.toLowerCase().includes(q)) || (log.actor && String(log.actor).toLowerCase().includes(q));
    const matchAction = log.action && log.action.toLowerCase().includes(q);
    const matchEntity = log.entityType && log.entityType.toLowerCase().includes(q);
    const matchDetails = JSON.stringify(log).toLowerCase().includes(q);
    return matchActor || matchAction || matchEntity || matchDetails;
  });

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Activity Logs</h2>
        <button className="btn btn-secondary" onClick={() => { setCurrentPage(1); fetchLogs(); }}>
          🔄 Refresh
        </button>
      </div>

      <div style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        Comprehensive audit trail tracking all administrative actions, inventory edits, and order updates.
        {pagination.total > 0 && ` Showing ${logs.length} of ${pagination.total} entries.`}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filters & Search Toolbar */}
      <div className="card" style={{ padding: "0.85rem 1.25rem", marginBottom: "1.25rem", display: "flex", gap: "1rem", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", flex: 1 }}>
          <div style={{ position: "relative", minWidth: "240px", flex: 1, maxWidth: "380px" }}>
            <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem", color: "#64748b" }}>🔍</span>
            <input
              type="text"
              placeholder="Search by actor email, action, details..."
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

          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569" }}>Entity:</label>
            <select
              className="form-control"
              value={filterEntityType}
              onChange={(e) => { setFilterEntityType(e.target.value); setCurrentPage(1); }}
              style={{ minWidth: "150px", padding: "0.35rem 0.6rem", fontSize: "0.8rem" }}
            >
              <option value="">All Types</option>
              {ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>
          Showing <strong style={{ color: "#0f172a" }}>{filteredLogs.length}</strong> of {logs.length} loaded logs
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>Loading logs...</div>
      ) : (
        <>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-responsive">
              <table className="table" style={{ margin: 0, fontSize: "0.85rem" }}>
              <thead>
                <tr>
                  <th style={{ whiteSpace: "nowrap" }}>Timestamp (PKT)</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Before</th>
                  <th>After</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "#64748b", padding: "2rem" }}>
                      {searchQuery || filterEntityType
                        ? "No activity logs match the active search/filters."
                        : "No activity logs recorded yet."}
                    </td>
                  </tr>
                ) : filteredLogs.map((log) => (
                  <tr key={log._id}>
                    <td style={{ whiteSpace: "nowrap", color: "#64748b", fontSize: "0.8rem" }}>
                      {formatDate(log.timestamp)}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: "0.8rem" }}>{log.actor?.email || log.actor?.id || "—"}</div>
                      {log.actor?.role && (
                        <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{log.actor.role}</div>
                      )}
                    </td>
                    <td>
                      <span style={{
                        display: "inline-block", padding: "0.2rem 0.5rem", borderRadius: "4px",
                        fontSize: "0.75rem", fontWeight: 600,
                        ...actionBadgeColor(log.action),
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.8rem" }}>{log.entityType}</div>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8", wordBreak: "break-all" }}>
                        {String(log.entityId).slice(-8)}…
                      </div>
                    </td>
                    <td>
                      <pre style={{ margin: 0, fontSize: "0.7rem", background: "#f8fafc", padding: "0.3rem 0.5rem",
                        borderRadius: "4px", maxWidth: "180px", overflow: "auto", maxHeight: "80px", color: "#475569" }}>
                        {formatJson(log.before)}
                      </pre>
                    </td>
                    <td>
                      <pre style={{ margin: 0, fontSize: "0.7rem", background: "#f0fdf4", padding: "0.3rem 0.5rem",
                        borderRadius: "4px", maxWidth: "180px", overflow: "auto", maxHeight: "80px", color: "#166534" }}>
                        {formatJson(log.after)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1rem" }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                ← Prev
              </button>
              <span style={{ padding: "0.4rem 0.75rem", color: "#64748b", fontSize: "0.875rem" }}>
                Page {currentPage} of {pagination.pages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={currentPage >= pagination.pages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ActivityLogs;
