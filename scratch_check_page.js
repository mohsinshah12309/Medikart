async function check() {
  try {
    const res = await fetch("http://localhost:3000/blogs/2-years-baby-food-chart-toddler-meals-portions");
    const html = await res.text();
    console.log("Status:", res.status);
    console.log("Has error text:", html.includes("Something Went Wrong"));
    if (html.includes("Something Went Wrong")) {
      const idx = html.indexOf("Developer Debug Details");
      console.log("Snippet around error:", html.slice(idx, idx + 600));
    } else {
      console.log("Success! HTML length:", html.length);
      console.log("Includes title:", html.includes("2 Years Baby Food Chart"));
    }
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}
check();
