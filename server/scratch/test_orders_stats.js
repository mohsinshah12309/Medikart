const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function run() {
  const loginRes = await fetch("http://localhost:5000/api/v1/auth/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@medikart.pk", password: "medikart@admin123" })
  });
  
  const loginBody = await loginRes.json();
  const token = loginBody.data?.token;
  
  if (!token) {
    console.error("Login failed:", loginBody);
    return;
  }

  // Check orders stats endpoint
  const statsRes = await fetch("http://localhost:5000/api/v1/admin/orders/stats", {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const statsBody = await statsRes.json();
  console.log("Orders Stats Status:", statsRes.status);
  console.log("Orders Stats Response:", JSON.stringify(statsBody, null, 2));
}

run().catch(console.error);
