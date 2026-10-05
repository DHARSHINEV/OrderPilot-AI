'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Command,
  LayoutDashboard,
  Bot,
  UserCheck,
  ShoppingBag,
  Package,
  Users,
  Activity,
  BarChart3,
  FileCheck,
  Settings,
  ArrowRight,
  X,
} from 'lucide-react';
import { Order, Product } from '@/lib/types';
import { TabId } from '../layout/Sidebar';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: TabId) => void;
  orders: Order[];
  products: Product[];
  onSelectOrder?: (order: Order) => void;
  onSelectProduct?: (product: Product) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onSelectTab,
  orders,
  products,
  onSelectOrder,
  onSelectProduct,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const quickNav = [
    { id: 'overview' as TabId, label: 'Dashboard & Command Center', icon: <LayoutDashboard className="w-4 h-4 text-indigo-400" /> },
    { id: 'workspace' as TabId, label: 'Process New Order (Agent Workspace)', icon: <Bot className="w-4 h-4 text-cyan-400" /> },
    { id: 'approval_queue' as TabId, label: 'Human-in-the-Loop Approval Queue', icon: <UserCheck className="w-4 h-4 text-amber-400" /> },
    { id: 'orders' as TabId, label: 'All Orders & Statuses', icon: <ShoppingBag className="w-4 h-4 text-emerald-400" /> },
    { id: 'inventory' as TabId, label: 'Inventory & Stock Management', icon: <Package className="w-4 h-4 text-blue-400" /> },
    { id: 'customers' as TabId, label: 'Customers Directory', icon: <Users className="w-4 h-4 text-purple-400" /> },
    { id: 'analytics' as TabId, label: 'Operations Analytics', icon: <BarChart3 className="w-4 h-4 text-pink-400" /> },
    { id: 'activity' as TabId, label: 'Agent Activity & Observability Log', icon: <Activity className="w-4 h-4 text-teal-400" /> },
    { id: 'evaluation' as TabId, label: 'Reliability Center (20/20 Benchmark)', icon: <FileCheck className="w-4 h-4 text-emerald-400" /> },
    { id: 'settings' as TabId, label: 'System Settings & AI Providers', icon: <Settings className="w-4 h-4 text-slate-400" /> },
  ];

  const filteredNav = quickNav.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredOrders = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(query.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(query.toLowerCase()) ||
      o.raw_message?.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-900/90 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search orders, customers, inventory..."
            className="flex-1 bg-transparent border-0 text-white text-sm focus:outline-none placeholder-slate-500"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded">
            ESC to close
          </kbd>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Quick Navigation Section */}
          {filteredNav.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-1">
                Navigation
              </p>
              <div className="space-y-1">
                {filteredNav.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-indigo-600/20 hover:text-white transition-colors group text-left"
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Orders Match */}
          {filteredOrders.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-1">
                Orders
              </p>
              <div className="space-y-1">
                {filteredOrders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      onSelectTab('orders');
                      if (onSelectOrder) onSelectOrder(o);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 hover:text-white transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-indigo-400 font-semibold">{o.id}</span>
                      <span className="text-slate-300 font-medium">{o.customer_name || 'Anonymous Customer'}</span>
                      <span className="text-xs text-slate-500 truncate max-w-xs">{o.raw_message}</span>
                    </div>
                    <span className="text-xs font-mono text-emerald-400">${o.total.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products Match */}
          {filteredProducts.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-1">
                Products & Inventory
              </p>
              <div className="space-y-1">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectTab('inventory');
                      if (onSelectProduct) onSelectProduct(p);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 hover:text-white transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-blue-400">{p.sku}</span>
                      <span className="text-slate-300 font-medium">{p.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {p.category}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      Stock: <span className="font-bold text-white">{p.stock_quantity}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredNav.length === 0 && filteredOrders.length === 0 && filteredProducts.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-sm">
              No matching commands, orders, or products found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        {/* Footer Shortcut Guide */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">↵</kbd> Select
            </span>
          </div>
          <span className="text-indigo-400 font-medium">OrderPilot AI Command Center</span>
        </div>
      </div>
    </div>
  );
}
