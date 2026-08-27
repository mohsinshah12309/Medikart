import React from 'react';
import './globals.css';
import { CartProvider } from '../components/CartProvider';
import Link from 'next/link';
import NavbarCartIcon from '../components/NavbarCartIcon';
import ChatbotWidget from '../components/ChatbotWidget';

export const metadata = {
  title: 'Medikart - Authentic Online Pharmacy',
  description: 'Your trusted healthcare partner. Order authentic medicines online with Cash on Delivery.',
};

export default async function RootLayout({ children }) {
  // Fetch settings content to get contact and about details dynamically
  let contactPhone = '923001234567';
  let contactEmail = 'support@medikart.pk';
  let aboutText = 'Medikart is Pakistan\'s leading online pharmacy.';
  try {
    const res = await fetch('http://127.0.0.1:5000/api/v1/content', { cache: 'no-store' });
    if (res.ok) {
      const body = await res.json();
      if (body?.data) {
        if (body.data.contactPhone) contactPhone = body.data.contactPhone;
        if (body.data.contactEmail) contactEmail = body.data.contactEmail;
        if (body.data.aboutText) aboutText = body.data.aboutText;
      }
    }
  } catch (err) {
    console.error("Failed to fetch contact details for layout:", err);
  }

  const cleanPhone = contactPhone.replace(/[^0-9]/g, '');

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Medikart',
    'url': 'http://localhost:3000',
    'logo': 'http://localhost:3000/uploads/placeholder.webp',
    'contactPoint': {
      '@type': 'ContactPoint',
      'telephone': contactPhone,
      'contactType': 'customer service'
    }
  };

  const businessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    'name': 'Medikart',
    'description': aboutText,
    'telephone': contactPhone,
    'email': contactEmail,
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': 'Lahore',
      'addressCountry': 'PK'
    }
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#fafafa] text-gray-900 tech-grid relative overflow-x-hidden font-sans">
        <CartProvider>
          {/* Glassmorphic Navigation Bar */}
          <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-gray-200/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-2.5 group">
                  <span className="text-3xl transition-transform group-hover:rotate-12 duration-300">💊</span>
                  <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-teal-600 via-teal-500 to-indigo-600 bg-clip-text text-transparent">
                    Medikart
                  </span>
                </Link>
                <nav className="hidden md:flex items-center gap-6">
                  <Link href="/" className="text-sm font-semibold text-gray-600 hover:text-teal-600 transition-colors relative after:content-[''] after:absolute after:bottom-[-20px] after:left-0 after:w-0 after:h-[2px] after:bg-teal-500 hover:after:w-full after:transition-all">
                    Home
                  </Link>
                  <Link href="/instant-order" className="text-sm font-semibold text-gray-600 hover:text-teal-600 transition-colors relative after:content-[''] after:absolute after:bottom-[-20px] after:left-0 after:w-0 after:h-[2px] after:bg-teal-500 hover:after:w-full after:transition-all">
                    Instant Order
                  </Link>
                  <Link href="/about" className="text-sm font-semibold text-gray-600 hover:text-teal-600 transition-colors relative after:content-[''] after:absolute after:bottom-[-20px] after:left-0 after:w-0 after:h-[2px] after:bg-teal-500 hover:after:w-full after:transition-all">
                    About
                  </Link>
                  <Link href="/contact" className="text-sm font-semibold text-gray-600 hover:text-teal-600 transition-colors relative after:content-[''] after:absolute after:bottom-[-20px] after:left-0 after:w-0 after:h-[2px] after:bg-teal-500 hover:after:w-full after:transition-all">
                    Contact
                  </Link>
                </nav>
              </div>

              <div className="flex items-center gap-4">
                <NavbarCartIcon />
              </div>
            </div>
          </header>

          {/* Main App Page Wrapper */}
          <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full animate-fade-in-up">
            {children}
          </main>

          {/* Premium Tech-Inspired Footer */}
          <footer className="bg-white border-t border-gray-200/60 py-10 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💊</span>
                  <span className="font-bold text-gray-900 tracking-tight">Medikart Pakistan</span>
                </div>
                <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
                  <Link href="/" className="hover:text-teal-600 transition-colors">Home</Link>
                  <Link href="/instant-order" className="hover:text-teal-600 transition-colors">Instant Order</Link>
                  <Link href="/about" className="hover:text-teal-600 transition-colors">About Us</Link>
                  <Link href="/contact" className="hover:text-teal-600 transition-colors">Contact Support</Link>
                </div>
              </div>
              <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-gray-400 gap-4">
                <p>&copy; {new Date().getFullYear()} Medikart. All rights reserved. Built with integrity.</p>
                <div className="flex gap-4">
                  <span>Standard Cash on Delivery</span>
                  <span>•</span>
                  <span>Sandbox Card Payments</span>
                  <span>•</span>
                  <span className="text-indigo-500 font-medium">Narcotics Compliance Active</span>
                </div>
              </div>
            </div>
          </footer>

          {/* Floating WhatsApp chat link with pulse glow */}
          {cleanPhone && (
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="fixed bottom-6 left-6 z-50 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-4 shadow-xl transition-all hover:scale-110 active:scale-95 flex items-center justify-center h-14 w-14 hover:shadow-emerald-500/30"
              title="Chat on WhatsApp"
            >
              <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.729-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.863-9.864.001-2.63-1.019-5.101-2.871-6.958C16.598 1.932 14.12 1.9 11.487 1.9c-5.437 0-9.862 4.421-9.865 9.866-.001 1.702.464 3.367 1.346 4.887l-.988 3.606 3.69-.968zm13.111-5.613c-.262-.13-1.551-.765-1.792-.852-.24-.087-.416-.13-.591.13-.175.26-.677.852-.83 1.026-.153.174-.306.195-.568.065-.262-.13-1.107-.408-2.109-1.302-.78-.696-1.307-1.555-1.46-1.816-.153-.26-.017-.401.114-.53.118-.117.262-.305.393-.457.13-.152.175-.26.262-.435.087-.174.044-.326-.021-.456-.066-.13-.591-1.424-.81-1.947-.213-.512-.446-.442-.614-.45l-.523-.007c-.18 0-.472.067-.719.336-.247.269-.942.921-.942 2.247 0 1.326.964 2.607 1.098 2.78 1.35 1.794 3.01 2.656 5.443 3.619 1.139.449 2.052.484 2.825.369.863-.128 2.656-1.087 3.028-2.087.372-.999.372-1.854.262-2.036-.109-.18-.306-.267-.568-.397z"/>
              </svg>
            </a>
          )}

          {/* Floating AI Chatbot Widget */}
          <ChatbotWidget />
        </CartProvider>
      </body>
    </html>
  );
}
