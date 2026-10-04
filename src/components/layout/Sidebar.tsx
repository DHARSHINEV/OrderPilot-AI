'use client';

import React from 'react';
import {
  LayoutDashboard,
  Bot,
  UserCheck,
  ShoppingBag,
  Package,
  Activity,
  FileCheck,
  Settings,
  Sparkles,
  RotateCcw,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export type TabId =
  | 'overview'
  | 'workspace'
  | 'approval_queue'
  | 'orders'
  | 'inventory'
  | 'activity'
  | 'evaluation'
  | 'settings';

interface SidebarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  pendingApprovalsCount: number;
  lowStockCount: number;
  onTriggerSampleOrder: (path: 'A' | 'B') => void;
  onResetDemoData: () => void;
  isDemoMode: boolean;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  pendingApprovalsCount,
  lowStockCount,
  onTriggerSampleOrder,
  onResetDemoData,
  isDemoMode,
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
      label: 'Overview',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'workspace',
      label: 'Process Order',
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
      id: 'activity',
      label: 'Agent Activity',
      icon: <Activity className="w-5 h-5" />,
    },
    {
      id: 'evaluation',
      label: 'Evaluation Center',
      icon: <FileCheck className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col h-screen border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
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
            <p className="text-[11px] text-slate-400 leading-tight">Order Copilot for SMBs</p>
          </div>
        </div>

        {/* Demo Mode Badge */}
        <div className="mt-3.5 flex items-center justify-between px-2.5 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`} />
            <span className="text-slate-300 font-medium">
              {isDemoMode ? 'Demo Mode Active' : 'Live Agent Active'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">v1.0</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
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
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/40 space-y-2">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
          Demo Scenarios
        </p>
        <button
          onClick={() => onTriggerSampleOrder('A')}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/50 rounded-lg transition-colors text-left"
          title="Load complete order with sufficient stock (Apparel)"
        >
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span className="truncate">Path A: Successful Order</span>
        </button>
        <button
          onClick={() => onTriggerSampleOrder('B')}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/50 rounded-lg transition-colors text-left"
          title="Load order requiring clarification or stock review"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span className="truncate">Path B: Needs Review</span>
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
      <div className="px-4 py-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
        <span>WCC Launchpad 30</span>
        <span className="text-slate-400 font-medium">Agentic AI</span>
      </div>
    </aside>
  );
}
