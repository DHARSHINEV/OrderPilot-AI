'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Calendar,
  DollarSign,
  ArrowRight,
  TrendingUp,
  X,
  ExternalLink,
  PlusCircle,
} from 'lucide-react';
import { Order } from '@/lib/types';

interface CustomerProfile {
  id: string;
  name: string;
  contact: string | null;
  address: string | null;
  orders: Order[];
  totalOrders: number;
  totalSpend: number;
  lastOrderDate: string;
  averageOrderValue: number;
}

interface CustomersViewProps {
  orders: Order[];
  onSelectCustomerOrder?: (order: Order) => void;
  onCreateOrderForCustomer?: (customerName: string, customerContact: string | null) => void;
}

export function CustomersView({
  orders,
  onSelectCustomerOrder,
  onCreateOrderForCustomer,
}: CustomersViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Group orders by customer name / contact
  const customers = useMemo<CustomerProfile[]>(() => {
    const map = new Map<string, CustomerProfile>();

    orders.forEach((order) => {
      const name = (order.customer_name || 'Anonymous Customer').trim();
      const key = name.toLowerCase();

      if (!map.has(key)) {
        map.set(key, {
          id: `cust-${key.replace(/\s+/g, '-')}`,
          name: name,
          contact: order.customer_contact,
          address: order.delivery_address,
          orders: [order],
          totalOrders: 1,
          totalSpend: order.status === 'approved' ? order.total : 0,
          lastOrderDate: order.created_at,
          averageOrderValue: 0,
        });
      } else {
        const existing = map.get(key)!;
        existing.orders.push(order);
        existing.totalOrders += 1;
        if (order.status === 'approved') {
          existing.totalSpend += order.total;
        }
        if (!existing.contact && order.customer_contact) {
          existing.contact = order.customer_contact;
        }
        if (!existing.address && order.delivery_address) {
          existing.address = order.delivery_address;
        }
        if (new Date(order.created_at) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.created_at;
        }
      }
    });

    return Array.from(map.values()).map((c) => ({
      ...c,
      averageOrderValue: c.totalOrders > 0 ? c.totalSpend / c.totalOrders : 0,
    })).sort((a, b) => b.totalSpend - a.totalSpend);
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.contact && c.contact.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-purple-400" />
            Customer Directory
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Aggregated customer context, order history, and lifetime spending insights.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone, or address..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl">
          <p className="text-xs font-medium text-slate-400">Total Unique Customers</p>
          <p className="text-2xl font-bold text-white mt-1">{customers.length}</p>
        </div>
        <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl">
          <p className="text-xs font-medium text-slate-400">Total Orders Placed</p>
          <p className="text-2xl font-bold text-indigo-400 mt-1">{orders.length}</p>
        </div>
        <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl">
          <p className="text-xs font-medium text-slate-400">Total Approved Revenue</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            ${customers.reduce((acc, c) => acc + c.totalSpend, 0).toFixed(2)}
          </p>
        </div>
        <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl">
          <p className="text-xs font-medium text-slate-400">Avg Spend per Customer</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">
            ${customers.length > 0 ? (customers.reduce((acc, c) => acc + c.totalSpend, 0) / customers.length).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      {/* Customer Cards Grid / Table */}
      {filteredCustomers.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No customers found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No customer matches the query "${searchQuery}".`
              : 'Customers will appear here automatically when orders are processed.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              onClick={() => setSelectedCustomerId(customer.id)}
              className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl hover:border-purple-500/50 hover:bg-slate-900 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-base shrink-0 group-hover:scale-105 transition-transform">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {customer.totalOrders} {customer.totalOrders === 1 ? 'order' : 'orders'}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-white mt-3 group-hover:text-purple-300 transition-colors">
                  {customer.name}
                </h3>

                <div className="space-y-1.5 mt-3 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{customer.contact || 'No phone provided'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{customer.address || 'No address on file'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-500">Lifetime Spend</p>
                  <p className="text-sm font-semibold font-mono text-emerald-400">
                    ${customer.totalSpend.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-purple-400 font-medium group-hover:translate-x-1 transition-transform">
                  View Profile <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer Detail Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-lg">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedCustomer.name}</h2>
                  <p className="text-xs text-slate-400">Customer Profile & Order History</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="py-4 border-b border-slate-800">
              <button
                onClick={() => {
                  if (onCreateOrderForCustomer) {
                    onCreateOrderForCustomer(selectedCustomer.name, selectedCustomer.contact);
                  }
                  setSelectedCustomerId(null);
                }}
                className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-purple-600/20"
              >
                <PlusCircle className="w-4 h-4" />
                Draft New Order for {selectedCustomer.name}
              </button>
            </div>

            {/* Contact Details Card */}
            <div className="py-4 border-b border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Contact & Shipping Details
              </h4>
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-500 block">Phone / Contact:</span>
                    <span className="text-slate-200 font-medium">
                      {selectedCustomer.contact || 'Not provided'}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-500 block">Default Shipping Address:</span>
                    <span className="text-slate-200 font-medium">
                      {selectedCustomer.address || 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lifetime Metrics */}
            <div className="py-4 border-b border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Customer Metrics
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <span className="text-slate-500 text-xs block">Total Orders</span>
                  <span className="text-lg font-bold text-white font-mono">
                    {selectedCustomer.totalOrders}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <span className="text-slate-500 text-xs block">Lifetime Spend</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    ${selectedCustomer.totalSpend.toFixed(2)}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <span className="text-slate-500 text-xs block">Avg Order Value</span>
                  <span className="text-lg font-bold text-purple-400 font-mono">
                    ${selectedCustomer.averageOrderValue.toFixed(2)}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <span className="text-slate-500 text-xs block">Last Active</span>
                  <span className="text-xs font-medium text-slate-300 truncate block mt-1">
                    {new Date(selectedCustomer.lastOrderDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Order History */}
            <div className="py-4 flex-1 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Order History ({selectedCustomer.orders.length})
              </h4>
              <div className="space-y-2">
                {selectedCustomer.orders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => {
                      if (onSelectCustomerOrder) onSelectCustomerOrder(ord);
                    }}
                    className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-indigo-400">{ord.id}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          ord.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : ord.status === 'pending_approval'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {ord.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-2 line-clamp-2">
                      {ord.raw_message}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                      <span>{new Date(ord.created_at).toLocaleDateString()}</span>
                      <span className="font-mono font-semibold text-white">
                        ${ord.total.toFixed(2)}
                      </span>
                    </div>
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
