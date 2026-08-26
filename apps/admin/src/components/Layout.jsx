import React from "react";

function Layout({ adminUser, onLogout, activeTab, onTabChange, children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span>💊</span> Medikart Portal
        </div>
        <nav className="sidebar-nav">
          <div
            className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => onTabChange("overview")}
          >
            Overview
          </div>
          <div
            className={`nav-item ${activeTab === "products" ? "active" : ""}`}
            onClick={() => onTabChange("products")}
          >
            Products
          </div>
          <div
            className={`nav-item ${activeTab === "categories" ? "active" : ""}`}
            onClick={() => onTabChange("categories")}
          >
            Categories
          </div>
          <div
            className={`nav-item ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => onTabChange("orders")}
          >
            Orders
          </div>
          {adminUser && adminUser.role === "super_admin" && (
            <div
              className={`nav-item ${activeTab === "users" ? "active" : ""}`}
              onClick={() => onTabChange("users")}
            >
              Staff Management
            </div>
          )}
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <header className="header">
          <div className="user-profile">
            <span style={{ fontWeight: 600, color: "#334155" }}>
              {adminUser ? adminUser.name : "Admin User"}
            </span>
            <span className="user-role-badge">
              {adminUser ? adminUser.role : "staff"}
            </span>
          </div>
        </header>
        <div className="content-body">{children}</div>
      </main>
    </div>
  );
}

export default Layout;
