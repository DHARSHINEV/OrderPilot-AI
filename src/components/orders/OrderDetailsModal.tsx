'use client';

import React from 'react';
import {
  X,
  ShoppingBag,
  User,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { Order } from '@/lib/types';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  onApprove?: (orderId: string) => void;
  onReject?: (orderId: string) => void;
}

export function OrderDetailsModal({
  order,
  onClose,
  onApprove,
  onReject,
}: OrderDetailsModalProps) {
  if (!order) return null;

  // Determine timeline stage states
  const isApproved = order.status === 'approved';
  const isRejected = order.status === 'rejected';
  const isPending = order.status === 'pending_approval';

  const timelineSteps = [
    { name: 'Received', status: 'complete', desc: 'Raw customer message received' },
    { name: 'Parsed', status: 'complete', desc: 'Entities & items extracted' },
    { name: 'Validated', status: 'complete', desc: 'Inventory checked & totals calculated' },
    { name: 'Draft Created', status: 'complete', desc: 'Structured draft generated' },
    {
      name: isRejected ? 'Rejected' : isApproved ? 'Approved' : 'Awaiting Approval',
      status: isApproved ? 'complete' : isRejected ? 'failed' : 'current',
      desc: isApproved
        ? 'Human verified & approved'
        : isRejected
        ? 'Rejected by reviewer'
        : 'In human review queue',
    },
    {
      name: 'Inventory Decremented',
      status: isApproved ? 'complete' : isRejected ? 'skipped' : 'upcoming',
      desc: isApproved ? 'Committed & deducted atomically' : 'Awaiting confirmation',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono">{order.id}</h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                    order.status === 'approved'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : order.status === 'pending_approval'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : order.status === 'rejected'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}
                >
                  {order.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Created on {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Rejection Notice if rejected */}
          {isRejected && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <div className="flex items-center gap-2 font-semibold">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Order Rejected</span>
              </div>
              <p className="mt-1 text-slate-300">
                {order.suggested_action || 'Rejection reason recorded in audit trail.'}
              </p>
            </div>
          )}

          {/* Visual Lifecycle Timeline */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Order Lifecycle Timeline
            </h4>
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {timelineSteps.map((step, idx) => (
                <div key={idx} className="relative flex items-start gap-3 text-xs">
                  <div
                    className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${
                      step.status === 'complete'
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                        : step.status === 'failed'
                        ? 'bg-rose-500 border-rose-400 text-white'
                        : step.status === 'current'
                        ? 'bg-amber-500 border-amber-400 text-slate-950 animate-pulse'
                        : 'bg-slate-900 border-slate-700 text-slate-500'
                    }`}
                  >
                    {step.status === 'complete' ? (
                      <CheckCircle2 className="w-2.5 h-2.5" />
                    ) : step.status === 'failed' ? (
                      <XCircle className="w-2.5 h-2.5" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    )}
                  </div>
                  <div>
                    <span
                      className={`font-semibold ${
                        step.status === 'complete'
                          ? 'text-white'
                          : step.status === 'failed'
                          ? 'text-rose-400'
                          : step.status === 'current'
                          ? 'text-amber-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {step.name}
                    </span>
                    <p className="text-slate-400 text-[11px] mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer & Address Details */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 text-xs">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Customer Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-slate-300">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{order.customer_name || 'Name not provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>{order.customer_contact || 'Phone not provided'}</span>
              </div>
              <div className="sm:col-span-2 flex items-start gap-2 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                <span>{order.delivery_address || 'Delivery address not provided'}</span>
              </div>
            </div>
          </div>

          {/* Items Breakdown Table */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Ordered Line Items ({order.items.length})
            </h4>
            <div className="overflow-hidden border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-slate-200 block">
                          {item.product_name_snapshot}
                        </span>
                        {item.variant && (
                          <span className="text-[10px] text-slate-500">{item.variant}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        ${item.unit_price_snapshot.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-400">
                        ${item.line_total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono text-slate-200">${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Flat Tax (5%):</span>
              <span className="font-mono text-slate-200">${order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Delivery Charge:</span>
              <span className="font-mono text-slate-200">
                {order.delivery_charge === 0 ? 'FREE' : `$${order.delivery_charge.toFixed(2)}`}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
              <span>Total:</span>
              <span className="font-mono text-emerald-400">${order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Raw Ingested Message */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Raw Ingested Message
            </span>
            <p className="text-xs text-slate-300 italic font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              &ldquo;{order.raw_message}&rdquo;
            </p>
          </div>
        </div>

        {/* Footer Actions if pending */}
        {isPending && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-3">
            {onReject && (
              <button
                onClick={() => {
                  onReject(order.id);
                  onClose();
                }}
                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors"
              >
                Reject Order
              </button>
            )}
            {onApprove && (
              <button
                onClick={() => {
                  onApprove(order.id);
                  onClose();
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-lg shadow-emerald-600/20"
              >
                Approve & Decrement Stock
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
