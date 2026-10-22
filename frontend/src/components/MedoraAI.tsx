import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Send, Bot, Sparkles, RefreshCw, AlertCircle, ChevronDown,
  Calendar, FileText, Receipt, Shield, ExternalLink, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, AiStatusResponse } from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
  modelUsed?: string;
  suggestedRoute?: { label: string; path: string };
}

const DEFAULT_SUGGESTIONS = [
  { label: 'Book an Appointment', query: 'How do I book an appointment with a specialist?', path: '/appointments/book' },
  { label: 'View Medical Records', query: 'Where can I access my medical records and lab reports?', path: '/portal/medical-records' },
  { label: 'Billing & Invoices', query: 'How do I download my tax invoices and view charges?', path: '/portal/billing' },
  { label: 'Campus Visiting Hours', query: 'What are the visiting hours for inpatient wards and ICU?', path: '/' },
];

export default function MedoraAI() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<AiStatusResponse | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check backend AI status on mount
  useEffect(() => {
    let active = true;
    api.aiStatus()
      .then((res) => {
        if (active) {
          setStatus(res);
          setCheckingStatus(false);
        }
      })
      .catch(() => {
        if (active) {
          setStatus({ configured: false, model: 'AI Assistant', message: 'Unable to connect to AI service' });
          setCheckingStatus(false);
        }
      });
    return () => { active = false; };
  }, []);

  // Auto-scroll on new messages or loading
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  const detectSuggestedRoute = (text: string): { label: string; path: string } | undefined => {
    const lower = text.toLowerCase();
    if (lower.includes('book') || lower.includes('slot') || lower.includes('consultation')) {
      return { label: 'Go to Appointment Booking', path: '/appointments/book' };
    }
    if (lower.includes('record') || lower.includes('prescription') || lower.includes('lab result')) {
      return { label: 'Go to Medical Records', path: '/portal/medical-records' };
    }
    if (lower.includes('invoice') || lower.includes('bill') || lower.includes('payment')) {
      return { label: 'Go to Billing & Invoices', path: '/portal/billing' };
    }
    if (lower.includes('doctor') || lower.includes('specialist') || lower.includes('faculty')) {
      return { label: 'Browse Doctors Directory', path: '/doctors' };
    }
    return undefined;
  };

  const handleSendMessage = useCallback(async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.aiChat(query);
      if (response.success && response.reply) {
        const assistantMsg: Message = {
          id: `asst_${Date.now()}`,
          role: 'assistant',
          content: response.reply,
          timestamp: new Date(),
          modelUsed: response.model_used,
          suggestedRoute: detectSuggestedRoute(response.reply),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const errMsg: Message = {
          id: `err_${Date.now()}`,
          role: 'error',
          content: response.error || 'Medora AI is currently unavailable. Please try again.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);
      }
    } catch (err: any) {
      let friendlyError = 'Could not communicate with Medora AI.';
      if (err?.status === 401 || err?.status === 403) {
        friendlyError = 'Please sign in to your Medora account to chat with the assistant.';
      } else if (err?.message) {
        friendlyError = err.message;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'error',
          content: friendlyError,
          timestamp: new Date(),
          suggestedRoute: (err?.status === 401 || err?.status === 403)
            ? { label: 'Sign In to Medora', path: '/login' }
            : undefined,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[9000] flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#178B8B] to-[#106E70] text-white rounded-full shadow-xl shadow-teal-900/25 border border-teal-300/30 hover:scale-105 active:scale-95 transition-all duration-200 group focus:outline-none focus:ring-4 focus:ring-teal-400/40"
          aria-label="Open Medora AI Clinical Assistant"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-teal-200 group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
              Medora AI

            </span>
            <span className="text-[10px] text-teal-100/90 font-medium hidden sm:inline">
              Instant Hospital Assistant
            </span>
          </div>
        </button>
      )}

      {/* Floating Chat Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Medora AI Assistant"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9500] w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[85vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-white/60 bg-white/90 backdrop-blur-2xl transition-all duration-300 animate-slide-up"
          style={{
            boxShadow: '0 25px 60px -15px rgba(0, 32, 67, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)',
          }}
        >
          {/* Header */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-[#002043] via-[#002b54] to-[#178B8B] text-white flex items-center justify-between border-b border-white/10 shrink-0 select-none">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <Bot className="w-5 h-5 text-teal-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm tracking-tight text-white">Medora AI</h3>
                  <span className="px-2 py-0.5 rounded-full bg-teal-400/20 border border-teal-300/30 text-[10px] font-semibold text-teal-200">
                    'AI Assistant'
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      status?.configured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <p className="text-[10px] text-teal-100/80">
                    {status?.configured ? 'Online • Ready to assist' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  title="Clear conversation"
                  className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition"
                  aria-label="Clear chat"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize assistant"
                className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition"
                aria-label="Close chat"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gradient-to-b from-[#f8fbfe]/70 via-white/50 to-[#eef6fc]/60">
            {/* Welcome card if no messages */}
            {messages.length === 0 && (
              <div className="space-y-4 py-2 animate-fade-in">
                <div className="p-4 rounded-2xl bg-white/80 border border-teal-100/80 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-teal-700 font-semibold text-xs">
                    <Sparkles className="w-4 h-4" />
                    <span>Welcome to Medora Health Assistant</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hello{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! I can answer questions about clinical services, help you find doctors, explain outpatient workflows, or guide you through appointments and medical records.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                    Suggested Questions
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {DEFAULT_SUGGESTIONS.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(item.query)}
                        className="w-full text-left p-2.5 rounded-xl bg-white/70 hover:bg-white hover:border-teal-300 border border-slate-200/70 text-xs text-slate-700 font-medium transition shadow-xs flex items-center justify-between group"
                      >
                        <span className="truncate pr-2">{item.query}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-teal-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Render message list */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-[#178B8B] to-[#106E70] text-white rounded-br-xs shadow-md shadow-teal-900/10'
                      : msg.role === 'error'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200 rounded-bl-xs'
                      : 'bg-white/95 text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Quick Action Navigation Link */}
                  {msg.suggestedRoute && (
                    <button
                      onClick={() => {
                        navigate(msg.suggestedRoute!.path);
                        setIsOpen(false);
                      }}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-bold hover:bg-teal-100 transition text-[11px]"
                    >
                      <span>{msg.suggestedRoute.label}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex items-center gap-2 p-3 max-w-[120px] rounded-2xl bg-white/90 border border-slate-200/80 rounded-bl-xs shadow-xs animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-[10px] text-slate-400 font-medium ml-1">Thinking</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input & Footer */}
          <div className="p-3 bg-white/95 border-t border-slate-200/80 shrink-0 space-y-2">
            <div className="relative flex items-end gap-2 bg-slate-50/90 rounded-2xl border border-slate-200/80 p-1.5 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-400/20 transition">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Medora AI anything (appointments, records, visiting hours)..."
                rows={1}
                disabled={loading}
                className="flex-1 bg-transparent border-0 text-xs text-slate-800 placeholder-slate-400 px-2 py-1.5 focus:outline-none resize-none max-h-24"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={loading || !input.trim()}
                className="p-2 bg-gradient-to-r from-[#178B8B] to-[#106E70] text-white rounded-xl disabled:opacity-40 hover:opacity-95 active:scale-95 transition shadow-sm shrink-0"
                aria-label="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[10px] text-slate-400 text-center leading-tight">
              Medora AI is informational. For emergencies, dial <strong className="text-rose-600">1066</strong> immediately.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
