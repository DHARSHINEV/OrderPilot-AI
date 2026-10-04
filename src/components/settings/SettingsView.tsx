'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Key,
  Sliders,
  DollarSign,
  Shield,
  RotateCcw,
  Save,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Cpu,
} from 'lucide-react';
import { SystemSettings } from '@/lib/types';

interface SettingsViewProps {
  onSettingsSaved: () => void;
  onResetData: () => void;
}

export function SettingsView({ onSettingsSaved, onResetData }: SettingsViewProps) {
  const [provider, setProvider] = useState<'demo' | 'gemini' | 'openai' | 'anthropic'>('demo');
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [taxRate, setTaxRate] = useState('5');
  const [deliveryCharge, setDeliveryCharge] = useState('5.00');
  const [freeThreshold, setFreeThreshold] = useState('50.00');
  const [confidenceThreshold, setConfidenceThreshold] = useState(80);
  const [autoFlagDuplicates, setAutoFlagDuplicates] = useState(true);
  const [recheckStock, setRecheckStock] = useState(true);

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.settings) {
          const s = data.settings;
          setProvider(s.ai_provider || 'demo');
          setTaxRate(String(Math.round((s.tax_rate || 0.05) * 100)));
          setDeliveryCharge(String(s.delivery_charge || 5.0));
          setFreeThreshold(String(s.free_delivery_threshold || 50.0));
          setConfidenceThreshold(s.confidence_threshold || 80);
          setAutoFlagDuplicates(s.auto_flag_duplicates !== false);
          setRecheckStock(s.recheck_stock_on_approval !== false);
          setHasApiKey(Boolean(s.has_api_key));
          if (s.api_key_masked) {
            setApiKey(s.api_key_masked);
          }
        }
      })
      .catch((err) => console.error('Failed to load settings:', err));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    const payload: Partial<SystemSettings> = {
      ai_provider: provider,
      tax_rate: (parseFloat(taxRate) || 5) / 100,
      delivery_charge: parseFloat(deliveryCharge) || 5.0,
      free_delivery_threshold: parseFloat(freeThreshold) || 50.0,
      confidence_threshold: confidenceThreshold,
      auto_flag_duplicates: autoFlagDuplicates,
      recheck_stock_on_approval: recheckStock,
    };

    // Only update API key if user changed it and it's not the masked placeholder
    if (apiKey && !apiKey.includes('...')) {
      payload.api_key = apiKey;
    }

    try {
      const resp = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to save settings');

      setFeedback({ type: 'success', message: 'System configuration updated successfully.' });
      onSettingsSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating settings';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure AI provider credentials, business arithmetic rules, confidence thresholds, and demo persistence.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* AI Engine & Provider Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Cpu className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-base text-slate-900">Agent Intelligence Mode</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <button
              type="button"
              onClick={() => setProvider('demo')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                provider === 'demo'
                  ? 'bg-blue-50/70 border-blue-500 text-blue-900 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="font-bold text-xs mb-1">Demo Mode</div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Deterministic parser + real DB queries. Zero API keys required.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setProvider('gemini')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                provider === 'gemini'
                  ? 'bg-blue-50/70 border-blue-500 text-blue-900 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="font-bold text-xs mb-1">Google Gemini</div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Structured tool execution via Gemini 1.5 Flash.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setProvider('openai')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                provider === 'openai'
                  ? 'bg-blue-50/70 border-blue-500 text-blue-900 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="font-bold text-xs mb-1">OpenAI</div>
              <p className="text-[11px] text-slate-500 leading-snug">
                GPT-4o mini with structured JSON format validation.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setProvider('anthropic')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                provider === 'anthropic'
                  ? 'bg-blue-50/70 border-blue-500 text-blue-900 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="font-bold text-xs mb-1">Anthropic</div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Claude 3.5 Sonnet / Haiku tool calling.
              </p>
            </button>
          </div>

          {provider !== 'demo' && (
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>API Key ({provider.toUpperCase()})</span>
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Enter your ${provider} API key...`}
                  className="w-full pr-10 pl-3.5 py-2.5 text-xs border border-slate-200 rounded-xl font-mono outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Key is kept in memory and server-side config. If the API fails or times out, the system automatically falls back to deterministic parsing without crashing.
              </p>
            </div>
          )}
        </div>

        {/* Business Arithmetic & Rules Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-base text-slate-900">Business Pricing &amp; Charges</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Standard Tax Rate (%)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="50"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-xs"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Applied to order subtotal (e.g. 5%)</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Standard Delivery Fee ($)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-xs"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Flat rate for local shipping</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Free Delivery Threshold ($)</label>
              <div className="relative">
                <input
                  type="number"
                  step="5"
                  min="0"
                  value={freeThreshold}
                  onChange={(e) => setFreeThreshold(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-xs"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Orders above this amount get free shipping</span>
            </div>
          </div>
        </div>

        {/* Safety & Guardrail Rules Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Shield className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-base text-slate-900">Safety &amp; Guardrails</h2>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 cursor-pointer">
              <div>
                <span className="font-bold text-slate-800 block">Atomic Inventory Verification on Approval</span>
                <span className="text-[11px] text-slate-500">
                  Strictly recheck live product stock before approving an order to prevent race-condition overselling.
                </span>
              </div>
              <input
                type="checkbox"
                checked={recheckStock}
                onChange={(e) => setRecheckStock(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 cursor-pointer">
              <div>
                <span className="font-bold text-slate-800 block">Automatic Duplicate Order Detection</span>
                <span className="text-[11px] text-slate-500">
                  Scan previous 24 hours of customer orders and flag potential duplicate submissions.
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoFlagDuplicates}
                onChange={(e) => setAutoFlagDuplicates(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-slate-700">Minimum Approval Confidence Threshold: {confidenceThreshold}%</span>
                <span className="text-slate-400 text-[11px]">Recommended: 80%</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onResetData}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Database to Demo Baseline</span>
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
