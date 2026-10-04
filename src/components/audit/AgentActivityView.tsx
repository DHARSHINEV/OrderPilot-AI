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
} from 'lucide-react';
import { AgentEvent } from '@/lib/types';

interface AgentActivityViewProps {
  events: AgentEvent[];
  onRefresh: () => void;
}

export function AgentActivityView({ events, onRefresh }: AgentActivityViewProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [filterActor, setFilterActor] = useState('all');

  const filtered = events.filter((e) => {
    if (filterType !== 'all' && e.event_type !== filterType) return false;
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Agent Activity &amp; Audit Trail
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Immutable Trace Log
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Complete chronological record of all agent plans, tool calls, inventory checks, business rule validations, and human review decisions.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800">Responsible AI &amp; Privacy:</strong> Logs record only safe sanitized summaries, tool names, and verification outcomes. No passwords, private API keys, or raw payment details are ever written to the audit log.
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs by tool name, summary, or order ID..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Actor Filter */}
          <select
            value={filterActor}
            onChange={(e) => setFilterActor(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-blue-500 font-medium text-slate-700"
          >
            <option value="all">All Actors (AI &amp; Human)</option>
            <option value="agent">AI Agent Only</option>
            <option value="human">Human Reviewer Only</option>
          </select>

          {/* Outcome Filter */}
          <select
            value={filterOutcome}
            onChange={(e) => setFilterOutcome(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-blue-500 font-medium text-slate-700"
          >
            <option value="all">All Outcomes</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold uppercase tracking-wider text-[11px]">
            Activity Records ({filtered.length})
          </span>
          <span>Showing latest events first</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p>No activity events match your filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((evt) => (
              <div key={evt.id} className="p-4 hover:bg-slate-50/60 transition-colors space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        evt.actor === 'agent'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {evt.actor === 'agent' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      <span>{evt.actor}</span>
                    </span>

                    <span className="font-mono font-bold text-slate-800">
                      {evt.tool_name || evt.event_type}
                    </span>

                    {evt.order_id && (
                      <span className="text-[11px] text-slate-400 font-medium">
                        &bull; {evt.order_id}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        evt.outcome === 'success'
                          ? 'bg-emerald-100 text-emerald-800'
                          : evt.outcome === 'warning'
                          ? 'bg-amber-100 text-amber-800'
                          : evt.outcome === 'error'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {evt.outcome === 'success' && <CheckCircle className="w-2.5 h-2.5" />}
                      {evt.outcome === 'warning' && <AlertTriangle className="w-2.5 h-2.5" />}
                      {evt.outcome === 'error' && <XCircle className="w-2.5 h-2.5" />}
                      {evt.outcome === 'info' && <Info className="w-2.5 h-2.5" />}
                      <span>{evt.outcome}</span>
                    </span>

                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(evt.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <p className="text-slate-700 leading-relaxed pl-1">{evt.safe_summary}</p>
                <div className="text-[10px] text-slate-400 font-mono pl-1">
                  Session: {evt.session_id} &bull; Timestamp: {new Date(evt.created_at).toISOString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
