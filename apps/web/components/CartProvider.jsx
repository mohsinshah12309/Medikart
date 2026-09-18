"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useCustomer } from "./CustomerProvider";
import {
  getCartApi,
  addToCartApi,
  updateCartItemApi,
  removeCartItemApi,
  clearCartApi,
  mergeCartApi,
} from "../lib/api";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { token, isAuthenticated } = useCustomer();
  const prevTokenRef = useRef(token);

  // Sync cart from server API
  const refreshCart = useCallback(async (authToken = token) => {
    try {
      const res = await getCartApi(authToken);
      if (res && res.data && Array.isArray(res.data.items)) {
        setCart(res.data.items);
        localStorage.setItem("medikart_cart", JSON.stringify(res.data.items));
      }
    } catch (err) {
      console.warn("[CartProvider] Failed to fetch server cart, using local cache:", err.message);
    } finally {
      setIsLoaded(true);
    }
  }, [token]);

  // Initial load: local storage first (instant hydration), then server sync
  useEffect(() => {
    const storedCart = localStorage.getItem("medikart_cart");
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (e) {
        console.error("Failed to parse local cart:", e);
      }
    }
    refreshCart(token);
  }, []);

  // Handle Login / Logout state transitions
  useEffect(() => {
    const prevToken = prevTokenRef.current;
    prevTokenRef.current = token;

    if (!prevToken && token) {
      // User just logged in / registered: merge guest cart into customer account cart
      (async () => {
        try {
          const res = await mergeCartApi(token);
          if (res && res.data && Array.isArray(res.data.items)) {
            setCart(res.data.items);
            localStorage.setItem("medikart_cart", JSON.stringify(res.data.items));
            localStorage.setItem("medikart_cart_sync", Date.now().toString());
          } else {
            refreshCart(token);
          }
        } catch (err) {
          console.error("[CartProvider] Cart merge error:", err);
          refreshCart(token);
        }
      })();
    } else if (prevToken && !token) {
      // User logged out: clear customer cart and initialize fresh guest session
      setCart([]);
      localStorage.removeItem("medikart_cart");
      localStorage.setItem("medikart_cart_sync", Date.now().toString());
      refreshCart(null);
    }
  }, [token, refreshCart]);

  // Cross-tab synchronization via storage event
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "medikart_cart_sync") {
        refreshCart(token);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [token, refreshCart]);

  // Optimistic Add To Cart
  const addToCart = async (product, quantity = 1) => {
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const prodId = product._id || product.productId;

    // 1. Optimistic local update
    setCart((prevCart) => {
      const existing = prevCart.find((item) => (item.productId || item._id) === prodId);
      let updated;
      if (existing) {
        updated = prevCart.map((item) =>
          (item.productId || item._id) === prodId
            ? { ...item, quantity: Math.min(item.quantity + qty, 99) }
            : item
        );
      } else {
        updated = [
          ...prevCart,
          {
            productId: prodId,
            name: product.name,
            price: product.effectivePrice !== undefined ? product.effectivePrice : product.price,
            quantity: qty,
            coverImage: product.coverImage || product.images?.[0] || "",
            isNarcotic: Boolean(product.isNarcotic),
          },
        ];
      }
      localStorage.setItem("medikart_cart", JSON.stringify(updated));
      localStorage.setItem("medikart_cart_sync", Date.now().toString());
      return updated;
    });

    // 2. Server API sync
    try {
      const res = await addToCartApi(prodId, qty, token);
      if (res && res.data && Array.isArray(res.data.items)) {
        setCart(res.data.items);
        localStorage.setItem("medikart_cart", JSON.stringify(res.data.items));
      }
    } catch (err) {
      console.warn("[CartProvider] Server add error, keeping optimistic state:", err.message);
    }
  };

  // Optimistic Update Quantity
  const updateQuantity = async (productId, quantity) => {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty)) return;

    // 1. Optimistic local update
    setCart((prevCart) => {
      let updated;
      if (qty <= 0) {
        updated = prevCart.filter((item) => (item.productId || item._id) !== productId);
      } else {
        updated = prevCart.map((item) =>
          (item.productId || item._id) === productId
            ? { ...item, quantity: Math.min(qty, 99) }
            : item
        );
      }
      localStorage.setItem("medikart_cart", JSON.stringify(updated));
      localStorage.setItem("medikart_cart_sync", Date.now().toString());
      return updated;
    });

    // 2. Server API sync
    try {
      const res = await updateCartItemApi(productId, qty, token);
      if (res && res.data && Array.isArray(res.data.items)) {
        setCart(res.data.items);
        localStorage.setItem("medikart_cart", JSON.stringify(res.data.items));
      }
    } catch (err) {
      console.warn("[CartProvider] Server update error, keeping optimistic state:", err.message);
    }
  };

  // Optimistic Remove From Cart
  const removeFromCart = async (productId) => {
    // 1. Optimistic local update
    setCart((prevCart) => {
      const updated = prevCart.filter((item) => (item.productId || item._id) !== productId);
      localStorage.setItem("medikart_cart", JSON.stringify(updated));
      localStorage.setItem("medikart_cart_sync", Date.now().toString());
      return updated;
    });

    // 2. Server API sync
    try {
      const res = await removeCartItemApi(productId, token);
      if (res && res.data && Array.isArray(res.data.items)) {
        setCart(res.data.items);
        localStorage.setItem("medikart_cart", JSON.stringify(res.data.items));
      }
    } catch (err) {
      console.warn("[CartProvider] Server remove error:", err.message);
    }
  };

  // Optimistic Clear Cart
  const clearCart = async () => {
    setCart([]);
    localStorage.removeItem("medikart_cart");
    localStorage.setItem("medikart_cart_sync", Date.now().toString());

    try {
      await clearCartApi(token);
    } catch (err) {
      console.warn("[CartProvider] Server clear error:", err.message);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
        cartTotal,
        cartCount,
        isLoaded,
        isAuthenticated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
