'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import MobileNav from '@/app/components/MobileNav';
import { ChatResponse, ChatErrorResponse } from '@/types/chat-query';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date | string;
  intent?: string;
}

interface Suggestion {
  title: string;
  query: string;
  icon: string;
}

export default function ChatPage() {
  const { logout } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions on mount
  useEffect(() => {
    fetchSuggestions();
    // Add initial greeting
    setMessages([
      {
        id: '0',
        type: 'assistant',
        content: 'Hi! 👋 I can help you analyze your financial data. Ask me about your transactions, expenses, income, or get a financial summary.',
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSuggestions = async () => {
    try {
      const res = await fetch('/api/chat-query');
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Send to chat query API
      const res = await fetch('/api/chat-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });

      if (!res.ok) {
        const error = (await res.json()) as ChatErrorResponse;
        throw new Error(error.error || 'Failed to process query');
      }

      const response = (await res.json()) as ChatResponse;

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.formattedResponse,
        timestamp: response.timestamp,
        intent: response.intent,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An error occurred';
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `❌ Error: ${errorMsg}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <MobileNav currentPage="/chat" />
      <div className="flex-1 lg:ml-0 pt-16 lg:pt-0 lg:ml-64 w-full">
        <div className="max-w-7xl mx-auto p-4 pt-4">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">💬 Financial Chat</h1>
            <p className="text-gray-600 mt-1">Ask natural language questions about your finances</p>
          </div>

          {/* Chat Container */}
          <div className="bg-white rounded-lg shadow-md flex flex-col h-[600px]">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 border-b border-gray-200">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p>No messages yet. Start a conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const timeStr = typeof msg.timestamp === 'string' 
                ? new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : msg.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
              
              return (
              <div
                key={msg.id}
                className={`mb-4 flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-lg ${
                    msg.type === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm md:text-base break-words">
                    {msg.content}
                  </p>
                  <p className="text-xs mt-1 opacity-70">
                    {timeStr}
                  </p>
                </div>
              </div>
            );
            })
          )}
          {loading && (
            <div className="mb-4 flex justify-start">
              <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg rounded-bl-none">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
            <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions (shown when no messages) */}
            {messages.length === 1 && suggestions.length > 0 && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <p className="text-sm text-gray-600 mb-3 font-medium">Quick Actions:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.query}
                      onClick={() => handleSendMessage(suggestion.query)}
                      className="text-left p-2 bg-white border border-gray-200 rounded hover:border-blue-500 hover:bg-blue-50 transition text-xs"
                    >
                      <div className="text-base mb-1">{suggestion.icon}</div>
                      <div className="font-medium text-gray-900 text-xs">{suggestion.title}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask about your finances... (e.g., 'Top 5 expenses')"
                className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
                disabled={loading}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium text-sm"
              >
                {loading ? '...' : 'Send'}
              </button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>💡 Tip: Try asking about expenses, income, transactions, or get a financial summary</p>
          </div>
        </div>
      </div>
    </div>
  );;
}
