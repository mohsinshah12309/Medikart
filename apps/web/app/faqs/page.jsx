import React from "react";
import FaqClient from "./FaqClient";

export const metadata = {
  title: "Frequently Asked Questions (FAQs) | Medikart Online Pharmacy Pakistan",
  description:
    "Find clear answers about online medicine orders, Cash on Delivery, debit/credit cards, 2–4 hr express delivery, prescription verification & 30-day monthly refills in Pakistan.",
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
      "Get answers to common questions regarding ordering authentic medicines, delivery timelines, payment options, and prescription verification across Pakistan.",
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

// Structured Data JSON-LD Schema for Google Rich Snippets & AI Overviews
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
        text: "We offer multiple convenient payment channels across Pakistan including Cash on Delivery (COD), Visa/MasterCard debit and credit cards, 1Bill, direct internet banking, and mobile wallets (JazzCash, Easypaisa, Raast).",
      },
    },
    {
      "@type": "Question",
      name: "Can I place an order without creating an account (Guest Checkout)?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! Medikart fully supports rapid guest checkout. You only need to enter your recipient name, active contact phone number, and delivery address in Pakistan to complete an order.",
      },
    },
    {
      "@type": "Question",
      name: "How do I know if my order is confirmed?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Once you submit your order, you will immediately receive an on-screen Order ID and a confirmation SMS on your mobile number. For prescription orders, a licensed pharmacist may call you to verify dosage.",
      },
    },
    {
      "@type": "Question",
      name: "How fast is delivery and which cities are covered in Pakistan?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "In major metropolitan hubs (Lahore, Karachi, Islamabad/Rawalpindi), intra-city orders are dispatched from licensed partner pharmacies within 2 to 4 hours. Nationwide courier deliveries across Pakistan typically arrive within 24 to 48 business hours.",
      },
    },
    {
      "@type": "Question",
      name: "How are temperature-sensitive medicines (Insulin, Vaccines, Biologics) handled?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "All temperature-sensitive medications (such as Insulin, biologics, and vaccines) are packed in insulated thermal cold-chain packaging with calibrated ice packs in strict compliance with DRAP regulations.",
      },
    },
    {
      "@type": "Question",
      name: "What are the shipping charges?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Standard intra-city delivery fees typically range between PKR 100 to PKR 250 depending on distance. Free shipping is provided for qualifying cart amounts and active Monthly Refill subscribers.",
      },
    },
    {
      "@type": "Question",
      name: "How can I track my parcel status?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You receive live tracking SMS updates upon dispatch. You can also message our 24/7 WhatsApp helpline (+92 324 4489159) with your Order ID for real-time rider tracking.",
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
      name: "Are there discounts or perks with Monthly Refill?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, enrolling in Monthly Refill gives you priority order fulfillment, specialized cold-chain packaging at no extra cost, periodic discount savings, and free delivery on scheduled monthly cycles.",
      },
    },
    {
      "@type": "Question",
      name: "Can I pause, reschedule, or cancel my Monthly Refill plan?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, you have complete control over your subscription. You can pause deliveries, change your scheduled delivery date, update medicine quantities, or cancel anytime with zero lock-in contracts or penalty fees.",
      },
    },
    {
      "@type": "Question",
      name: "Is my medical and prescription data kept private?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Your prescriptions, order details, and personal contact info are encrypted using bank-grade 256-bit SSL protocols. Prescriptions are accessible only to licensed pharmacists reviewing your order.",
      },
    },
    {
      "@type": "Question",
      name: "Which medicines require a doctor's prescription?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "All Schedule G and prescription-only medications (antibiotics, antihypertensives, cardiac drugs, hormonal treatments) require a valid doctor's prescription. General OTC items and vitamins do not require a prescription.",
      },
    },
    {
      "@type": "Question",
      name: "Does Medikart dispense controlled substances or narcotics online?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Strictly No. In full compliance with DRAP regulations and provincial drug laws, Medikart does not dispense or deliver controlled narcotics, habit-forming sedatives, or restricted Schedule X substances online.",
      },
    },
    {
      "@type": "Question",
      name: "Are all medicines on Medikart authentic and genuine?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, 100%. Medikart partners exclusively with verified, licensed retail pharmacies and reputable pharmaceutical distributors. Every product batch is inspected for intact tamper seals, genuine manufacturer packaging, and DRAP registration.",
      },
    },
    {
      "@type": "Question",
      name: "Can I cancel my order before it is delivered?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You can cancel your order free of charge at any stage before the partner pharmacy dispatches the delivery rider by contacting our 24/7 support helpline on WhatsApp (+92 324 4489159).",
      },
    },
    {
      "@type": "Question",
      name: "What is the return policy for delivered medicines?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Under drug safety standards, medicines once delivered and unsealed cannot be returned. However, if an item is damaged in transit or incorrect, notify support within 24 hours for an immediate free replacement or refund.",
      },
    },
    {
      "@type": "Question",
      name: "How and when are refunds processed for online payments?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "For orders cancelled prior to dispatch, refunds are initiated immediately. Depending on your bank or card issuer, the credited funds reflect in your account within 3 to 7 working days.",
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
