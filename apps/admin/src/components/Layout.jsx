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
        <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Brand capsule */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: '13px',
            height: '24px',
            borderRadius: '9999px',
            overflow: 'hidden',
            boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ height: '50%', background: 'linear-gradient(to bottom, #2dd4bf, #0d9488)' }} />
            <div style={{ height: '50%', background: 'linear-gradient(to bottom, #34d399, #10b981)' }} />
          </div>
          <span style={{
            fontWeight: 800,
            fontSize: '1.25rem',
            background: 'linear-gradient(to right, #2dd4bf, #10b981)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.025em'
          }}>
            Medikart
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginLeft: '-4px', marginTop: '4px' }}>
            Portal
          </span>
        </div>
        <nav className="sidebar-nav">
          {navItem("overview", "Overview")}
          {navItem("products", "Products")}
          {navItem("categories", "Categories")}
          {navItem("orders", "Orders")}
          {navItem("cities", "Cities")}
          {navItem("settings", "Settings")}
          {navItem("activityLogs", "Activity Logs")}
          {navItem("messages", "Messages")}
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
            <span style={{ fontWeight: 600, color: "#cbd5e1" }}>
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
