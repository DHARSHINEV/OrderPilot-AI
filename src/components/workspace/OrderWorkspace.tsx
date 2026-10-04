'use client';

import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Copy,
  Check,
  UserCheck,
  FileText,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { Order, OrchestrationResult, ToolExecutionStep } from '@/lib/types';
import { TabId } from '../layout/Sidebar';

interface OrderWorkspaceProps {
  initialMessage?: string;
  onNavigate: (tab: TabId) => void;
  onOrderProcessed?: (order: Order) => void;
}

const SAMPLE_PRESETS = [
  {
    label: 'Example 1 (Apparel)',
    badge: 'In Stock',
    badgeColor: 'text-emerald-700 bg-emerald-100',
    text: 'Hi, I need 3 blue cotton shirts in medium and 2 black cotton shirts in large. Deliver to 14 Lake Road. My name is Priya. Please confirm availability.',
  },
  {
    label: 'Example 2 (Stationery)',
    badge: 'Price Total',
    badgeColor: 'text-blue-700 bg-blue-100',
    text: 'Need 10 notebooks, 5 pens and 2 geometry boxes for tomorrow. Send the total price before confirming.',
  },
  {
    label: 'Example 3 (Office)',
    badge: 'Mixed Items',
    badgeColor: 'text-purple-700 bg-purple-100',
    text: 'Please send 4 packets of A4 paper and 3 blue ink pens. My name is Arun. Address: 21 Main Street.',
  },
  {
    label: 'Edge Case A: Missing Address',
    badge: 'Missing Info',
    badgeColor: 'text-amber-700 bg-amber-100',
    text: 'Hi this is Rohan (rohan.mehta@example.com). Need 2 geometry boxes urgently for school tomorrow morning.',
  },
  {
    label: 'Edge Case B: Stock Shortage',
    badge: 'Shortage',
    badgeColor: 'text-rose-700 bg-rose-100',
    text: 'Need 50 spiral notebooks delivered to 10 Park Street. My name is Sarah.',
  },
  {
    label: 'Edge Case C: Ambiguous Item',
    badge: 'Ambiguous',
    badgeColor: 'text-orange-700 bg-orange-100',
    text: 'Please deliver 2 cotton shirts to 5 Elm Street. My name is David.',
  },
];

export function OrderWorkspace({
  initialMessage = '',
  onNavigate,
  onOrderProcessed,
}: OrderWorkspaceProps) {
  const [message, setMessage] = useState(initialMessage || SAMPLE_PRESETS[0].text);
  const [sourceType, setSourceType] = useState<'paste' | 'file_upload'>('paste');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<OrchestrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState<string | null>(null);

  const handleProcessOrder = async () => {
    if (!message.trim()) return;
    setIsLoading(true);
    setError(null);
    setApprovalSuccess(null);

    try {
      const resp = await fetch('/api/agent/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sourceType,
          mode: 'demo_deterministic',
        }),
      });

      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.error || 'Failed to process order message');
      }

      setResult(data.result);
      if (onOrderProcessed) {
        onOrderProcessed(data.result.order);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error executing agent orchestrator';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt') && !file.name.endsWith('.csv')) {
      setError('Please upload a .txt or .csv customer message file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setMessage(content);
        setSourceType('file_upload');
      }
    };
    reader.readAsText(file);
  };

  const handleCopyDraft = () => {
    if (!result?.order.draft_response) return;
    navigator.clipboard.writeText(result.order.draft_response);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const handleDirectApproval = async (orderId: string) => {
    setIsApproving(true);
    try {
      const resp = await fetch(`/api/orders/${orderId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer: 'Store Manager (Direct Approval via Workspace)',
          notes: 'Immediate approval after agent validation.',
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Approval failed');
      }

      setApprovalSuccess(`Order ${orderId} successfully approved and stock decremented.`);
      if (result) {
        setResult({
          ...result,
          order: { ...result.order, status: 'approved' },
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve order';
      setError(msg);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Order Ingestion &amp; Agent Workspace
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Deterministic Tools + Safety Fallbacks
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Paste messy customer text from WhatsApp, SMS, or email. The agent extracts items, executes inventory lookups, calculates totals, and creates an approval draft.
          </p>
        </div>

        <button
          onClick={() => {
            setMessage('');
            setResult(null);
            setError(null);
            setApprovalSuccess(null);
          }}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 shrink-0 self-start md:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Canvas</span>
        </button>
      </div>

      {/* Main Grid: Input Column & Live Results Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Input & Presets */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Customer Message Input</span>
              </label>

              {/* File upload hidden trigger */}
              <label className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload .txt/.csv</span>
                <input
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Paste customer order message here..."
                rows={7}
                className="w-full p-3.5 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-y text-slate-800 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white"
              />
            </div>

            {/* Run Button */}
            <button
              onClick={handleProcessOrder}
              disabled={isLoading || !message.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Agent Planning &amp; Executing Tools...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Agent Orchestrator</span>
                </>
              )}
            </button>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {approvalSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{approvalSuccess}</span>
              </div>
            )}
          </div>

          {/* Quick Sample Presets */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Quick Test Presets (Click to load)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SAMPLE_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setMessage(p.text);
                    setSourceType('paste');
                    setError(null);
                  }}
                  className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50/50 hover:border-blue-200 text-left transition-all group"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 truncate">
                      {p.label}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase shrink-0 ${p.badgeColor}`}
                    >
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {p.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Execution Timeline & Order Draft Results */}
        <div className="lg:col-span-7 space-y-4">
          {!result && !isLoading && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center h-full min-h-[420px]">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 shadow-inner">
                <Bot className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Awaiting Message Ingestion</h3>
              <p className="text-xs text-slate-500 max-w-md mt-1 leading-relaxed">
                Click &ldquo;Run Agent Orchestrator&rdquo; or select one of the test presets on the left to see the agent plan tools, execute live inventory queries, and prepare an order draft.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Agent Execution Timeline Accordion */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Agent Orchestration Timeline
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    Confidence: <span className="text-blue-600 font-bold">{result.confidence_score}%</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {result.timeline.map((step) => (
                    <div
                      key={step.step_number}
                      className={`p-2.5 rounded-xl border text-xs ${
                        step.status === 'completed'
                          ? 'bg-slate-50/70 border-slate-100 text-slate-700'
                          : step.status === 'warning'
                          ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[11px] truncate">{step.tool_name}</span>
                        <span className="text-[10px] text-slate-400">{step.duration_ms}ms</span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Result Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                {/* Result Card Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-900">
                        Draft Order: {result.order.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          result.order.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : result.order.status === 'pending_approval'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {result.order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Suggested Action: <span className="font-medium text-slate-700">{result.order.suggested_action}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400">Total Calculation</span>
                    <p className="text-xl font-bold text-slate-900">
                      ${result.order.total.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Customer Details Box */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Customer</span>
                    <span className="font-semibold text-slate-800">
                      {result.order.customer_name || 'Missing Name'}
                    </span>
                    {result.order.customer_contact && (
                      <span className="text-slate-500 block text-[11px] truncate">
                        {result.order.customer_contact}
                      </span>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Delivery Destination</span>
                    <span className="font-semibold text-slate-800">
                      {result.order.delivery_address || (
                        <span className="text-rose-600 font-bold">Address Missing &mdash; Verification Required</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="pb-2">Product</th>
                        <th className="pb-2">Qty</th>
                        <th className="pb-2">Match Status</th>
                        <th className="pb-2">Stock Availability</th>
                        <th className="pb-2 text-right">Price</th>
                        <th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.order.items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 font-medium text-slate-800">
                            <div>{item.product_name_snapshot}</div>
                            {item.variant && (
                              <span className="text-[10px] text-slate-500">Variant: {item.variant}</span>
                            )}
                          </td>
                          <td className="py-2.5 font-bold text-slate-900">{item.quantity}</td>
                          <td className="py-2.5">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                item.match_status === 'exact_match'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.match_status === 'partial_match'
                                  ? 'bg-blue-100 text-blue-800'
                                  : item.match_status === 'ambiguous'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {item.match_status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                item.stock_status === 'in_stock'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.stock_status === 'low_stock'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {item.stock_status.replace('_', ' ')} ({item.available_stock} in stock)
                            </span>
                          </td>
                          <td className="py-2.5 text-right text-slate-600">
                            ${item.unit_price_snapshot.toFixed(2)}
                          </td>
                          <td className="py-2.5 text-right font-bold text-slate-900">
                            ${item.line_total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary */}
                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <div className="w-56 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span>${result.order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Configured Tax (5%)</span>
                      <span>${result.order.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Delivery Charge</span>
                      <span>
                        {result.order.delivery_charge === 0
                          ? 'FREE (over $50)'
                          : `$${result.order.delivery_charge.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-200">
                      <span>Grand Total</span>
                      <span>${result.order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Warnings / Missing Info Box if any */}
                {(result.order.missing_fields.length > 0 || result.order.warnings.length > 0) && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs text-amber-900">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Review Flags Detected by Agent:</span>
                    </div>
                    <ul className="list-disc list-inside text-[11px] space-y-0.5 text-amber-800 pl-1">
                      {result.order.missing_fields.map((mf) => (
                        <li key={mf}>Missing required field: <strong className="font-semibold">{mf}</strong></li>
                      ))}
                      {result.order.warnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Draft Customer Reply Section */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-800">
                        AI-Generated Customer Response Draft
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-200 text-slate-600 rounded">
                        Not Sent Automatically
                      </span>
                    </div>
                    <button
                      onClick={handleCopyDraft}
                      className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {copiedDraft ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Message</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 italic bg-white p-3 rounded-lg border border-slate-200/60 leading-relaxed">
                    &ldquo;{result.order.draft_response}&rdquo;
                  </p>
                </div>

                {/* Human-in-the-Loop Action Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    Human Review Gate: No external communication or inventory changes occur until human approval.
                  </span>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => onNavigate('approval_queue')}
                      className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors text-center"
                    >
                      View in Queue
                    </button>

                    {result.order.status !== 'approved' && (
                      <button
                        onClick={() => handleDirectApproval(result.order.id)}
                        disabled={isApproving}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{isApproving ? 'Verifying Stock...' : 'Approve Order'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
