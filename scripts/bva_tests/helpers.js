const BASE_URL = process.env.TEST_API_URL || "http://localhost:5000/api/v1";
const HEALTH_URL = "http://localhost:5000/health";

const results = [];

async function checkServerAlive() {
  try {
    const res = await fetch(HEALTH_URL, {
      headers: { "User-Agent": "Mozilla/5.0 MedikartQA/1.0" }
    });
    if (!res.ok) return false;
    const body = await res.json();
    return body.status === "ok" && body.database === "connected";
  } catch (err) {
    return false;
  }
}

async function getAdminToken() {
  const res = await fetch(`${BASE_URL}/auth/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 MedikartQA/1.0"
    },
    body: JSON.stringify({
      email: "admin@medikart.pk",
      password: "medikart@admin123"
    })
  });
  const data = await res.json();
  if (data.status !== "success" || !data.data?.token) {
    throw new Error(`Admin login failed: ${JSON.stringify(data)}`);
  }
  return data.data.token;
}

async function apiRequest(endpoint, { method = "GET", headers = {}, body = null } = {}) {
  const defaultHeaders = {
    "User-Agent": "Mozilla/5.0 MedikartQA/1.0",
    ...headers
  };
  if (body && typeof body === "object" && !(body instanceof FormData) && !(body instanceof Buffer)) {
    if (!defaultHeaders["Content-Type"]) {
      defaultHeaders["Content-Type"] = "application/json";
    }
    body = JSON.stringify(body);
  }

  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      method,
      headers: defaultHeaders,
      body: body || undefined
    });
    let data = null;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch (_) {
      data = text;
    }
    return { status: res.status, ok: res.ok, data, rawText: text };
  } catch (err) {
    return { status: 0, ok: false, error: err.message, crashed: true };
  }
}

function recordResult({ category, testId, description, status, details, responseStatus, expected, actual }) {
  const item = {
    category,
    testId,
    description,
    status, // "PASS" | "FAIL — CRASHED" | "FAIL — INCORRECT BEHAVIOR"
    responseStatus,
    expected,
    actual,
    details: details || ""
  };
  results.push(item);
  const color = status === "PASS" ? "\x1b[32m" : status.includes("CRASHED") ? "\x1b[41m\x1b[37m" : "\x1b[31m";
  console.log(`${color}[${status}]\x1b[0m ${category} > ${testId}: ${description} (HTTP ${responseStatus || 'N/A'})`);
  if (status !== "PASS") {
    console.log(`   Expected: ${expected}`);
    console.log(`   Actual:   ${actual}`);
    if (details) console.log(`   Details:  ${details}`);
  }
}

module.exports = {
  BASE_URL,
  HEALTH_URL,
  checkServerAlive,
  getAdminToken,
  apiRequest,
  recordResult,
  results
};
