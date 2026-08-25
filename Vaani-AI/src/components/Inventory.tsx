import React, { useState } from 'react';
import { Package, Search, IndianRupee, TrendingUp, AlertCircle, ShoppingBag, Boxes } from 'lucide-react';
import { cn } from '../lib/utils';
import { kiranaInventory } from '../mockData';

export const Inventory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(kiranaInventory.map(item => item.category)))];

  const filteredItems = kiranaInventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const totalValue = kiranaInventory.reduce((acc, item) => acc + (item.price * item.stock), 0);
  const lowStockCount = kiranaInventory.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock').length;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Merchant Operational Inventory</h1>
            <span className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
              Operations &amp; Stock
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Cross-reference SKU stock depletion against reconciled payment batches.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="rounded-xl border border-slate-800 bg-[#0d111a] p-3 text-xs min-w-[140px]">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Total Stock Value</span>
            <div className="mt-1 text-base font-bold text-white">₹{totalValue.toLocaleString('en-IN')}</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0d111a] p-3 text-xs min-w-[140px]">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Low Stock Alerts</span>
            <div className="mt-1 text-base font-bold text-rose-400">{lowStockCount} Items</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#0d111a] overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-900/40">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search SKU by name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat 
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" 
                    : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/20 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Unit Price</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">{item.name}</td>
                  <td className="py-3 px-4 text-slate-400">{item.category}</td>
                  <td className="py-3 px-4 font-medium text-slate-200">₹{item.price} / {item.unit}</td>
                  <td className="py-3 px-4 font-mono">{item.stock} {item.unit}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      item.status === 'In Stock'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : item.status === 'Low Stock'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
