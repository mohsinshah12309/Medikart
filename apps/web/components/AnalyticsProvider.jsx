"use client";

import React, { useEffect, useState, Suspense } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { isAnalyticsAllowed, trackPageView } from '../lib/analytics';

function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(isAnalyticsAllowed());

    const handleConsentUpdate = () => {
      setAllowed(isAnalyticsAllowed());
    };

    window.addEventListener('medikart_cookie_consent_updated', handleConsentUpdate);
    return () => {
      window.removeEventListener('medikart_cookie_consent_updated', handleConsentUpdate);
    };
  }, []);

  useEffect(() => {
    if (allowed) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      trackPageView(url);
    }
  }, [pathname, searchParams, allowed]);

  return null;
}

export default function AnalyticsProvider() {
  const [allowed, setAllowed] = useState(false);
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const isValidGaId = gaId && typeof gaId === 'string' && gaId.startsWith('G-') && !gaId.includes('XXXXX') && gaId !== 'G-MEDIKARTDEMO';

  useEffect(() => {
    setAllowed(isAnalyticsAllowed());

    const handleConsentUpdate = () => {
      setAllowed(isAnalyticsAllowed());
    };

    window.addEventListener('medikart_cookie_consent_updated', handleConsentUpdate);
    return () => {
      window.removeEventListener('medikart_cookie_consent_updated', handleConsentUpdate);
    };
  }, []);

  return (
    <>
      {allowed && isValidGaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', {
                page_path: window.location.pathname,
                anonymize_ip: true
              });
            `}
          </Script>
        </>
      )}
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
    </>
  );
}

