"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import RefillToast from "./monthlyRefill/RefillToast";

const CustomerContext = createContext(null);

export function CustomerProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [token, setToken] = useState(null);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  // Fetch wishlist IDs for fast O(1) active state
  const refreshWishlistIds = useCallback(async (authToken) => {
    if (!authToken) {
      setWishlistIds([]);
      setWishlistCount(0);
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/wishlist/ids`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        const ids = json?.data?.ids || [];
        setWishlistIds(ids);
        setWishlistCount(ids.length);
      } else if (res.status === 401) {
        // Token expired/invalid
        logout();
      }
    } catch (err) {
      console.error("[CustomerProvider] Failed to fetch wishlist IDs:", err);
    }
  }, [apiUrl]);

  // Fetch full wishlist with product details
  const refreshWishlist = useCallback(async (authToken = token) => {
    if (!authToken) {
      setWishlistItems([]);
      setWishlistCount(0);
      return;
    }
    setIsWishlistLoading(true);
    try {
      const res = await fetch(`${apiUrl}/wishlist`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        const items = json?.data?.items || [];
        setWishlistItems(items);
        setWishlistCount(items.length);
        setWishlistIds(items.map((i) => i._id));
      }
    } catch (err) {
      console.error("[CustomerProvider] Failed to fetch full wishlist:", err);
    } finally {
      setIsWishlistLoading(false);
    }
  }, [apiUrl, token]);

  // Monthly Refill State
  const [refillData, setRefillData] = useState({
    items: [],
    count: 0,
    subtotal: 0,
    lastOrderedAt: null,
    nextReminderAt: null,
  });
  const [isRefillLoading, setIsRefillLoading] = useState(false);

  // Friendly Refill Popup Toast State
  const [refillToast, setRefillToast] = useState({
    show: false,
    product: null,
    title: "Added to Monthly Refill!",
    message: "Your 30-day recurring refill routine has been updated.",
  });

  const showRefillToast = useCallback(
    ({
      product = null,
      title = "Added to Monthly Refill!",
      message = "Your 30-day recurring refill routine has been updated.",
    } = {}) => {
      setRefillToast({
        show: true,
        product,
        title,
        message,
      });
    },
    []
  );

  const hideRefillToast = useCallback(() => {
    setRefillToast((prev) => ({ ...prev, show: false }));
  }, []);

  // Fetch customer's full Monthly Refill list
  const refreshRefill = useCallback(async (authToken = token) => {
    if (!authToken) {
      setRefillData({ items: [], count: 0, subtotal: 0, lastOrderedAt: null, nextReminderAt: null });
      return;
    }
    setIsRefillLoading(true);
    try {
      const res = await fetch(`${apiUrl}/customer/monthly-refill`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        const data = json?.data || { items: [], count: 0, subtotal: 0 };
        setRefillData(data);
      }
    } catch (err) {
      console.error("[CustomerProvider] Failed to fetch monthly refill list:", err);
    } finally {
      setIsRefillLoading(false);
    }
  }, [apiUrl, token]);

  // Initial token hydration from sessionStorage (strictly session-scoped, not persistent localStorage)
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        // Clear any legacy persistent storage for security
        localStorage.removeItem("customer_token");
        localStorage.removeItem("customer_user");

        const storedToken = sessionStorage.getItem("customer_token");
        const storedCustomer = sessionStorage.getItem("customer_user");

        if (storedToken && storedCustomer) {
          setToken(storedToken);
          setCustomer(JSON.parse(storedCustomer));
          refreshWishlistIds(storedToken);
          refreshRefill(storedToken);
        }
      }
    } catch (e) {
      console.error("[CustomerProvider] Failed to hydrate customer auth:", e);
    } finally {
      setIsLoading(false);
    }
  }, [refreshWishlistIds, refreshRefill]);

  // Auth Functions
  const setSession = (tokenData, customerData) => {
    setToken(tokenData);
    setCustomer(customerData);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("customer_token", tokenData);
      sessionStorage.setItem("customer_user", JSON.stringify(customerData));
      // Ensure localStorage has no lingering auth tokens
      localStorage.removeItem("customer_token");
      localStorage.removeItem("customer_user");
    }
    refreshWishlistIds(tokenData);
    refreshRefill(tokenData);
  };

  const logout = () => {
    setToken(null);
    setCustomer(null);
    setWishlistIds([]);
    setWishlistItems([]);
    setWishlistCount(0);
    setRefillData({ items: [], count: 0, subtotal: 0, lastOrderedAt: null, nextReminderAt: null });
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("customer_token");
      sessionStorage.removeItem("customer_user");
      localStorage.removeItem("customer_token");
      localStorage.removeItem("customer_user");
    }
  };

  const parseAuthError = (data, defaultMessage) => {
    let msg = defaultMessage;
    if (data?.details && Array.isArray(data.details) && data.details.length > 0) {
      msg = data.details.map((d) => d.message).join(". ");
    } else if (data?.message) {
      msg = data.message;
    }
    const err = new Error(msg);
    if (data?.code) err.code = data.code;
    if (data?.details) err.details = data.details;
    return err;
  };

  const login = async (email, password) => {
    const res = await fetch(`${apiUrl}/auth/customer/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw parseAuthError(data, "Invalid email or password");
    }
    setSession(data.token, data.customer);
    return data;
  };

  const signup = async (formData) => {
    const res = await fetch(`${apiUrl}/auth/customer/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw parseAuthError(data, "Registration failed. Please verify your details.");
    }
    return data;
  };

  const verifyEmail = async (email, code) => {
    const res = await fetch(`${apiUrl}/auth/customer/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw parseAuthError(data, "Verification failed. Code may be invalid or expired.");
    }
    setSession(data.token, data.customer);
    return data;
  };

  const resendVerification = async (email, overrideSuggestion = false) => {
    const res = await fetch(`${apiUrl}/auth/customer/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, overrideSuggestion }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw parseAuthError(data, "Failed to resend verification code.");
    }
    return data;
  };

  const forgotPassword = async (email) => {
    const res = await fetch(`${apiUrl}/auth/customer/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw parseAuthError(data, "Failed to submit password reset request.");
    }
    return data;
  };

  const resetPassword = async (resetToken, password) => {
    const res = await fetch(`${apiUrl}/auth/customer/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetToken, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw parseAuthError(data, "Failed to reset password. Link may be invalid or expired.");
    }
    return data;
  };

  // Wishlist Functions
  const isWishlisted = useCallback((productId) => {
    return wishlistIds.includes(productId);
  }, [wishlistIds]);

  const toggleWishlist = async (productId) => {
    if (!token) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return false;
    }

    const currentlyWishlisted = isWishlisted(productId);

    // Optimistic UI update
    if (currentlyWishlisted) {
      setWishlistIds((prev) => prev.filter((id) => id !== productId));
      setWishlistItems((prev) => prev.filter((item) => item._id !== productId));
      setWishlistCount((prev) => Math.max(0, prev - 1));
    } else {
      setWishlistIds((prev) => [...prev, productId]);
      setWishlistCount((prev) => prev + 1);
    }

    try {
      const method = currentlyWishlisted ? "DELETE" : "POST";
      const res = await fetch(`${apiUrl}/wishlist/${productId}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        // Rollback on failure
        refreshWishlistIds(token);
        return false;
      }
      return !currentlyWishlisted;
    } catch (err) {
      console.error("[CustomerProvider] Wishlist toggle failed:", err);
      refreshWishlistIds(token);
      return false;
    }
  };

  // Check if product is in refill list
  const isRefillSaved = useCallback((productId) => {
    if (!refillData?.items || !productId) return false;
    const targetId = String(productId?._id || productId);
    return refillData.items.some(
      (it) =>
        String(it.productId) === targetId ||
        String(it.productId?._id) === targetId ||
        String(it._id) === targetId
    );
  }, [refillData]);

  // Add item to monthly refill
  const addToRefill = async (productId, quantity = 1, productObj = null) => {
    if (!token) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return false;
    }

    try {
      const res = await fetch(`${apiUrl}/customer/monthly-refill`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity }),
      });

      if (res.ok) {
        const json = await res.json();
        setRefillData(json?.data || refillData);
        showRefillToast({
          product: productObj || { _id: productId },
          title: "Added to Monthly Refill!",
          message: productObj?.name
            ? `${productObj.name} saved to your 30-day recurring routine.`
            : "Medicine added to your 30-day recurring routine.",
        });
        return true;
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || "Failed to add product to refill list");
    } catch (err) {
      console.error("[CustomerProvider] Add to refill error:", err);
      throw err;
    }
  };

  // Update item quantity in monthly refill
  const updateRefillQuantity = async (itemId, quantity) => {
    if (!token) return false;
    // Optimistic update
    const previous = { ...refillData };
    setRefillData((prev) => {
      const updatedItems = prev.items.map((it) => {
        if (it._id === itemId) {
          const itemSubtotal = Math.round(it.effectivePrice * quantity * 100) / 100;
          return { ...it, quantity, subtotal: itemSubtotal };
        }
        return it;
      });
      const newSubtotal = Math.round(
        updatedItems.reduce((acc, it) => acc + it.subtotal, 0) * 100
      ) / 100;
      return { ...prev, items: updatedItems, subtotal: newSubtotal };
    });

    try {
      const res = await fetch(`${apiUrl}/customer/monthly-refill/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      });

      if (!res.ok) {
        // Rollback
        setRefillData(previous);
        return false;
      }
      const json = await res.json();
      setRefillData(json?.data || previous);
      return true;
    } catch (err) {
      setRefillData(previous);
      throw err;
    }
  };

  // Remove item from monthly refill
  const removeFromRefill = async (itemId) => {
    if (!token) return false;
    const previous = { ...refillData };
    setRefillData((prev) => {
      const updatedItems = prev.items.filter((it) => it._id !== itemId);
      const newSubtotal = Math.round(
        updatedItems.reduce((acc, it) => acc + it.subtotal, 0) * 100
      ) / 100;
      return {
        ...prev,
        items: updatedItems,
        count: updatedItems.length,
        subtotal: newSubtotal,
      };
    });

    try {
      const res = await fetch(`${apiUrl}/customer/monthly-refill/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setRefillData(previous);
        return false;
      }
      const json = await res.json();
      setRefillData(json?.data || previous);
      return true;
    } catch (err) {
      setRefillData(previous);
      throw err;
    }
  };

  // Clear entire refill list
  const clearRefill = async () => {
    if (!token) return false;
    const previous = { ...refillData };
    setRefillData({ ...refillData, items: [], count: 0, subtotal: 0 });

    try {
      const res = await fetch(`${apiUrl}/customer/monthly-refill`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setRefillData(previous);
        return false;
      }
      return true;
    } catch (err) {
      setRefillData(previous);
      throw err;
    }
  };

  return (
    <CustomerContext.Provider
      value={{
        customer,
        token,
        isAuthenticated: Boolean(token && customer),
        isLoading,
        login,
        signup,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        logout,
        wishlistIds,
        wishlistItems,
        wishlistCount,
        isWishlistLoading,
        isWishlisted,
        toggleWishlist,
        refreshWishlist,
        refillData,
        refillItems: refillData.items || [],
        refillCount: refillData.count || 0,
        refillSubtotal: refillData.subtotal || 0,
        isRefillLoading,
        refreshRefill,
        isRefillSaved,
        addToRefill,
        updateRefillQuantity,
        removeFromRefill,
        clearRefill,
        showRefillToast,
        hideRefillToast,
      }}
    >
      {children}
      <RefillToast
        show={refillToast.show}
        product={refillToast.product}
        title={refillToast.title}
        message={refillToast.message}
        onClose={hideRefillToast}
      />
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error("useCustomer must be used within a CustomerProvider");
  }
  return context;
}
