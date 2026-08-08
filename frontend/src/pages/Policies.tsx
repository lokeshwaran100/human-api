import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Plus, Trash2, ToggleLeft, ToggleRight, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';

interface Policy {
  id: string;
  name: string;
  category: string;
  conditions: any[];
  action: string;
  priority: number;
  enabled: boolean;
}

const ACTION_DISPLAY: Record<string, { label: string; icon: typeof CheckCircle2; color: string; bgColor: string }> = {
  AUTO_APPROVE: { label: 'Automatically approve', icon: CheckCircle2, color: 'text-approve', bgColor: 'bg-approve/10' },
  ASK_USER: { label: 'Ask me', icon: AlertTriangle, color: 'text-ask', bgColor: 'bg-ask/10' },
  REJECT: { label: 'Reject', icon: XCircle, color: 'text-reject', bgColor: 'bg-reject/10' },
};

const OPERATOR_LABELS: Record<string, string> = {
  lt: '<',
  lte: '≤',
  gt: '>',
  gte: '≥',
  eq: '=',
  neq: '≠',
  in: 'in',
  not_in: 'not in',
};

function formatCondition(cond: any): string {
  const op = OPERATOR_LABELS[cond.operator] || cond.operator;
  const value = typeof cond.value === 'number' ? `₹${cond.value.toLocaleString()}` : String(cond.value);
  return `${cond.field} ${op} ${value}`;
}

export default function Policies() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    name: '',
    action: 'AUTO_APPROVE',
    field: 'price',
    operator: 'lte',
    value: '',
  });

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      const data = await api.getPolicies('travel');
      setPolicies(data);
    } catch (err) {
      console.error(err);
    }
  };

  const togglePolicy = async (id: string, enabled: boolean) => {
    try {
      await api.updatePolicy(id, { enabled: !enabled });
      loadPolicies();
    } catch (err) {
      console.error(err);
    }
  };

  const deletePolicy = async (id: string) => {
    try {
      await api.deletePolicy(id);
      loadPolicies();
    } catch (err) {
      console.error(err);
    }
  };

  const addPolicy = async () => {
    if (!newPolicy.name || !newPolicy.value) return;
    try {
      let parsedValue: any;
      try {
        parsedValue = JSON.parse(newPolicy.value);
      } catch {
        parsedValue = isNaN(Number(newPolicy.value)) ? newPolicy.value : Number(newPolicy.value);
      }

      await api.createPolicy({
        name: newPolicy.name,
        category: 'travel',
        conditions: [{ field: newPolicy.field, operator: newPolicy.operator, value: parsedValue }],
        action: newPolicy.action,
        priority: policies.length,
      });
      setShowAdd(false);
      setNewPolicy({ name: '', action: 'AUTO_APPROVE', field: 'price', operator: 'lte', value: '' });
      loadPolicies();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Decision Policies</h1>
          <p className="text-sm text-text-secondary">
            Rules that control what your agent can decide autonomously.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Policy
        </button>
      </div>

      {/* Add Policy Form */}
      {showAdd && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass p-6"
        >
          <h3 className="text-sm font-semibold text-text-primary mb-4">New Policy</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Policy Name</label>
              <input
                value={newPolicy.name}
                onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                placeholder="e.g., Budget auto-approve"
                className="w-full bg-surface-800 border border-glass-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Action</label>
              <select
                value={newPolicy.action}
                onChange={(e) => setNewPolicy({ ...newPolicy, action: e.target.value })}
                className="w-full bg-surface-800 border border-glass-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-500/50"
              >
                <option value="AUTO_APPROVE">Auto Approve</option>
                <option value="ASK_USER">Ask Me</option>
                <option value="REJECT">Reject</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Field</label>
              <select
                value={newPolicy.field}
                onChange={(e) => setNewPolicy({ ...newPolicy, field: e.target.value })}
                className="w-full bg-surface-800 border border-glass-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-500/50"
              >
                <option value="price">Price</option>
                <option value="stops">Stops</option>
                <option value="airline">Airline</option>
                <option value="cabin">Cabin</option>
              </select>
            </div>
            <div className="flex gap-2">
              <div className="w-24">
                <label className="text-xs text-text-muted mb-1 block">Operator</label>
                <select
                  value={newPolicy.operator}
                  onChange={(e) => setNewPolicy({ ...newPolicy, operator: e.target.value })}
                  className="w-full bg-surface-800 border border-glass-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-500/50"
                >
                  <option value="lt">&lt;</option>
                  <option value="lte">≤</option>
                  <option value="gt">&gt;</option>
                  <option value="gte">≥</option>
                  <option value="eq">=</option>
                  <option value="neq">≠</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-text-muted mb-1 block">Value</label>
                <input
                  value={newPolicy.value}
                  onChange={(e) => setNewPolicy({ ...newPolicy, value: e.target.value })}
                  placeholder="50000"
                  className="w-full bg-surface-800 border border-glass-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-500/50"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addPolicy}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Create Policy
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 glass text-text-secondary text-sm rounded-lg"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Policies List */}
      <div className="space-y-3">
        {policies.length === 0 ? (
          <div className="glass p-8 text-center">
            <Shield className="w-8 h-8 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No policies configured. Add policies to control autonomous decisions.</p>
          </div>
        ) : (
          policies.map((policy, i) => {
            const actionInfo = ACTION_DISPLAY[policy.action] || ACTION_DISPLAY.ASK_USER;
            const ActionIcon = actionInfo.icon;

            return (
              <motion.div
                key={policy.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`glass p-4 transition-all duration-200 ${!policy.enabled ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${actionInfo.bgColor} flex items-center justify-center`}>
                      <ActionIcon className={`w-[18px] h-[18px] ${actionInfo.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{policy.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-medium ${actionInfo.color}`}>
                          {actionInfo.label}
                        </span>
                        <span className="text-xs text-text-muted">
                          when {policy.conditions.map(formatCondition).join(' AND ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePolicy(policy.id, policy.enabled)}
                      className="p-1.5 text-text-muted hover:text-text-primary transition-colors"
                      title={policy.enabled ? 'Disable' : 'Enable'}
                    >
                      {policy.enabled ? (
                        <ToggleRight className="w-5 h-5 text-approve" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => deletePolicy(policy.id)}
                      className="p-1.5 text-text-muted hover:text-reject transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
