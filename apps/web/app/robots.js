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
        userAgent: [
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'PerplexityBot',
          'ClaudeBot',
          'Google-Extended',
          'CCBot',
          'Applebot-Extended',
          'bingbot',
        ],
        allow: [
          '/',
          '/llms.txt',
          '/blogs',
          '/blogs/*',
          '/categories/*',
          '/products/*',
          '/faqs',
          '/about',
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
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap-pages.xml`,
      `${baseUrl}/sitemap-categories.xml`,
      `${baseUrl}/sitemap-brands.xml`,
      `${baseUrl}/sitemap-blogs.xml`,
      `${baseUrl}/sitemap-products-priority.xml`,
      `${baseUrl}/sitemap-products-rest.xml`,
      `${baseUrl}/sitemap.txt`,
    ],
  };
}

