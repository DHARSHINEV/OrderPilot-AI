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
} from 'lucide-react';
import { Order, OrderStatus } from '@/lib/types';

interface OrdersListProps {
  orders: Order[];
}

export function OrdersList({ orders }: OrdersListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest_total'>('newest');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filter & Search
  let filtered = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
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
      `"${o.customer_name.replace(/"/g, '""')}"`,
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Orders Registry</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {filtered.length} Orders
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Complete database of ingested, drafted, and approved customer orders with historical item price snapshots.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, customer name, address, or product..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-blue-500 font-medium text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="needs_clarification">Needs Clarification</option>
            <option value="draft">Draft</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-blue-500 font-medium text-slate-700"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest_total">Highest Amount</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Order ID</th>
                <th className="p-3.5">Customer &amp; Address</th>
                <th className="p-3.5">Items Snapshot</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Source</th>
                <th className="p-3.5 text-right">Total</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">
                      <div>{ord.id}</div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {new Date(ord.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{ord.customer_name}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[220px]">
                        {ord.delivery_address || (
                          <span className="text-amber-600 italic">No address provided</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 max-w-[240px]">
                      <div className="text-slate-700 truncate">
                        {ord.items.map((i) => `${i.quantity}x ${i.product_name_snapshot}`).join(', ')}
                      </div>
                      <span className="text-[10px] text-slate-400">{ord.items.length} line item(s)</span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            ord.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'pending_approval'
                              ? 'bg-amber-100 text-amber-800'
                              : ord.status === 'needs_clarification'
                              ? 'bg-orange-100 text-orange-800'
                              : ord.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {ord.status.replace('_', ' ')}
                        </span>
                        {ord.duplicate_warning?.is_duplicate && (
                          <span className="inline-flex items-center gap-1 text-[9px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>Duplicate</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-500 capitalize">{ord.source_type}</td>
                    <td className="p-3.5 text-right font-bold text-slate-900">
                      ${ord.total.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                        title="View Full Order Snapshot"
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
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Order Details: {selectedOrder.id}
                </h3>
                <span className="text-xs text-slate-400">
                  Recorded on {new Date(selectedOrder.created_at).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Raw Message Card */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Original Incoming Message
              </span>
              <p className="text-slate-700 italic">&ldquo;{selectedOrder.raw_message}&rdquo;</p>
            </div>

            {/* Customer & Address Details */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Customer</span>
                <span className="font-bold text-slate-800">{selectedOrder.customer_name}</span>
                {selectedOrder.customer_contact && (
                  <span className="block text-slate-500">{selectedOrder.customer_contact}</span>
                )}
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Destination</span>
                <span className="font-semibold text-slate-800">
                  {selectedOrder.delivery_address || 'None provided'}
                </span>
              </div>
            </div>

            {/* Items Snapshot Table */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Order Items (Historical Snapshot)
              </span>
              <table className="w-full text-xs text-left border border-slate-100 rounded-lg">
                <thead className="bg-slate-50 text-slate-400">
                  <tr>
                    <th className="p-2.5">Product Name</th>
                    <th className="p-2.5">Quantity</th>
                    <th className="p-2.5 text-right">Unit Price</th>
                    <th className="p-2.5 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedOrder.items.map((i) => (
                    <tr key={i.id}>
                      <td className="p-2.5 font-medium text-slate-800">
                        {i.product_name_snapshot}
                        {i.variant && <span className="text-[10px] text-slate-400 block">({i.variant})</span>}
                      </td>
                      <td className="p-2.5 font-bold">{i.quantity}</td>
                      <td className="p-2.5 text-right text-slate-600">${i.unit_price_snapshot.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">${i.line_total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Totals */}
            <div className="flex justify-end pt-2 border-t border-slate-100 text-xs">
              <div className="w-48 space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>${selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tax (5%)</span>
                  <span>${selectedOrder.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Delivery</span>
                  <span>${selectedOrder.delivery_charge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-200">
                  <span>Total</span>
                  <span>${selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Draft Response */}
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                Customer Response Draft
              </span>
              <p className="text-slate-700 italic">&ldquo;{selectedOrder.draft_response}&rdquo;</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
