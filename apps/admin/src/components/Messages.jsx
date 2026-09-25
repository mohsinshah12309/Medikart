import React, { useState, useEffect } from "react";
import { adminFetch } from "../apiClient";

function Messages({ token }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeMessage, setActiveMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError("");
      const body = await adminFetch("/admin/contact-messages");
      setMessages(body.data?.messages || []);
    } catch (err) {
      setError("Failed to load customer messages: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "";
    const date = new Date(isoStr);
    return date.toLocaleString("en-PK", {
      timeZone: "Asia/Karachi",
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const filteredMessages = messages.filter((msg) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchName = msg.name && msg.name.toLowerCase().includes(q);
    const matchEmail = msg.email && msg.email.toLowerCase().includes(q);
    const matchPhone = msg.phone && msg.phone.toLowerCase().includes(q);
    const matchSubject = msg.subject && msg.subject.toLowerCase().includes(q);
    const matchMessage = msg.message && msg.message.toLowerCase().includes(q);
    return matchName || matchEmail || matchPhone || matchSubject || matchMessage;
  });

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Customer Messages</h2>
        <button className="btn btn-secondary" onClick={fetchMessages}>
          🔄 Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Search Toolbar */}
      <div
        className="card"
        style={{
          padding: "0.85rem 1.25rem",
          marginBottom: "1.25rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
        }}
      >
        <div style={{ position: "relative", minWidth: "240px", flex: 1, maxWidth: "420px" }}>
          <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem", color: "#64748b" }}>🔍</span>
          <input
            type="text"
            placeholder="Search customer name, email, phone, message..."
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

        <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>
          Showing <strong style={{ color: "#0f172a" }}>{filteredMessages.length}</strong> of {messages.length} messages
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
          Loading messages...
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
          <span style={{ fontSize: "3rem" }}>✉️</span>
          <h3 style={{ margin: "1rem 0 0.5rem 0", color: "#334155" }}>
            {searchQuery ? "No matching messages found" : "No messages found"}
          </h3>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>
            {searchQuery
              ? `No messages matched "${searchQuery}".`
              : "Customer queries submitted via the contact form will show up here."}
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Date & Time</th>
                  <th>Snippet</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map((msg) => (
                  <tr key={msg._id}>
                    <td>
                      <span style={{ fontWeight: 700, color: "#0f172a" }}>{msg.name}</span>
                    </td>
                    <td>
                      <a href={`mailto:${msg.email}`} style={{ color: "#ca8a04", textDecoration: "none", fontWeight: 600 }} className="hover:underline">
                        {msg.email}
                      </a>
                    </td>
                    <td style={{ fontSize: "0.85rem", color: "#64748b" }}>
                      {formatDate(msg.createdAt)}
                    </td>
                    <td style={{ fontSize: "0.9rem", color: "#334155" }}>
                      <span className="truncate" style={{ maxWidth: "240px", display: "inline-block" }}>
                        {msg.message}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                        onClick={() => setActiveMessage(msg)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Message View Modal */}
      {activeMessage && (
        <div className="modal-overlay" onClick={() => setActiveMessage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h3>Message details</h3>
              <button className="modal-close" onClick={() => setActiveMessage(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "0.5rem", fontSize: "0.9rem" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>From:</span>
                <span style={{ color: "#0f172a", fontWeight: 700 }}>{activeMessage.name}</span>
                
                <span style={{ color: "#64748b", fontWeight: 600 }}>Email:</span>
                <span>
                  <a href={`mailto:${activeMessage.email}`} style={{ color: "#ca8a04", textDecoration: "none", fontWeight: 600 }}>
                    {activeMessage.email}
                  </a>
                </span>
                
                <span style={{ color: "#64748b", fontWeight: 600 }}>Date:</span>
                <span style={{ color: "#475569" }}>{formatDate(activeMessage.createdAt)}</span>
              </div>

              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
                <h4 style={{ margin: "0 0 0.5rem 0", color: "#854d0e", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 800 }}>
                  Message Content
                </h4>
                <p style={{ 
                  color: "#0f172a", 
                  fontSize: "0.95rem", 
                  lineHeight: "1.6", 
                  background: "#f8fafc", 
                  padding: "1rem", 
                  borderRadius: "10px", 
                  border: "1px solid #e2e8f0",
                  margin: 0,
                  whiteSpace: "pre-wrap"
                }}>
                  {activeMessage.message}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <a
                href={`mailto:${activeMessage.email}?subject=Re: Medikart Query`}
                className="btn btn-primary"
                style={{ textDecoration: "none" }}
              >
                ✉️ Reply via Email
              </a>
              <button className="btn btn-secondary" onClick={() => setActiveMessage(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Messages;
