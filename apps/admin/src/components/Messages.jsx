import React, { useState, useEffect } from "react";

function Messages({ token }) {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeMessage, setActiveMessage] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError("");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${apiUrl}/admin/contact-messages`, { headers });
      if (!res.ok) throw new Error(`Server returned status ${res.status}`);
      const body = await res.json();
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

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Customer Messages</h2>
        <button className="btn btn-secondary" onClick={fetchMessages}>
          🔄 Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
          Loading messages...
        </div>
      ) : messages.length === 0 ? (
        <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
          <span style={{ fontSize: "3rem" }}>✉️</span>
          <h3 style={{ margin: "1rem 0 0.5rem 0", color: "#f1f5f9" }}>No messages found</h3>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>
            Customer queries submitted via the contact form will show up here.
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
                {messages.map((msg) => (
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
