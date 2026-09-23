"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const PwaInstallContext = createContext({
  isInstallable: false,
  isInstalled: false,
  isIOS: false,
  showInstallModal: false,
  setShowInstallModal: () => {},
  triggerInstall: () => {},
});

export function PwaInstallProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker for PWA
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          if (process.env.NODE_ENV !== "production") {
            console.log("[PWA] Service worker registered with scope:", reg.scope);
          }
        })
        .catch((err) => {
          if (process.env.NODE_ENV !== "production") {
            console.warn("[PWA] Service worker registration failed:", err);
          }
        });
    }

    // 2. Check if already running in standalone mode (installed PWA)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true ||
        document.referrer.includes("android-app://");
      setIsInstalled(isStandaloneMode);
    };
    checkStandalone();

    // 3. Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 4. Listen for beforeinstallprompt event (Android / Chromium)
    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser default mini-infobar
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // 5. Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallModal(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    // Case 1: Browser native deferred prompt is available
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error("[PWA] Install prompt error:", err);
        setShowInstallModal(true);
      }
      return;
    }

    // Case 2: iOS device or no deferred prompt yet (show instruction sheet)
    setShowInstallModal(true);
  };

  return (
    <PwaInstallContext.Provider
      value={{
        isInstallable: !!deferredPrompt || isIOS,
        isInstalled,
        isIOS,
        showInstallModal,
        setShowInstallModal,
        triggerInstall,
      }}
    >
      {children}
    </PwaInstallContext.Provider>
  );
}

export function usePwaInstall() {
  return useContext(PwaInstallContext);
}
