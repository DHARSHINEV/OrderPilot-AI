'use client';

import React from 'react';
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  ArrowRight,
  TrendingUp,
  Bot,
  UserCheck,
  ShieldCheck,
  Package,
  DollarSign,
  Activity,
  AlertCircle,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { Order, Product, AgentEvent } from '@/lib/types';
import { TabId } from '../layout/Sidebar';

interface OverviewDashboardProps {
  orders: Order[];
  products: Product[];
  events: AgentEvent[];
  onNavigate: (tab: TabId) => void;
  onTriggerSampleOrder: (path: 'A' | 'B') => void;
  onSelectOrder?: (order: Order) => void;
}

export function OverviewDashboard({
  orders,
  products,
  events,
  onNavigate,
  onTriggerSampleOrder,
  onSelectOrder,
}: OverviewDashboardProps) {
  const totalOrders = orders.length;
  const pendingApprovals = orders.filter(
    (o) => o.status === 'pending_approval' || o.status === 'needs_clarification'
  );
  const approvedOrders = orders.filter((o) => o.status === 'approved');
  const rejectedOrders = orders.filter((o) => o.status === 'rejected');
  const attentionOrders = orders.filter(
    (o) =>
      o.status === 'needs_clarification' ||
      (o.missing_fields && o.missing_fields.length > 0) ||
      (o.warnings && o.warnings.length > 0) ||
      o.duplicate_warning !== null
  );

  const lowStockProducts = products.filter(
    (p) => p.stock_quantity <= p.low_stock_threshold
  );

  const totalRevenue = approvedOrders.reduce((sum, o) => sum + o.total, 0);
  const avgProcessingTime = '1.35s';

  // Last agent activity
  const latestEvent = events.length > 0 ? events[0] : null;

  return (
    <div className="space-y-6">
      {/* Top Banner / Operational Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Operations Command Center
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Autonomous Agent Active
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time copilot converting messy customer messages into verified, human-approved orders.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => onNavigate('workspace')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Bot className="w-4 h-4" />
            <span>Process New Order</span>
          </button>
          <button
            onClick={() => onTriggerSampleOrder('A')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-medium transition-colors"
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Load Demo Order</span>
          </button>
        </div>
      </div>

      {/* 6 Required Operations KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Orders Today */}
        <div
          onClick={() => onNavigate('orders')}
          className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Orders Today</span>
            <ShoppingBag className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-white font-mono">{totalOrders}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Recorded orders</p>
          </div>
        </div>

        {/* 2. Pending Approval */}
        <div
          onClick={() => onNavigate('approval_queue')}
          className="bg-slate-900/80 p-4 rounded-xl border border-amber-500/30 hover:border-amber-500/50 transition-colors cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Approval</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-amber-300 font-mono">{pendingApprovals.length}</span>
            <p className="text-[11px] text-amber-400/80 font-medium mt-0.5">Awaiting sign-off</p>
          </div>
        </div>

        {/* 3. Revenue Today */}
        <div
          onClick={() => onNavigate('analytics')}
          className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Revenue Today</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-white font-mono">${totalRevenue.toFixed(2)}</span>
            <p className="text-[11px] text-emerald-400/80 font-medium mt-0.5">Confirmed revenue</p>
          </div>
        </div>

        {/* 4. Items Low in Stock */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-slate-900/80 p-4 rounded-xl border border-rose-500/30 hover:border-rose-500/50 transition-colors cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Low Stock Items</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-rose-300 font-mono">{lowStockProducts.length}</span>
            <p className="text-[11px] text-rose-400/80 font-medium mt-0.5">Requires replenishment</p>
          </div>
        </div>

        {/* 5. Orders Requiring Attention */}
        <div
          onClick={() => onNavigate('approval_queue')}
          className="bg-slate-900/80 p-4 rounded-xl border border-purple-500/30 hover:border-purple-500/50 transition-colors cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Needs Attention</span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-purple-300 font-mono">{attentionOrders.length}</span>
            <p className="text-[11px] text-purple-400/80 font-medium mt-0.5">Missing info / warnings</p>
          </div>
        </div>

        {/* 6. Average Processing Time */}
        <div
          onClick={() => onNavigate('activity')}
          className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-cyan-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Processing Time</span>
            <Zap className="w-4 h-4" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-white font-mono">{avgProcessingTime}</span>
            <p className="text-[11px] text-cyan-400/80 font-medium mt-0.5">7-step autonomous</p>
          </div>
        </div>
      </div>

      {/* 5-Second Answer: "ATTENTION REQUIRED" Operations Card */}
      <div className="p-5 bg-gradient-to-r from-amber-950/30 via-slate-900 to-rose-950/20 border border-amber-500/20 rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-300">
              Immediate Operations Attention ({pendingApprovals.length + lowStockProducts.length} items)
            </h2>
          </div>
          <span className="text-xs text-slate-400">Answers &ldquo;What needs my attention right now?&rdquo;</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {/* Pending Approvals alert */}
          <div
            onClick={() => onNavigate('approval_queue')}
            className="p-3.5 bg-slate-900/90 border border-amber-500/30 rounded-xl hover:border-amber-400 transition-colors cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-semibold text-amber-300 block">
                {pendingApprovals.length} Orders Awaiting Approval
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Human sign-off required to decrement inventory
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </div>

          {/* Low Stock alert */}
          <div
            onClick={() => onNavigate('inventory')}
            className="p-3.5 bg-slate-900/90 border border-rose-500/30 rounded-xl hover:border-rose-400 transition-colors cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-semibold text-rose-300 block">
                {lowStockProducts.length} Products Low or Out of Stock
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                {lowStockProducts.map((p) => p.name).join(', ') || 'All products in stock'}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-rose-400" />
          </div>

          {/* Clarifications / Missing fields alert */}
          <div
            onClick={() => onNavigate('approval_queue')}
            className="p-3.5 bg-slate-900/90 border border-purple-500/30 rounded-xl hover:border-purple-400 transition-colors cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-semibold text-purple-300 block">
                {attentionOrders.length} Orders Need Clarification
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Missing customer phone, address, or variant
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-purple-400" />
          </div>
        </div>
      </div>

      {/* 2-Column Section: TODAY'S ORDER ACTIVITY & LIVE AGENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TODAY'S ORDER ACTIVITY (2 Cols) */}
        <div className="lg:col-span-2 p-6 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-indigo-400" />
                  Today&apos;s Order Activity
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Recent customer messages parsed and staged into the fulfillment pipeline.
                </p>
              </div>
              <button
                onClick={() => onNavigate('orders')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Time</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {orders.slice(0, 5).map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-mono font-bold text-indigo-400">
                        {ord.id}
                      </td>
                      <td className="py-3">
                        <span className="font-medium text-slate-200 block">
                          {ord.customer_name || 'Anonymous Customer'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {ord.customer_contact || 'No phone'}
                        </span>
                      </td>
                      <td className="py-3 font-mono font-semibold text-emerald-400">
                        ${ord.total.toFixed(2)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            ord.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : ord.status === 'pending_approval'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : ord.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {ord.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400 text-[11px]">
                        {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => {
                            if (onSelectOrder) onSelectOrder(ord);
                            else onNavigate('orders');
                          }}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Showing recent {Math.min(orders.length, 5)} of {orders.length} orders</span>
            <span className="text-emerald-400 font-medium">Auto-synced</span>
          </div>
        </div>

        {/* LIVE AGENT ACTIVITY (1 Col) */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Live Agent Activity
              </h3>
              <button
                onClick={() => onNavigate('activity')}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                All Logs <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Current Agent State */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl mb-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Agent State:</span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Ready & Listening
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-slate-500">
                <span>Guardrails:</span>
                <span className="text-slate-300 font-mono">Deterministic Fallback</span>
              </div>
            </div>

            {/* Recent Tool Executions */}
            <div className="space-y-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Recent Step Executions
              </p>
              {events.slice(0, 4).map((evt) => (
                <div
                  key={evt.id}
                  className="p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-xl text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-cyan-400 text-[11px] font-semibold">
                      {evt.tool_name}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                        evt.outcome === 'success'
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : evt.outcome === 'warning'
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-rose-400 bg-rose-500/10'
                      }`}
                    >
                      {evt.outcome}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-1">
                    {evt.safe_summary}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                    <span>Actor: {evt.actor}</span>
                    <span>{new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4 text-center">
            <button
              onClick={() => onNavigate('evaluation')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Inspect 20/20 Test Suite &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
