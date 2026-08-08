import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings2,
  User,
  Bot,
  Edit3,
  Trash2,
  History,
  Save,
  X,
  Lightbulb,
  Check,
  EyeOff,
} from 'lucide-react';
import { api } from '../lib/api';

interface Preference {
  id: string;
  category: string;
  key: string;
  value: any;
  source: string;
  confidence: number;
  importance: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Suggestion {
  id: string;
  category: string;
  key: string;
  proposed_value: any;
  reason: string;
  confidence: number;
  source: string;
}

const DISPLAY_LABELS: Record<string, string> = {
  preferred_airlines: 'Preferred Airlines',
  avoid_airlines: 'Avoid Airlines',
  max_flight_budget: 'Normal Flight Budget',
  max_stops: 'Maximum Stops',
  preferred_seat: 'Preferred Seat',
  preferred_cabin: 'Cabin Class',
  preferred_departure_time: 'Departure Time',
  max_flight_duration: 'Max Flight Duration',
  prefer_direct_flights: 'Prefer Direct Flights',
  preferred_airports: 'Preferred Airports',
  baggage_requirement: 'Baggage Requirement',
  willing_to_pay_extra_for_direct: 'Extra for Direct Flights',
};

const SOURCE_LABELS: Record<string, { label: string; icon: typeof User }> = {
  USER_EXPLICIT: { label: 'You', icon: User },
  USER_CORRECTION: { label: 'Your Correction', icon: Edit3 },
  AI_INFERRED: { label: 'AI Inferred', icon: Bot },
  IMPORTED: { label: 'Imported', icon: Settings2 },
};

function formatValue(value: any): string {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return `₹${value.toLocaleString()}`;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function confidenceLabel(c: number): string {
  if (c >= 0.9) return 'High';
  if (c >= 0.6) return 'Medium';
  return 'Low';
}

export default function Preferences() {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [historyFor, setHistoryFor] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prefs, sugs] = await Promise.all([
        api.getPreferences('travel', 'ACTIVE'),
        api.getSuggestions(),
      ]);
      setPreferences(prefs);
      setSuggestions(sugs);
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (pref: Preference) => {
    setEditing(pref.id);
    setEditValue(typeof pref.value === 'string' ? pref.value : JSON.stringify(pref.value));
  };

  const saveEdit = async (id: string) => {
    try {
      let parsedValue: any;
      try {
        parsedValue = JSON.parse(editValue);
      } catch {
        parsedValue = editValue;
      }
      await api.updatePreference(id, { value: parsedValue, source: 'USER_EXPLICIT' });
      setEditing(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const deletePref = async (id: string) => {
    try {
      await api.deletePreference(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const showHistory = async (id: string) => {
    setHistoryFor(id);
    try {
      const h = await api.getPreferenceHistory(id);
      setHistory(h);
    } catch (err) {
      setHistory([]);
    }
  };

  const acceptSuggestion = async (id: string) => {
    try {
      await api.acceptSuggestion(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const ignoreSuggestion = async (id: string) => {
    try {
      await api.ignoreSuggestion(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">What My Agent Knows</h1>
        <p className="text-sm text-text-secondary">
          Your travel preferences — edit, review, or see where they came from.
        </p>
      </div>

      {/* Suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-ask" /> Preference Suggestions
            </h2>
            {suggestions.map((s) => (
              <div key={s.id} className="glass p-4 border-ask/20">
                <p className="text-sm text-text-primary mb-1">{s.reason}</p>
                <p className="text-xs text-text-muted mb-3">
                  Suggested: {formatValue(s.proposed_value)} • Confidence: {Math.round(s.confidence * 100)}%
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptSuggestion(s.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
                  >
                    <Check className="w-3 h-3" /> Remember
                  </button>
                  <button
                    onClick={() => ignoreSuggestion(s.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium glass glass-hover text-text-secondary rounded-lg transition-colors"
                  >
                    <EyeOff className="w-3 h-3" /> Ignore
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preferences List */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Travel Preferences
        </h2>
        {preferences.length === 0 ? (
          <div className="glass p-8 text-center">
            <p className="text-text-muted">No preferences yet. Complete onboarding to get started.</p>
          </div>
        ) : (
          preferences.map((pref, i) => {
            const sourceInfo = SOURCE_LABELS[pref.source] || SOURCE_LABELS.USER_EXPLICIT;
            const SourceIcon = sourceInfo.icon;

            return (
              <motion.div
                key={pref.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass p-4 glass-hover transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary mb-1">
                      {DISPLAY_LABELS[pref.key] || pref.key}
                    </p>

                    {editing === pref.id ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 bg-surface-800 border border-glass-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary-500/50"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit(pref.id)}
                        />
                        <button onClick={() => saveEdit(pref.id)} className="p-1.5 text-approve hover:bg-approve/10 rounded-lg transition-colors">
                          <Save className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditing(null)} className="p-1.5 text-text-muted hover:bg-white/5 rounded-lg transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-text-secondary">{formatValue(pref.value)}</p>
                    )}

                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <SourceIcon className="w-3 h-3" />
                        Source: {sourceInfo.label}
                      </span>
                      <span className="text-xs text-text-muted">
                        Confidence: {confidenceLabel(pref.confidence)}
                      </span>
                    </div>
                  </div>

                  {editing !== pref.id && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(pref)}
                        className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => showHistory(pref.id)}
                        className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors"
                        title="History"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deletePref(pref.id)}
                        className="p-1.5 text-text-muted hover:text-reject hover:bg-reject/5 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {historyFor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setHistoryFor(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass p-6 max-w-md w-full max-h-[60vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-text-primary">Version History</h3>
                <button onClick={() => setHistoryFor(null)} className="p-1 text-text-muted hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {history.length === 0 ? (
                <p className="text-sm text-text-muted">No version history available.</p>
              ) : (
                <div className="space-y-3">
                  {history.map((v, i) => (
                    <div key={v.id} className="bg-surface-800/50 rounded-xl p-3">
                      <p className="text-sm font-medium text-text-primary">
                        Version {history.length - i}
                      </p>
                      <p className="text-sm text-text-secondary mt-0.5">{formatValue(v.value)}</p>
                      <p className="text-xs text-text-muted mt-1">
                        {new Date(v.created_at).toLocaleString()} • {v.changed_by}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
