import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Eye,
  EyeOff,
  Undo2,
} from 'lucide-react';
import { api } from '../lib/api';

interface DecisionItem {
  request_id: string;
  agent_id: string;
  decision_type: string;
  payload: any;
  status: string;
  created_at: string;
  agents: { name: string } | null;
  decision_result: {
    decision: string;
    confidence: number;
    reason: string;
    matched_policies: string[];
    matched_preferences: string[];
    requires_user_action: boolean;
  } | null;
}

const DECISION_STYLES: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
  APPROVE: { icon: CheckCircle2, color: 'text-approve', bg: 'decision-approve', label: 'APPROVED' },
  REJECT: { icon: XCircle, color: 'text-reject', bg: 'decision-reject', label: 'REJECTED' },
  ASK_USER: { icon: AlertTriangle, color: 'text-ask', bg: 'decision-ask', label: 'AWAITING YOU' },
};

export default function Activity() {
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [overriding, setOverriding] = useState<string | null>(null);

  useEffect(() => {
    loadDecisions();
  }, []);

  const loadDecisions = async () => {
    try {
      const data = await api.getDecisions();
      setDecisions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproval = async (requestId: string, decision: string) => {
    try {
      await api.approveDecision(requestId, decision);
      loadDecisions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOverride = async (requestId: string, decision: string, remember: boolean) => {
    try {
      await api.overrideDecision(requestId, {
        override_decision: decision,
        remember_preference: remember,
      });
      setOverriding(null);
      loadDecisions();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">Decision Activity</h1>
        <p className="text-sm text-text-secondary">
          Timeline of all decisions made by your Personal Agent.
        </p>
      </div>

      {decisions.length === 0 ? (
        <div className="glass p-8 text-center">
          <Clock className="w-8 h-8 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">No decisions yet. Use the Travel Agent demo to see decisions appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {decisions.map((item, i) => {
            const result = item.decision_result;
            const style = result ? DECISION_STYLES[result.decision] || DECISION_STYLES.ASK_USER : DECISION_STYLES.ASK_USER;
            const Icon = style.icon;
            const isExpanded = expanded === item.request_id;
            const payload = item.payload || {};

            return (
              <motion.div
                key={item.request_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass overflow-hidden"
              >
                {/* Summary Row */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : item.request_id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${style.bg} flex items-center justify-center`}>
                      <Icon className="w-[18px] h-[18px]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary">
                          {item.agents?.name || 'Unknown Agent'}
                        </p>
                        <span className="text-xs text-text-muted">
                          {item.decision_type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {payload.airline && `${payload.airline} • `}
                        {payload.origin && `${payload.origin} → ${payload.destination} • `}
                        {payload.price && `₹${payload.price.toLocaleString()}`}
                        {payload.stops !== undefined && ` • ${payload.stops === 0 ? 'Direct' : `${payload.stops} stop${payload.stops > 1 ? 's' : ''}`}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold ${style.color}`}>
                      {style.label}
                    </span>
                    <span className="text-xs text-text-muted">
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && result && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-glass-border"
                    >
                      <div className="p-4 space-y-4">
                        {/* Reason */}
                        <div>
                          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Reason</p>
                          <p className="text-sm text-text-secondary">{result.reason}</p>
                        </div>

                        {/* Matched Info */}
                        <div className="grid grid-cols-2 gap-4">
                          {result.matched_policies.length > 0 && (
                            <div>
                              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Policies Matched</p>
                              {result.matched_policies.map((p, j) => (
                                <span key={j} className="inline-flex items-center gap-1 text-xs bg-surface-800 text-text-secondary px-2 py-1 rounded mr-1 mb-1">
                                  <ShieldCheck className="w-3 h-3" /> {p}
                                </span>
                              ))}
                            </div>
                          )}
                          {result.matched_preferences.length > 0 && (
                            <div>
                              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Preferences Matched</p>
                              {result.matched_preferences.map((p, j) => (
                                <span key={j} className="text-xs bg-surface-800 text-text-secondary px-2 py-1 rounded mr-1 mb-1 inline-block">
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-text-muted">
                          <span>Confidence: {Math.round(result.confidence * 100)}%</span>
                        </div>

                        {/* Privacy Notice */}
                        <div className="bg-surface-800/50 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Eye className="w-3.5 h-3.5 text-primary-400" />
                            <span className="text-xs font-medium text-primary-400">External Agent Received</span>
                          </div>
                          <p className="text-xs text-text-muted mb-2">Decision: {result.decision} • Confidence: {Math.round(result.confidence * 100)}%</p>
                          <div className="flex items-center gap-2">
                            <EyeOff className="w-3.5 h-3.5 text-reject" />
                            <span className="text-xs font-medium text-reject">NOT shared with agent</span>
                          </div>
                          <p className="text-xs text-text-muted mt-1">
                            ✗ Your preferences ✗ Budget details ✗ Full reasoning ✗ Personal context
                          </p>
                        </div>

                        {/* Actions */}
                        {result.requires_user_action && item.status === 'AWAITING_USER' && (
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => handleApproval(item.request_id, 'APPROVE')}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-approve/15 hover:bg-approve/25 text-approve text-sm font-medium rounded-xl transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Approve
                            </button>
                            <button
                              onClick={() => handleApproval(item.request_id, 'REJECT')}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-reject/15 hover:bg-reject/25 text-reject text-sm font-medium rounded-xl transition-colors"
                            >
                              <XCircle className="w-4 h-4" /> Reject
                            </button>
                          </div>
                        )}

                        {/* Override */}
                        {result.decision === 'REJECT' && item.status === 'COMPLETED' && (
                          <>
                            {overriding === item.request_id ? (
                              <div className="glass p-3 border-ask/20">
                                <p className="text-sm text-text-primary mb-3">
                                  Remember this for future decisions?
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleOverride(item.request_id, 'APPROVE', false)}
                                    className="flex-1 px-3 py-2 glass text-text-secondary text-xs font-medium rounded-lg"
                                  >
                                    Just this time
                                  </button>
                                  <button
                                    onClick={() => handleOverride(item.request_id, 'APPROVE', true)}
                                    className="flex-1 px-3 py-2 bg-primary-600 text-white text-xs font-medium rounded-lg"
                                  >
                                    Remember this
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setOverriding(item.request_id)}
                                className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors"
                              >
                                <Undo2 className="w-3.5 h-3.5" /> Override → Approve
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
