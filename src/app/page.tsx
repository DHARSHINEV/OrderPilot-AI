'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar, TabId } from '@/components/layout/Sidebar';
import { OverviewDashboard } from '@/components/dashboard/OverviewDashboard';
import { OrderWorkspace } from '@/components/workspace/OrderWorkspace';
import { ApprovalQueue } from '@/components/orders/ApprovalQueue';
import { OrdersList } from '@/components/orders/OrdersList';
import { InventoryManager } from '@/components/inventory/InventoryManager';
import { AgentActivityView } from '@/components/audit/AgentActivityView';
import { EvaluationCenter } from '@/components/evaluation/EvaluationCenter';
import { SettingsView } from '@/components/settings/SettingsView';
import { Order, Product, AgentEvent, EvaluationSummary } from '@/lib/types';
import { Menu, X, Zap } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [evaluationSummary, setEvaluationSummary] = useState<EvaluationSummary | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [workspaceMessage, setWorkspaceMessage] = useState<string>('');

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
      // Successful in-stock order
      setWorkspaceMessage(
        'Hi, I need 3 blue cotton shirts in medium and 2 black cotton shirts in large. Deliver to 14 Lake Road. My name is Priya. Please confirm availability.'
      );
    } else {
      // Order requiring review (missing address, out of stock shortage)
      setWorkspaceMessage(
        'Hi this is Rohan (rohan.mehta@example.com). Need 2 geometry boxes and 50 notebooks urgently for school tomorrow morning.'
      );
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
      }
    } catch (err) {
      console.error('Failed to reset demo data:', err);
    }
  };

  const pendingApprovalsCount = orders.filter(
    (o) => o.status === 'pending_approval' || o.status === 'needs_clarification'
  ).length;

  const lowStockCount = products.filter(
    (p) => p.stock_quantity <= p.low_stock_threshold
  ).length;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            refreshAll();
          }}
          pendingApprovalsCount={pendingApprovalsCount}
          lowStockCount={lowStockCount}
          onTriggerSampleOrder={handleTriggerSampleOrder}
          onResetDemoData={handleResetDemoData}
          isDemoMode={isDemoMode}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-64 h-full">
            <Sidebar
              activeTab={activeTab}
              onSelectTab={(tab) => {
                setActiveTab(tab);
                setMobileMenuOpen(false);
                refreshAll();
              }}
              pendingApprovalsCount={pendingApprovalsCount}
              lowStockCount={lowStockCount}
              onTriggerSampleOrder={handleTriggerSampleOrder}
              onResetDemoData={handleResetDemoData}
              isDemoMode={isDemoMode}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Mobile Navbar */}
        <header className="lg:hidden bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <span className="font-bold text-base tracking-tight">OrderPilot AI</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
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
              />
            )}

            {activeTab === 'orders' && <OrdersList orders={orders} />}

            {activeTab === 'inventory' && (
              <InventoryManager
                products={products}
                onInventoryUpdated={() => {
                  refreshProducts();
                  refreshOrders();
                }}
              />
            )}

            {activeTab === 'activity' && (
              <AgentActivityView events={events} onRefresh={refreshEvents} />
            )}

            {activeTab === 'evaluation' && (
              <EvaluationCenter initialSummary={evaluationSummary} />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                onSettingsSaved={refreshSettings}
                onResetData={handleResetDemoData}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
