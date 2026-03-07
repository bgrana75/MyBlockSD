'use client';

import { useState, useRef, useEffect } from 'react';
import { streamChat } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant' | 'status';
  content: string;
}

interface Props {
  locationContext?: {
    address: string;
    lat: number;
    lng: number;
    neighborhood: string;
  };
  agentAvailable: boolean;
}

const SUGGESTIONS = [
  "What should I know about this neighborhood?",
  "What are the biggest issues on my block?",
  "Any active construction permits near me?",
  "What's happening right now?",
  "How does this area compare for pothole response times?",
];

export default function ChatPanel({ locationContext, agentAvailable }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  if (!agentAvailable) return null;

  async function sendMessage(userMessage: string) {
    const userMsg: Message = { role: 'user', content: userMessage };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    // Build conversation for API (only user/assistant roles)
    const apiMessages = [...messages, userMsg]
      .filter((m) => m.role !== 'status')
      .map((m) => ({ role: m.role as string, content: m.content }));

    let assistantContent = '';
    try {
      await streamChat(apiMessages, locationContext, (event) => {
        if (event.type === 'tool_use') {
          setMessages((prev) => [...prev, { role: 'status', content: event.content }]);
        } else if (event.type === 'text') {
          assistantContent += event.content;
          setMessages((prev) => {
            const filtered = prev.filter((m) => m !== prev.findLast((x) => x.role === 'assistant' && x === prev[prev.length - 1]));
            // Remove last assistant msg if it exists (we're appending)
            const last = prev[prev.length - 1];
            if (last?.role === 'assistant') {
              return [...prev.slice(0, -1), { role: 'assistant', content: assistantContent }];
            }
            return [...prev, { role: 'assistant', content: assistantContent }];
          });
        } else if (event.type === 'error') {
          setMessages((prev) => [...prev, { role: 'status', content: `Error: ${event.content}` }]);
        }
      });
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'status', content: 'Failed to connect to agent' }]);
    }
    setIsStreaming(false);
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white px-5 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-all z-50 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z" clipRule="evenodd" />
          </svg>
          Ask about this area
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 w-full sm:w-[420px] h-[600px] sm:bottom-6 sm:right-6 bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-blue-600 rounded-t-2xl">
            <div>
              <h3 className="text-white font-semibold text-sm">My Block Assistant</h3>
              <p className="text-blue-200 text-xs">Powered by Claude</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-blue-200 p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 text-center">Ask me anything about your neighborhood</p>
                <div className="space-y-2">
                  {SUGGESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      disabled={isStreaming}
                      className="w-full text-left text-sm bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 p-3 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : msg.role === 'status' ? 'justify-center' : 'justify-start'}`}>
                {msg.role === 'status' ? (
                  <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                    {msg.content}
                  </span>
                ) : (
                  <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}>
                    {msg.content}
                  </div>
                )}
              </div>
            ))}

            {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3">
            <form onSubmit={(e) => { e.preventDefault(); if (input.trim() && !isStreaming) sendMessage(input.trim()); }} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your neighborhood..."
                disabled={isStreaming}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isStreaming || !input.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
