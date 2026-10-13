"use client";

import { useEffect } from "react";

/**
 * Google Customer Reviews / Google Merchant Center Store Rating Badge
 * Merchant ID: 5872982532
 * Displays verified store rating and reviews from Google Merchant Center.
 */
export default function GoogleMerchantBadge() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initMerchantWidget = () => {
      if (window.merchantwidget && typeof window.merchantwidget.start === "function") {
        try {
          window.merchantwidget.start({
            merchant_id: 5872982532,
            position: "LEFT_BOTTOM",
            region: "PK",
          });
        } catch (err) {
          console.debug("Google Merchant Widget init warning:", err);
        }
      }
    };

    let script = document.getElementById("merchantWidgetScript");
    if (!script) {
      script = document.createElement("script");
      script.id = "merchantWidgetScript";
      script.src = "https://www.gstatic.com/shopping/merchant/merchantwidget.js";
      script.defer = true;
      script.addEventListener("load", initMerchantWidget);
      document.body.appendChild(script);
    } else if (window.merchantwidget) {
      initMerchantWidget();
    } else {
      script.addEventListener("load", initMerchantWidget);
    }
  }, []);

  return null;
}
