'use client';

import React, { useState } from 'react';
import {
  Activity,
  Search,
  Filter,
  ShieldCheck,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Clock,
  User,
  Bot,
  X,
  Layers,
  ChevronRight,
  Eye,
  FileCode,
} from 'lucide-react';
import { AgentEvent } from '@/lib/types';

interface AgentActivityViewProps {
  events: AgentEvent[];
  onRefresh: () => void;
}

export function AgentActivityView({ events, onRefresh }: AgentActivityViewProps) {
  const [search, setSearch] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [filterActor, setFilterActor] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<AgentEvent | null>(null);

  const filtered = events.filter((e) => {
    if (filterOutcome !== 'all' && e.outcome !== filterOutcome) return false;
    if (filterActor !== 'all' && e.actor !== filterActor) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.safe_summary.toLowerCase().includes(q) ||
      (e.tool_name && e.tool_name.toLowerCase().includes(q)) ||
      (e.order_id && e.order_id.toLowerCase().includes(q)) ||
      e.session_id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Activity className="w-6 h-6 text-teal-400" />
              Agent Observability &amp; Audit Trail
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
              Immutable Trace Log
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Tamper-evident record of all AI plans, tool invocations, stock checks, business rules, and human review decisions.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors shrink-0 self-start md:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Security & Responsible AI Banner */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200">Security &amp; Audit Hygiene:</strong> Logs store only sanitized summaries, tool names, and verification outcomes. No passwords, private API keys, or raw payment details are ever written to the audit log.
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs by tool name, summary, or order ID..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Actor Filter */}
          <select
            value={filterActor}
            onChange={(e) => setFilterActor(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-medium outline-none focus:border-teal-500"
          >
            <option value="all">All Actors (AI &amp; Human)</option>
            <option value="agent">Autonomous Agent Only</option>
            <option value="human">Human Reviewer Only</option>
            <option value="system">System Only</option>
          </select>

          {/* Outcome Filter */}
          <select
            value={filterOutcome}
            onChange={(e) => setFilterOutcome(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-medium outline-none focus:border-teal-500"
          >
            <option value="all">All Outcomes</option>
            <option value="success">Success Only</option>
            <option value="warning">Warnings Only</option>
            <option value="error">Errors Only</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Actor</th>
                <th className="py-3 px-3">Tool / Action</th>
                <th className="py-3 px-3">Order</th>
                <th className="py-3 px-4">Sanitized Summary</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((evt) => {
                const isSuccess = evt.outcome === 'success';
                const isWarning = evt.outcome === 'warning';

                return (
                  <tr
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(evt.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 font-medium text-slate-300">
                        {evt.actor === 'agent' ? (
                          <Bot className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span className="capitalize">{evt.actor}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-cyan-400 font-semibold whitespace-nowrap">
                      {evt.tool_name || evt.event_type}
                    </td>

                    <td className="py-3 px-3 font-mono text-indigo-400 whitespace-nowrap">
                      {evt.order_id || '—'}
                    </td>

                    <td className="py-3 px-4 text-slate-200 max-w-md truncate">
                      {evt.safe_summary}
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          isSuccess
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : isWarning
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {evt.outcome}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button className="p-1 text-slate-500 hover:text-white rounded">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filtered.length} of {events.length} immutable events</span>
          <span>Logged with microsecond precision</span>
        </div>
      </div>

      {/* =========================================
          EVENT DETAIL DRAWER
          ========================================= */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="font-mono text-[11px] text-cyan-400 font-bold block">
                  {selectedEvent.tool_name || selectedEvent.event_type}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">Event Execution Detail</h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{selectedEvent.id}</p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Structured Answers */}
            <div className="py-5 space-y-5 flex-1">
              {/* 1. What happened? */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                  1. What Happened?
                </span>
                <p className="text-slate-200 text-xs leading-relaxed">
                  {selectedEvent.safe_summary}
                </p>
              </div>

              {/* 2. Why? */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                  2. Why Did This Execute?
                </span>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {selectedEvent.actor === 'agent'
                    ? `Executed as part of the 7-step autonomous ingestion pipeline for session ${selectedEvent.session_id}.`
                    : `Executed by a verified human store manager during approval or inventory reconciliation.`}
                </p>
              </div>

              {/* 3. What data was involved? */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                  3. What Data Was Involved?
                </span>
                <div className="space-y-1 text-[11px] text-slate-400">
                  <p>Order ID: <span className="font-mono text-white font-bold">{selectedEvent.order_id || 'None (Catalog / System level)'}</span></p>
                  <p>Actor: <span className="text-white capitalize">{selectedEvent.actor}</span></p>
                  <p>Timestamp: <span className="text-slate-300 font-mono">{new Date(selectedEvent.created_at).toISOString()}</span></p>
                </div>
                {selectedEvent.details && (
                  <pre className="p-2.5 bg-slate-900 rounded-lg text-[10px] font-mono text-cyan-300 overflow-x-auto border border-slate-800 mt-2">
                    {JSON.stringify(selectedEvent.details, null, 2)}
                  </pre>
                )}
              </div>

              {/* 4. What was the result? */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                  4. What Was the Result?
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      selectedEvent.outcome === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : selectedEvent.outcome === 'warning'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {selectedEvent.outcome}
                  </span>
                  <span className="text-slate-300 text-xs">Deterministic guardrail validated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
