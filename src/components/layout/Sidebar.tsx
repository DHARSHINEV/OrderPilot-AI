'use client';

import React from 'react';
import {
  LayoutDashboard,
  Bot,
  UserCheck,
  ShoppingBag,
  Package,
  Users,
  BarChart3,
  Activity,
  FileCheck,
  Settings,
  Sparkles,
  RotateCcw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Search,
  Bell,
  X,
} from 'lucide-react';

export type TabId =
  | 'overview'
  | 'workspace'
  | 'approval_queue'
  | 'orders'
  | 'inventory'
  | 'customers'
  | 'analytics'
  | 'activity'
  | 'evaluation'
  | 'settings';

interface SidebarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  pendingApprovalsCount: number;
  lowStockCount: number;
  attentionCount?: number;
  onTriggerSampleOrder: (path: 'A' | 'B') => void;
  onResetDemoData: () => void;
  isDemoMode: boolean;
  onOpenCommandPalette?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  pendingApprovalsCount,
  lowStockCount,
  attentionCount = 0,
  onTriggerSampleOrder,
  onResetDemoData,
  isDemoMode,
  onOpenCommandPalette,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const navItems: Array<{
    id: TabId;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }> = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'workspace',
      label: 'New Order',
      icon: <Bot className="w-5 h-5" />,
    },
    {
      id: 'approval_queue',
      label: 'Approval Queue',
      icon: <UserCheck className="w-5 h-5" />,
      badge: pendingApprovalsCount,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <ShoppingBag className="w-5 h-5" />,
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: <Package className="w-5 h-5" />,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      id: 'activity',
      label: 'Agent Activity',
      icon: <Activity className="w-5 h-5" />,
    },
    {
      id: 'evaluation',
      label: 'Reliability Center',
      icon: <FileCheck className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 flex flex-col h-screen border-r border-slate-800 shrink-0 select-none transition-transform duration-300 lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Zap className="w-5 h-5 fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white tracking-tight text-lg">OrderPilot</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">SMB Operations Copilot</p>
              </div>
            </div>

            {/* Mobile close button */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Quick Search Trigger (Ctrl+K) */}
          <button
            onClick={onOpenCommandPalette}
            className="mt-3.5 w-full flex items-center justify-between px-3 py-2 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition-all group"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              <span>Search or command...</span>
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-400">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white text-blue-600' : item.badgeColor || 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Demo Quick Actions Section */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
            Demo Presets
          </p>
          <button
            onClick={() => onTriggerSampleOrder('A')}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/50 rounded-lg transition-colors text-left"
            title="Load complete order with sufficient stock"
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            <span className="truncate">Sample: Clean Order</span>
          </button>
          <button
            onClick={() => onTriggerSampleOrder('B')}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/50 rounded-lg transition-colors text-left"
            title="Load order requiring review"
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span className="truncate">Sample: Review Flag</span>
          </button>

          <button
            onClick={onResetDemoData}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors border border-transparent hover:border-slate-700"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Demo Data</span>
          </button>
        </div>

        {/* Footer Info */}
        <div className="px-4 py-2.5 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-emerald-400' : 'bg-blue-400'}`} />
            {isDemoMode ? 'Demo Mode' : 'Live Agent'}
          </span>
          <span className="text-slate-400 font-medium">WCC Launchpad</span>
        </div>
      </aside>
    </>
  );
}
