const API_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || '/api/v1')
  : (process.env.INTERNAL_API_URL || 'http://localhost:5000/api/v1');

export async function fetchApi(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const signal = options.signal || (typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined);
  const res = await fetch(url, {
    ...options,
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
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

export async function getProducts(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.categoryId) query.append('categoryId', params.categoryId);
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);

  return fetchApi(`/products?${query.toString()}`, { cache: 'no-store' });
}

export async function getProduct(id) {
  return fetchApi(`/products/${id}`, { cache: 'no-store' });
}

export async function getCategories() {
  return fetchApi('/categories', { next: { revalidate: 60 } });
}

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
  return fetchApi('/cities', { cache: 'no-store' });
}

export async function getContent() {
  return fetchApi('/content', { cache: 'no-store' });
}

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
  return fetchApi('/chatbot', {
    method: 'POST',
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
  return fetchApi(`/banners${query}`, { next: { revalidate: 60 } });
}

export async function getConditions() {
  return fetchApi('/conditions', { next: { revalidate: 60 } });
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

