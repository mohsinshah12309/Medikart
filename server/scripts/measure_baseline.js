const { performance } = require('perf_hooks');

async function benchmark(name, url, iterations = 5) {
  const times = [];
  let size = 0;
  let status = 0;
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    const end = performance.now();
    times.push(end - start);
    size = buf.byteLength;
    status = res.status;
  }
  const min = Math.min(...times).toFixed(1);
  const max = Math.max(...times).toFixed(1);
  const avg = (times.reduce((a,b)=>a+b,0)/times.length).toFixed(1);
  const firstMs = times[0].toFixed(1);
  return { name, status, size: (size/1024).toFixed(1) + ' KB', firstMs, avgMs: avg, minMs: min };
}

(async () => {
  const sampleProductRes = await fetch('http://localhost:5000/api/v1/products?limit=1');
  const sampleProductBody = await sampleProductRes.json();
  const prodId = sampleProductBody.data.products[0]._id;

  const targets = [
    ['API Products List (24)', 'http://localhost:5000/api/v1/products?limit=24'],
    ['API Product Detail', `http://localhost:5000/api/v1/products/${prodId}`],
    ['API Categories', 'http://localhost:5000/api/v1/categories'],
    ['API Search Suggestion (panadol)', 'http://localhost:5000/api/v1/search/suggestions?q=panadol'],
    ['API Related Products', `http://localhost:5000/api/v1/products/${prodId}/related`],
    ['Next.js Homepage (SSR)', 'http://localhost:3000/'],
    ['Next.js Product Detail', `http://localhost:3000/products/${prodId}`],
    ['Next.js FAQs', 'http://localhost:3000/faqs'],
    ['Next.js Blogs', 'http://localhost:3000/blogs'],
    ['Next.js About', 'http://localhost:3000/about'],
    ['Next.js Sitemap', 'http://localhost:3000/sitemap.xml']
  ];

  console.log('=== Medikart Performance Baseline Run ===');
  const results = [];
  for (const [name, url] of targets) {
    try {
      const res = await benchmark(name, url, 5);
      results.push(res);
    } catch (e) {
      results.push({ name, status: 'ERR', size: '0', firstMs: 'ERR', avgMs: e.message, minMs: 'ERR' });
    }
  }
  console.table(results);
})();
