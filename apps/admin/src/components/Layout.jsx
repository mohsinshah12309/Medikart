import React, { useState } from "react";

/**
 * Layout — Phase 23/24
 * White & Yellow Design System + Responsive Mobile Drawer Navigation
 */
function Layout({ adminUser, onLogout, activeTab, onTabChange, children }) {
  const isSuperAdmin = adminUser?.role === "super_admin";
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleTabClick = (tab) => {
    onTabChange(tab);
    setMobileOpen(false); // Close mobile drawer when an item is selected
  };

  const navItem = (tab, label) => (
    <div
      key={tab}
      className={`nav-item ${activeTab === tab ? "active" : ""}`}
      onClick={() => handleTabClick(tab)}
    >
      {label}
    </div>
  );

  return (
    <div className="app-shell">
      {/* Mobile Drawer Backdrop */}
      <div 
        className={`mobile-sidebar-backdrop ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)} 
        aria-hidden="true"
      />

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          {/* Brand capsule (Vivid Yellow & Dark Slate) */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: '13px',
            height: '24px',
            borderRadius: '9999px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
            border: '1px solid #eab308'
          }}>
            <div style={{ height: '50%', background: '#facc15' }} />
            <div style={{ height: '50%', background: '#0f172a' }} />
          </div>
          <span style={{
            fontWeight: 900,
            fontSize: '1.25rem',
            color: '#0f172a',
            letterSpacing: '-0.025em'
          }}>
            Medikart<span style={{ color: '#eab308' }}>.</span>
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginLeft: '-2px', marginTop: '2px' }}>
            Admin
          </span>

          {/* Mobile drawer close button */}
          <button 
            className="mobile-sidebar-close" 
            onClick={() => setMobileOpen(false)}
            aria-label="Close Sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItem("overview", "📊 Overview")}
          {navItem("products", "💊 Products")}
          {navItem("categories", "📁 Categories")}
          {navItem("orders", "📦 Orders")}
          {navItem("cities", "📍 Cities")}
          {navItem("settings", "⚙️ Settings")}
          {navItem("activityLogs", "📋 Activity Logs")}
          {navItem("messages", "💬 Messages")}
          {/* Admin Users — UI only shown to Super Admin. */}
          {isSuperAdmin && navItem("adminUsers", "👤 Admin Users")}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          {/* Mobile Hamburger Button */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle Navigation Menu"
          >
            ☰
          </button>

          <div className="user-profile">
            <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>
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
