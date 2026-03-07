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
  "What should I know about this area?",
  "What are the biggest issues nearby?",
  "Any active construction permits?",
  "How does my block compare?",
];

export default function ChatPanel({ locationContext, agentAvailable }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (!agentAvailable) {
    return (
      <div className="flex items-center justify-center h-full text-muted text-sm">
        AI assistant is not available right now.
      </div>
    );
  }

  async function sendMessage(userMessage: string) {
    const userMsg: Message = { role: 'user', content: userMessage };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

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
    } catch {
      setMessages((prev) => [...prev, { role: 'status', content: 'Failed to connect to agent' }]);
    }
    setIsStreaming(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-muted mb-4">Ask anything about your neighborhood</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={isStreaming}
                  className="text-left text-xs bg-surface-alt hover:bg-primary/10 text-foreground/60 hover:text-primary-light p-3 rounded-xl transition-all disabled:opacity-50 border border-border hover:border-primary/30"
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
              <span className="text-[11px] text-muted bg-surface-alt px-3 py-1 rounded-full flex items-center gap-1.5 border border-border">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                {msg.content}
              </span>
            ) : (
              <div className={`max-w-[85%] px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-2xl rounded-br-md'
                  : 'bg-surface-alt text-foreground rounded-2xl rounded-bl-md border border-border'
              }`}>
                {msg.content}
              </div>
            )}
          </div>
        ))}

        {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="bg-surface-alt px-4 py-3 rounded-2xl rounded-bl-md border border-border">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 bg-surface">
        <form onSubmit={(e) => { e.preventDefault(); if (input.trim() && !isStreaming) sendMessage(input.trim()); }} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your neighborhood..."
            disabled={isStreaming}
            className="flex-1 px-3.5 py-2 border border-border rounded-xl text-sm bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-foreground placeholder:text-muted disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="px-4 py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium hover:from-primary-light hover:to-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
