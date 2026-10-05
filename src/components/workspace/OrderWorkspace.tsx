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
  Package,
  Layers,
  Terminal,
  ChevronDown,
  ChevronUp,
  X,
  MessageSquare,
  Mail,
  Smartphone,
} from 'lucide-react';
import { Order, OrchestrationResult, ToolExecutionStep } from '@/lib/types';
import { TabId } from '../layout/Sidebar';

interface OrderWorkspaceProps {
  initialMessage?: string;
  onNavigate: (tab: TabId) => void;
  onOrderProcessed?: (order: Order) => void;
  onShowToast?: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

const SAMPLE_PRESETS = [
  {
    label: 'Clean Order (Apparel)',
    channel: 'WhatsApp',
    badge: '100% Stock',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    text: 'Hi, I need 3 blue cotton shirts in medium and 2 black cotton shirts in large. Deliver to 14 Lake Road, Apt 3B. My name is Priya.',
  },
  {
    label: 'Mixed Office Stationery',
    channel: 'Email',
    badge: 'Standard',
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    text: 'Please send 4 packets of A4 paper and 3 blue ink pens. My name is Arun. Address: 21 Main Street.',
  },
  {
    label: 'Edge Case: Missing Address',
    channel: 'SMS',
    badge: 'Missing Info',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    text: 'Hi this is Rohan (rohan.mehta@example.com). Need 2 geometry boxes urgently for school tomorrow morning.',
  },
  {
    label: 'Edge Case: Stock Shortage',
    channel: 'WhatsApp',
    badge: 'Stock Shortage',
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    text: 'Need 50 spiral notebooks delivered to 10 Park Street. My name is Sarah.',
  },
  {
    label: 'Edge Case: Ambiguous Variant',
    channel: 'WhatsApp',
    badge: 'Ambiguous',
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    text: 'Please deliver 2 cotton shirts to 5 Elm Street. My name is David.',
  },
];

export function OrderWorkspace({
  initialMessage = '',
  onNavigate,
  onOrderProcessed,
  onShowToast,
}: OrderWorkspaceProps) {
  const [message, setMessage] = useState(initialMessage || SAMPLE_PRESETS[0].text);
  const [channel, setChannel] = useState<'WhatsApp' | 'Email' | 'SMS' | 'Paste'>('WhatsApp');
  const [sourceType, setSourceType] = useState<'paste' | 'file_upload'>('paste');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<OrchestrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [showTechnicalDrawer, setShowTechnicalDrawer] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (idx: number) => {
    setExpandedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleProcessOrder = async () => {
    if (!message.trim()) return;
    setIsLoading(true);
    setError(null);

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
      if (onShowToast) {
        onShowToast('success', 'Order Processed by Agent', `Order #${data.result.order.id} generated with 7 verified tools.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error executing agent orchestrator';
      setError(msg);
      if (onShowToast) {
        onShowToast('error', 'Processing Failed', msg);
      }
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
    if (onShowToast) {
      onShowToast('info', 'Draft Copied to Clipboard', 'You can paste this message directly back to the customer.');
    }
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

      if (result) {
        setResult({
          ...result,
          order: { ...result.order, status: 'approved' },
        });
      }
      if (onShowToast) {
        onShowToast('success', 'Order Approved & Committed', `Inventory atomically decremented for Order #${orderId}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve order';
      setError(msg);
      if (onShowToast) {
        onShowToast('error', 'Approval Blocked', msg);
      }
    } finally {
      setIsApproving(false);
    }
  };

  // Confidence Tier & Explanation
  const order = result?.order;
  const confidenceScore = order?.confidence_score ?? 95;
  const confidenceTier =
    confidenceScore >= 90
      ? { label: 'HIGH CONFIDENCE', desc: 'Ready for human approval', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' }
      : confidenceScore >= 70
      ? { label: 'MEDIUM CONFIDENCE', desc: 'Human review recommended', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' }
      : { label: 'LOW CONFIDENCE', desc: 'Additional customer info required', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Order Ingestion &amp; Agent Workspace
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              7-Stage Deterministic Pipeline
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Transform raw, unstructured customer texts from WhatsApp, Email, or SMS into verified orders with deterministic tools.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {result && (
            <button
              onClick={() => setShowTechnicalDrawer(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition-colors"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Technical Details</span>
            </button>
          )}

          <button
            onClick={() => {
              setMessage('');
              setResult(null);
              setError(null);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* 3-Column SaaS Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* =========================================
            COLUMN 1 (Left 3.5 cols): Message Input & Presets
            ========================================= */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-4">
            {/* Input Header & Channels */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Customer Message</span>
              </label>

              {/* Channel Selector */}
              <div className="flex items-center gap-1 text-[11px] bg-slate-950 p-1 rounded-lg border border-slate-800">
                {(['WhatsApp', 'Email', 'SMS'] as const).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setChannel(ch)}
                    className={`px-2 py-0.5 rounded font-medium transition-colors ${
                      channel === ch ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Paste customer order message here (e.g. 'Need 3 blue shirts M and 2 black shirts L. Deliver to 14 Lake Road. My name is Priya.')..."
                rows={7}
                className="w-full p-3.5 text-sm rounded-xl border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-y text-slate-100 placeholder:text-slate-500 bg-slate-950/70"
              />
            </div>

            {/* Run Button */}
            <button
              onClick={handleProcessOrder}
              disabled={isLoading || !message.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-all disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Agent Executing Pipeline...</span>
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  <span>Run Agent Ingestion Pipeline</span>
                </>
              )}
            </button>

            {/* File Upload Option */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <label className="cursor-pointer hover:text-white flex items-center gap-1.5 transition-colors">
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>Upload batch .txt or .csv</span>
                <input
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <span>Shift+Enter to send</span>
            </div>
          </div>

          {/* Quick Presets Section */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block px-1">
              Sample Order Presets
            </span>
            <div className="space-y-1.5">
              {SAMPLE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setMessage(preset.text);
                    setResult(null);
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-950/50 hover:bg-slate-800/80 border border-slate-800/60 hover:border-slate-700 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-blue-300 transition-colors">
                      {preset.label}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${preset.badgeColor}`}>
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-1">{preset.text}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* =========================================
            COLUMN 2 (Center 4 cols): Agent Processing Timeline
            ========================================= */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Agent Processing Timeline</span>
                </h3>
                {result && (
                  <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                    {result.timeline.reduce((acc: number, t: ToolExecutionStep) => acc + (t.duration_ms || 0), 0)}ms total
                  </span>
                )}
              </div>

              {/* 7 Visual Pipeline Steps */}
              <div className="mt-4 space-y-2">
                {[
                  { step: 1, name: 'UNDERSTANDING ORDER', tool: 'parse_order_message', desc: 'Extract entities & item quantities' },
                  { step: 2, name: 'SEARCHING INVENTORY', tool: 'search_inventory_catalog', desc: 'Fuzzy match items to catalog' },
                  { step: 3, name: 'CHECKING STOCK', tool: 'validate_order_stock', desc: 'Verify real-time stock levels' },
                  { step: 4, name: 'VALIDATING', tool: 'enforce_order_business_rules', desc: 'Check contact & delivery address' },
                  { step: 5, name: 'CALCULATING', tool: 'calculate_order_totals', desc: 'Deterministic subtotal, tax & total' },
                  { step: 6, name: 'CHECKING DUPLICATES', tool: 'check_duplicate_orders', desc: 'Screen for duplicate order bursts' },
                  { step: 7, name: 'CREATING DRAFT', tool: 'create_draft_order', desc: 'Build review draft & customer reply' },
                ].map((s, idx) => {
                  const stepResult = result?.timeline.find((t: ToolExecutionStep) => t.tool_name === s.tool);
                  const isExecuted = Boolean(stepResult);
                  const isExpanded = Boolean(expandedSteps[idx]);

                  return (
                    <div
                      key={s.step}
                      className={`rounded-xl border transition-all ${
                        isExecuted
                          ? 'bg-slate-950/60 border-slate-800'
                          : 'bg-slate-950/20 border-slate-800/40 opacity-60'
                      }`}
                    >
                      <div
                        onClick={() => isExecuted && toggleStep(idx)}
                        className={`p-3 flex items-center justify-between ${
                          isExecuted ? 'cursor-pointer hover:bg-slate-900/60' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isExecuted
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-slate-800 text-slate-500 border border-slate-700'
                            }`}
                          >
                            {isExecuted ? <Check className="w-3 h-3" /> : s.step}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-slate-200 block">
                              {s.name}
                            </span>
                            <span className="text-[10px] text-slate-500">{s.desc}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {stepResult && (
                            <span className="text-[10px] font-mono text-slate-400">
                              {stepResult.duration_ms}ms
                            </span>
                          )}
                          {isExecuted && (
                            <span className="text-slate-500">
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expandable tool output details */}
                      {isExecuted && isExpanded && stepResult && (
                        <div className="p-3 border-t border-slate-800/80 bg-slate-950 text-[11px] font-mono text-slate-300 overflow-x-auto space-y-1">
                          <p className="text-cyan-400 font-bold">{stepResult.description}</p>
                          <p className="text-slate-500 text-[10px]">
                            Output: {JSON.stringify(stepResult.output, null, 1)}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Zero hallucinations</span>
              <span className="text-emerald-400 font-semibold">Deterministic Tool Guardrails</span>
            </div>
          </div>
        </div>

        {/* =========================================
            COLUMN 3 (Right 4.5 cols): Structured Order Preview
            ========================================= */}
        <div className="lg:col-span-4 space-y-4">
          {result && order ? (
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-4">
              {/* Confidence Tier & Attention Explanation */}
              <div className={`p-3.5 rounded-xl border ${confidenceTier.color} flex items-start gap-3`}>
                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider">{confidenceTier.label}</span>
                    <span className="text-xs font-mono font-bold">{order.confidence_score}%</span>
                  </div>
                  <p className="text-xs mt-0.5 opacity-90">{confidenceTier.desc}</p>
                  {order.warnings && order.warnings.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-current/20 text-[11px] space-y-1">
                      {order.warnings.map((w, i) => (
                        <p key={i} className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>{w}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Card */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-white">{order.customer_name || 'Anonymous Customer'}</span>
                  <span className="font-mono text-[10px] text-indigo-400">{order.id}</span>
                </div>
                <p className="text-slate-400">{order.customer_contact || 'No contact phone provided'}</p>
                <p className="text-slate-400">{order.delivery_address || 'No shipping address provided'}</p>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-2 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                    {order.items.map((it) => (
                      <tr key={it.id}>
                        <td className="py-2 px-3">
                          <span className="text-slate-200 font-medium block">{it.product_name_snapshot}</span>
                          <span className="text-[10px] text-emerald-400">Stock: {it.available_stock} available</span>
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-slate-300">{it.quantity}</td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-400 font-semibold">
                          ${it.line_total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pricing Breakdown */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-slate-200">${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tax (5%):</span>
                  <span className="font-mono text-slate-200">${order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Delivery:</span>
                  <span className="font-mono text-slate-200">
                    {order.delivery_charge === 0 ? 'FREE' : `$${order.delivery_charge.toFixed(2)}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
                  <span>Total:</span>
                  <span className="font-mono text-emerald-400">${order.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Consequential Action Preview */}
              <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-xs space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Consequential Inventory Change on Approval
                </span>
                {order.items.map((it) => (
                  <p key={it.id} className="text-[11px] text-slate-300 flex items-center justify-between">
                    <span className="truncate max-w-[180px]">{it.product_name_snapshot}:</span>
                    <span className="font-mono text-amber-300">
                      {it.available_stock} &rarr; {Math.max(0, it.available_stock - it.quantity)}
                    </span>
                  </p>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {order.status === 'pending_approval' ? (
                  <button
                    onClick={() => handleDirectApproval(order.id)}
                    disabled={isApproving}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    {isApproving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Decrementing Stock...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Decrement Inventory</span>
                      </>
                    )}
                  </button>
                ) : order.status === 'approved' ? (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center text-xs font-bold text-emerald-400 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Order Approved & Stock Committed</span>
                  </div>
                ) : (
                  <button
                    onClick={() => onNavigate('approval_queue')}
                    className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Review in Approval Queue</span>
                  </button>
                )}

                {order.draft_response && (
                  <button
                    onClick={handleCopyDraft}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {copiedDraft ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDraft ? 'Copied to Clipboard!' : 'Copy Draft Customer Reply'}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 p-8 rounded-2xl border border-slate-800/80 text-center text-slate-500 h-full flex flex-col items-center justify-center space-y-3">
              <Bot className="w-12 h-12 text-slate-700" />
              <p className="text-sm font-semibold text-slate-300">Structured Preview Ready</p>
              <p className="text-xs max-w-xs text-slate-500">
                Paste or choose a preset message on the left, then click &ldquo;Run Agent Ingestion Pipeline&rdquo; to preview the verified order.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Optional Technical Details Drawer for Judges/Engineers */}
      {showTechnicalDrawer && result && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 font-mono text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400">
                <Terminal className="w-5 h-5" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Technical Execution Log &amp; Traces
                </h2>
              </div>
              <button
                onClick={() => setShowTechnicalDrawer(false)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-slate-300">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <p className="text-slate-500 text-[11px]">Execution Summary</p>
                <p>Pipeline Mode: <span className="text-emerald-400">Deterministic Fallback</span></p>
                <p>Steps Executed: <span className="text-cyan-400">{result.timeline?.length || 0} of 7</span></p>
                <p>Total Latency: <span className="text-white font-bold">{result.timeline?.reduce((acc, t) => acc + (t.duration_ms || 0), 0) || 0}ms</span></p>
              </div>

              <div className="space-y-3">
                <p className="text-slate-500 text-[11px] uppercase tracking-wider">Per-Step Tool Logs</p>
                {(result.timeline || []).map((step) => (
                  <div key={step.step_number} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex justify-between text-cyan-400 font-bold">
                      <span>#{step.step_number} {step.tool_name}</span>
                      <span className="text-slate-500">{step.duration_ms || 0}ms</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{step.description}</p>
                    <pre className="text-[10px] text-slate-500 overflow-x-auto p-2 bg-slate-900 rounded border border-slate-800/80 mt-1">
                      {JSON.stringify(step.input, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
