import React, { useState } from "react";

/**
 * Layout — Phase 23/24
 * White & Yellow Design System + Responsive Mobile Drawer Navigation
 */
function Layout({ adminUser, onLogout, activeTab, onTabChange, children }) {
  const isSuperAdmin = adminUser?.role === "super_admin";
  const userPerms = Array.isArray(adminUser?.permissions) ? adminUser.permissions : [];
  const canAccess = (...perms) => isSuperAdmin || perms.some((p) => userPerms.includes(p));
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
        <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img 
              src="/logo.png" 
              alt="Medikart Logo" 
              style={{ height: '38px', width: 'auto', objectFit: 'contain' }} 
            />
            <span style={{
              fontSize: '10px',
              background: '#FEF08A',
              color: '#854D0E',
              fontWeight: 800,
              padding: '2px 6px',
              border: '1px solid #FDE68A',
              marginLeft: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Admin
            </span>
          </div>

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
          {canAccess("view_products", "manage_products") && navItem("products", "💊 Products")}
          {canAccess("view_categories", "manage_categories") && navItem("categories", "📁 Categories")}
          {canAccess("view_conditions", "manage_conditions") && navItem("conditions", "🩺 Conditions")}
          {canAccess("view_banners", "manage_banners") && navItem("banners", "🖼️ Banners")}
          {canAccess("view_blogs", "manage_blogs", "view_products") && navItem("blogs", "📰 Blogs")}
          {canAccess("view_orders", "manage_orders") && navItem("orders", "📦 Orders")}
          {(canAccess("view_pharmacies", "manage_pharmacies", "view_orders", "manage_orders") || Boolean(adminUser?.assignedPharmacyId)) && navItem("pharmacies", "🏥 Pharmacies")}
          {canAccess("view_cities", "manage_cities") && navItem("cities", "📍 Cities")}
          {canAccess("view_settings", "manage_settings") && navItem("settings", "⚙️ Settings")}
          {canAccess("view_activity_logs") && navItem("activityLogs", "📋 Activity Logs")}
          {canAccess("view_messages") && navItem("messages", "💬 Messages")}
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
