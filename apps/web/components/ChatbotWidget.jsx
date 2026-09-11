"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { sendChatbotMessage } from '../lib/api';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your Medikart AI Medicine & Symptom Assistant 💊.\n\nAsk me about medicine availability, prices, or describe your symptoms (e.g. headache, fever, cough), and I will search our authentic catalog for you!\n\nDisclaimer: I am an AI, not a doctor. This suggestion is for informational purposes only. Consult a physician for medical advice.',
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
        content: `⚠️ I'm having trouble connecting to the medicine assistant right now. Please try asking again in a moment, or speak directly with our licensed pharmacist on WhatsApp: +92 331 4170744.`
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
    "Is Panadol available?",
    "Suggest something for headache",
    "Do you have Augmentin in stock?",
    "Medicine for fever & cough",
  ];

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────────
          1. FLOATING CHAT BUTTON (Larger, more noticeable, glowing amber)
      ────────────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-5 right-4 sm:right-6 z-40 flex items-center group">
        
        {/* Playful Floating Desktop Greeting Pill */}
        {!isOpen && showTooltip && (
          <div 
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-amber-200 shadow-xl text-xs font-bold text-slate-800 mr-3 cursor-pointer hover:border-amber-400 hover:shadow-amber-glow transition-all transform hover:-translate-x-1 select-none"
          >
            <span className="text-sm">💬</span>
            <span>Need medicine? Ask AI</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        )}

        {/* Floating Chat Button */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setShowTooltip(false);
          }}
          className="relative bg-gradient-to-tr from-amber-400 via-[#FFCB05] to-yellow-300 hover:from-amber-500 hover:via-[#FFCB05] hover:to-yellow-200 text-slate-950 rounded-full shadow-[0_8px_25px_rgba(248,186,3,0.45)] hover:shadow-[0_12px_32px_rgba(248,186,3,0.65)] ring-4 ring-amber-200/60 transition-all hover:scale-110 active:scale-95 flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 cursor-pointer border border-amber-300"
          title="Medikart AI Medicine Assistant"
          aria-label="Open AI Medicine Assistant"
        >
          {isOpen ? (
            <span className="text-2xl font-black text-slate-900 leading-none">✕</span>
          ) : (
            <>
              {/* Pulsing Active Online Badge */}
              <span className="absolute -top-1.5 -right-1 flex items-center gap-1 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-white shadow-sm animate-pulse">
                Ask AI
              </span>
              <span className="text-2xl sm:text-3xl filter drop-shadow-xs">🤖</span>
            </>
          )}
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          2. CHAT WINDOW PANEL
      ────────────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-22 sm:bottom-26 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] max-w-[440px] h-[520px] max-h-[80vh] z-50 bg-[#FAF8F5] border border-amber-200/90 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 select-none">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-300 via-[#FFCB05] to-yellow-300 text-slate-950 px-5 py-3.5 flex justify-between items-center flex-shrink-0 shadow-sm border-b border-amber-300">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/90 shadow-xs flex items-center justify-center text-lg">
                🤖
              </div>
              <div>
                <h3 className="font-black text-sm leading-tight text-slate-900 font-heading">
                  Medikart AI Assistant
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-700 animate-pulse" />
                  <span className="text-[10px] text-amber-950 font-bold">Catalog &amp; Symptoms Live</span>
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
                className={`flex flex-col max-w-[88%] ${
                  msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
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
              <div className="self-start max-w-[85%] flex flex-col items-start">
                <div className="bg-white border border-amber-200 rounded-2xl rounded-bl-none px-4 py-2.5 text-xs text-amber-800 shadow-xs flex items-center gap-2">
                  <span className="text-xs">🔍 Searching catalog...</span>
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
              placeholder="Ask about medicine or symptoms..."
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
