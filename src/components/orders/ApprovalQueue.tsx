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
  ArrowRight,
  ShieldCheck,
  X,
  FileText,
  DollarSign,
} from 'lucide-react';
import { Order, OrderItem } from '@/lib/types';

interface ApprovalQueueProps {
  orders: Order[];
  onOrderUpdated: () => void;
  onShowToast?: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

const REJECTION_REASONS = [
  'Incorrect quantity requested',
  'Insufficient stock available',
  'Duplicate order burst detected',
  'Missing customer address or contact',
  'Customer cancelled or changed mind',
  'Pricing or variant mismatch',
  'Other (specify below)',
];

export function ApprovalQueue({ orders, onOrderUpdated, onShowToast }: ApprovalQueueProps) {
  const pendingOrders = orders.filter(
    (o) => o.status === 'pending_approval' || o.status === 'needs_clarification'
  );

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(
    pendingOrders.length > 0 ? pendingOrders[0] : null
  );

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editItems, setEditItems] = useState<OrderItem[]>([]);

  // Confirmation & Rejection Modals
  const [showApproveConfirmModal, setShowApproveConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRejectReason, setSelectedRejectReason] = useState(REJECTION_REASONS[0]);
  const [customRejectNotes, setCustomRejectNotes] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);

  const selectOrderForReview = (order: Order) => {
    setSelectedOrder(order);
    setIsEditing(false);
    setEditCustomerName(order.customer_name);
    setEditAddress(order.delivery_address || '');
    setEditContact(order.customer_contact || '');
    setEditItems(JSON.parse(JSON.stringify(order.items)));
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
      if (onShowToast) {
        onShowToast('success', 'Draft Updated', `Changes saved for Order #${selectedOrder.id}`);
      }
      onOrderUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating draft';
      if (onShowToast) onShowToast('error', 'Update Failed', msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Perform Final Approval
  const handleConfirmApproval = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);

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

      setShowApproveConfirmModal(false);
      if (onShowToast) {
        onShowToast(
          'success',
          'Order Approved & Committed',
          `Order #${selectedOrder.id} confirmed. Stock decremented atomically.`
        );
      }
      onOrderUpdated();

      // Pick next pending order
      const remaining = pendingOrders.filter((o) => o.id !== selectedOrder.id);
      setSelectedOrder(remaining.length > 0 ? remaining[0] : null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Approval failed';
      if (onShowToast) onShowToast('error', 'Approval Blocked', msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Perform Final Rejection
  const handleConfirmRejection = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);

    const fullReason =
      selectedRejectReason === 'Other (specify below)'
        ? customRejectNotes || 'Other reason'
        : customRejectNotes
        ? `${selectedRejectReason}: ${customRejectNotes}`
        : selectedRejectReason;

    try {
      const resp = await fetch(`/api/orders/${selectedOrder.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer: 'Human Reviewer (Approval Queue)',
          reason: fullReason,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Failed to reject order');
      }

      setShowRejectModal(false);
      setCustomRejectNotes('');
      if (onShowToast) {
        onShowToast('info', 'Order Rejected', `Order #${selectedOrder.id} rejected. Reason logged in audit history.`);
      }
      onOrderUpdated();

      // Pick next pending order
      const remaining = pendingOrders.filter((o) => o.id !== selectedOrder.id);
      setSelectedOrder(remaining.length > 0 ? remaining[0] : null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Rejection failed';
      if (onShowToast) onShowToast('error', 'Rejection Error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyDraft = () => {
    if (!selectedOrder?.draft_response) return;
    navigator.clipboard.writeText(selectedOrder.draft_response);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
    if (onShowToast) onShowToast('info', 'Copied to Clipboard', 'Draft customer response copied.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <UserCheck className="w-6 h-6 text-amber-400" />
              Human-in-the-Loop Approval Queue
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {pendingOrders.length} Pending Sign-Off
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Review agent-parsed draft orders, inspect consequential stock transitions, and authorize atomic inventory decrement.
          </p>
        </div>
      </div>

      {pendingOrders.length === 0 ? (
        <div className="bg-slate-900/60 p-16 rounded-2xl border border-slate-800 text-center space-y-3">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">All Caught Up!</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            There are currently no orders pending human approval. New orders ingested by the AI will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (4 cols): Pending Orders Queue List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Awaiting Review ({pendingOrders.length})
              </span>
            </div>

            <div className="space-y-2.5 max-h-[75vh] overflow-y-auto pr-1">
              {pendingOrders.map((ord) => {
                const isSelected = selectedOrder?.id === ord.id;
                const hasMissingFields = ord.missing_fields && ord.missing_fields.length > 0;
                const isShortage = ord.items.some((it) => it.stock_status === 'insufficient_stock' || it.available_stock < it.quantity);

                return (
                  <div
                    key={ord.id}
                    onClick={() => selectOrderForReview(ord)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-slate-800/90 border-amber-500 shadow-md shadow-amber-500/10'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-amber-400">{ord.id}</span>
                        <h4 className="text-sm font-semibold text-white mt-0.5">
                          {ord.customer_name || 'Anonymous Customer'}
                        </h4>
                      </div>
                      <span className="font-mono font-bold text-sm text-emerald-400">
                        ${ord.total.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mt-2 font-mono">
                      &ldquo;{ord.raw_message}&rdquo;
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">
                        {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {hasMissingFields && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                            Missing Info
                          </span>
                        )}
                        {isShortage && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-semibold">
                            Stock Shortage
                          </span>
                        )}
                        {!hasMissingFields && !isShortage && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                            Ready
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column (8 cols): Order Review & Decision Workspace */}
          {selectedOrder ? (
            <div className="lg:col-span-8 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-6">
              {/* Order Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white font-mono">{selectedOrder.id}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
                      Pending Human Sign-Off
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Ingested via {selectedOrder.source_type} on {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <button
                      onClick={handleStartEdit}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit &amp; Adjust</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveDraftEdits}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Warning/Attention Alerts */}
              {selectedOrder.warnings && selectedOrder.warnings.length > 0 && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Attention Flags Detected</span>
                  </div>
                  {selectedOrder.warnings.map((w, i) => (
                    <p key={i} className="pl-6 text-slate-300">{w}</p>
                  ))}
                </div>
              )}

              {/* Customer & Delivery Form (or Readonly) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Customer Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editCustomerName}
                      onChange={(e) => setEditCustomerName(e.target.value)}
                      className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="font-semibold text-slate-200">
                      {selectedOrder.customer_name || <span className="text-amber-400">Missing Name</span>}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Phone / Contact
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editContact}
                      onChange={(e) => setEditContact(e.target.value)}
                      className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-slate-200">
                      {selectedOrder.customer_contact || <span className="text-amber-400">No contact phone</span>}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Shipping Address
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-slate-200">
                      {selectedOrder.delivery_address || <span className="text-rose-400">Address missing</span>}
                    </p>
                  )}
                </div>
              </div>

              {/* Items & Consequential Stock Changes Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-emerald-400" />
                    <span>Line Items &amp; Consequential Inventory Deductions</span>
                  </h4>
                  <span className="text-[11px] text-amber-300 font-mono">
                    Before Approval &rarr; After Approval
                  </span>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-2 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-center">Stock Transition</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                      {(isEditing ? editItems : selectedOrder.items).map((item, idx) => {
                        const newStock = Math.max(0, item.available_stock - item.quantity);
                        const isShortage = item.stock_status === 'insufficient_stock' || item.available_stock < item.quantity;

                        return (
                          <tr key={item.id} className={isShortage ? 'bg-rose-950/20' : ''}>
                            <td className="py-3 px-3">
                              <span className="font-medium text-slate-200 block">
                                {item.product_name_snapshot}
                              </span>
                              {item.variant && (
                                <span className="text-[10px] text-slate-500">{item.variant}</span>
                              )}
                            </td>

                            <td className="py-3 px-2 text-center">
                              {isEditing ? (
                                <input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 1;
                                    const updated = [...editItems];
                                    updated[idx].quantity = val;
                                    updated[idx].line_total = val * updated[idx].unit_price_snapshot;
                                    setEditItems(updated);
                                  }}
                                  className="w-14 p-1 rounded bg-slate-900 border border-slate-700 text-center text-white"
                                />
                              ) : (
                                <span className="font-mono text-slate-300 font-bold">{item.quantity}</span>
                              )}
                            </td>

                            {/* Consequential action explicit: Inventory will change from X -> Y */}
                            <td className="py-3 px-3 text-center font-mono">
                              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                                <span className={isShortage ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                                  {item.available_stock}
                                </span>
                                {' '}&rarr;{' '}
                                <span className={newStock === 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                                  {newStock}
                                </span>
                              </span>
                            </td>

                            <td className="py-3 px-3 text-right font-mono text-slate-400">
                              ${item.unit_price_snapshot.toFixed(2)}
                            </td>

                            <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-400">
                              ${item.line_total.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pricing & Draft Customer Reply */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono text-slate-200">${selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Tax (5%):</span>
                    <span className="font-mono text-slate-200">${selectedOrder.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Delivery Charge:</span>
                    <span className="font-mono text-slate-200">
                      {selectedOrder.delivery_charge === 0 ? 'FREE' : `$${selectedOrder.delivery_charge.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
                    <span>Total Amount:</span>
                    <span className="font-mono text-emerald-400">${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col justify-between text-xs space-y-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Generated Customer Reply
                      </span>
                      <button
                        onClick={handleCopyDraft}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                      >
                        {copiedDraft ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedDraft ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-slate-300 italic text-xs mt-1.5 line-clamp-3">
                      &ldquo;{selectedOrder.draft_response}&rdquo;
                    </p>
                  </div>

                  <span className="text-[11px] text-slate-500">
                    Confidence: <strong>{selectedOrder.confidence_score}%</strong> (Deterministic validation)
                  </span>
                </div>
              </div>

              {/* Decision Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Order...</span>
                </button>

                <button
                  onClick={() => setShowApproveConfirmModal(true)}
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve &amp; Decrement Stock...</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* =========================================
          CONFIRMATION MODAL: Approve & Decrement Stock
          ========================================= */}
      {showApproveConfirmModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Approve Order &amp; Decrement Stock?
                </h3>
                <p className="text-xs text-slate-400">
                  Consequential action on Order #{selectedOrder.id}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs space-y-1.5 text-slate-300">
              <p className="font-semibold text-white">Inventory will change atomically:</p>
              {selectedOrder.items.map((it) => (
                <div key={it.id} className="flex justify-between font-mono text-[11px]">
                  <span>{it.product_name_snapshot}:</span>
                  <span className="text-amber-300">
                    {it.available_stock} &rarr; {Math.max(0, it.available_stock - it.quantity)}
                  </span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-slate-800 flex justify-between font-semibold">
                <span>Customer:</span>
                <span className="text-white">{selectedOrder.customer_name}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total Amount:</span>
                <span className="text-emerald-400 font-mono">${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowApproveConfirmModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApproval}
                disabled={actionLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
              >
                {actionLoading ? 'Committing...' : 'Approve & Decrement Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          REJECTION MODAL: Requires Reason + Audit Trail
          ========================================= */}
      {showRejectModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Reject Order #{selectedOrder.id}
                </h3>
                <p className="text-xs text-slate-400">
                  Please specify the reason for the audit trail.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Select Rejection Reason (Required)
                </label>
                <select
                  value={selectedRejectReason}
                  onChange={(e) => setSelectedRejectReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500"
                >
                  {REJECTION_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Additional Notes / Explanation (Optional)
                </label>
                <textarea
                  value={customRejectNotes}
                  onChange={(e) => setCustomRejectNotes(e.target.value)}
                  placeholder="Provide context for customer or internal audit..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejection}
                disabled={actionLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors shadow-lg shadow-rose-600/20"
              >
                {actionLoading ? 'Recording...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
