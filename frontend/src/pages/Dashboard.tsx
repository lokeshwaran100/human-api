import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Lightbulb,
  ArrowRight,
  Activity,
  Zap,
} from 'lucide-react';
import { api } from '../lib/api';

interface Stats {
  total_decisions: number;
  approved: number;
  rejected: number;
  awaiting_user: number;
  pending_suggestions: number;
  agent_status: string;
}

const card = (i: number) => ({
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } },
});

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    total_decisions: 0,
    approved: 0,
    rejected: 0,
    awaiting_user: 0,
    pending_suggestions: 0,
    agent_status: 'online',
  });
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    api.getDashboard().then(setStats).catch(() => {});
    api.getUser().then((u: any) => setUserName(u.name)).catch(() => {});
  }, []);

  const statCards = [
    {
      label: 'Total Decisions',
      value: stats.total_decisions,
      icon: Activity,
      color: 'text-primary-400',
      bg: 'bg-primary-600/10',
    },
    {
      label: 'Approved',
      value: stats.approved,
      icon: CheckCircle2,
      color: 'text-approve',
      bg: 'bg-approve/10',
    },
    {
      label: 'Rejected',
      value: stats.rejected,
      icon: XCircle,
      color: 'text-reject',
      bg: 'bg-reject/10',
    },
    {
      label: 'Awaiting You',
      value: stats.awaiting_user,
      icon: Clock,
      color: 'text-ask',
      bg: 'bg-ask/10',
    },
  ];

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-8">
      {/* Greeting */}
      <motion.div variants={card(0)}>
        <h1 className="text-3xl font-bold text-text-primary mb-1">
          Hello, {userName}
        </h1>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span className="status-dot online" />
          <span>Your Agent is online and ready</span>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} variants={card(i + 1)} className="glass p-5 glass-hover transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-[18px] h-[18px] ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-text-primary">{s.value}</p>
            <p className="text-sm text-text-muted mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div variants={card(5)} className="grid md:grid-cols-2 gap-4">
        {/* Suggestions */}
        <div className="glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Lightbulb className="w-[18px] h-[18px] text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Preference Suggestions</h3>
              <p className="text-xs text-text-muted">{stats.pending_suggestions} pending</p>
            </div>
          </div>
          {stats.pending_suggestions > 0 ? (
            <Link
              to="/preferences"
              className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
            >
              Review suggestions <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <p className="text-sm text-text-muted">No suggestions at the moment.</p>
          )}
        </div>

        {/* Quick Demo */}
        <div className="glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-primary-600/10 flex items-center justify-center">
              <Zap className="w-[18px] h-[18px] text-primary-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Try the Demo</h3>
              <p className="text-xs text-text-muted">See your agent in action</p>
            </div>
          </div>
          <Link
            to="/demo"
            className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
          >
            Open Travel Agent Demo <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </motion.div>

      {/* Recent Activity Preview */}
      <motion.div variants={card(6)} className="glass p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">Recent Activity</h3>
          <Link to="/activity" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
            View all →
          </Link>
        </div>
        <p className="text-sm text-text-muted">
          Your decision history will appear here as your agent processes requests.
        </p>
      </motion.div>
    </motion.div>
  );
}
