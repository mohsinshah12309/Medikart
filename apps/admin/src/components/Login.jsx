import React, { useState } from "react";

function Login({ onLoginSuccess, sessionExpiredMessage = "" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

    try {
      const res = await fetch(`${apiUrl}/auth/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid credentials");
      }

      // Successful login
      if (data.status === "success" || (data.data && data.data.token)) {
        const token = data.data.token;
        const admin = data.data.admin;
        onLoginSuccess(token, admin);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Medikart Staff Login</h2>
        {sessionExpiredMessage && (
          <div className="alert alert-warning" style={{ background: "#fef9c3", color: "#854d0e", border: "1px solid #fde047" }}>
            ⏱️ {sessionExpiredMessage}
          </div>
        )}
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="admin@medikart.pk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "1rem" }}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
