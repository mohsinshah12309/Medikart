const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export async function fetchApi(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
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

export async function requestOtp(email) {
  return fetchApi('/otp/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
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
