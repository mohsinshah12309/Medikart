export const revalidate = 3600;

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://medikart.pk';
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api/v1';

  let products = [];
  try {
    const res = await fetch(`${apiUrl}/sitemap/products`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      products = data?.data?.products || [];
    }
  } catch (err) {
    console.error('Failed to fetch products for merchant feed:', err.message);
  }

  const escapeXml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Medikart Online Pharmacy Pakistan Product Feed</title>
    <link>${baseUrl}</link>
    <description>100% Genuine DRAP-registered prescription medicines and healthcare items delivered across Pakistan.</description>
`;

  for (const prod of products) {
    const id = prod.sku || prod._id;
    const name = prod.name || 'Healthcare Product';
    const link = `${baseUrl}/products/${prod.slug || prod._id}`;
    const img = prod.coverImage
      ? (prod.coverImage.startsWith('http') ? prod.coverImage : `${baseUrl}${prod.coverImage}`)
      : `${baseUrl}/icon-512.png`;
    const price = typeof prod.price === 'number' ? prod.price.toFixed(2) : '0.00';

    xml += `    <item>
      <g:id>${escapeXml(id)}</g:id>
      <g:title>${escapeXml(name)}</g:title>
      <g:description>Buy authentic ${escapeXml(name)} online in Pakistan on Medikart with Cash on Delivery (COD).</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(img)}</g:image_link>
      <g:availability>${prod.stockStatus === 'out_of_stock' ? 'out_of_stock' : 'in_stock'}</g:availability>
      <g:price>${price} PKR</g:price>
      <g:brand>${escapeXml(prod.manufacturer || 'Medikart')}</g:brand>
      <g:condition>new</g:condition>
      <g:google_product_category>Health &amp; Beauty &gt; Health Care &gt; Medicine &amp; Drugs</g:google_product_category>
      <g:shipping>
        <g:country>PK</g:country>
        <g:service>Standard Delivery</g:service>
        <g:price>0.00 PKR</g:price>
      </g:shipping>
    </item>
`;
  }

  xml += `  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  });
}
