export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://medikart.pk';
  return {
    rules: [
      {
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
      {
        userAgent: ['GPTBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended', 'CCBot', 'Applebot-Extended'],
        allow: [
          '/',
          '/llms.txt',
          '/blogs',
          '/blogs/*',
          '/products/*',
          '/faqs',
          '/about',
          '/press',
          '/instant-order',
          '/refill',
          '/return-refund-policy',
          '/privacy-policy',
          '/terms-and-conditions',
        ],
        disallow: [
          '/admin/*',
          '/api/*',
          '/cart',
          '/checkout',
          '/order-confirmation/*',
          '/customer/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

