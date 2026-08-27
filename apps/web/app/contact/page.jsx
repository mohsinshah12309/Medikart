"use client";

import React, { useState, useEffect } from 'react';
import { getContent, sendContactMessage } from '../../lib/api';

export default function ContactPage() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await sendContactMessage(formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setErrorMsg(err.message || "Failed to submit message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const defaultEmail = "support@medikart.pk";
  const defaultPhone = "+92 300 1234567";

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      {/* Left Column: Contact Details */}
      <div className="bg-[#0a232a]/45 p-8 rounded-3xl border border-teal-955/65 shadow-2xl backdrop-blur-md flex flex-col gap-6 relative overflow-hidden">
        <h1 className="text-2xl font-extrabold text-slate-100 border-b border-teal-950/60 pb-4">Contact Us</h1>
        
        <p className="text-sm text-slate-400 leading-relaxed">
          Have queries about your order, prescriptions, or available items? Reach out to our customer care team.
        </p>

        {loading ? (
          <div className="text-slate-500 text-sm">Loading details...</div>
        ) : (
          <div className="flex flex-col gap-4 text-sm mt-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">Business Email</span>
              <a href={`mailto:${content?.contactEmail || defaultEmail}`} className="font-bold text-emerald-450 hover:text-emerald-350 transition-colors">
                {content?.contactEmail || defaultEmail}
              </a>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">Business Phone</span>
              <a href={`tel:${content?.contactPhone || defaultPhone}`} className="font-bold text-slate-200">
                {content?.contactPhone || defaultPhone}
              </a>
            </div>

            <div className="flex flex-col gap-1 mt-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">Operating Hours</span>
              <span className="text-slate-300 font-medium">Monday — Saturday: 9:00 AM — 9:00 PM</span>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Contact Form */}
      <div className="bg-[#0a232a]/45 p-8 rounded-3xl border border-teal-955/65 shadow-2xl backdrop-blur-md flex flex-col gap-4 relative overflow-hidden">
        <h2 className="text-xl font-bold text-slate-200">Send a Message</h2>
        
        {submitted && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-4 rounded-xl text-xs font-semibold">
            ✓ Message sent successfully! Our team will contact you shortly.
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-semibold">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs font-semibold text-slate-400">Full Name</label>
            <input
              type="text"
              required
              disabled={submitting}
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Your Name"
              className="border border-teal-955/80 bg-[#081d23] text-slate-100 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-slate-400">Email Address</label>
            <input
              type="email"
              required
              disabled={submitting}
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="name@example.com"
              className="border border-teal-955/80 bg-[#081d23] text-slate-100 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="message" className="text-xs font-semibold text-slate-400">Message</label>
            <textarea
              required
              rows={4}
              disabled={submitting}
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="How can we help you?"
              className="border border-teal-955/80 bg-[#081d23] text-slate-100 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-650"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#04151a] font-extrabold text-sm rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer"
          >
            {submitting ? 'Submitting...' : 'Submit Message'}
          </button>
        </form>
      </div>
    </div>
  );
}
