"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getContent, sendContactMessage } from '../../lib/api';

export default function ContactPage() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formErrors, setFormErrors] = useState({});

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

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = "Please enter your full name.";
    }
    if (!formData.email.trim()) {
      errors.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }
    if (!formData.message.trim()) {
      errors.message = "Please enter your message or query.";
    } else if (formData.message.trim().length < 10) {
      errors.message = "Message should be at least 10 characters long.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await sendContactMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
      });
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      setFormErrors({});
    } catch (err) {
      setErrorMsg(err.message || "Failed to submit message. Please try again or reach out on WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  const defaultEmail = "medikart.com@gmail.com";
  const defaultPhone = "+92 324 4489159";

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-10 pb-16 px-4 sm:px-6">
      {/* Hero Header Card - Storefront Yellow Dominant */}
      <div className="relative overflow-hidden bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 rounded-3xl p-8 sm:p-12 text-slate-950 shadow-lg border-2 border-yellow-500/40">
        {/* Soft Ambient Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/30 blur-[90px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-amber-500/20 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-slate-950 text-yellow-300 w-fit shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_8px_#facc15]" />
            24/7 Qualified Pharmacist Support
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            We&apos;re Here to Assist You.
          </h1>
          <p className="text-base sm:text-lg text-slate-900 leading-relaxed font-semibold">
            Have a prescription query, need help tracking an order, or looking for specific medicine availability? Contact our clinical care team directly.
          </p>
        </div>
      </div>

      {/* Support Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="p-5 bg-white rounded-3xl border-2 border-yellow-400 shadow-md flex items-center gap-4 hover:bg-yellow-50/50 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center text-2xl shrink-0 shadow-xs">
            ⚡
          </div>
          <div>
            <h4 className="font-black text-slate-950 text-sm sm:text-base">Rapid Response</h4>
            <p className="text-xs text-slate-600 font-medium mt-0.5">Average reply under 15 minutes</p>
          </div>
        </div>

        <div className="p-5 bg-yellow-400 rounded-3xl border-2 border-yellow-500/60 shadow-md flex items-center gap-4 hover:bg-yellow-300 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 text-yellow-300 flex items-center justify-center text-2xl shrink-0 shadow-xs">
            🩺
          </div>
          <div>
            <h4 className="font-black text-slate-950 text-sm sm:text-base">Clinical Pharmacists</h4>
            <p className="text-xs text-slate-900 font-bold mt-0.5">Direct guidance on dosage &amp; Rx</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border-2 border-yellow-400 shadow-md flex items-center gap-4 hover:bg-yellow-50/50 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center text-2xl shrink-0 shadow-xs">
            🚚
          </div>
          <div>
            <h4 className="font-black text-slate-950 text-sm sm:text-base">Order Tracking</h4>
            <p className="text-xs text-slate-600 font-medium mt-0.5">Live status updates nationwide</p>
          </div>
        </div>
      </div>

      {/* Main Content: Info & Interactive Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Direct Contact Information */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border-2 border-yellow-300/80 shadow-xl flex flex-col gap-6 relative overflow-hidden">
          <div className="flex items-center justify-between border-b-2 border-yellow-100 pb-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
              <span className="p-2 bg-yellow-400 text-slate-950 rounded-xl text-base font-bold shadow-xs">📞</span>
              <span>Official Channels</span>
            </h2>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed font-normal">
            Reach out through our official direct channels for quick order updates and prescription consultations.
          </p>

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
              <div className="w-8 h-8 border-3 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-600">Loading contact details...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Business Email */}
              <div className="p-4 bg-yellow-50/70 border-2 border-yellow-200 rounded-2xl flex flex-col gap-1 transition-all hover:border-yellow-400 hover:bg-yellow-50">
                <span className="text-xs uppercase tracking-wider font-black text-amber-900 flex items-center gap-1.5">
                  <span>✉️</span> Official Support Email
                </span>
                <a
                  href={`mailto:${content?.contactEmail || defaultEmail}`}
                  className="font-extrabold text-sm text-slate-950 hover:text-amber-700 transition-colors break-all"
                >
                  {content?.contactEmail || defaultEmail}
                </a>
              </div>

              {/* Business Phone */}
              <div className="p-4 bg-yellow-50/70 border-2 border-yellow-200 rounded-2xl flex flex-col gap-1 transition-all hover:border-yellow-400 hover:bg-yellow-50">
                <span className="text-xs uppercase tracking-wider font-black text-amber-900 flex items-center gap-1.5">
                  <span>📱</span> Customer Helpline
                </span>
                <a
                  href={`tel:${content?.contactPhone || defaultPhone}`}
                  className="font-extrabold text-sm text-slate-950 hover:text-amber-700 transition-colors"
                >
                  {content?.contactPhone || defaultPhone}
                </a>
              </div>

              {/* Live WhatsApp Direct CTA */}
              <div className="p-5 bg-[#25D366]/10 border-2 border-[#25D366]/40 rounded-2xl flex flex-col gap-2 shadow-xs">
                <span className="text-xs uppercase tracking-wider font-black text-green-950 flex items-center gap-1.5">
                  <span>💬</span> Instant WhatsApp Support
                </span>
                <p className="text-xs text-green-900 leading-relaxed font-semibold">
                  Connect immediately with on-duty pharmacists for urgent prescription queries.
                </p>
                <a
                  href="https://wa.me/923244489159?text=Hi%20Medikart%20Support,%20I%20have%20a%20query%20about%20an%20order."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#1faa53] active:bg-[#1b9347] text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer active:scale-[0.98]"
                >
                  Chat on WhatsApp Now →
                </a>
              </div>

              {/* Operating Hours */}
              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl flex flex-col gap-2 text-xs">
                <div>
                  <span className="font-extrabold text-slate-900 block">🕒 Support &amp; Delivery Hours</span>
                  <span className="text-slate-600 font-medium">Monday — Sunday: 24/7 Nationwide Digital Ordering &amp; Customer Support</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Contact Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 md:p-10 rounded-3xl border-2 border-yellow-300/80 shadow-xl flex flex-col gap-6 relative overflow-hidden">
          <div className="border-b-2 border-yellow-100 pb-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
              <span className="p-2 bg-yellow-400 text-slate-950 rounded-xl text-base font-bold shadow-xs">✍️</span>
              <span>Send Us a Direct Message</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Your inquiry will be logged directly into our administrative support inbox.
            </p>
          </div>

          {/* Success Banner */}
          {submitted && (
            <div className="bg-green-50 border-2 border-green-300 text-green-950 p-5 rounded-2xl flex flex-col gap-2 shadow-sm animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-black">
                  ✓
                </span>
                <span className="font-extrabold text-sm text-green-950">Message Sent Successfully!</span>
              </div>
              <p className="text-xs text-green-900 leading-relaxed font-normal">
                Thank you for contacting Medikart. Our clinical support team will review your message and reach out to you via email shortly.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-2 self-start text-xs font-black text-green-900 hover:text-green-950 underline cursor-pointer"
              >
                Send another message
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="bg-red-50 border-2 border-red-200 text-red-800 p-4 rounded-2xl text-xs font-medium flex items-center gap-3 shadow-xs">
              <span className="text-lg shrink-0">⚠️</span>
              <div className="flex-grow">
                <p className="font-bold text-red-900">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Contact Message Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                required
                disabled={submitting}
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }));
                  if (formErrors.name) setFormErrors(prev => ({ ...prev, name: null }));
                }}
                placeholder="e.g. Ali Ahmed"
                className={`border-2 bg-white text-slate-950 placeholder:text-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-yellow-400/20 focus:border-yellow-500 transition-all ${
                  formErrors.name ? 'border-red-300 ring-2 ring-red-200' : 'border-slate-200 hover:border-yellow-400'
                }`}
              />
              {formErrors.name && (
                <span className="text-[11px] text-red-600 font-bold">{formErrors.name}</span>
              )}
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                required
                disabled={submitting}
                value={formData.email}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, email: e.target.value }));
                  if (formErrors.email) setFormErrors(prev => ({ ...prev, email: null }));
                }}
                placeholder="customer@example.com"
                className={`border-2 bg-white text-slate-950 placeholder:text-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-yellow-400/20 focus:border-yellow-500 transition-all ${
                  formErrors.email ? 'border-red-300 ring-2 ring-red-200' : 'border-slate-200 hover:border-yellow-400'
                }`}
              />
              {formErrors.email && (
                <span className="text-[11px] text-red-600 font-bold">{formErrors.email}</span>
              )}
            </div>

            {/* Message Body */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Message / Inquiry Details <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                required
                rows={5}
                disabled={submitting}
                value={formData.message}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, message: e.target.value }));
                  if (formErrors.message) setFormErrors(prev => ({ ...prev, message: null }));
                }}
                placeholder="Please describe how our pharmacy team can assist you (e.g., order tracking, prescription verification)..."
                className={`border-2 bg-white text-slate-950 placeholder:text-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-yellow-400/20 focus:border-yellow-500 transition-all ${
                  formErrors.message ? 'border-red-300 ring-2 ring-red-200' : 'border-slate-200 hover:border-yellow-400'
                }`}
              />
              {formErrors.message && (
                <span className="text-[11px] text-red-600 font-bold">{formErrors.message}</span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] border-2 border-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Sending Message...
                </>
              ) : (
                'Submit Message →'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
