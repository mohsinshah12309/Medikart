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
        content: `⚠️ Failed to get reply: ${err.message || 'Server connection issue'}. Please try again.`
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
        className="fixed bottom-6 right-6 z-50 bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-xl transition-all hover:scale-105 flex items-center justify-center h-14 w-14"
        title="AI Symptom Assistant"
      >
        <span className="text-2xl">💬</span>
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[90vw] h-[500px] z-50 bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* Header */}
          <div className="bg-green-600 text-white p-4 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <div>
                <h3 className="font-bold text-sm leading-tight">Symptom Assistant</h3>
                <span className="text-[10px] text-green-100 font-medium">OTC catalog suggestions</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-green-100 font-bold text-lg p-1 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Warning Banner */}
          <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 text-[10px] text-amber-800 leading-normal flex-shrink-0">
            <strong>Medical Disclaimer:</strong> Suggestions are informational only, not medical advice. Consult a doctor.
          </div>

          {/* Messages Body */}
          <div className="flex-grow p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col max-w-[80%] ${
                  msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                <div
                  className={`rounded-2xl px-4 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-green-600 text-white rounded-br-none shadow-sm'
                      : 'bg-white text-gray-800 border border-gray-150 rounded-bl-none shadow-xs'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="self-start max-w-[80%] flex flex-col items-start">
                <div className="bg-white border border-gray-150 rounded-2xl rounded-bl-none px-4 py-2.5 text-xs text-gray-500 shadow-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSend} className="p-3 border-t border-gray-150 bg-white flex gap-2 flex-shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your symptoms (e.g. fever)..."
              disabled={loading}
              className="flex-grow border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
