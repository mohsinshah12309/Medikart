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

  const defaultEmail = "support@medikart.pk";
  const defaultPhone = "+92 300 1234567";

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-16">
      {/* Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-yellow-50/40 to-amber-50/50 rounded-3xl p-8 md:p-12 text-slate-900 shadow-md border border-slate-200">
        <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-400/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-amber-300/15 blur-[90px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-3 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-yellow-100 text-amber-900 border border-yellow-300/70 w-fit shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse shadow-[0_0_8px_#eab308]" />
            Direct Pharmacist Support
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Contact Medikart
          </h1>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed font-normal">
            Have questions about an order, prescription verification, or medicine availability? Our pharmacy team is here to help.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Direct Contact Information */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl flex flex-col gap-6 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>📞</span> Contact Channels
            </h2>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed font-normal">
            Reach out through our official direct channels for quick order updates and prescription consultations.
          </p>

          {loading ? (
            <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-400">
              <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-500">Loading contact details...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Business Email */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-1 transition-all hover:border-yellow-400/80">
                <span className="text-xs uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1.5">
                  <span>✉️</span> Official Support Email
                </span>
                <a
                  href={`mailto:${content?.contactEmail || defaultEmail}`}
                  className="font-extrabold text-sm text-slate-900 hover:text-yellow-600 transition-colors break-all"
                >
                  {content?.contactEmail || defaultEmail}
                </a>
              </div>

              {/* Business Phone */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-1 transition-all hover:border-yellow-400/80">
                <span className="text-xs uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1.5">
                  <span>📱</span> Customer Helpline
                </span>
                <a
                  href={`tel:${content?.contactPhone || defaultPhone}`}
                  className="font-extrabold text-sm text-slate-900 hover:text-yellow-600 transition-colors"
                >
                  {content?.contactPhone || defaultPhone}
                </a>
              </div>

              {/* Live WhatsApp Direct CTA */}
              <div className="p-4 bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wider font-black text-green-900 flex items-center gap-1.5">
                  <span>💬</span> Instant WhatsApp Support
                </span>
                <p className="text-xs text-green-800 leading-relaxed font-normal">
                  Connect immediately with on-duty pharmacists for urgent prescription queries.
                </p>
                <a
                  href="https://wa.me/923001234567?text=Hi%20Medikart%20Support,%20I%20have%20a%20query%20about%20an%20order."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#1faa53] text-white text-xs font-black rounded-xl transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  Chat with Pharmacist →
                </a>
              </div>

              {/* Operating Hours & Pharmacy Hub */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block">🕒 Operating Hours</span>
                  <span className="text-slate-600 font-normal">Monday — Saturday: 9:00 AM — 9:00 PM (PKT)</span>
                </div>
                <div className="border-t border-slate-200 pt-2 mt-1">
                  <span className="font-bold text-slate-700 block">📍 Central Pharmacy Hub</span>
                  <span className="text-slate-600 font-normal">Medikart Licensed Dispensary, Tech Town, Pakistan</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Contact Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl flex flex-col gap-6 relative overflow-hidden">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>✍️</span> Send Us a Message
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Your inquiry will be logged directly into our administrative support inbox.
            </p>
          </div>

          {/* Success Banner */}
          {submitted && (
            <div className="bg-green-50 border border-green-200 text-green-900 p-5 rounded-2xl flex flex-col gap-2 shadow-xs animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-black">
                  ✓
                </span>
                <span className="font-extrabold text-sm text-green-950">Message Sent Successfully!</span>
              </div>
              <p className="text-xs text-green-800 leading-relaxed font-normal">
                Thank you for contacting Medikart. Our clinical support team will review your message and reach out to you via email shortly.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-2 self-start text-xs font-black text-green-800 hover:text-green-950 underline cursor-pointer"
              >
                Send another message
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-xs font-medium flex items-center gap-3 shadow-xs">
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
              <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-700">
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
                placeholder="Muhammad Mohsin Ali"
                className={`border bg-white text-slate-900 placeholder:text-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/40 focus:border-yellow-500 transition-all ${
                  formErrors.name ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-300'
                }`}
              />
              {formErrors.name && (
                <span className="text-[11px] text-red-600 font-semibold">{formErrors.name}</span>
              )}
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-700">
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
                placeholder="alishahmohsin938@gmail.com"
                className={`border bg-white text-slate-900 placeholder:text-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/40 focus:border-yellow-500 transition-all ${
                  formErrors.email ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-300'
                }`}
              />
              {formErrors.email && (
                <span className="text-[11px] text-red-600 font-semibold">{formErrors.email}</span>
              )}
            </div>

            {/* Message Body */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-slate-700">
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
                placeholder="Please describe how our pharmacy team can assist you..."
                className={`border bg-white text-slate-900 placeholder:text-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/40 focus:border-yellow-500 transition-all ${
                  formErrors.message ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-300'
                }`}
              />
              {formErrors.message && (
                <span className="text-[11px] text-red-600 font-semibold">{formErrors.message}</span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] border border-yellow-500/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-2"
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
