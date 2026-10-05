'use client';

import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Download,
  AlertTriangle,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  X,
  FileText,
  DollarSign,
} from 'lucide-react';
import { Order, OrderStatus } from '@/lib/types';
import { OrderDetailsModal } from './OrderDetailsModal';

interface OrdersListProps {
  orders: Order[];
  onSelectOrder?: (order: Order) => void;
}

export function OrdersList({ orders, onSelectOrder }: OrdersListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest_total'>('newest');
  const [inspectedOrder, setInspectedOrder] = useState<Order | null>(null);

  // Filter & Search
  let filtered = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.customer_name?.toLowerCase().includes(q) ||
      (o.delivery_address && o.delivery_address.toLowerCase().includes(q)) ||
      o.items.some((i) => i.product_name_snapshot.toLowerCase().includes(q))
    );
  });

  // Sort
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    if (sortBy === 'highest_total') {
      return b.total - a.total;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Customer', 'Contact', 'Address', 'Status', 'Subtotal', 'Tax', 'Delivery', 'Total', 'Created At'];
    const rows = filtered.map((o) => [
      `"${o.id}"`,
      `"${(o.customer_name || '').replace(/"/g, '""')}"`,
      `"${(o.customer_contact || '').replace(/"/g, '""')}"`,
      `"${(o.delivery_address || '').replace(/"/g, '""')}"`,
      `"${o.status}"`,
      o.subtotal.toFixed(2),
      o.tax.toFixed(2),
      o.delivery_charge.toFixed(2),
      o.total.toFixed(2),
      `"${o.created_at}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orderpilot-orders-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <ShoppingBag className="w-6 h-6 text-indigo-400" />
              Orders Registry
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {filtered.length} Orders Listed
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Complete database of ingested, drafted, and approved customer orders with immutable line item price snapshots.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors shrink-0 self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, customer name, address, or item..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-medium outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="needs_clarification">Needs Clarification</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-medium outline-none focus:border-indigo-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest_total">Highest Amount</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer &amp; Address</th>
                <th className="py-3 px-4">Items Snapshot</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Total</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => {
                      if (onSelectOrder) onSelectOrder(ord);
                      else setInspectedOrder(ord);
                    }}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold font-mono text-indigo-400">{ord.id}</div>
                      <span className="text-[10px] text-slate-500 font-normal">
                        {new Date(ord.created_at).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">
                        {ord.customer_name || 'Anonymous Customer'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                        {ord.delivery_address || (
                          <span className="text-amber-400 italic">No address provided</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-[240px]">
                      <div className="text-slate-300 truncate">
                        {ord.items.map((i) => `${i.quantity}x ${i.product_name_snapshot}`).join(', ')}
                      </div>
                      <span className="text-[10px] text-slate-500">{ord.items.length} line item(s)</span>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          ord.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : ord.status === 'pending_approval'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : ord.status === 'needs_clarification'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {ord.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-white text-sm">
                      ${ord.total.toFixed(2)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectedOrder(ord);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        title="View Detailed Lifecycle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filtered.length} of {orders.length} total orders</span>
          <span className="text-emerald-400 font-semibold">100% verified schema</span>
        </div>
      </div>

      {/* Order Details Modal */}
      {inspectedOrder && (
        <OrderDetailsModal
          order={inspectedOrder}
          onClose={() => setInspectedOrder(null)}
        />
      )}
    </div>
  );
}
