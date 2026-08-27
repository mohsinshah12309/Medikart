"use client";

import React, { useState, useEffect } from 'react';
import { getContent } from '../../lib/api';

export default function ContactPage() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function loadContent() {
      try {
        const res = await getContent();
        if (res && res.data) {
          setContent(res.data);
        }
      } catch (err) {
        console.error("Failed to load contact details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadContent();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFormData({ name: '', email: '', message: '' });
    setTimeout(() => setSubmitted(false), 5000);
  };

  const defaultEmail = "support@medikart.pk";
  const defaultPhone = "+92 300 1234567";

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      {/* Left Column: Contact Details */}
      <div className="bg-white p-8 rounded-xl border border-gray-150 shadow-sm flex flex-col gap-6">
        <h1 className="text-2xl font-extrabold text-gray-950 border-b border-gray-100 pb-4">Contact Us</h1>
        
        <p className="text-sm text-gray-600 leading-relaxed">
          Have queries about your order, prescriptions, or available items? Reach out to our customer care team.
        </p>

        {loading ? (
          <div className="text-gray-500 text-sm">Loading details...</div>
        ) : (
          <div className="flex flex-col gap-4 text-sm mt-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">Business Email</span>
              <a href={`mailto:${content?.contactEmail || defaultEmail}`} className="font-semibold text-green-600 hover:text-green-700 transition-colors">
                {content?.contactEmail || defaultEmail}
              </a>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">Business Phone</span>
              <a href={`tel:${content?.contactPhone || defaultPhone}`} className="font-semibold text-gray-900">
                {content?.contactPhone || defaultPhone}
              </a>
            </div>

            <div className="flex flex-col gap-1 mt-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">Operating Hours</span>
              <span className="text-gray-700">Monday — Saturday: 9:00 AM — 9:00 PM</span>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Contact Form */}
      <div className="bg-white p-8 rounded-xl border border-gray-150 shadow-sm flex flex-col gap-4">
        <h2 className="text-xl font-bold text-gray-950">Send a Message</h2>
        
        {submitted && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg text-xs font-semibold">
            ✓ Message sent successfully! Our team will contact you shortly.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs font-semibold text-gray-700">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Your Name"
              className="border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-gray-700">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="name@example.com"
              className="border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="message" className="text-xs font-semibold text-gray-700">Message</label>
            <textarea
              required
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="How can we help you?"
              className="border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm"
          >
            Submit Message
          </button>
        </form>
      </div>
    </div>
  );
}
