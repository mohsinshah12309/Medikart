export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://medikart.pk';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/admin/*',
        '/api/*',
        '/cart',
        '/checkout',
        '/order-confirmation',
        '/order-confirmation/*',
        '/login',
        '/signup',
        '/forgot-password',
        '/reset-password',
        '/verify-email',
        '/wishlist',
        '/customer/*',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

