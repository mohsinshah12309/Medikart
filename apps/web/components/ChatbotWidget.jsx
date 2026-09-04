"use client";

import React, { useState, useEffect, useRef } from 'react';
import { sendChatbotMessage } from '../lib/api';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your AI Symptom Assistant. Tell me what symptoms you are experiencing, and I can suggest safe Over-the-Counter (OTC) medicines from our catalog. Note: I cannot suggest prescription-only medicines or narcotics.\n\nDisclaimer: I am an AI, not a doctor. This suggestion is for informational purposes only. Consult a physician for medical advice.'
    }
  ]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChatbotMessage(userMessage, conversationId);
      if (res && res.data) {
        setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
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
        content: `⚠️ I'm having trouble connecting to the symptom assistant right now. Please try asking again in a moment, or speak directly with our licensed pharmacist on WhatsApp: +92 300 1234567.`
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-4 sm:right-6 z-40 bg-yellow-400 hover:bg-yellow-500 text-slate-950 rounded-full p-3 sm:p-3.5 shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 border border-yellow-500/40"
        title="AI Symptom Assistant"
        aria-label="Open AI Symptom Assistant"
      >
        <span className="text-xl sm:text-2xl">💬</span>
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 max-w-[400px] h-[480px] max-h-[75vh] z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* Header */}
          <div className="bg-yellow-400 text-slate-950 px-4 py-3.5 flex justify-between items-center flex-shrink-0 border-b border-yellow-500/30">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🤖</span>
              <div>
                <h3 className="font-extrabold text-sm leading-tight text-slate-950">Symptom Assistant</h3>
                <span className="text-[10px] text-slate-800 font-semibold">OTC catalog suggestions</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-950 hover:bg-yellow-500/50 rounded-lg p-1.5 font-bold text-sm transition-colors cursor-pointer"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Warning Banner */}
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-[10px] text-amber-900 leading-normal flex-shrink-0">
            <strong>Medical Disclaimer:</strong> Suggestions are informational only, not medical advice. Consult a doctor.
          </div>

          {/* Messages Body */}
          <div className="flex-grow p-4 overflow-y-auto bg-slate-50 flex flex-col gap-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col max-w-[85%] ${
                  msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-yellow-400 text-slate-950 font-medium rounded-br-none shadow-sm'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="self-start max-w-[85%] flex flex-col items-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-2.5 text-xs text-slate-500 shadow-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white flex gap-2 flex-shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe symptoms (e.g. fever)..."
              disabled={loading}
              className="flex-grow border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 disabled:opacity-50 text-slate-900 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-colors disabled:opacity-40 cursor-pointer shadow-sm"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
