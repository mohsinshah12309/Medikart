import { cache } from 'react';

const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || 'https://medikart.pk';
const FALLBACK_PUBLIC_URL = `${SITE_ORIGIN}/api/v1`;
const PRIMARY_INTERNAL_URL = (process.env.INTERNAL_API_URL || 'http://127.0.0.1:5000/api/v1').replace('localhost', '127.0.0.1');

const API_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || '/api/v1')
  : PRIMARY_INTERNAL_URL;

export async function fetchApi(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const signal = options.signal || (typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined);
  let res;
  try {
    res = await fetch(url, {
      ...options,
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch (err) {
    // If SSR internal fetch failed (e.g. ECONNREFUSED or port mismatch), retry with public production URL
    if (typeof window === 'undefined' && API_URL !== FALLBACK_PUBLIC_URL) {
      try {
        res = await fetch(`${FALLBACK_PUBLIC_URL}${endpoint}`, {
          ...options,
          signal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });
      } catch (fallbackErr) {
        if (err.name === 'TimeoutError' || err.name === 'AbortError') {
          throw new Error('Request timed out. Please check your internet connection and try again.');
        }
        throw fallbackErr;
      }
    } else {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        throw new Error('Request timed out. Please check your internet connection and try again.');
      }
      throw err;
    }
  }

  if (!res.ok) {
    let errorMsg = `API request failed with status ${res.status}`;
    let details = null;
    try {
      const errBody = await res.json();
      errorMsg = errBody.message || errBody.error || errorMsg;
      details = errBody.details || errBody.errors || null;
    } catch (_) {}
    const error = new Error(errorMsg);
    error.details = details;
    error.status = res.status;
    throw error;
  }

  return res.json();
}

export async function getProducts(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.categoryId) query.append('categoryId', params.categoryId);
  if (params.brand) query.append('brand', params.brand);
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);

  return fetchApi(`/products?${query.toString()}`, {
    next: { revalidate: 300, tags: ['products'] },
  });
}

// React.cache deduplicates getProduct across generateMetadata and ProductDetailPage
export const getProduct = cache(async (id) => {
  return fetchApi(`/products/${id}`, {
    next: { revalidate: 3600, tags: [`product-${id}`, 'products'] },
  });
});

export async function getCategories() {
  return fetchApi('/categories', { next: { revalidate: 3600, tags: ['categories'] } });
}

export const getCategory = cache(async (slug) => {
  return fetchApi(`/categories/${slug}`, {
    next: { revalidate: 3600, tags: [`category-${slug}`, 'categories'] },
  });
});

export async function getDeliveryCharge(city) {
  return fetchApi(`/delivery-charge?city=${encodeURIComponent(city)}`, { cache: 'no-store' });
}

export async function requestOtp(email, overrideSuggestion = false) {
  return fetchApi('/otp/request', {
    method: 'POST',
    body: JSON.stringify({ email, overrideSuggestion }),
  });
}

export async function verifyOtp(email, code) {
  return fetchApi('/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export async function placeStandardOrder(payload) {
  return fetchApi('/orders/standard', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getCities() {
  return fetchApi('/cities', { next: { revalidate: 3600, tags: ['cities'] } });
}

export async function getContent() {
  return fetchApi('/content', { next: { revalidate: 3600, tags: ['content'] } });
}

export async function getMedicinesByLetter(letter, params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  const qStr = query.toString();
  return fetchApi(`/medicines-a-z/${encodeURIComponent(letter)}${qStr ? `?${qStr}` : ''}`, {
    next: { revalidate: 3600, tags: [`medicines-a-z-${letter}`, 'medicines-a-z'] },
  });
}

export async function getBrands() {
  return fetchApi('/brands', {
    next: { revalidate: 3600, tags: ['brands'] },
  });
}

export const getBrand = cache(async (slug, params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  const qStr = query.toString();
  return fetchApi(`/brands/${encodeURIComponent(slug)}${qStr ? `?${qStr}` : ''}`, {
    next: { revalidate: 3600, tags: [`brand-${slug}`, 'brands'] },
  });
});

export const getProductContextualLinks = cache(async (idOrSlug) => {
  return fetchApi(`/products/${encodeURIComponent(idOrSlug)}/contextual-links`, {
    next: { revalidate: 3600, tags: [`contextual-${idOrSlug}`, 'products'] },
  });
});

async function postFormData(endpoint, formData) {
  const url = `${API_URL}${endpoint}`;
  const signal = typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(30000) : undefined; // 30s for file uploads
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
    signal,
  });
  if (!res.ok) {
    let errorMsg = `API request failed with status ${res.status}`;
    try {
      const errBody = await res.json();
      errorMsg = errBody.message || errBody.error || errorMsg;
    } catch (_) {}
    throw new Error(errorMsg);
  }
  return res.json();
}

export async function placeInstantOrder(formData) {
  return postFormData('/orders/instant', formData);
}

export async function placeNarcoticsOrder(formData) {
  return postFormData('/orders/narcotics', formData);
}

export async function initiatePayment(orderId) {
  return fetchApi(`/orders/${orderId}/payment/initiate`, {
    method: 'POST',
  });
}

export async function sendChatbotMessage(symptoms, conversationId) {
  const signal = typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(30000) : undefined;
  return fetchApi('/chatbot', {
    method: 'POST',
    signal,
    body: JSON.stringify({ symptoms, conversationId }),
  });
}

export async function sendContactMessage(payload) {
  return fetchApi('/contact-messages', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getBanners(placement) {
  const query = placement ? `?placement=${placement}` : '';
  return fetchApi(`/banners${query}`, { next: { revalidate: 3600, tags: ['banners'] } });
}

export async function getConditions() {
  return fetchApi('/conditions', { next: { revalidate: 3600, tags: ['conditions'] } });
}

// ─── Cart API ───────────────────────────────────────────────────────────────
export async function getCartApi(token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return fetchApi('/cart', {
    headers,
    credentials: 'include',
    cache: 'no-store',
  });
}

export async function addToCartApi(productId, quantity = 1, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return fetchApi('/cart/items', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ productId, quantity }),
  });
}

export async function updateCartItemApi(productId, quantity, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return fetchApi(`/cart/items/${productId}`, {
    method: 'PATCH',
    headers,
    credentials: 'include',
    body: JSON.stringify({ quantity }),
  });
}

export async function removeCartItemApi(productId, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return fetchApi(`/cart/items/${productId}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });
}

export async function clearCartApi(token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return fetchApi('/cart', {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });
}

export async function mergeCartApi(token) {
  if (!token) return;
  return fetchApi('/cart/merge', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
    body: JSON.stringify({}),
  });
}

