export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/cart',
        '/checkout',
        '/order-confirmation',
        '/admin-adjacent',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
