/**
 * Centralized Google Analytics 4 (GA4) Dispatcher
 * Strictly gated behind cookie consent.
 */

export function getCookieConsent() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('medikart_cookie_consent');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAnalyticsAllowed() {
  const consent = getCookieConsent();
  if (!consent) return false;
  return consent.status === 'accepted' || consent.categories?.analytics === true;
}

export function trackEvent(eventName, eventParams = {}) {
  if (typeof window === 'undefined') return;
  if (!isAnalyticsAllowed()) {
    // Non-essential cookies blocked
    return;
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventParams);
  } else if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({
      event: eventName,
      ...eventParams,
    });
  }
}

// Referrer & Traffic Attribution Helper
export function detectReferrerSource() {
  if (typeof document === 'undefined' || !document.referrer) {
    return { source: 'direct', platform: null };
  }
  const ref = document.referrer.toLowerCase();

  if (ref.includes('chatgpt.com') || ref.includes('chat.openai.com')) {
    return { source: 'ai_search', platform: 'ChatGPT' };
  }
  if (ref.includes('perplexity.ai')) {
    return { source: 'ai_search', platform: 'Perplexity' };
  }
  if (ref.includes('claude.ai') || ref.includes('anthropic.com')) {
    return { source: 'ai_search', platform: 'Claude' };
  }
  if (ref.includes('copilot.microsoft.com') || ref.includes('bing.com/chat')) {
    return { source: 'ai_search', platform: 'Copilot' };
  }
  if (ref.includes('gemini.google.com')) {
    return { source: 'ai_search', platform: 'Gemini' };
  }
  if (ref.includes('google.')) {
    return { source: 'search_engine', platform: 'Google' };
  }
  if (ref.includes('bing.')) {
    return { source: 'search_engine', platform: 'Bing' };
  }
  try {
    return { source: 'referral', platform: new URL(document.referrer).hostname };
  } catch {
    return { source: 'referral', platform: 'external' };
  }
}

// Predefined Key E-Commerce Tracking Handlers
export function trackPageView(url) {
  const refInfo = detectReferrerSource();
  trackEvent('page_view', {
    page_location: url || (typeof window !== 'undefined' ? window.location.href : ''),
    page_title: typeof document !== 'undefined' ? document.title : '',
    referrer_source_type: refInfo.source,
    referrer_platform: refInfo.platform || undefined,
  });

  if (refInfo.source === 'ai_search') {
    trackEvent('ai_search_visit', {
      ai_platform: refInfo.platform,
      landing_page: url || (typeof window !== 'undefined' ? window.location.pathname : ''),
      timestamp: new Date().toISOString(),
    });
  }
}

export function trackAddToCart(product, quantity = 1) {
  if (!product) return;
  trackEvent('add_to_cart', {
    currency: 'PKR',
    value: (product.effectivePrice || product.price || 0) * quantity,
    items: [
      {
        item_id: product._id || product.id,
        item_name: product.name,
        price: product.effectivePrice || product.price || 0,
        quantity,
        item_category: product.categoryIds?.[0]?.name || product.category || 'Medicine',
      },
    ],
  });
}

export function trackBeginCheckout(items = [], totalValue = 0) {
  trackEvent('begin_checkout', {
    currency: 'PKR',
    value: totalValue,
    items: items.map((it) => ({
      item_id: it._id || it.productId || it.id,
      item_name: it.name,
      price: it.price || it.effectivePrice || 0,
      quantity: it.quantity || 1,
    })),
  });
}

export function trackPurchase(order) {
  if (!order) return;
  trackEvent('purchase', {
    transaction_id: order.orderCode || order._id,
    value: order.totals?.total || order.total || 0,
    currency: 'PKR',
    shipping: order.totals?.deliveryCharge || 0,
    payment_type: order.paymentMethod || 'COD',
    items: (order.items || []).map((it) => ({
      item_id: it._id || it.productId,
      item_name: it.name,
      price: it.price || 0,
      quantity: it.quantity || 1,
    })),
  });
}

export function trackAddToRefill(product) {
  if (!product) return;
  trackEvent('add_to_refill', {
    item_id: product._id || product.id,
    item_name: product.name,
    price: product.effectivePrice || product.price || 0,
  });
}

export function trackRefillReorderClick(itemCount, totalValue) {
  trackEvent('refill_reorder_click', {
    item_count: itemCount,
    value: totalValue,
    currency: 'PKR',
  });
}
