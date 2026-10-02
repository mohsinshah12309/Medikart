async function check() {
  try {
    const res = await fetch("http://localhost:5000/api/v1/blogs/2-years-baby-food-chart-toddler-meals-portions");
    const json = await res.json();
    console.log("Status:", json.status);
    console.log("faqSchema:", JSON.stringify(json.data?.blog?.faqSchema, null, 2));
    console.log("faqSchema is Array:", Array.isArray(json.data?.blog?.faqSchema));
    if (json.data?.blog?.faqSchema?.length > 0) {
      console.log("First faq item:", json.data.blog.faqSchema[0]);
      console.log("First faq item keys:", Object.keys(json.data.blog.faqSchema[0]));
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}
check();
