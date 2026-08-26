import React, { useState } from "react";
import Login from "./components/Login";
import Layout from "./components/Layout";
import Products from "./components/Products";

function App() {
  const [token, setToken] = useState(localStorage.getItem("admin_token") || "");
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem("admin_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState("products");

  const handleLogin = (newToken, user) => {
    localStorage.setItem("admin_token", newToken);
    localStorage.setItem("admin_user", JSON.stringify(user));
    setToken(newToken);
    setAdminUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setToken("");
    setAdminUser(null);
  };

  if (!token) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  return (
    <Layout
      adminUser={adminUser}
      onLogout={handleLogout}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "products" ? (
        <Products token={token} />
      ) : (
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Screen
          </h2>
          <p style={{ color: "#64748b" }}>
            This screen is currently placeholder in Phase 23. Only the Products screen is fully wired.
          </p>
        </div>
      )}
    </Layout>
  );
}

export default App;
