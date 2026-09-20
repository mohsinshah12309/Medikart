"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { sendChatbotMessage } from '../lib/api';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am Medi, your personal AI assistant at Medikart 🦉💊.\n\nI can help you with:\n• Finding medicines, checking live prices & stock\n• Safe Over-The-Counter (OTC) symptom advice\n• Delivery timelines (2–4 hrs local, 24–48 hrs nationwide)\n• Payment methods (COD, Online Cards & Wallets)\n• Return & Refund Policy and Store FAQs\n• Uploading prescriptions via [Instant Order](/instant-order) & [Monthly Refills](/refill)\n\nHow can I help you today?\n\nDisclaimer: I am an AI, not a doctor. Suggestions are for informational purposes only. Consult a physician for medical advice.',
      suggestedProducts: []
    }
  ]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const sendMessage = async (messageText) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
    setInput('');
    setLoading(true);
    setShowTooltip(false);

    try {
      const res = await sendChatbotMessage(textToSend, conversationId);
      if (res && res.data) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: res.data.response,
            suggestedProducts: res.data.suggestedProducts || [],
          }
        ]);
        if (res.data.conversationId) {
          setConversationId(res.data.conversationId);
        }
      } else {
        throw new Error("Invalid chatbot response format");
      }
    } catch (err) {
      console.error("Chatbot error:", err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ I'm having trouble connecting right now. Please try asking again in a moment, or speak directly with our licensed pharmacist on WhatsApp: +92 324 4489159.`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const quickPrompts = [
    "Delivery & Shipping time?",
    "Return & Refund Policy",
    "How to upload prescription?",
    "Payment methods accepted",
    "Is Panadol available?",
    "Medicine for fever & cough",
  ];

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────────
          1. FLOATING CHAT BUTTON (Ultra-Prominent 3D Medi Owl Doctor)
      ────────────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-4 sm:right-8 z-50 flex items-center select-none">
        
        {/* Irresistible High-Visibility Greeting Speech Bubble */}
        {!isOpen && showTooltip && (
          <div 
            onClick={() => setIsOpen(true)}
            className="hidden md:flex flex-col gap-0.5 bg-white/98 backdrop-blur-md px-4 py-3 rounded-2xl border-2 border-amber-400 shadow-2xl mr-3 cursor-pointer hover:border-amber-500 hover:shadow-amber-glow transition-all transform hover:-translate-x-1 select-none animate-float relative group/tooltip max-w-[280px]"
          >
            {/* Triangular Speech Bubble Pointer */}
            <div className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[8px] border-l-amber-400" />
            <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-l-[7px] border-l-white" />

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-full">
                  24/7 AI Doctor
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTooltip(false);
                }}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold leading-none p-0.5"
                title="Dismiss"
              >
                ✕
              </button>
            </div>

            <p className="font-black text-xs text-slate-900 leading-snug mt-1">
              Need medicine? Ask Medi your personal AI assistant 👋
            </p>
            <p className="text-[11px] text-amber-700 font-semibold mt-0.5 flex items-center gap-1">
              <span>⚡ Click to search &amp; consult</span>
              <span className="text-xs">&rarr;</span>
            </p>
          </div>
        )}

        {/* Ultra-Prominent Floating 3D Medi Character Button */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setShowTooltip(false);
          }}
          className="relative bg-gradient-to-tr from-amber-400 via-[#FFCB05] to-yellow-200 hover:from-amber-500 hover:via-[#FFCB05] hover:to-yellow-100 text-slate-950 rounded-full shadow-[0_12px_40px_rgba(248,186,3,0.65)] hover:shadow-[0_18px_50px_rgba(248,186,3,0.85)] ring-4 ring-amber-300 ring-offset-2 ring-offset-white hover:ring-amber-500 transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center h-20 w-20 sm:h-22 sm:w-22 cursor-pointer border-2 border-white overflow-visible group"
          title="Medi - Your Personal AI Assistant"
          aria-label="Open Medi AI Assistant"
        >
          {isOpen ? (
            <span className="text-3xl font-black text-slate-900 leading-none">✕</span>
          ) : (
            <>
              {/* Pulsing Active Online Badge */}
              <span className="absolute -top-2.5 -right-1 z-20 flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full ring-2 ring-white shadow-md animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                Ask Medi
              </span>

              {/* 3D Owl Doctor Character Image with Ambient Glow */}
              <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <Image
                  src="/images/ai-med-bot.png"
                  alt="Medi AI Assistant"
                  fill
                  sizes="96px"
                  priority
                  className="object-cover object-center drop-shadow-md"
                />
              </div>
            </>
          )}
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          2. CHAT WINDOW PANEL
      ────────────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-24 sm:bottom-28 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] max-w-[440px] h-[520px] max-h-[80vh] z-50 bg-[#FAF8F5] border-2 border-amber-300 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 select-none">
          
          {/* Header with 3D Owl Avatar */}
          <div className="bg-gradient-to-r from-amber-300 via-[#FFCB05] to-yellow-300 text-slate-950 px-5 py-3.5 flex justify-between items-center flex-shrink-0 shadow-sm border-b border-amber-300">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full bg-white shadow-xs overflow-hidden border-2 border-white flex-shrink-0">
                <Image
                  src="/images/ai-med-bot.png"
                  alt="Medi"
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-black text-sm leading-tight text-slate-900 font-heading flex items-center gap-1.5">
                  <span>Medi</span>
                  <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-200/80 px-1.5 py-0.2 rounded-md">
                    Personal AI Assistant
                  </span>
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-700 animate-pulse" />
                  <span className="text-[10px] text-amber-950 font-bold">Storefront, Medicines &amp; Support</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-white/70 hover:bg-white text-slate-900 flex items-center justify-center text-xs font-black transition-colors cursor-pointer"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Medical Disclaimer Warning Banner */}
          <div className="bg-[#FEF9C3] border-b border-amber-200/80 px-4 py-1.5 text-[10px] text-amber-900 leading-tight flex items-center gap-1.5 flex-shrink-0">
            <span>🛡️</span>
            <span><strong>Medical Disclaimer:</strong> Suggestions are informational. Always consult a licensed doctor.</span>
          </div>

          {/* Messages Body */}
          <div className="flex-grow p-4 overflow-y-auto bg-slate-50/50 flex flex-col gap-3.5">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2 max-w-[92%] ${
                  msg.role === 'user' ? 'self-end justify-end' : 'self-start justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="relative w-6 h-6 rounded-full overflow-hidden border border-amber-300 flex-shrink-0 bg-white mt-1 shadow-3xs">
                    <Image
                      src="/images/ai-med-bot.png"
                      alt="AI Med-Bot"
                      fill
                      sizes="24px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-amber-300 to-[#FFCB05] text-slate-950 font-semibold rounded-br-none shadow-xs'
                      : 'bg-white text-slate-800 border border-amber-100/90 rounded-bl-none shadow-xs'
                  }`}
                >
                  {msg.content}

                  {/* Interactive Product Cards in Chat */}
                  {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-amber-100 flex flex-col gap-2">
                      <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">
                        Matched Medikart Products:
                      </span>
                      <div className="grid grid-cols-1 gap-1.5">
                        {msg.suggestedProducts.map((p) => (
                          <Link
                            key={p._id}
                            href={`/?search=${encodeURIComponent(p.name)}#store-catalog`}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-between p-2 rounded-xl bg-amber-50/60 hover:bg-amber-100/80 border border-amber-200/70 transition-all group"
                          >
                            <div className="text-left pr-2">
                              <p className="font-bold text-slate-900 text-[11px] line-clamp-1 group-hover:text-amber-800">
                                {p.name}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                Rs. {Number(p.price).toFixed(2)} PKR • {p.stockStatus === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold text-amber-700 bg-white px-2 py-0.5 rounded-md border border-amber-200 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                              View →
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="self-start max-w-[85%] flex items-center gap-2">
                <div className="relative w-6 h-6 rounded-full overflow-hidden border border-amber-300 flex-shrink-0 bg-white shadow-3xs animate-bounce">
                  <Image
                    src="/images/ai-med-bot.png"
                    alt="AI Med-Bot"
                    fill
                    sizes="24px"
                    className="object-cover"
                  />
                </div>
                <div className="bg-white border border-amber-200 rounded-2xl rounded-bl-none px-4 py-2.5 text-xs text-amber-800 shadow-xs flex items-center gap-2">
                  <span className="text-xs font-semibold">🔍 Searching catalog...</span>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Strip */}
          {messages.length <= 2 && !loading && (
            <div className="px-3 py-2 bg-amber-50/70 border-t border-amber-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0">
              {quickPrompts.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sendMessage(q)}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white hover:bg-amber-100 border border-amber-200 text-[10px] font-bold text-slate-800 shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <form onSubmit={handleSend} className="p-3 border-t border-amber-100 bg-white flex gap-2 flex-shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about medicines, delivery, orders, policies..."
              disabled={loading}
              className="flex-grow border border-amber-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 disabled:opacity-50 text-slate-900 placeholder:text-slate-400 bg-[#FAF8F5]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-amber-gradient text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all disabled:opacity-40 cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
            >
              <span>Send</span>
              <span>→</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
