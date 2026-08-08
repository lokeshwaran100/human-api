import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle2, Edit3, Loader2, Sparkles } from 'lucide-react';
import { api } from '../lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ExtractedPref {
  category: string;
  key: string;
  value: any;
  type: string;
  source: string;
  confidence: number;
  display_label: string;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your Personal Agent. Let's learn how you make travel decisions so I can help in the future.\n\nWhat matters most to you when choosing a flight? Think about things like price, airlines, comfort, or convenience." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedPref[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage: Message = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await api.onboardingChat(updatedMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);

      if (res.extracted_preferences?.length > 0) {
        setExtracted(res.extracted_preferences);
        setShowConfirmation(true);
      }
      if (res.is_complete && res.extracted_preferences?.length > 0) {
        setExtracted(res.extracted_preferences);
        setShowConfirmation(true);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const confirmPreferences = async () => {
    setConfirming(true);
    try {
      await api.confirmOnboarding(extracted);
      navigate('/preferences');
    } catch (err) {
      console.error(err);
    } finally {
      setConfirming(false);
    }
  };

  const formatValue = (value: any): string => {
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return `₹${value.toLocaleString()}`;
    return String(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Agent Onboarding</h1>
        <p className="text-sm text-text-secondary">
          Tell your agent about your preferences through a natural conversation.
        </p>
      </div>

      <div className="glass overflow-hidden">
        {/* Chat area */}
        <div className="h-[420px] overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-agent'
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div className="flex justify-start">
              <div className="chat-bubble-agent px-4 py-3 flex items-center gap-2 text-sm text-text-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-glass-border p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Tell your agent about your preferences..."
              className="flex-1 bg-surface-800 border border-glass-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-500/50 transition-colors"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Panel */}
      <AnimatePresence>
        {showConfirmation && extracted.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass mt-6 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary-600/15 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  I understood the following
                </h3>
                <p className="text-xs text-text-muted">
                  Please confirm these preferences are correct.
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {extracted.map((pref, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-2.5 bg-surface-800/50 rounded-xl"
                >
                  <CheckCircle2 className="w-4 h-4 text-approve shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">
                      {pref.display_label}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {formatValue(pref.value)}
                    </p>
                  </div>
                  <span className="text-xs text-text-muted">
                    {Math.round(pref.confidence * 100)}%
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmPreferences}
                disabled={confirming}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-xl transition-colors disabled:opacity-60"
              >
                {confirming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Confirm Preferences
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2.5 glass glass-hover text-text-secondary font-medium rounded-xl transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
