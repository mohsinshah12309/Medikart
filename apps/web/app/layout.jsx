import React from 'react';
import './globals.css';
import { CartProvider } from '../components/CartProvider';
import Link from 'next/link';
import NavbarCartIcon from '../components/NavbarCartIcon';
import ChatbotWidget from '../components/ChatbotWidget';

export const metadata = {
  title: 'Medikart Storefront',
  description: 'Order medicines online in Pakistan',
};

export default async function RootLayout({ children }) {
  // Fetch settings content to get WhatsApp contact number
  let contactPhone = '923001234567';
  try {
    const res = await fetch('http://127.0.0.1:5000/api/v1/content', { cache: 'no-store' });
    if (res.ok) {
      const body = await res.json();
      if (body?.data?.contactPhone) {
        contactPhone = body.data.contactPhone;
      }
    }
  } catch (err) {
    console.error("Failed to fetch contact phone for layout WhatsApp link:", err);
  }

  const cleanPhone = contactPhone.replace(/[^0-9]/g, '');

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
        <CartProvider>
          <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Link href="/" className="text-2xl font-bold text-green-600 flex items-center gap-2">
                  <span className="text-3xl">💊</span>
                  <span>Medikart</span>
                </Link>
                <nav className="hidden md:flex gap-4">
                  <Link href="/" className="text-sm font-medium text-gray-700 hover:text-green-600">
                    Home
                  </Link>
                  <Link href="/instant-order" className="text-sm font-medium text-gray-700 hover:text-green-600">
                    Instant Order
                  </Link>
                  <Link href="/about" className="text-sm font-medium text-gray-700 hover:text-green-600">
                    About
                  </Link>
                  <Link href="/contact" className="text-sm font-medium text-gray-700 hover:text-green-600">
                    Contact
                  </Link>
                </nav>
              </div>

              <div className="flex items-center gap-4">
                <NavbarCartIcon />
              </div>
            </div>
          </header>

          <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {children}
          </main>

          <footer className="bg-white border-t border-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
              <p>&copy; {new Date().getFullYear()} Medikart. All rights reserved.</p>
              <p className="mt-2 text-xs">Standard Cash on Delivery and Sandbox Card Payments. Narcotics compliance active.</p>
            </div>
          </footer>

          {/* Floating WhatsApp chat link */}
          {cleanPhone && (
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="fixed bottom-6 left-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-xl transition-all hover:scale-105 flex items-center justify-center h-14 w-14"
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
