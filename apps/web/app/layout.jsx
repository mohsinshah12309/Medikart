import React from 'react';
import './globals.css';
import { CartProvider } from '../components/CartProvider';
import { CustomerProvider } from '../components/CustomerProvider';
import Link from 'next/link';
import NavbarCartIcon from '../components/NavbarCartIcon';
import InteractiveLogo from '../components/InteractiveLogo';
import HeaderNav from '../components/HeaderNav';
import DvagoSearchBar from '../components/DvagoSearchBar';
import HomeOnlyBanners from '../components/HomeOnlyBanners';
import dynamic from 'next/dynamic';
import { Plus_Jakarta_Sans, Inter, Caveat } from 'next/font/google';

// Code-split Chatbot widget so it does not block initial main thread hydration
const ChatbotWidget = dynamic(() => import('../components/ChatbotWidget'), {
  ssr: false,
});

// Code-split Mobile Bottom Nav (client-side only — uses usePathname)
const MobileBottomNav = dynamic(() => import('../components/MobileBottomNav'), {
  ssr: false,
});

// Design System Typography — Plus Jakarta Sans for headings, Inter for body/UI, Caveat for annotations
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-script',
  display: 'swap',
});

export const metadata = {
  title: 'Medikart - Authentic Online Pharmacy',
  description: 'Your trusted healthcare partner. Order authentic medicines online with Cash on Delivery.',
};

export default async function RootLayout({ children }) {
  // Fetch settings content to get contact and about details dynamically
  let contactPhone = '923314170744';
  let contactEmail = 'medikart.com@gmail.com';
  let aboutText = 'Medikart is Pakistan\'s leading online pharmacy.';
  let categories = [];

  const baseUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api/v1';
  try {
    const [contentRes, catRes] = await Promise.all([
      fetch(`${baseUrl}/content`, { next: { revalidate: 300 } }).catch(() => null),
      fetch(`${baseUrl}/categories`, { next: { revalidate: 300 } }).catch(() => null),
    ]);

    if (contentRes && contentRes.ok) {
      const body = await contentRes.json();
      if (body?.data) {
        if (body.data.contactPhone) contactPhone = body.data.contactPhone;
        if (body.data.contactEmail) contactEmail = body.data.contactEmail;
        if (body.data.aboutText) aboutText = body.data.aboutText;
      }
    }

    if (catRes && catRes.ok) {
      const catBody = await catRes.json();
      if (catBody?.data?.categories) {
        categories = catBody.data.categories;
      }
    }
  } catch (err) {
    console.error("Failed to fetch layout content or categories:", err);
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
    <html lang="en" className={`${plusJakarta.variable} ${inter.variable} ${caveat.variable}`}>
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
      <body className="min-h-screen flex flex-col bg-white text-slate-900 relative overflow-x-hidden font-body pb-16 md:pb-0">
        <CustomerProvider>
          <CartProvider>
            {/* Main Brand Sticky Header */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs transition-all">
              <div className="max-w-[1600px] 2xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 h-18 sm:h-20 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 lg:gap-8 flex-1 min-w-0">
                  {/* Official Interactive Logo */}
                  <Link href="/" className="flex items-center flex-shrink-0">
                    <InteractiveLogo />
                  </Link>

                  {/* Dvago Top Search Bar with Continuously Cycling Animated Placeholder */}
                  <DvagoSearchBar className="hidden md:flex flex-1 max-w-sm lg:max-w-md" />
                </div>

                <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
                  {/* Header Navigation: Home | Instant Order | Categories ▾ | About | Contact */}
                  <HeaderNav initialCategories={categories} />
                  <NavbarCartIcon />
                </div>
              </div>

              {/* Mobile Search Bar Row (visible on small mobile screens) */}
              <div className="md:hidden px-4 pb-2.5 pt-0.5">
                <DvagoSearchBar className="w-full" />
              </div>
            </header>

            {/* Non-Sticky Home-Only Category Sub-Navbar */}
            <HomeOnlyBanners categories={categories} />

            {/* Main App Page Wrapper */}
            <main className="flex-grow max-w-[1600px] 2xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 w-full animate-fade-in-up z-10">
              {children}
            </main>

            {/* Warm Clinical Footer with Amber Accents */}
            <footer className="bg-white border-t border-[#F3EFE6] py-10 mt-12 relative z-10 shadow-sm">
              <div className="max-w-[1600px] 2xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-[#F3EFE6]">
                  <Link href="/">
                    <InteractiveLogo />
                  </Link>
                  <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-600 font-medium">
                    <Link href="/" className="hover:text-amber-600 transition-colors">Home</Link>
                    <Link href="/instant-order" className="hover:text-amber-600 transition-colors">Instant Order</Link>
                    <Link href="/about" className="hover:text-amber-600 transition-colors">About Us</Link>
                    <Link href="/contact" className="hover:text-amber-600 transition-colors">Contact Support</Link>
                  </div>
                </div>
                <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
                  <p>&copy; {new Date().getFullYear()} Medikart. All rights reserved. Your trusted healthcare partner.</p>
                  <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 font-semibold">
                    <span className="text-slate-700">Cash on Delivery</span>
                    <span>•</span>
                    <span className="text-slate-700">Online Card Payments</span>
                    <span>•</span>
                    <span className="text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full font-bold">Narcotics Compliance Active</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-3 text-[11px]">
                    <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full font-semibold">
                      🔐 256-Bit SSL Encrypted
                    </span>
                    <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full font-semibold border border-blue-100">
                      🏥 DRAP Licensed Pharmacy
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-100">
                      🛡️ Secure Patient Data
                    </span>
                  </div>
                </div>
              </div>
            </footer>

            {/* Floating WhatsApp chat link (positioned bottom-left with crisp official SVG) */}
            {cleanPhone && (
              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-20 md:bottom-6 left-5 sm:left-7 z-40 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full p-3 sm:p-3.5 shadow-[0_4px_18px_rgba(37,211,102,0.45)] hover:shadow-[0_6px_24px_rgba(37,211,102,0.65)] transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 border border-white/30"
                title="Chat with Pharmacist on WhatsApp"
                aria-label="Chat with Pharmacist on WhatsApp"
              >
                <svg viewBox="0 0 308 308" className="w-6 h-6 sm:w-7 sm:h-7 fill-white drop-shadow-xs" aria-hidden="true">
                  <path d="M227.904,176.981c-0.6-0.288-23.054-11.345-27.019-12.781c-3.524-1.283-6.088-1.926-8.653,1.926 c-2.564,3.852-9.932,12.781-12.176,15.345c-2.244,2.564-4.489,2.885-8.013,0.963c-3.524-1.925-14.877-5.485-28.339-17.489 c-10.493-9.358-17.575-20.919-19.627-24.444c-2.052-3.524-0.219-5.428,1.543-7.18c1.587-1.579,3.524-4.113,5.287-6.166 c1.763-2.052,2.348-3.524,3.524-5.871c1.176-2.348,0.588-4.407-0.294-6.332c-0.882-1.925-8.653-20.871-11.859-28.567 c-3.123-7.499-6.297-6.483-8.653-6.603c-2.245-0.114-4.808-0.138-7.372-0.138c-2.564,0-6.727,0.963-10.251,4.815 c-3.524,3.852-13.456,13.147-13.456,32.067c0,18.92,13.778,37.204,15.701,39.768c1.923,2.564,27.112,41.399,65.679,58.043 c9.172,3.959,16.335,6.323,21.917,8.096c9.208,2.923,17.589,2.509,24.218,1.519c7.391-1.104,23.054-9.426,26.315-18.532 c3.261-9.106,3.261-16.906,2.28-18.532C233.993,179.866,231.428,178.903,227.904,176.981z"/>
                  <path d="M156.934,0C70.401,0,0,70.401,0,156.934c0,27.637,7.207,54.588,20.882,78.274L0,308l74.966-19.664 c22.729,12.394,48.337,18.932,74.968,18.932c86.533,0,156.934-70.401,156.934-156.934C306.868,70.401,243.468,0,156.934,0z M156.934,277.946c-23.479,0-46.467-6.309-66.502-18.243l-4.767-2.827l-44.478,11.666l11.87-43.359l-3.104-4.94 c-13.111-20.865-20.038-44.974-20.038-69.691c0-72.228,58.756-130.984,130.984-130.984c72.228,0,130.984,58.756,130.984,130.984 C287.918,219.19,229.162,277.946,156.934,277.946z"/>
                </svg>
              </a>
            )}

            {/* Floating AI Chatbot Widget (bottom-right) */}
            <ChatbotWidget />

            {/* Mobile Bottom Navigation Bar */}
            <MobileBottomNav />
          </CartProvider>
        </CustomerProvider>
      </body>
    </html>
  );
}
