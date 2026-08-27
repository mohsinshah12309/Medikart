"use client";

import React, { useState, useEffect } from 'react';
import { getContent } from '../../lib/api';

export default function AboutPage() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      try {
        const res = await getContent();
        if (res && res.data) {
          setContent(res.data);
        }
      } catch (err) {
        console.error("Failed to load about page content:", err);
      } finally {
        setLoading(false);
      }
    }
    loadContent();
  }, []);

  const defaultText = "Welcome to Medikart, your premier destination for healthcare needs. We are dedicated to providing high-quality medicines, healthcare products, and consultation services to your doorstep safely and reliably. Our online pharmacy facilitates access to standard Cash on Delivery items as well as secure compliance-oriented prescription workflows.";

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl border border-gray-150 shadow-sm flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold text-gray-950 border-b border-gray-100 pb-4">About Medikart</h1>
      
      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading details...</div>
      ) : (
        <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
          {content?.aboutText || defaultText}
        </div>
      )}
    </div>
  );
}
