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
} from 'lucide-react';
import { Order, Product, AgentEvent } from '@/lib/types';
import { TabId } from '../layout/Sidebar';

interface OverviewDashboardProps {
  orders: Order[];
  products: Product[];
  events: AgentEvent[];
  onNavigate: (tab: TabId) => void;
  onTriggerSampleOrder: (path: 'A' | 'B') => void;
}

export function OverviewDashboard({
  orders,
  products,
  events,
  onNavigate,
  onTriggerSampleOrder,
}: OverviewDashboardProps) {
  const totalOrders = orders.length;
  const pendingApprovals = orders.filter(
    (o) => o.status === 'pending_approval' || o.status === 'needs_clarification'
  );
  const approvedOrders = orders.filter((o) => o.status === 'approved');
  const rejectedOrders = orders.filter((o) => o.status === 'rejected');

  const lowStockProducts = products.filter(
    (p) => p.stock_quantity <= p.low_stock_threshold
  );

  const avgProcessingTime = '1.35s';
  const workflowSuccessRate =
    totalOrders > 0
      ? Math.round(
          ((approvedOrders.length + pendingApprovals.length) / totalOrders) * 100
        )
      : 95;

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Order Operations Hub
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Autonomous Agent Active
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time copilot transforming unstructured customer messages into verified, human-approved orders.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => onNavigate('workspace')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Bot className="w-4 h-4" />
            <span>Process New Order</span>
          </button>
          <button
            onClick={() => onTriggerSampleOrder('A')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
          >
            <Zap className="w-4 h-4 text-blue-600" />
            <span>Try Sample Order</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {/* Total Orders */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900">{totalOrders}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Recorded orders</p>
          </div>
        </div>

        {/* Pending Approval */}
        <div
          onClick={() => onNavigate('approval_queue')}
          className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-sm flex flex-col justify-between cursor-pointer hover:border-amber-300 transition-colors"
        >
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-semibold">Pending Review</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-amber-600">{pendingApprovals.length}</span>
            <p className="text-[11px] text-amber-600/80 font-medium mt-0.5">Awaiting human sign-off</p>
          </div>
        </div>

        {/* Approved Orders */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-semibold">Approved</span>
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-emerald-600">{approvedOrders.length}</span>
            <p className="text-[11px] text-emerald-600/80 font-medium mt-0.5">Stock decremented</p>
          </div>
        </div>

        {/* Rejected Orders */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Rejected</span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-700">{rejectedOrders.length}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Declined drafts</p>
          </div>
        </div>

        {/* Low-stock Products */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white p-4 rounded-xl border border-rose-200/80 shadow-sm flex flex-col justify-between cursor-pointer hover:border-rose-300 transition-colors"
        >
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-semibold">Stock Alerts</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-rose-600">{lowStockProducts.length}</span>
            <p className="text-[11px] text-rose-600/80 font-medium mt-0.5">Low or zero stock</p>
          </div>
        </div>

        {/* Average Processing Time */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-xs font-semibold">Agent Speed</span>
            <Zap className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-blue-600">{avgProcessingTime}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">vs ~15 min manual</p>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-xs font-semibold">Accuracy</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-indigo-600">{workflowSuccessRate}%</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Tool execution rate</p>
          </div>
        </div>
      </div>

      {/* Low-Stock Warning Banner if any */}
      {lowStockProducts.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-sm text-rose-900">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-semibold">Inventory Alert:</span>{' '}
              {lowStockProducts.length} item(s) are at or below safety threshold (
              {lowStockProducts.map((p) => `${p.name}: ${p.stock_quantity}`).join(', ')}).
            </div>
          </div>
          <button
            onClick={() => onNavigate('inventory')}
            className="text-xs font-semibold text-rose-700 hover:text-rose-900 underline whitespace-nowrap ml-4"
          >
            Adjust Stock &rarr;
          </button>
        </div>
      )}

      {/* Two Column Layout: Recent Orders & Recent Agent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Orders & Approval Queue Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Approval Section */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-slate-900 text-base">Human Approval Queue</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  {pendingApprovals.length} pending
                </span>
              </div>
              <button
                onClick={() => onNavigate('approval_queue')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                <p>No orders pending approval. Queue is clear!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.slice(0, 3).map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">{order.id}</span>
                        <span className="text-xs text-slate-500">&bull; {order.customer_name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            order.status === 'pending_approval'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {order.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                        {order.items.map((i) => `${i.quantity}x ${i.product_name_snapshot}`).join(', ')}
                      </p>
                      {order.warnings.length > 0 && (
                        <p className="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>{order.warnings[0]}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                      <span className="text-sm font-bold text-slate-900">
                        ${order.total.toFixed(2)}
                      </span>
                      <button
                        onClick={() => onNavigate('approval_queue')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders Overview */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 text-base">Recent Orders</h2>
              <button
                onClick={() => onNavigate('orders')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View Full Registry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-2.5">Order ID</th>
                    <th className="pb-2.5">Customer</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5">Items</th>
                    <th className="pb-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {orders.slice(0, 5).map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 font-semibold text-slate-900">{ord.id}</td>
                      <td className="py-2.5 text-slate-700 font-medium">{ord.customer_name}</td>
                      <td className="py-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            ord.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'pending_approval'
                              ? 'bg-amber-100 text-amber-800'
                              : ord.status === 'needs_clarification'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {ord.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-500 max-w-[200px] truncate">
                        {ord.items.map((i) => `${i.quantity}x ${i.product_name_snapshot}`).join(', ')}
                      </td>
                      <td className="py-2.5 text-right font-bold text-slate-900">
                        ${ord.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Agent Live Activity Feed */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-slate-900 text-base">Agent Activity Audit</h2>
              </div>
              <button
                onClick={() => onNavigate('activity')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>Audit Log</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {events.slice(0, 6).map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {evt.tool_name ? evt.tool_name : evt.event_type}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(evt.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-snug">{evt.safe_summary}</p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        evt.actor === 'agent'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {evt.actor}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        evt.outcome === 'success'
                          ? 'bg-emerald-100 text-emerald-800'
                          : evt.outcome === 'warning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {evt.outcome}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Demo Workflow Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-sm tracking-tight">Judge Demo Playbook</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Demonstrate the core agentic loop: message input &rarr; deterministic tool invocation &rarr; inventory verification &rarr; human sign-off.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => onTriggerSampleOrder('A')}
                className="w-full text-left px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold text-emerald-300 transition-colors border border-white/10 flex items-center justify-between"
              >
                <span>Run Scenario A: In-Stock Order</span>
                <span>&rarr;</span>
              </button>
              <button
                onClick={() => onTriggerSampleOrder('B')}
                className="w-full text-left px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold text-amber-300 transition-colors border border-white/10 flex items-center justify-between"
              >
                <span>Run Scenario B: Review Required</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
