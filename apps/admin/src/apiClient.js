// Centralized Authenticated Fetch Wrapper with Global Session Expiration Interception
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

// Custom event to notify App.jsx when session expires
export const SESSION_EXPIRED_EVENT = "medikart_admin_session_expired";

export function notifySessionExpired(message = "Your session has expired. Please sign in again.") {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { message } }));
}

export async function adminFetch(endpoint, options = {}) {
  const token = localStorage.getItem("admin_token");
  const fullUrl = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // If body is FormData, delete Content-Type so browser sets boundary
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  let res;
  try {
    res = await fetch(fullUrl, {
      ...options,
      headers,
    });
  } catch (netErr) {
    throw new Error("Unable to connect to backend server. Please check your network connection.");
  }

  // Handle 401 Unauthorized globally
  if (res.status === 401) {
    let errMsg = "Session expired. Please log in again.";
    try {
      const data = await res.json();
      errMsg = data.message || errMsg;
    } catch (_) {}
    notifySessionExpired(errMsg);
    throw new Error(errMsg);
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }

  return data;
}
