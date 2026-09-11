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
        <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Official Medikart Shopping Cart Icon */}
          <div style={{ width: '36px', height: '32px', flexShrink: 0 }}>
            <svg viewBox="0 0 100 90" fill="none" style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="adminCartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F8BA03" />
                  <stop offset="50%" stopColor="#FFCB05" />
                  <stop offset="100%" stopColor="#FED604" />
                </linearGradient>
                <linearGradient id="adminCapsuleY" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F8BA03" />
                  <stop offset="100%" stopColor="#FED604" />
                </linearGradient>
              </defs>
              {/* Motion Streaks */}
              <rect x="6" y="24" width="22" height="7" rx="3.5" fill="#FFCB05" />
              <rect x="0" y="36" width="25" height="7" rx="3.5" fill="#FFCB05" />
              <rect x="8" y="48" width="18" height="6.5" rx="3.25" fill="#FFCB05" />
              {/* Capsule */}
              <g transform="translate(52, 24) rotate(32)">
                <path d="M-7,-18 C-7,-24 7,-24 7,-18 L7,0 L-7,0 Z" fill="url(#adminCapsuleY)" />
                <path d="M-7,0 L7,0 L7,16 C7,22 -7,22 -7,16 Z" fill="#FFFFFF" />
              </g>
              {/* Basket */}
              <path
                d="M 28 20 C 34 20, 36 28, 41 33 C 45 28, 52 24, 60 27 C 66 22, 73 25, 78 31 C 81 35, 80 43, 75 51 C 71 58, 66 64, 46 64 C 32 64, 28 54, 26 44 C 24 35, 18 20, 28 20 Z"
                fill="url(#adminCartGrad)"
              />
              {/* Medical Cross */}
              <rect x="47.5" y="35" width="9" height="20" rx="3.5" fill="#FFFFFF" />
              <rect x="42" y="40.5" width="20" height="9" rx="3.5" fill="#FFFFFF" />
              {/* Wheels */}
              <circle cx="38" cy="74" r="8" fill="#F8BA03" />
              <circle cx="38" cy="74" r="3.5" fill="#FEF3C7" />
              <circle cx="62" cy="74" r="8" fill="#F8BA03" />
              <circle cx="62" cy="74" r="3.5" fill="#FEF3C7" />
            </svg>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{
              fontWeight: 900,
              fontSize: '1.25rem',
              color: '#1E293B',
              letterSpacing: '-0.025em',
              display: 'flex',
              alignItems: 'baseline'
            }}>
              med
              <span style={{ position: 'relative', display: 'inline-block' }}>
                ı
                <svg viewBox="0 0 24 24" style={{ position: 'absolute', top: '-6px', left: '0px', width: '10px', height: '10px' }} fill="#10B981">
                  <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM17.5 9.5C16.5 13.5 13 16.5 9 17.5C8.5 17.5 8 17 8.5 16.5C12.5 12.5 15.5 9 16.5 8C17 7.5 17.5 8 17.5 9.5Z" />
                </svg>
              </span>
              kart
            </span>
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: 800,
              color: '#B45309',
              background: '#FEF3C7',
              padding: '2px 6px',
              borderRadius: '9999px',
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
          {navItem("products", "💊 Products")}
          {navItem("categories", "📁 Categories")}
          {navItem("conditions", "🩺 Conditions")}
          {navItem("banners", "🖼️ Banners")}
          {navItem("orders", "📦 Orders")}
          {navItem("pharmacies", "🏥 Pharmacies")}
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
