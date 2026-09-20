import React from "react";
import FaqClient from "./FaqClient";

export const metadata = {
  title: "Frequently Asked Questions (FAQs) | Medikart Online Pharmacy",
  description:
    "Find answers to frequently asked questions about online medicine orders, digital card and Cash on Delivery payments, cold-chain rapid shipping, prescription verification, and Monthly Refills in Pakistan.",
  alternates: {
    canonical: "https://medikart.pk/faqs",
  },
  openGraph: {
    title: "Frequently Asked Questions (FAQs) | Medikart Online Pharmacy",
    description:
      "Frequently asked questions about ordering authentic prescription medicines, payment options, delivery timelines, and monthly refills across Pakistan.",
    url: "https://medikart.pk/faqs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Medikart FAQs — Online Pharmacy Pakistan",
    description:
      "Find answers about medicine delivery, payment methods, prescription verification, and 30-day refills.",
  },
};

// Structured Data JSON-LD Schema for Google Rich Snippets
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I place an order on Medikart?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can browse products through our catalog and add items directly to your cart, or use Instant Order to upload a photo of your doctor's prescription for quick verification and fulfillment by a licensed pharmacist.",
      },
    },
    {
      "@type": "Question",
      name: "What payment methods are supported on Medikart?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We support Cash on Delivery (COD) across Pakistan as well as secure online card and digital payments (supporting Visa/MasterCard debit and credit cards, 1Bill, Internet Banking, JazzCash, and Easypaisa).",
      },
    },
    {
      "@type": "Question",
      name: "How fast is medicine delivery in Pakistan?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "In major metropolitan cities (Lahore, Karachi, Islamabad/Rawalpindi), intra-city orders are dispatched rapidly within 2 to 4 hours. Nationwide courier deliveries typically arrive within 24 to 48 hours.",
      },
    },
    {
      "@type": "Question",
      name: "What is the Medikart Monthly Refill service?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Monthly Refill is an automated 30-day subscription service for patients taking regular maintenance medications (e.g. for diabetes, hypertension, cardiac care), ensuring uninterrupted medicine supplies with priority dispatch.",
      },
    },
    {
      "@type": "Question",
      name: "Does Medikart dispense narcotics or controlled substances online?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. In strict compliance with DRAP regulations and provincial drug laws, Medikart does not dispense or deliver controlled narcotics, habit-forming psychotropics, or restricted Schedule X substances online.",
      },
    },
  ],
};

export default function FaqsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="w-full pt-4 sm:pt-6">
        <FaqClient />
      </div>
    </>
  );
}
