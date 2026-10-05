'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar, TabId } from '@/components/layout/Sidebar';
import { OverviewDashboard } from '@/components/dashboard/OverviewDashboard';
import { OrderWorkspace } from '@/components/workspace/OrderWorkspace';
import { ApprovalQueue } from '@/components/orders/ApprovalQueue';
import { OrdersList } from '@/components/orders/OrdersList';
import { InventoryManager } from '@/components/inventory/InventoryManager';
import { CustomersView } from '@/components/customers/CustomersView';
import { AnalyticsView } from '@/components/analytics/AnalyticsView';
import { AgentActivityView } from '@/components/audit/AgentActivityView';
import { EvaluationCenter } from '@/components/evaluation/EvaluationCenter';
import { SettingsView } from '@/components/settings/SettingsView';
import { CommandPalette } from '@/components/common/CommandPalette';
import { ToastContainer, ToastMessage } from '@/components/common/Toast';
import { OrderDetailsModal } from '@/components/orders/OrderDetailsModal';
import { Order, Product, AgentEvent, EvaluationSummary } from '@/lib/types';
import { Menu, X, Zap, Search, Bell, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Core Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [evaluationSummary, setEvaluationSummary] = useState<EvaluationSummary | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [workspaceMessage, setWorkspaceMessage] = useState<string>('');
  const [inspectedOrder, setInspectedOrder] = useState<Order | null>(null);

  // Toast Notification System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (
    type: 'success' | 'warning' | 'error' | 'info',
    title: string,
    message?: string
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch all initial data
  const refreshOrders = async () => {
    try {
      const resp = await fetch('/api/orders');
      const data = await resp.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const refreshProducts = async () => {
    try {
      const resp = await fetch('/api/inventory');
      const data = await resp.json();
      if (data.success && data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  const refreshEvents = async () => {
    try {
      const resp = await fetch('/api/agent/events');
      const data = await resp.json();
      if (data.success && data.events) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const refreshSettings = async () => {
    try {
      const resp = await fetch('/api/settings');
      const data = await resp.json();
      if (data.success && data.settings) {
        setIsDemoMode(data.settings.ai_provider === 'demo');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const refreshAll = () => {
    refreshOrders();
    refreshProducts();
    refreshEvents();
    refreshSettings();
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // Demo Order Trigger (Path A vs Path B)
  const handleTriggerSampleOrder = (path: 'A' | 'B') => {
    if (path === 'A') {
      setWorkspaceMessage(
        'Hi, I need 3 blue cotton shirts in medium and 2 black cotton shirts in large. Deliver to 14 Lake Road, Apt 3B. My name is Priya.'
      );
      showToast('info', 'Loaded Sample Order (Clean)', 'Apparel order with 100% available stock.');
    } else {
      setWorkspaceMessage(
        'Hi this is Rohan (rohan.mehta@example.com). Need 2 geometry boxes and 50 notebooks urgently for school tomorrow morning.'
      );
      showToast('warning', 'Loaded Sample Order (Review Flag)', 'Contains stock shortage & missing address.');
    }
    setActiveTab('workspace');
    setMobileMenuOpen(false);
  };

  // Reset Demo Data
  const handleResetDemoData = async () => {
    if (!confirm('Reset all orders, inventory, and activity logs to pristine hackathon demo baseline?')) {
      return;
    }
    try {
      const resp = await fetch('/api/demo/reset', { method: 'POST' });
      if (resp.ok) {
        refreshAll();
        setActiveTab('overview');
        showToast('success', 'Demo Baseline Reset', 'Catalog restored to 7 items, 3 sample orders, and clean test audit history.');
      }
    } catch (err) {
      console.error('Failed to reset demo data:', err);
      showToast('error', 'Reset Failed', 'Could not reset demo database.');
    }
  };

  const pendingApprovalsCount = orders.filter(
    (o) => o.status === 'pending_approval' || o.status === 'needs_clarification'
  ).length;

  const lowStockCount = products.filter(
    (p) => p.stock_quantity <= p.low_stock_threshold
  ).length;

  const attentionTotal = pendingApprovalsCount + lowStockCount;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          refreshAll();
        }}
        orders={orders}
        products={products}
        onSelectOrder={(ord) => setInspectedOrder(ord)}
      />

      {/* Order Details Modal */}
      {inspectedOrder && (
        <OrderDetailsModal
          order={inspectedOrder}
          onClose={() => setInspectedOrder(null)}
          onApprove={() => {
            refreshAll();
            setInspectedOrder(null);
          }}
          onReject={() => {
            refreshAll();
            setInspectedOrder(null);
          }}
        />
      )}

      {/* Desktop Persistent Sidebar & Mobile Drawer */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          refreshAll();
        }}
        pendingApprovalsCount={pendingApprovalsCount}
        lowStockCount={lowStockCount}
        attentionCount={attentionTotal}
        onTriggerSampleOrder={handleTriggerSampleOrder}
        onResetDemoData={handleResetDemoData}
        isDemoMode={isDemoMode}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        isMobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950">
        {/* Top Navbar Header */}
        <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
                {activeTab.replace('_', ' ')}
              </span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-500">OrderPilot Operations</span>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-3">
            {/* Global Search shortcut button */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-400">
                Ctrl+K
              </kbd>
            </button>

            {/* Notification & Attention Indicator */}
            <button
              onClick={() => setActiveTab('approval_queue')}
              className="relative p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title={`${attentionTotal} items requiring attention`}
            >
              <Bell className="w-4 h-4" />
              {attentionTotal > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>

            {/* Live Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-xl text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-medium">Port 3005 Active</span>
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <OverviewDashboard
                orders={orders}
                products={products}
                events={events}
                onNavigate={(tab) => {
                  setActiveTab(tab);
                  refreshAll();
                }}
                onTriggerSampleOrder={handleTriggerSampleOrder}
                onSelectOrder={(ord) => setInspectedOrder(ord)}
              />
            )}

            {activeTab === 'workspace' && (
              <OrderWorkspace
                key={workspaceMessage}
                initialMessage={workspaceMessage}
                onNavigate={(tab) => {
                  setActiveTab(tab);
                  refreshAll();
                }}
                onOrderProcessed={() => {
                  refreshOrders();
                  refreshEvents();
                }}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'approval_queue' && (
              <ApprovalQueue
                orders={orders}
                onOrderUpdated={() => {
                  refreshOrders();
                  refreshProducts();
                  refreshEvents();
                }}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersList
                orders={orders}
                onSelectOrder={(ord) => setInspectedOrder(ord)}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryManager
                products={products}
                onInventoryUpdated={() => {
                  refreshProducts();
                  refreshOrders();
                }}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'customers' && (
              <CustomersView
                orders={orders}
                onSelectCustomerOrder={(ord) => setInspectedOrder(ord)}
                onCreateOrderForCustomer={(name, contact) => {
                  setWorkspaceMessage(
                    `Hi, this is ${name}${contact ? ` (${contact})` : ''}. Need `
                  );
                  setActiveTab('workspace');
                }}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView
                orders={orders}
                products={products}
                events={events}
              />
            )}

            {activeTab === 'activity' && (
              <AgentActivityView
                events={events}
                onRefresh={refreshEvents}
              />
            )}

            {activeTab === 'evaluation' && (
              <EvaluationCenter
                initialSummary={evaluationSummary}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                onSettingsSaved={refreshSettings}
                onResetData={handleResetDemoData}
                onShowToast={showToast}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
