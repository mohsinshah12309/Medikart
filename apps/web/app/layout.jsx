import React from 'react';
import './globals.css';
import { CartProvider } from '../components/CartProvider';
import Link from 'next/link';
import NavbarCartIcon from '../components/NavbarCartIcon';

export const metadata = {
  title: 'Medikart Storefront',
  description: 'Order medicines online in Pakistan',
};

export default function RootLayout({ children }) {
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
              <p className="mt-2 text-xs">Standard COD ordering flow. Narcotics items excluded.</p>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
