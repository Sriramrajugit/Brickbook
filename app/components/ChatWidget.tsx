'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
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

/**
 * Get time-based greeting
 */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions on mount
  useEffect(() => {
    fetchSuggestions();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize chat with greeting when opened
  useEffect(() => {
    if (isOpen && messages.length === 0 && user) {
      const greeting = getGreeting();
      const userName = user.name || 'User';
      setMessages([
        {
          id: '0',
          type: 'assistant',
          content: `${greeting} ${userName}! 👋 I can help you analyze your financial data. Ask me about your transactions, expenses, income, or get a financial summary.`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, user]);

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
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Unable to process your query'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button - Bottom Right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl transition-all duration-300 z-50 ${
          isOpen
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white`}
        title={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Modal - Slide up from bottom right */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 animate-slideUp border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h2 className="text-lg font-bold">BrickAdvisor</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1 transition"
            >
              ✕
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="mb-4">Ask me anything about your finances!</p>
                {suggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold mb-2">Try asking:</p>
                    {suggestions.slice(0, 3).map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(suggestion.query)}
                        className="w-full text-left text-sm bg-white hover:bg-blue-50 border border-gray-200 rounded p-2 text-blue-600 hover:text-blue-700 transition"
                      >
                        {suggestion.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    <p className="break-words whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {typeof message.timestamp === 'string'
                        ? new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : (message.timestamp as Date).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                    </p>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-800 px-3 py-2 rounded-lg rounded-bl-none">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-3 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question..."
                disabled={loading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition disabled:bg-gray-400"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        .delay-100 {
          animation-delay: 0.1s;
        }

        .delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </>
  );
}
