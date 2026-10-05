'use client';

import React, { useState, useMemo } from 'react';
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
  ArrowUpDown,
  Eye,
  ArrowRight,
  TrendingDown,
  Layers,
  History,
} from 'lucide-react';
import { Product } from '@/lib/types';

interface InventoryManagerProps {
  products: Product[];
  onInventoryUpdated: () => void;
  onShowToast?: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export function InventoryManager({
  products,
  onInventoryUpdated,
  onShowToast,
}: InventoryManagerProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'in_stock' | 'low_stock' | 'out_of_stock'>('All');
  const [sortBy, setSortBy] = useState<'stock_asc' | 'stock_desc' | 'name_asc' | 'price_desc'>('stock_asc');

  // Product Detail Drawer
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Stock Adjustment Modal
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'increase' | 'decrease'>('increase');
  const [adjustQuantity, setAdjustQuantity] = useState(5);
  const [adjustReason, setAdjustReason] = useState('Restock shipment received');
  const [actionLoading, setActionLoading] = useState(false);

  // Add / Edit Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Stationery');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('4.99');
  const [stockQuantity, setStockQuantity] = useState('20');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [variantsStr, setVariantsStr] = useState('');

  const categories = ['All', 'Apparel', 'Stationery', 'Office'];

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (categoryFilter !== 'All' && p.category.toLowerCase() !== categoryFilter.toLowerCase())
          return false;

        const isOutOfStock = p.stock_quantity === 0;
        const isLowStock = p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold;
        const isInStock = p.stock_quantity > p.low_stock_threshold;

        if (statusFilter === 'out_of_stock' && !isOutOfStock) return false;
        if (statusFilter === 'low_stock' && !isLowStock) return false;
        if (statusFilter === 'in_stock' && !isInStock) return false;

        if (!search) return true;
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'stock_asc') return a.stock_quantity - b.stock_quantity;
        if (sortBy === 'stock_desc') return b.stock_quantity - a.stock_quantity;
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'price_desc') return b.price - a.price;
        return 0;
      });
  }, [products, categoryFilter, statusFilter, search, sortBy]);

  // Handle Manual Stock Adjustment
  const handleConfirmStockAdjustment = async () => {
    if (!adjustingProduct) return;
    setActionLoading(true);

    const delta = adjustType === 'increase' ? adjustQuantity : -adjustQuantity;
    const newStock = Math.max(0, adjustingProduct.stock_quantity + delta);

    try {
      const resp = await fetch(`/api/inventory/${adjustingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock_quantity: newStock,
          reason: adjustReason,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to adjust stock');

      if (onShowToast) {
        onShowToast(
          'success',
          'Stock Adjusted',
          `${adjustingProduct.name}: ${adjustingProduct.stock_quantity} → ${newStock} units (${adjustType === 'increase' ? '+' : '-'}${adjustQuantity}).`
        );
      }

      setAdjustingProduct(null);
      if (selectedProduct?.id === adjustingProduct.id) {
        setSelectedProduct(data.product);
      }
      onInventoryUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error adjusting stock';
      if (onShowToast) onShowToast('error', 'Adjustment Failed', msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Add / Edit Product
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
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stockQuantity, 10);
    const lowNum = parseInt(lowStockThreshold, 10);

    const payload = {
      sku: sku.trim(),
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      price: isNaN(priceNum) ? 0 : priceNum,
      stock_quantity: isNaN(stockNum) ? 0 : stockNum,
      low_stock_threshold: isNaN(lowNum) ? 5 : lowNum,
      variants: variantsStr
        ? variantsStr.split(',').map((v) => v.trim()).filter(Boolean)
        : [],
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

      setIsAddModalOpen(false);
      if (onShowToast) {
        onShowToast(
          'success',
          editingProduct ? 'Product Updated' : 'Product Added',
          `${payload.name} saved successfully.`
        );
      }
      onInventoryUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving product';
      if (onShowToast) onShowToast('error', 'Save Failed', msg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Package className="w-6 h-6 text-blue-400" />
              Inventory &amp; Stock Operations
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {products.length} Products Tracked
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time stock catalog inspected by the AI agent before drafting customer orders.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-600/20 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search, Filter & Sort Controls Strip */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, SKU, category..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Category Filter */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  categoryFilter === cat ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(
              [
                { id: 'All', label: 'All Status' },
                { id: 'in_stock', label: 'In Stock' },
                { id: 'low_stock', label: 'Low Stock' },
                { id: 'out_of_stock', label: 'Out of Stock' },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  statusFilter === s.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800 text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none"
            >
              <option value="stock_asc" className="bg-slate-900">Stock (Lowest First)</option>
              <option value="stock_desc" className="bg-slate-900">Stock (Highest First)</option>
              <option value="name_asc" className="bg-slate-900">Name (A-Z)</option>
              <option value="price_desc" className="bg-slate-900">Price (Highest First)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Price</th>
                <th className="py-3 px-3 text-center">Current Stock</th>
                <th className="py-3 px-3 text-center">Reorder Level</th>
                <th className="py-3 px-3 text-center">Stock Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stock_quantity === 0;
                const isLowStock = p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold;
                const statusBadge = isOutOfStock
                  ? { label: 'OUT OF STOCK', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
                  : isLowStock
                  ? { label: 'LOW STOCK', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
                  : { label: 'IN STOCK', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-100">{p.name}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 max-w-sm">{p.description}</div>
                    </td>

                    <td className="py-3 px-3 font-mono text-blue-400">{p.sku}</td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium text-[10px]">
                        {p.category}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-200 font-semibold">
                      ${p.price.toFixed(2)}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-sm">
                      <span className={isOutOfStock ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-emerald-400'}>
                        {p.stock_quantity}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-slate-400">
                      {p.low_stock_threshold}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setAdjustingProduct(p)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors text-[11px] font-medium"
                          title="Quick Stock Adjustment"
                        >
                          +/- Stock
                        </button>
                        <button
                          onClick={() => setSelectedProduct(p)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                          title="View Product Detail Drawer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredProducts.length} of {products.length} products</span>
          <span>Automatic safety guardrails enabled</span>
        </div>
      </div>

      {/* =========================================
          PRODUCT DETAIL DRAWER
          ========================================= */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="font-mono text-xs text-blue-400">{selectedProduct.sku}</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedProduct.name}</h3>
                <p className="text-xs text-slate-400">{selectedProduct.category}</p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-5 text-xs flex-1">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Product Description
                </span>
                <p className="text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  {selectedProduct.description || 'No description provided.'}
                </p>
              </div>

              {/* Stock Status Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <span className="text-[11px] text-slate-400 block">Current Stock</span>
                  <span className="text-2xl font-bold font-mono text-white mt-1 block">
                    {selectedProduct.stock_quantity}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <span className="text-[11px] text-slate-400 block">Safety Reorder Level</span>
                  <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
                    {selectedProduct.low_stock_threshold}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Known Variants
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProduct.variants.map((v, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs">
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Unit Retail Price:</span>
                  <span className="font-mono font-bold text-white text-sm">
                    ${selectedProduct.price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Created:</span>
                  <span className="text-slate-300">{new Date(selectedProduct.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex gap-2">
              <button
                onClick={() => {
                  setAdjustingProduct(selectedProduct);
                  setSelectedProduct(null);
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Adjust Stock Level
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          STOCK ADJUSTMENT MODAL
          ========================================= */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Manual Stock Adjustment</h3>
                <p className="text-xs text-slate-400">{adjustingProduct.name}</p>
              </div>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setAdjustType('increase')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  adjustType === 'increase'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Increase Stock</span>
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('decrease')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  adjustType === 'decrease'
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <MinusCircle className="w-4 h-4" />
                <span>- Decrease Stock</span>
              </button>
            </div>

            {/* Quantity */}
            <div className="space-y-1.5 text-xs">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Quantity to {adjustType}
              </label>
              <input
                type="number"
                min={1}
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Reason */}
            <div className="space-y-1.5 text-xs">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Reason for Adjustment (Required for Audit Trail)
              </label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Shipment received, Inventory count audit, Damaged write-off"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Preview */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Current Stock:</span>
                <span className="font-mono text-white font-bold">{adjustingProduct.stock_quantity}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Adjustment:</span>
                <span className={`font-mono font-bold ${adjustType === 'increase' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {adjustType === 'increase' ? '+' : '-'}{adjustQuantity}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white">
                <span>New Stock Level:</span>
                <span className="font-mono text-emerald-400">
                  {Math.max(
                    0,
                    adjustingProduct.stock_quantity + (adjustType === 'increase' ? adjustQuantity : -adjustQuantity)
                  )}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStockAdjustment}
                disabled={actionLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/20"
              >
                {actionLoading ? 'Saving...' : 'Confirm & Log Audit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          ADD / EDIT PRODUCT MODAL
          ========================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingProduct ? 'Edit Catalog Product' : 'Add New Catalog Product'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Stock Qty</label>
                  <input
                    type="number"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Reorder Level</label>
                  <input
                    type="number"
                    required
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Variants (comma separated)</label>
                <input
                  type="text"
                  value={variantsStr}
                  onChange={(e) => setVariantsStr(e.target.value)}
                  placeholder="e.g. Small, Medium, Large"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/20"
                >
                  {actionLoading ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
