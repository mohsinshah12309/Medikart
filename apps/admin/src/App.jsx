import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Layout from "./components/Layout";
import Products from "./components/Products";
import Overview from "./components/Overview";
import Categories from "./components/Categories";
import Orders from "./components/Orders";
import Cities from "./components/Cities";
import Settings from "./components/Settings";
import AdminUsers from "./components/AdminUsers";
import ActivityLogs from "./components/ActivityLogs";
import Messages from "./components/Messages";
import { SESSION_EXPIRED_EVENT } from "./apiClient";

function App() {
  const [token, setToken] = useState(localStorage.getItem("admin_token") || "");
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem("admin_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState("");

  useEffect(() => {
    const handleExpired = (e) => {
      const msg = e?.detail?.message || "Your session has expired. Please sign in again.";
      setToken("");
      setAdminUser(null);
      setSessionExpiredMsg(msg);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, []);

  const handleLogin = (newToken, user) => {
    localStorage.setItem("admin_token", newToken);
    localStorage.setItem("admin_user", JSON.stringify(user));
    setToken(newToken);
    setAdminUser(user);
    setSessionExpiredMsg("");
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setToken("");
    setAdminUser(null);
    setSessionExpiredMsg("");
  };

  if (!token) {
    return <Login onLoginSuccess={handleLogin} sessionExpiredMessage={sessionExpiredMsg} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <Overview token={token} />;
      case "products":
        return <Products token={token} />;
      case "categories":
        return <Categories token={token} />;
      case "orders":
        return <Orders token={token} />;
      case "cities":
        return <Cities token={token} />;
      case "settings":
        return <Settings token={token} />;
      case "adminUsers":
        // Extra guard in App — if somehow a non-super-admin reaches this tab
        // (e.g. stale localStorage), they still see nothing useful.
        // The backend is the real guard (requireSuperAdmin middleware, Phase 20).
        return adminUser?.role === "super_admin"
          ? <AdminUsers token={token} adminUser={adminUser} />
          : <div style={{ padding: "2rem", color: "#64748b" }}>Access denied.</div>;
      case "activityLogs":
        return <ActivityLogs token={token} />;
      case "messages":
        return <Messages token={token} />;
      default:
        return (
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Screen
            </h2>
            <p style={{ color: "#64748b" }}>This screen is under construction.</p>
          </div>
        );
    }
  };

  return (
    <Layout
      adminUser={adminUser}
      onLogout={handleLogout}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
