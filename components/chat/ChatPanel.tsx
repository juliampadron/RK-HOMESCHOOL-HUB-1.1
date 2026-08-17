'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useMemo, useRef } from 'react';

interface ChatPanelProps {
  /** API endpoint for this assistant, e.g. "/api/chat/parent" */
  endpoint: string;
  title: string;
  placeholder?: string;
  /** Tailwind bg class for the send button, e.g. "bg-rk-green" */
  accentClass?: string;
}

export default function ChatPanel({
  endpoint,
  title,
  placeholder = 'Type a message…',
  accentClass = 'bg-rk-green',
}: ChatPanelProps) {
  // Keep the transport stable across message/status re-renders. Recreate it only
  // when the configured API endpoint changes.
  const transport = useMemo(
    () => new DefaultChatTransport({ api: endpoint }),
    [endpoint]
  );

  const { messages, sendMessage, status } = useChat({ transport });
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to newest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = inputRef.current?.value.trim();
    if (!text || status === 'submitted' || status === 'streaming') return;

    sendMessage({ text });
    if (inputRef.current) inputRef.current.value = '';
  }

  const isLoading = status === 'submitted' || status === 'streaming';

  return (
    <section
      aria-label={title}
      aria-busy={isLoading}
      data-chat-status={status}
      className="flex flex-col h-[520px] border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden"
    >
      {/* Message list */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messages.length === 0 && (
          <p className="text-sm text-gray-400 text-center mt-8">
            No messages yet. Say hello!
          </p>
        )}
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const textContent = msg.parts
            .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
            .map((p) => p.text)
            .join('');

          return (
            <div
              key={msg.id}
              data-chat-role={msg.role}
              data-chat-message-id={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-rk-green text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}
              >
                {textContent}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex justify-start" data-chat-thinking="true">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2 text-sm text-gray-400 animate-pulse">
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-100 p-3 flex gap-2"
      >
        <input
          ref={inputRef}
          data-chat-input="true"
          type="text"
          placeholder={placeholder}
          disabled={isLoading}
          aria-label="Message input"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rk-green disabled:opacity-50"
        />
        <button
          type="submit"
          data-chat-send="true"
          disabled={isLoading}
          aria-label="Send message"
          className={`px-4 py-2 rounded-lg text-white text-sm font-semibold ${accentClass} hover:opacity-90 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-rk-green`}
        >
          Send
        </button>
      </form>
    </section>
  );
}
