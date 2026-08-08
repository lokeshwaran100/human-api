import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  Zap,
  Clock,
  Send,
} from 'lucide-react';
import { api } from '../lib/api';

// Simulated flight search results
const SAMPLE_FLIGHTS = [
  {
    id: 'f1',
    airline: 'Singapore Airlines',
    origin: 'BLR',
    destination: 'NRT',
    date: '2026-10-12',
    price: 45000,
    currency: 'INR',
    stops: 0,
    seat: 'aisle',
    cabin: 'economy',
    duration: '8h 30m',
    departure: '06:30',
  },
  {
    id: 'f2',
    airline: 'Emirates',
    origin: 'BLR',
    destination: 'NRT',
    date: '2026-10-12',
    price: 54000,
    currency: 'INR',
    stops: 0,
    seat: 'aisle',
    cabin: 'economy',
    duration: '9h 15m',
    departure: '14:20',
  },
  {
    id: 'f3',
    airline: 'Singapore Airlines',
    origin: 'BLR',
    destination: 'NRT',
    date: '2026-10-12',
    price: 65000,
    currency: 'INR',
    stops: 0,
    seat: 'aisle',
    cabin: 'economy',
    duration: '7h 45m',
    departure: '23:15',
  },
  {
    id: 'f4',
    airline: 'Air India',
    origin: 'BLR',
    destination: 'NRT',
    date: '2026-10-12',
    price: 42000,
    currency: 'INR',
    stops: 2,
    seat: 'window',
    cabin: 'economy',
    duration: '16h 30m',
    departure: '08:45',
  },
  {
    id: 'f5',
    airline: 'Singapore Airlines',
    origin: 'BLR',
    destination: 'NRT',
    date: '2026-10-12',
    price: 80000,
    currency: 'INR',
    stops: 0,
    seat: 'aisle',
    cabin: 'premium_economy',
    duration: '8h 10m',
    departure: '10:00',
  },
];

interface FlightResult {
  flight: typeof SAMPLE_FLIGHTS[0];
  status: 'pending' | 'evaluating' | 'done';
  decision?: {
    decision: string;
    confidence: number;
    reason: string;
    requires_user_action: boolean;
  };
  request_id?: string;
}

const DECISION_STYLES: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
  APPROVE: { icon: CheckCircle2, color: 'text-approve', bg: 'bg-approve/10', label: '✓ APPROVED' },
  REJECT: { icon: XCircle, color: 'text-reject', bg: 'bg-reject/10', label: '✕ REJECTED' },
  ASK_USER: { icon: AlertTriangle, color: 'text-ask', bg: 'bg-ask/10', label: '⚠ ASK USER' },
};

export default function TravelAgentDemo() {
  const [phase, setPhase] = useState<'idle' | 'searching' | 'evaluating' | 'done'>('idle');
  const [results, setResults] = useState<FlightResult[]>([]);
  const [currentEval, setCurrentEval] = useState(0);
  const [showPrivacy, setShowPrivacy] = useState<string | null>(null);
  const [agentId, setAgentId] = useState('');

  const startSearch = async () => {
    setPhase('searching');
    setResults([]);

    // Check if any agents exist
    try {
      const agents = await api.getAgents();
      const activeAgent = agents.find((a: any) => a.status === 'ACTIVE');
      if (activeAgent) {
        setAgentId(activeAgent.id);
      } else {
        // Auto-register a demo travel agent
        const res = await api.registerAgent({
          name: 'Travel Agent',
          description: 'Finds and evaluates flights',
          capabilities: ['flight_purchase'],
        });
        setAgentId(res.agent_id);
      }
    } catch {
      // If API not connected, use a placeholder
      setAgentId('demo-agent');
    }

    // Simulate search delay
    await new Promise(r => setTimeout(r, 1500));

    const flightResults: FlightResult[] = SAMPLE_FLIGHTS.map(f => ({
      flight: f,
      status: 'pending' as const,
    }));
    setResults(flightResults);
    setPhase('evaluating');

    // Evaluate each flight sequentially
    for (let i = 0; i < flightResults.length; i++) {
      setCurrentEval(i);
      setResults(prev => prev.map((r, j) => j === i ? { ...r, status: 'evaluating' } : r));

      const flight = flightResults[i].flight;
      const requestId = `req_demo_${Date.now()}_${i}`;

      try {
        const result = await api.submitDecision({
          request_id: requestId,
          agent_id: agentId || 'demo-agent',
          decision_type: 'flight_purchase',
          payload: {
            origin: flight.origin,
            destination: flight.destination,
            date: flight.date,
            airline: flight.airline,
            price: flight.price,
            currency: flight.currency,
            stops: flight.stops,
            seat: flight.seat,
            cabin: flight.cabin,
          },
        });

        setResults(prev =>
          prev.map((r, j) =>
            j === i
              ? {
                  ...r,
                  status: 'done',
                  decision: result,
                  request_id: requestId,
                }
              : r
          )
        );
      } catch (err) {
        setResults(prev =>
          prev.map((r, j) =>
            j === i
              ? {
                  ...r,
                  status: 'done',
                  decision: {
                    decision: 'ASK_USER',
                    confidence: 0,
                    reason: 'Unable to evaluate. API may not be connected.',
                    requires_user_action: true,
                  },
                }
              : r
          )
        );
      }

      // Brief pause between evaluations for visual effect
      await new Promise(r => setTimeout(r, 500));
    }

    setPhase('done');
  };

  const handleUserAction = async (index: number, userDecision: string, remember: boolean) => {
    const item = results[index];
    if (!item.request_id) return;

    try {
      await api.overrideDecision(item.request_id, {
        override_decision: userDecision,
        remember_preference: remember,
      });

      setResults(prev =>
        prev.map((r, j) =>
          j === index
            ? {
                ...r,
                decision: {
                  ...r.decision!,
                  decision: userDecision,
                  reason: `User ${userDecision.toLowerCase()}d${remember ? ' (preference remembered)' : ''}`,
                  requires_user_action: false,
                },
              }
            : r
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Travel Agent Demo</h1>
          <p className="text-sm text-text-secondary">
            Watch an external AI agent search for flights and get decisions from your Personal Agent.
          </p>
        </div>
      </div>

      {/* Split View */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: Travel Agent Panel */}
        <div className="lg:col-span-3 space-y-4">
          {/* Agent Header */}
          <div className="glass p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                <Plane className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-primary">Travel Agent</h2>
                <p className="text-xs text-text-muted">External AI Agent • BLR → Tokyo</p>
              </div>
            </div>

            {phase === 'idle' && (
              <button
                onClick={startSearch}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-primary-600/25"
              >
                <Search className="w-4 h-4" /> Search Flights & Evaluate
              </button>
            )}

            {phase === 'searching' && (
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
                Searching flights BLR → Tokyo...
              </div>
            )}

            {(phase === 'evaluating' || phase === 'done') && (
              <div className="flex items-center gap-3 text-sm">
                {phase === 'evaluating' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
                    <span className="text-text-secondary">
                      Evaluating flight {currentEval + 1} of {results.length} with HumanAPI...
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-approve" />
                    <span className="text-approve">
                      All {results.length} flights evaluated
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Flight Results */}
          <AnimatePresence>
            {results.map((item, i) => {
              const flight = item.flight;
              const style = item.decision
                ? DECISION_STYLES[item.decision.decision] || DECISION_STYLES.ASK_USER
                : null;

              return (
                <motion.div
                  key={flight.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="glass overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-text-primary">
                          {flight.airline}
                        </span>
                        <span className="text-xs text-text-muted">
                          {flight.origin} → {flight.destination}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-text-primary">
                        ₹{flight.price.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-text-muted mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {flight.departure}
                      </span>
                      <span>{flight.duration}</span>
                      <span>{flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}</span>
                      <span className="capitalize">{flight.seat}</span>
                      <span className="capitalize">{flight.cabin?.replace('_', ' ')}</span>
                    </div>

                    {/* Decision Status */}
                    {item.status === 'evaluating' && (
                      <div className="flex items-center gap-2 text-sm text-primary-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Evaluating with HumanAPI...</span>
                      </div>
                    )}

                    {item.status === 'done' && style && item.decision && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-text-muted">HumanAPI:</span>
                            <span className={`text-sm font-bold ${style.color}`}>
                              {style.label}
                            </span>
                          </div>
                          <button
                            onClick={() => setShowPrivacy(showPrivacy === flight.id ? null : flight.id)}
                            className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors"
                          >
                            <Shield className="w-3 h-3" /> Privacy
                          </button>
                        </div>

                        <p className="text-xs text-text-secondary">{item.decision.reason}</p>

                        {/* ASK_USER Actions */}
                        {item.decision.requires_user_action && (
                          <div className="bg-surface-800/50 rounded-xl p-3 space-y-3">
                            <p className="text-xs font-medium text-ask">Your approval is needed</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUserAction(i, 'APPROVE', false)}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-approve/15 hover:bg-approve/25 text-approve text-xs font-medium rounded-lg transition-colors"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => handleUserAction(i, 'REJECT', false)}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-reject/15 hover:bg-reject/25 text-reject text-xs font-medium rounded-lg transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            </div>
                            <div className="border-t border-glass-border pt-2">
                              <p className="text-xs text-text-muted mb-2">Remember this preference?</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUserAction(i, 'APPROVE', false)}
                                  className="flex-1 px-3 py-1.5 glass text-text-secondary text-xs rounded-lg hover:bg-white/5"
                                >
                                  Just this time
                                </button>
                                <button
                                  onClick={() => handleUserAction(i, 'APPROVE', true)}
                                  className="flex-1 px-3 py-1.5 bg-primary-600/20 text-primary-400 text-xs rounded-lg hover:bg-primary-600/30"
                                >
                                  Remember this
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Privacy Visualization */}
                        <AnimatePresence>
                          {showPrivacy === flight.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-surface-800/50 rounded-xl p-3 space-y-2"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Eye className="w-3.5 h-3.5 text-approve" />
                                <span className="text-xs font-medium text-approve">Travel Agent received</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
                                <span>✓ Decision: {item.decision.decision}</span>
                                <span>✓ Confidence: {Math.round(item.decision.confidence * 100)}%</span>
                              </div>

                              <div className="border-t border-glass-border pt-2 mt-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <EyeOff className="w-3.5 h-3.5 text-reject" />
                                  <span className="text-xs font-medium text-reject">NOT shared</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-xs text-text-muted">
                                  <span>✗ Full user profile</span>
                                  <span>✗ Private memories</span>
                                  <span>✗ Financial info</span>
                                  <span>✗ Preference database</span>
                                  <span>✗ Claude context</span>
                                  <span>✗ Internal reasoning</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Right: HumanAPI Response Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass p-5 sticky top-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-600/15 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-primary">HumanAPI</h2>
                <p className="text-xs text-text-muted">Personal Decision Agent</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Decision Pipeline */}
              <div className="bg-surface-800/50 rounded-xl p-3">
                <p className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
                  Decision Pipeline
                </p>
                {['Request Validation', 'Permission Check', 'Policy Evaluation', 'Preference Retrieval', 'Claude Reasoning'].map((step, i) => (
                  <div key={step} className="flex items-center gap-2 py-1">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      phase === 'done' || (phase === 'evaluating' && i <= 4)
                        ? 'bg-primary-600/20 text-primary-400'
                        : 'bg-surface-700 text-text-muted'
                    }`}>
                      {i + 1}
                    </div>
                    <span className="text-xs text-text-secondary">{step}</span>
                  </div>
                ))}
              </div>

              {/* Summary Stats */}
              {phase === 'done' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Summary
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Approved', count: results.filter(r => r.decision?.decision === 'APPROVE').length, color: 'text-approve' },
                      { label: 'Ask User', count: results.filter(r => r.decision?.decision === 'ASK_USER').length, color: 'text-ask' },
                      { label: 'Rejected', count: results.filter(r => r.decision?.decision === 'REJECT').length, color: 'text-reject' },
                    ].map(s => (
                      <div key={s.label} className="text-center bg-surface-800/50 rounded-lg p-2">
                        <p className={`text-lg font-bold ${s.color}`}>{s.count}</p>
                        <p className="text-[10px] text-text-muted">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Reset */}
              {phase === 'done' && (
                <button
                  onClick={() => { setPhase('idle'); setResults([]); setShowPrivacy(null); }}
                  className="w-full px-4 py-2 glass glass-hover text-text-secondary text-sm rounded-xl transition-colors"
                >
                  Run Again
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
