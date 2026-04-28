/**
 * Sidebar Navigation — persistent left sidebar with route links.
 */
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Map, Package, Bell, Users, FileText,
  Beaker, Brain, ChevronLeft, ChevronRight,
  Settings
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/control-tower', icon: Map, label: 'Control Tower' },
  { path: '/onboarding', icon: Settings, label: 'Onboarding' },
  { path: '/shipments', icon: Package, label: 'Shipments' },
  { path: '/alerts', icon: Bell, label: 'Alerts' },
  { path: '/suppliers', icon: Users, label: 'Suppliers' },
  { path: '/actions', icon: FileText, label: 'Action Log' },
  { path: '/simulation', icon: Beaker, label: 'Simulation' },
  { path: '/learning', icon: Brain, label: 'AI Learning' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-50 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[240px]'
      }`}
      style={{
        background: 'rgba(11, 15, 25, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(30, 41, 59, 0.5)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <img src={new URL('../assets/logo_hackstack.svg', import.meta.url).href} alt="NexChain" className="w-10 h-10 shrink-0" />
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-med font-bold text-text-primary leading-tight">NexChain</h1>
            <p className="text-xs text-cyan">Future of Logistics</p>
          </div>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'text-cyan bg-cyan/8 border-l-3 border-cyan'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
            {label === 'Setup' && !collapsed && (
              <span className="absolute right-2 top-1 w-2 h-2 rounded-full bg-status-warning animate-pulse" title="Setup recommended" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center py-3 border-t border-border text-text-muted hover:text-cyan transition-colors"
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </aside>
  );
}
