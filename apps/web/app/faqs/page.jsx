import React from "react";
import FaqClient from "./FaqClient";
import faqData from "./faqData.json";

export const metadata = {
  title: "Frequently Asked Questions (FAQs) | Medikart Online Pharmacy Pakistan",
  description:
    "Find answers to 100+ questions about online medicine orders, Cash on Delivery, debit/credit cards, 2–4 hr express delivery, prescription verification & 30-day monthly refills in Pakistan.",
  keywords: [
    "Medikart FAQs",
    "online pharmacy questions Pakistan",
    "medicine delivery charges Lahore",
    "cash on delivery pharmacy Karachi",
    "prescription verification Pakistan",
    "medicine refund policy Pakistan"
  ],
  alternates: {
    canonical: "https://medikart.pk/faqs",
  },
  openGraph: {
    title: "Frequently Asked Questions (FAQs) | Medikart Online Pharmacy Pakistan",
    description:
      "Get answers to 100+ questions regarding ordering authentic medicines, delivery timelines, payment options, and prescription verification across Pakistan.",
    url: "https://medikart.pk/faqs",
    siteName: "Medikart - Authentic Online Pharmacy",
    locale: "en_PK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Medikart FAQs — Online Pharmacy Pakistan",
    description:
      "Find answers about medicine delivery, payment methods, prescription verification, and 30-day refills in Pakistan.",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqData.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
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

