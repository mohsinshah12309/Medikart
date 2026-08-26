import React from "react";

/**
 * Layout — Phase 23/24
 *
 * Sidebar nav items:
 *   - Overview, Products, Categories, Orders (all admins)
 *   - Cities, Settings, Activity Logs (all admins)
 *   - Admin Users (super_admin only — UI hides tab; backend enforces separately)
 */
function Layout({ adminUser, onLogout, activeTab, onTabChange, children }) {
  const isSuperAdmin = adminUser?.role === "super_admin";

  const navItem = (tab, label) => (
    <div
      key={tab}
      className={`nav-item ${activeTab === tab ? "active" : ""}`}
      onClick={() => onTabChange(tab)}
    >
      {label}
    </div>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span>💊</span> Medikart Portal
        </div>
        <nav className="sidebar-nav">
          {navItem("overview", "Overview")}
          {navItem("products", "Products")}
          {navItem("categories", "Categories")}
          {navItem("orders", "Orders")}
          {navItem("cities", "Cities")}
          {navItem("settings", "Settings")}
          {navItem("activityLogs", "Activity Logs")}
          {/* Admin Users — UI only shown to Super Admin.
              Backend also enforces this via requireSuperAdmin middleware (Phase 20). */}
          {isSuperAdmin && navItem("adminUsers", "Admin Users")}
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
