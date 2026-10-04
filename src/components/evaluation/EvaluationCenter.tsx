'use client';

import React, { useState } from 'react';
import {
  FileCheck,
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';
import { EvaluationResult, EvaluationSummary } from '@/lib/types';

interface EvaluationCenterProps {
  initialSummary?: EvaluationSummary | null;
}

export function EvaluationCenter({ initialSummary }: EvaluationCenterProps) {
  const [summary, setSummary] = useState<EvaluationSummary | null>(initialSummary || null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [expandedScenarioId, setExpandedScenarioId] = useState<number | null>(null);

  const categories = ['All', 'Parsing', 'Validation', 'Inventory', 'Calculation', 'Approval', 'Resilience'];

  const handleRunAllTests = async () => {
    setIsRunning(true);
    try {
      const resp = await fetch('/api/evaluation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to run evaluation suite:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunSingleScenario = async (id: number) => {
    try {
      const resp = await fetch('/api/evaluation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: id }),
      });
      const data = await resp.json();
      if (resp.ok && data.success && summary) {
        const updatedResults = summary.results.map((r) =>
          r.scenario_id === id ? data.result : r
        );
        const passed = updatedResults.filter((r) => r.passed).length;
        setSummary({
          ...summary,
          results: updatedResults,
          passed,
          failed: updatedResults.length - passed,
          pass_rate: Math.round((passed / updatedResults.length) * 100),
        });
      }
    } catch (err) {
      console.error('Failed to run single scenario:', err);
    }
  };

  const filteredResults = summary?.results.filter((r) => {
    if (activeCategory === 'All') return true;
    // Map category
    if (activeCategory === 'Parsing' && [1, 2, 3, 11].includes(r.scenario_id)) return true;
    if (activeCategory === 'Inventory' && [4, 5, 6, 13].includes(r.scenario_id)) return true;
    if (activeCategory === 'Validation' && [7, 8, 12].includes(r.scenario_id)) return true;
    if (activeCategory === 'Calculation' && [15].includes(r.scenario_id)) return true;
    if (activeCategory === 'Approval' && [16, 17, 18].includes(r.scenario_id)) return true;
    if (activeCategory === 'Resilience' && [9, 10, 14, 19, 20].includes(r.scenario_id)) return true;
    return false;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Agent Reliability &amp; Evaluation Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              20 Automated Benchmarks
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Deterministic and resilience verification suite covering parsing, stock edge cases, overselling defenses, idempotency, and fallback behavior.
          </p>
        </div>

        <button
          onClick={handleRunAllTests}
          disabled={isRunning}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] shrink-0"
        >
          {isRunning ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Executing 20 Scenarios...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Run Full Evaluation Suite</span>
            </>
          )}
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Pass Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block">Pass Rate</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">
              {summary ? `${summary.pass_rate}%` : '---'}
            </span>
            <span className="text-xs text-slate-400">
              {summary ? `${summary.passed}/${summary.total} passed` : 'Suite not run'}
            </span>
          </div>
        </div>

        {/* Tests Passed */}
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-semibold">Passed Scenarios</span>
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="mt-1">
            <span className="text-3xl font-extrabold text-emerald-600">
              {summary ? summary.passed : '---'}
            </span>
          </div>
        </div>

        {/* Tests Failed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-semibold">Failed Scenarios</span>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="mt-1">
            <span className="text-3xl font-extrabold text-rose-600">
              {summary ? summary.failed : '---'}
            </span>
          </div>
        </div>

        {/* Suite Latency */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-xs font-semibold">Execution Latency</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="mt-1">
            <span className="text-3xl font-extrabold text-blue-600">
              {summary ? `${summary.total_duration_ms}ms` : '---'}
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-sm overflow-x-auto text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Scenarios Checklist List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
        {!summary ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <FileCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-sm text-slate-700">Benchmark Suite Ready</p>
            <p className="mt-1 max-w-sm mx-auto text-slate-500">
              Click &ldquo;Run Full Evaluation Suite&rdquo; above to execute all 20 scenarios against actual database logic and tool handlers.
            </p>
          </div>
        ) : (
          filteredResults?.map((res) => {
            const isExpanded = expandedScenarioId === res.scenario_id;

            return (
              <div key={res.scenario_id} className="p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        res.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {res.passed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400 font-bold">
                          #{res.scenario_id.toString().padStart(2, '0')}
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs">{res.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {res.duration_ms}ms
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRunSingleScenario(res.scenario_id)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                    >
                      Re-test
                    </button>

                    <button
                      onClick={() =>
                        setExpandedScenarioId(isExpanded ? null : res.scenario_id)
                      }
                      className="p-1 text-slate-400 hover:text-slate-700"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Assertion Badges */}
                <div className="mt-2.5 flex items-center gap-2 flex-wrap pl-9">
                  {res.assertions.map((ast, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        ast.passed
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {ast.passed ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                      <span>{ast.name}</span>
                    </span>
                  ))}
                </div>

                {/* Collapsible Details */}
                {isExpanded && (
                  <div className="mt-3 pl-9 pt-3 border-t border-slate-100 text-xs space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Actual Execution Outcome Object
                    </span>
                    <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
                      {JSON.stringify(res.actual_outcome, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
