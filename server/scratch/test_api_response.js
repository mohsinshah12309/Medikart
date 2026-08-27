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
  console.log("Login Status:", loginRes.status);
  console.log("Token received:", !!token);
  
  if (!token) {
    console.error("Login failed:", loginBody);
    return;
  }
  
  const productsRes = await fetch("http://localhost:5000/api/v1/admin/products?limit=1", {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const productsBody = await productsRes.json();
  console.log("API Status:", productsRes.status);
  console.log("Response Body:", JSON.stringify(productsBody, null, 2));
}

run().catch(console.error);
