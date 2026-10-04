'use client';

import React, { useState } from 'react';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  Download,
  Upload,
  RotateCcw,
  Edit2,
  Trash2,
  PlusCircle,
  MinusCircle,
  X,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Product } from '@/lib/types';

interface InventoryManagerProps {
  products: Product[];
  onInventoryUpdated: () => void;
}

export function InventoryManager({ products, onInventoryUpdated }: InventoryManagerProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Add / Edit Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Stationery');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('4.99');
  const [stockQuantity, setStockQuantity] = useState('20');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [variantsStr, setVariantsStr] = useState('');

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const categories = ['All', 'Apparel', 'Stationery', 'Office'];

  // Filtering
  const filtered = products.filter((p) => {
    if (categoryFilter !== 'All' && p.category.toLowerCase() !== categoryFilter.toLowerCase())
      return false;
    if (lowStockOnly && p.stock_quantity > p.low_stock_threshold) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setSku(`SKU-${Math.random().toString(36).substring(2, 7).toUpperCase()}`);
    setName('');
    setCategory('Stationery');
    setDescription('');
    setPrice('9.99');
    setStockQuantity('15');
    setLowStockThreshold('5');
    setVariantsStr('');
    setFeedback(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setSku(p.sku);
    setName(p.name);
    setCategory(p.category);
    setDescription(p.description || '');
    setPrice(String(p.price));
    setStockQuantity(String(p.stock_quantity));
    setLowStockThreshold(String(p.low_stock_threshold));
    setVariantsStr(p.variants.join(', '));
    setFeedback(null);
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stockQuantity, 10);
    const thresholdNum = parseInt(lowStockThreshold, 10);

    if (isNaN(priceNum) || priceNum < 0) {
      setFeedback({ type: 'error', message: 'Price must be a valid non-negative number.' });
      setLoading(false);
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      setFeedback({ type: 'error', message: 'Stock quantity cannot be negative.' });
      setLoading(false);
      return;
    }

    const payload = {
      sku,
      name,
      category,
      description,
      price: priceNum,
      stock_quantity: stockNum,
      low_stock_threshold: isNaN(thresholdNum) ? 5 : thresholdNum,
      variants: variantsStr.split(',').map((v) => v.trim()).filter(Boolean),
    };

    try {
      const url = editingProduct ? `/api/inventory/${editingProduct.id}` : '/api/inventory';
      const method = editingProduct ? 'PATCH' : 'POST';

      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to save product');

      setFeedback({
        type: 'success',
        message: editingProduct ? `Product "${name}" updated!` : `Product "${name}" added to inventory!`,
      });
      setIsAddModalOpen(false);
      onInventoryUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving product';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async (p: Product, delta: number) => {
    const nextStock = p.stock_quantity + delta;
    if (nextStock < 0) {
      setFeedback({ type: 'error', message: `Cannot reduce stock below 0 for ${p.name}.` });
      return;
    }

    try {
      const resp = await fetch(`/api/inventory/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_quantity: nextStock }),
      });
      if (!resp.ok) {
        const d = await resp.json();
        throw new Error(d.error || 'Failed to adjust stock');
      }
      onInventoryUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Stock adjustment failed';
      setFeedback({ type: 'error', message: msg });
    }
  };

  const handleDeleteProduct = async (p: Product) => {
    if (!confirm(`Are you sure you want to delete "${p.name}"?`)) return;
    try {
      const resp = await fetch(`/api/inventory/${p.id}`, { method: 'DELETE' });
      if (!resp.ok) {
        const d = await resp.json();
        throw new Error(d.error || 'Failed to delete');
      }
      onInventoryUpdated();
      setFeedback({ type: 'success', message: `Product "${p.name}" deleted.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      setFeedback({ type: 'error', message: msg });
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'SKU', 'Name', 'Category', 'Price', 'Stock', 'LowStockThreshold', 'Variants'];
    const rows = filtered.map((p) => [
      `"${p.id}"`,
      `"${p.sku}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.price.toFixed(2),
      p.stock_quantity,
      p.low_stock_threshold,
      `"${p.variants.join('; ')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orderpilot-inventory-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetSampleInventory = async () => {
    if (!confirm('Reset inventory and orders to pristine sample state?')) return;
    try {
      const resp = await fetch('/api/demo/reset', { method: 'POST' });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);
      onInventoryUpdated();
      setFeedback({ type: 'success', message: 'Sample inventory restored cleanly!' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reset failed';
      setFeedback({ type: 'error', message: msg });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Real Inventory Registry
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {products.length} Stored Products
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Ground-truth catalog consulted by the AI agent during message parsing and re-verified atomically at approval time.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleResetSampleInventory}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Reset to default hackathon sample catalog"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Catalog</span>
          </button>
        </div>
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

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by SKU, name, or category..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  categoryFilter === cat
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Low Stock Toggle */}
          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              lowStockOnly
                ? 'bg-rose-50 border-rose-300 text-rose-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Low Stock Alerts</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">SKU &amp; Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5 text-right">Price</th>
                <th className="p-3.5">Stock Level</th>
                <th className="p-3.5">Variants</th>
                <th className="p-3.5 text-center">Quick Adjust</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No products found.
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => {
                  const isLow = prod.stock_quantity <= prod.low_stock_threshold;
                  const isOut = prod.stock_quantity === 0;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{prod.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{prod.sku}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {prod.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-900">
                        ${prod.price.toFixed(2)}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'
                            }`}
                          >
                            {prod.stock_quantity} units
                          </span>
                          {isOut ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 uppercase">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 uppercase">
                              Low Stock (&le;{prod.low_stock_threshold})
                            </span>
                          ) : (
                            <span className="text-[9px] font-semibold text-emerald-700">OK</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-500 max-w-[180px] truncate">
                        {prod.variants.length > 0 ? prod.variants.join(', ') : 'None'}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleAdjustStock(prod, -1)}
                            disabled={prod.stock_quantity <= 0}
                            className="p-1 hover:bg-slate-100 text-slate-600 rounded disabled:opacity-40"
                            title="Decrease stock by 1"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>
                          <span className="font-mono text-xs w-6 text-center">
                            {prod.stock_quantity}
                          </span>
                          <button
                            onClick={() => handleAdjustStock(prod, 1)}
                            className="p-1 hover:bg-slate-100 text-slate-600 rounded"
                            title="Increase stock by 1"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg font-mono outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Apparel, Stationery"
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Blue cotton shirt, medium"
                  className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Low-Stock Alert</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Variants (comma-separated)
                </label>
                <input
                  type="text"
                  value={variantsStr}
                  onChange={(e) => setVariantsStr(e.target.value)}
                  placeholder="e.g. Medium, Blue, 160 Pages"
                  className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm"
                >
                  {loading ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
