import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings2,
  Shield,
  Bot,
  Activity,
  Plane,
  MessageSquare,
  Zap,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/preferences', label: 'Preferences', icon: Settings2 },
  { to: '/policies', label: 'Policies', icon: Shield },
  { to: '/agents', label: 'Agents', icon: Bot },
  { to: '/activity', label: 'Activity', icon: Activity },
  { to: '/onboarding', label: 'Onboarding', icon: MessageSquare },
  { to: '/demo', label: 'Travel Agent', icon: Plane },
];

export default function Sidebar() {
  return (
    <aside className="bg-gradient-sidebar w-64 min-h-screen flex flex-col py-6 px-4 shrink-0">
      {/* Logo */}
      <NavLink to="/dashboard" className="flex items-center gap-3 px-3 mb-8">
        <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center">
          <img src="/logo.png" alt="HumanAPI Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-primary leading-tight">HumanAPI</h1>
          <p className="text-xs text-text-muted">You as an API</p>
        </div>
      </NavLink>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-600/15 text-primary-400 border border-primary-500/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`
            }
          >
            <Icon className="w-[18px] h-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Agent Status */}
      <div className="glass px-4 py-3 mt-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="status-dot online" />
          <span className="text-sm font-medium text-text-primary">Personal Agent</span>
        </div>
        <p className="text-xs text-text-muted">Online • Ready for decisions</p>
      </div>
    </aside>
  );
}
