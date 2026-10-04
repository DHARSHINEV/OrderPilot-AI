'use client';

import React, { useState } from 'react';
import {
  UserCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Edit2,
  Save,
  Copy,
  Check,
  Package,
  MessageSquare,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { Order, OrderItem } from '@/lib/types';

interface ApprovalQueueProps {
  orders: Order[];
  onOrderUpdated: () => void;
}

export function ApprovalQueue({ orders, onOrderUpdated }: ApprovalQueueProps) {
  const pendingOrders = orders.filter(
    (o) => o.status === 'pending_approval' || o.status === 'needs_clarification'
  );

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(
    pendingOrders.length > 0 ? pendingOrders[0] : null
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editItems, setEditItems] = useState<OrderItem[]>([]);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [copiedDraft, setCopiedDraft] = useState(false);

  const selectOrderForReview = (order: Order) => {
    setSelectedOrder(order);
    setIsEditing(false);
    setEditCustomerName(order.customer_name);
    setEditAddress(order.delivery_address || '');
    setEditContact(order.customer_contact || '');
    setEditItems(JSON.parse(JSON.stringify(order.items)));
    setFeedback(null);
  };

  const handleStartEdit = () => {
    if (!selectedOrder) return;
    setEditCustomerName(selectedOrder.customer_name);
    setEditAddress(selectedOrder.delivery_address || '');
    setEditContact(selectedOrder.customer_contact || '');
    setEditItems(JSON.parse(JSON.stringify(selectedOrder.items)));
    setIsEditing(true);
  };

  const handleSaveDraftEdits = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    setFeedback(null);

    try {
      const resp = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: editCustomerName,
          delivery_address: editAddress,
          customer_contact: editContact,
          items: editItems,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to update order');

      setSelectedOrder(data.order);
      setIsEditing(false);
      setFeedback({ type: 'success', message: 'Order draft changes saved successfully.' });
      onOrderUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating draft';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    setFeedback(null);

    try {
      const resp = await fetch(`/api/orders/${selectedOrder.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer: 'Human Reviewer (Approval Queue)',
          notes: 'Checked line items and stock availability.',
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Failed to approve order');
      }

      setFeedback({
        type: 'success',
        message: `Order ${selectedOrder.id} successfully approved! Inventory decremented.`,
      });
      onOrderUpdated();
      // Deselect or pick next
      const remaining = pendingOrders.filter((o) => o.id !== selectedOrder.id);
      setSelectedOrder(remaining.length > 0 ? remaining[0] : null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Approval blocked by server';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    setFeedback(null);

    try {
      const resp = await fetch(`/api/orders/${selectedOrder.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: rejectReason || 'Rejected by reviewer during human approval review.',
          reviewer: 'Human Reviewer',
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to reject order');

      setFeedback({
        type: 'success',
        message: `Order ${selectedOrder.id} has been marked as rejected.`,
      });
      setRejectModalOpen(false);
      setRejectReason('');
      onOrderUpdated();
      const remaining = pendingOrders.filter((o) => o.id !== selectedOrder.id);
      setSelectedOrder(remaining.length > 0 ? remaining[0] : null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Rejection failed';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Human-in-the-Loop Approval Queue
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              {pendingOrders.length} Pending Sign-Off
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Every order requires human authorization before state commitment. Inspect items, verify stock availability, resolve missing details, and approve dispatch.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Grid: Queue List & Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (4 cols): Pending Order List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Orders Requiring Attention ({pendingOrders.length})
            </h3>

            {pendingOrders.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                <p className="text-xs font-medium">All orders reviewed!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingOrders.map((order) => {
                  const isSelected = selectedOrder?.id === order.id;
                  return (
                    <button
                      key={order.id}
                      onClick={() => selectOrderForReview(order)}
                      className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-300 shadow-sm'
                          : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900">{order.id}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                            order.status === 'pending_approval'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {order.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {order.customer_name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {order.items.map((i) => `${i.quantity}x ${i.product_name_snapshot}`).join(', ')}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50 text-[11px]">
                        <span className="text-slate-400">Total</span>
                        <span className="font-bold text-slate-900">${order.total.toFixed(2)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (8 cols): Active Inspection & Edit Panel */}
        <div className="lg:col-span-8">
          {!selectedOrder ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[400px]">
              <UserCheck className="w-10 h-10 mb-2 text-slate-300" />
              <p className="text-sm font-semibold">Select an order from the queue to review</p>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
              {/* Inspection Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-900">
                      Reviewing: {selectedOrder.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        selectedOrder.status === 'pending_approval'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {selectedOrder.status.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Source: {selectedOrder.source_type} &bull; Received:{' '}
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <button
                      onClick={handleStartEdit}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Fields</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveDraftEdits}
                      disabled={actionLoading}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Draft Edits</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Customer & Address Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase mb-1">
                    Customer Name
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editCustomerName}
                      onChange={(e) => setEditCustomerName(e.target.value)}
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  ) : (
                    <span className="font-bold text-slate-800 text-sm">
                      {selectedOrder.customer_name}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase mb-1">
                    Contact Info
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editContact}
                      onChange={(e) => setEditContact(e.target.value)}
                      placeholder="Phone or email"
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  ) : (
                    <span className="font-medium text-slate-700">
                      {selectedOrder.customer_contact || (
                        <span className="text-amber-600 italic">Not provided</span>
                      )}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase mb-1">
                    Delivery Address
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="Full delivery address"
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  ) : (
                    <span className="font-medium text-slate-700">
                      {selectedOrder.delivery_address || (
                        <span className="text-rose-600 font-bold">Missing Address</span>
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Line Items & Stock Verification Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Line Items &amp; Stock Availability
                </h4>
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr className="text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Quantity</th>
                        <th className="p-3">Stock Verification</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(isEditing ? editItems : selectedOrder.items).map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-800">
                            {item.product_name_snapshot}
                            {item.variant && (
                              <span className="block text-[10px] text-slate-400 font-normal">
                                Variant: {item.variant}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {isEditing ? (
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 1;
                                  const updated = [...editItems];
                                  updated[idx].quantity = val;
                                  updated[idx].line_total =
                                    Math.round(val * updated[idx].unit_price_snapshot * 100) / 100;
                                  setEditItems(updated);
                                }}
                                className="w-16 p-1 border border-slate-300 rounded text-xs"
                              />
                            ) : (
                              <span className="font-bold text-slate-900">{item.quantity}</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                item.stock_status === 'in_stock'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.stock_status === 'low_stock'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              <Package className="w-3 h-3" />
                              <span>{item.stock_status.replace('_', ' ')}</span>
                            </span>
                          </td>
                          <td className="p-3 text-right text-slate-600">
                            ${item.unit_price_snapshot.toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            ${item.line_total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Total & Price Breakdown */}
              <div className="flex justify-end">
                <div className="w-60 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span>${selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Tax (5%)</span>
                    <span>${selectedOrder.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Delivery Fee</span>
                    <span>
                      {selectedOrder.delivery_charge === 0
                        ? 'FREE'
                        : `$${selectedOrder.delivery_charge.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 text-base pt-1 border-t border-slate-200">
                    <span>Total</span>
                    <span>${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Warnings / Review Notice */}
              {(selectedOrder.missing_fields.length > 0 || selectedOrder.warnings.length > 0) && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs text-amber-900">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Blocking Constraints &amp; Agent Warnings:</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5 pl-1">
                    {selectedOrder.missing_fields.map((f) => (
                      <li key={f}>
                        Missing required field: <strong className="font-semibold">{f}</strong>
                      </li>
                    ))}
                    {selectedOrder.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Draft Customer Response */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Contextual Clarification Draft
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedOrder.draft_response);
                      setCopiedDraft(true);
                      setTimeout(() => setCopiedDraft(false), 2000);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {copiedDraft ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Reply</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-700 italic bg-white p-3 rounded-lg border border-slate-200/60 leading-relaxed">
                  &ldquo;{selectedOrder.draft_response}&rdquo;
                </p>
              </div>

              {/* Action Buttons: Approve, Reject */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Approval rechecks live inventory &amp; prevents overselling.</span>
                </span>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setRejectModalOpen(true)}
                    disabled={actionLoading}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Order</span>
                  </button>

                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{actionLoading ? 'Verifying & Committing...' : 'Approve & Decrement Stock'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Confirm Order Rejection</h3>
            <p className="text-xs text-slate-500">
              Please specify the reason for declining order {selectedOrder?.id}. This will be permanently recorded in the audit trail.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Out of stock item declined by customer / invalid delivery address..."
              rows={3}
              className="w-full p-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
