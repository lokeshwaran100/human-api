import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Shield, Trash2, CheckCircle2, Loader2, Key } from 'lucide-react';
import { api } from '../lib/api';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  agent_permissions: { id: string; permission: string }[];
}

export default function ConnectedAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showRegister, setShowRegister] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', description: '', capabilities: 'flight_purchase' });
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const data = await api.getAgents();
      setAgents(data);
    } catch (err) {
      console.error(err);
    }
  };

  const registerAgent = async () => {
    if (!newAgent.name) return;
    setRegistering(true);
    try {
      const res = await api.registerAgent({
        name: newAgent.name,
        description: newAgent.description,
        capabilities: newAgent.capabilities.split(',').map(s => s.trim()),
      });
      setCreatedKey(res.api_key);
      setShowRegister(false);
      setNewAgent({ name: '', description: '', capabilities: 'flight_purchase' });
      loadAgents();
    } catch (err) {
      console.error(err);
    } finally {
      setRegistering(false);
    }
  };

  const revokeAgent = async (id: string) => {
    try {
      await api.deleteAgent(id);
      loadAgents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Connected Agents</h1>
          <p className="text-sm text-text-secondary">
            External AI agents that can request decisions from your Personal Agent.
          </p>
        </div>
        <button
          onClick={() => setShowRegister(!showRegister)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Bot className="w-4 h-4" /> Register Agent
        </button>
      </div>

      {/* API Key Display */}
      {createdKey && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-4 border-ask/30"
        >
          <div className="flex items-start gap-3">
            <Key className="w-5 h-5 text-ask mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary mb-1">API Key Created</p>
              <p className="text-xs text-text-muted mb-2">
                Copy this key now — it won't be shown again.
              </p>
              <code className="block text-sm bg-surface-800 text-primary-400 rounded-lg px-3 py-2 break-all font-mono">
                {createdKey}
              </code>
            </div>
            <button
              onClick={() => setCreatedKey(null)}
              className="text-xs text-text-muted hover:text-text-primary"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}

      {/* Register Form */}
      {showRegister && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass p-6"
        >
          <h3 className="text-sm font-semibold text-text-primary mb-4">Register New Agent</h3>
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Agent Name</label>
              <input
                value={newAgent.name}
                onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                placeholder="e.g., Travel Agent"
                className="w-full bg-surface-800 border border-glass-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Description</label>
              <input
                value={newAgent.description}
                onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                placeholder="Finds and evaluates flights"
                className="w-full bg-surface-800 border border-glass-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Capabilities (comma-separated)</label>
              <input
                value={newAgent.capabilities}
                onChange={(e) => setNewAgent({ ...newAgent, capabilities: e.target.value })}
                placeholder="flight_purchase, hotel_booking"
                className="w-full bg-surface-800 border border-glass-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-500/50"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={registerAgent}
              disabled={registering}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Register
            </button>
            <button onClick={() => setShowRegister(false)} className="px-4 py-2 glass text-text-secondary text-sm rounded-lg">
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Agents List */}
      <div className="space-y-3">
        {agents.length === 0 ? (
          <div className="glass p-8 text-center">
            <Bot className="w-8 h-8 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No agents connected. Register an agent to get started.</p>
          </div>
        ) : (
          agents.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass p-5 glass-hover transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-600/10 flex items-center justify-center mt-0.5">
                    <Bot className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text-primary">{agent.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        agent.status === 'ACTIVE'
                          ? 'bg-approve/10 text-approve'
                          : 'bg-reject/10 text-reject'
                      }`}>
                        {agent.status === 'ACTIVE' ? 'Connected' : 'Revoked'}
                      </span>
                    </div>
                    {agent.description && (
                      <p className="text-sm text-text-secondary mt-0.5">{agent.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Shield className="w-3.5 h-3.5 text-text-muted" />
                      <span className="text-xs text-text-muted">
                        Permissions: {agent.agent_permissions?.map(p => p.permission.replace('decision:', '')).join(', ') || 'None'}
                      </span>
                    </div>
                  </div>
                </div>

                {agent.status === 'ACTIVE' && (
                  <button
                    onClick={() => revokeAgent(agent.id)}
                    className="p-1.5 text-text-muted hover:text-reject transition-colors"
                    title="Revoke agent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
