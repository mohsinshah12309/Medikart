import React, { useState, useEffect, lazy, Suspense } from "react";
import Login from "./components/Login";
import Layout from "./components/Layout";
import { SESSION_EXPIRED_EVENT } from "./apiClient";

// Route-level code splitting — each page component loads only when first visited.
// Login and Layout stay eager (always needed on startup).
const Products = lazy(() => import("./components/Products"));
const Overview = lazy(() => import("./components/Overview"));
const Categories = lazy(() => import("./components/Categories"));
const Orders = lazy(() => import("./components/Orders"));
const Cities = lazy(() => import("./components/Cities"));
const Settings = lazy(() => import("./components/Settings"));
const AdminUsers = lazy(() => import("./components/AdminUsers"));
const ActivityLogs = lazy(() => import("./components/ActivityLogs"));
const Messages = lazy(() => import("./components/Messages"));
const Banners = lazy(() => import("./components/Banners"));
const Conditions = lazy(() => import("./components/Conditions"));
const Pharmacies = lazy(() => import("./components/Pharmacies"));
const Blogs = lazy(() => import("./components/Blogs"));

// Shared loading fallback for all lazy-loaded admin sections
const PageLoader = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px", color: "#64748b", fontSize: "0.9rem", gap: "0.5rem" }}>
    <span style={{ display: "inline-block", width: "18px", height: "18px", border: "2px solid #e2e8f0", borderTopColor: "#FFCB05", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    Loading…
  </div>
);

function App() {
  const [token, setToken] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("admin_token") || localStorage.getItem("admin_token") || "";
  });
  const [adminUser, setAdminUser] = useState(() => {
    if (typeof window === "undefined") return null;
    const saved = sessionStorage.getItem("admin_user") || localStorage.getItem("admin_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [initialOrderFilter, setInitialOrderFilter] = useState(null);
  const [initialPharmacyTab, setInitialPharmacyTab] = useState(null);
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState("");

  const handleNavigateToOrders = (filter = null) => {
    setInitialOrderFilter(filter ? { ...filter, _ts: Date.now() } : null);
    setActiveTab("orders");
  };

  const handleNavigateToProducts = () => {
    setActiveTab("products");
  };

  const handleNavigateToPharmacies = (tab = null) => {
    setInitialPharmacyTab(tab ? { tab, _ts: Date.now() } : null);
    setActiveTab("pharmacies");
  };

  // 1. Session expiration listener
  useEffect(() => {
    const handleExpired = (e) => {
      const msg = e?.detail?.message || "Your session has expired. Please sign in again.";
      sessionStorage.removeItem("admin_token");
      sessionStorage.removeItem("admin_user");
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      setToken("");
      setAdminUser(null);
      setActiveTab("overview");
      setInitialOrderFilter(null);
      setInitialPharmacyTab(null);
      setSessionExpiredMsg(msg);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, []);

  // 2. Validate token & fetch fresh live admin permissions on mount or when token changes
  useEffect(() => {
    let isMounted = true;
    if (!token) return;

    const syncAdminProfile = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "/api/v1"}/auth/admin/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!isMounted) return;

        if (res.ok) {
          const data = await res.json();
          if (data?.data?.admin) {
            setAdminUser(data.data.admin);
            sessionStorage.setItem("admin_user", JSON.stringify(data.data.admin));
            localStorage.removeItem("admin_user");
          }
        } else if (res.status === 401) {
          sessionStorage.removeItem("admin_token");
          sessionStorage.removeItem("admin_user");
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          setToken("");
          setAdminUser(null);
          setActiveTab("overview");
        }
      } catch (err) {
        console.warn("Could not sync live admin profile:", err.message);
      }
    };

    syncAdminProfile();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleLogin = (newToken, user) => {
    sessionStorage.setItem("admin_token", newToken);
    sessionStorage.setItem("admin_user", JSON.stringify(user));
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setToken(newToken);
    setAdminUser(user);
    setActiveTab("overview");
    setInitialOrderFilter(null);
    setInitialPharmacyTab(null);
    setSessionExpiredMsg("");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_user");
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setToken("");
    setAdminUser(null);
    setActiveTab("overview");
    setInitialOrderFilter(null);
    setInitialPharmacyTab(null);
    setSessionExpiredMsg("");
  };

  if (!token) {
    return <Login onLoginSuccess={handleLogin} sessionExpiredMessage={sessionExpiredMsg} />;
  }

  const isSuperAdmin = adminUser?.role === "super_admin";
  const userPerms = Array.isArray(adminUser?.permissions) ? adminUser.permissions : [];
  const canAccess = (...perms) => isSuperAdmin || perms.some((p) => userPerms.includes(p));

  const accessDeniedView = (
    <div style={{ padding: "3rem", textAlign: "center", background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
      <span style={{ fontSize: "2.5rem" }}>🔒</span>
      <h3 style={{ margin: "0.75rem 0 0.25rem 0", color: "#0f172a", fontWeight: 800 }}>Access Restricted</h3>
      <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
        You do not have permission to access or manage this module. Please contact the Super Admin for access.
      </p>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <Overview
            token={token}
            adminUser={adminUser}
            onNavigateToOrders={handleNavigateToOrders}
            onNavigateToProducts={handleNavigateToProducts}
            onNavigateToPharmacies={handleNavigateToPharmacies}
          />
        );
      case "products":
        return canAccess("view_products", "manage_products")
          ? <Products token={token} />
          : accessDeniedView;
      case "categories":
        return canAccess("view_categories", "manage_categories")
          ? <Categories token={token} />
          : accessDeniedView;
      case "conditions":
        return canAccess("view_conditions", "manage_conditions")
          ? <Conditions token={token} />
          : accessDeniedView;
      case "banners":
        return canAccess("view_banners", "manage_banners")
          ? <Banners token={token} />
          : accessDeniedView;
      case "blogs":
        return canAccess("view_blogs", "manage_blogs", "view_products")
          ? <Blogs token={token} />
          : accessDeniedView;
      case "orders":
        return canAccess("view_orders", "manage_orders")
          ? <Orders token={token} adminUser={adminUser} initialFilter={initialOrderFilter} />
          : accessDeniedView;
      case "pharmacies":
        return canAccess("view_pharmacies", "manage_pharmacies", "view_orders", "manage_orders") || Boolean(adminUser?.assignedPharmacyId)
          ? <Pharmacies token={token} adminUser={adminUser} initialTab={initialPharmacyTab} onNavigateToOrders={handleNavigateToOrders} />
          : accessDeniedView;
      case "cities":
        return canAccess("view_cities", "manage_cities")
          ? <Cities token={token} />
          : accessDeniedView;
      case "settings":
        return canAccess("view_settings", "manage_settings")
          ? <Settings token={token} />
          : accessDeniedView;
      case "adminUsers":
        return isSuperAdmin
          ? <AdminUsers token={token} adminUser={adminUser} />
          : accessDeniedView;
      case "activityLogs":
        return canAccess("view_activity_logs")
          ? <ActivityLogs token={token} />
          : accessDeniedView;
      case "messages":
        return canAccess("view_messages")
          ? <Messages token={token} />
          : accessDeniedView;
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
      key={`${adminUser?.id || adminUser?._id || "guest"}-${adminUser?.role || "none"}`}
      adminUser={adminUser}
      onLogout={handleLogout}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <Suspense fallback={<PageLoader />}>
        {renderContent()}
      </Suspense>
    </Layout>
  );
}

export default App;
