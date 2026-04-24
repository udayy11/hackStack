/**
 * Chat Panel — floating AI assistant available on all pages.
 */
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import { sendChatMessage, getChatSuggestions } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I\'m your AI logistics assistant. Ask me anything about your supply chain — shipment delays, risk analysis, route optimization, or demand forecasts.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open && suggestions.length === 0) {
      getChatSuggestions().then(d => setSuggestions(d.suggestions || [])).catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(msg);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: res.message,
        actions: res.suggested_actions,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Sorry, I encountered an error. Please try again.',
      }]);
    }

    setLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full gradient-cyan-purple flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            style={{ boxShadow: '0 0 25px rgba(0, 229, 255, 0.4)' }}
          >
            <MessageSquare className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[60] w-[400px] h-[560px] flex flex-col rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(11, 15, 25, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 229, 255, 0.2)',
              boxShadow: '0 0 40px rgba(0, 229, 255, 0.15)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan" />
                <span className="font-semibold text-sm">AI Assistant</span>
                <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
              </div>
              <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user' ? 'chat-user' : 'chat-ai'
                    }`}
                  >
                    <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                    {msg.actions?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.actions.map((a, j) => (
                          <button
                            key={j}
                            className="text-xs px-2 py-1 rounded-lg bg-cyan/10 text-cyan hover:bg-cyan/20 transition-colors cursor-pointer"
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="chat-ai px-3.5 py-2.5 text-sm text-text-muted">
                    <span className="animate-pulse">Analyzing...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            {messages.length <= 2 && suggestions.length > 0 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {suggestions.slice(0, 4).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-border text-text-secondary hover:border-cyan hover:text-cyan transition-colors cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-border">
              <div className="flex items-center gap-2 rounded-xl bg-bg-card px-3 py-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about your supply chain..."
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted outline-none"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  className="p-1.5 rounded-lg bg-cyan/20 text-cyan hover:bg-cyan/30 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
