import React, { useState } from "react";
import PasswordInput from "./PasswordInput";

function Login({ onLoginSuccess, sessionExpiredMessage = "" }) {
  // mode: "login" | "forgot" | "reset"
  const [mode, setMode] = useState("login");

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot / Reset Password state
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  const apiUrl = import.meta.env.VITE_API_URL || "/api/v1";

  // ── Handle standard login ──────────────────────────────────────────────────
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/auth/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
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

  // ── Step 1: Send verification code to email ────────────────────────────────
  const handleSendCode = async (e) => {
    if (e) e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    setForgotLoading(true);

    try {
      const res = await fetch(`${apiUrl}/auth/admin/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to send reset code");
      }

      setForgotSuccess("Verification code sent! Please check your email inbox.");
      setMode("reset");
    } catch (err) {
      setForgotError(err.message || "Could not send verification code.");
    } finally {
      setForgotLoading(false);
    }
  };

  // ── Step 2: Reset password with 6-digit code & new password ─────────────────
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setForgotError("");

    if (!resetCode.trim()) {
      setForgotError("Please enter the 6-digit verification code.");
      return;
    }

    if (newPassword.length < 8) {
      setForgotError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError("Passwords do not match.");
      return;
    }

    setForgotLoading(true);

    try {
      const res = await fetch(`${apiUrl}/auth/admin/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetCode.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Reset failed. Code may be invalid or expired.");
      }

      // Success — prefill login email and go back to login mode
      setEmail(resetEmail);
      setPassword("");
      setSuccess("✅ Password reset successfully! You can now sign in with your new password.");
      setMode("login");
      setResetCode("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setForgotError(err.message || "Failed to reset password.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: "420px" }}>
        {/* ── MODE 1: STAFF LOGIN ────────────────────────────────────────── */}
        {mode === "login" && (
          <>
            <h2>Medikart Staff Login</h2>
            {sessionExpiredMessage && (
              <div className="alert alert-warning" style={{ background: "#fef9c3", color: "#854d0e", border: "1px solid #fde047" }}>
                ⏱️ {sessionExpiredMessage}
              </div>
            )}
            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label htmlFor="admin-email">Email Address</label>
                <input
                  id="admin-email"
                  type="email"
                  className="form-control"
                  placeholder="admin@medikart.pk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>

              {/* Password with show/hide toggle */}
              <PasswordInput
                id="admin-password"
                name="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                autoComplete="current-password"
              />

              {/* Forgot password link */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-0.5rem", marginBottom: "1rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email || "");
                    setForgotError("");
                    setForgotSuccess("");
                    setMode("forgot");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#b45309",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    padding: "0.2rem 0",
                    transition: "color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#78350f")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#b45309")}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%" }}
                disabled={loading}
              >
                {loading ? "Logging in..." : "Sign In"}
              </button>
            </form>
          </>
        )}

        {/* ── MODE 2: FORGOT PASSWORD (REQUEST CODE) ─────────────────────── */}
        {mode === "forgot" && (
          <>
            <h2>Forgot Password</h2>
            <p style={{ color: "#64748b", fontSize: "0.85rem", textAlign: "center", marginTop: "-0.75rem", marginBottom: "1.25rem", lineHeight: 1.4 }}>
              Enter your staff or administrator email to receive a 6-digit verification code.
            </p>

            {forgotError && <div className="alert alert-danger">{forgotError}</div>}

            <form onSubmit={handleSendCode}>
              <div className="form-group">
                <label htmlFor="reset-email">Staff Email Address</label>
                <input
                  id="reset-email"
                  type="email"
                  className="form-control"
                  placeholder="admin@medikart.pk"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "0.5rem" }}
                disabled={forgotLoading}
              >
                {forgotLoading ? "Sending Code..." : "Send Verification Code"}
              </button>

              <div style={{ textAlign: "center", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          </>
        )}

        {/* ── MODE 3: RESET PASSWORD (ENTER CODE + NEW PASSWORD) ─────────── */}
        {mode === "reset" && (
          <>
            <h2>Reset Password</h2>
            <p style={{ color: "#64748b", fontSize: "0.85rem", textAlign: "center", marginTop: "-0.75rem", marginBottom: "1.25rem", lineHeight: 1.4 }}>
              Enter the 6-digit code sent to <strong>{resetEmail}</strong> and your new password.
            </p>

            {forgotSuccess && <div className="alert alert-success">{forgotSuccess}</div>}
            {forgotError && <div className="alert alert-danger">{forgotError}</div>}

            <form onSubmit={handleResetSubmit}>
              <div className="form-group">
                <label htmlFor="reset-code">6-Digit Verification Code</label>
                <input
                  id="reset-code"
                  type="text"
                  className="form-control"
                  placeholder="123456"
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ""))}
                  required
                  style={{
                    letterSpacing: "4px",
                    fontWeight: 800,
                    fontSize: "1.1rem",
                    textAlign: "center",
                  }}
                />
              </div>

              <PasswordInput
                id="reset-new-password"
                name="newPassword"
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                required
                disabled={forgotLoading}
                autoComplete="new-password"
                minLength={8}
              />

              <PasswordInput
                id="reset-confirm-password"
                name="confirmPassword"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                disabled={forgotLoading}
                autoComplete="new-password"
                minLength={8}
              />

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "0.75rem" }}
                disabled={forgotLoading}
              >
                {forgotLoading ? "Resetting Password..." : "Update Password"}
              </button>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ← Back to Sign In
                </button>

                <button
                  type="button"
                  onClick={() => handleSendCode()}
                  disabled={forgotLoading}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#b45309",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Resend Code
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
