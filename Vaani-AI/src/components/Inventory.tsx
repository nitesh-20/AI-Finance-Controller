import React, { useState } from 'react';
import { Package, Search, IndianRupee, TrendingUp, AlertCircle, ShoppingBag } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { kiranaInventory } from '../mockData';

export function Inventory() {
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
    <div className="w-full flex-1 flex flex-col gap-6 p-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1f1f1f] tracking-tight">Kirana Store Inventory</h2>
          <p className="text-sm text-[#444746] mt-1">Manage stock, prices, and availability.</p>
        </div>
        <div className="flex gap-4">
            <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-[#e8eaed] flex flex-col items-start min-w-[140px]">
                <span className="text-[11px] font-semibold text-[#444746] uppercase tracking-wider mb-1">Total Stock Value</span>
                <span className="text-xl font-bold text-[#1967d2] flex items-center"><IndianRupee className="w-4 h-4 mr-0.5" />{totalValue.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-[#e8eaed] flex flex-col items-start min-w-[140px]">
                <span className="text-[11px] font-semibold text-[#444746] uppercase tracking-wider mb-1">Low Stock Alerts</span>
                <span className="text-xl font-bold text-[#d93025] flex items-center">{lowStockCount} Items</span>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-[#e8eaed] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#e8eaed] flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#f8f9fa] backdrop-blur-md">
            <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#444746]" />
                <input 
                    type="text" 
                    placeholder="Search inventory..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-[#e8eaed] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20 focus:border-[#1a73e8] transition-all"
                />
            </div>
            <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar" style={{scrollbarWidth: 'none'}}>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                            activeCategory === cat 
                                ? "bg-[#1967d2] text-white shadow-md shadow-[#1967d2]/20" 
                                : "bg-white text-[#444746] border border-[#e8eaed] hover:bg-[#f1f3f4]"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-white border-b border-[#e8eaed]">
                        <th className="px-6 py-4 text-xs font-semibold text-[#444746] uppercase tracking-wider">Item Name</th>
                        <th className="px-6 py-4 text-xs font-semibold text-[#444746] uppercase tracking-wider">Category</th>
                        <th className="px-6 py-4 text-xs font-semibold text-[#444746] uppercase tracking-wider">Price/Unit</th>
                        <th className="px-6 py-4 text-xs font-semibold text-[#444746] uppercase tracking-wider">Stock</th>
                        <th className="px-6 py-4 text-xs font-semibold text-[#444746] uppercase tracking-wider text-right">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredItems.map((item, index) => (
                        <motion.tr 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(index * 0.02, 0.2) }}
                            key={item.id} 
                            className="border-b border-[#f1f3f4] hover:bg-[#f8f9fa] transition-colors group"
                        >
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#e8f0fe] flex items-center justify-center text-[#1967d2]">
                                        <ShoppingBag className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium text-[#1f1f1f]">{item.name}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="inline-flex px-2.5 py-1 rounded-full bg-[#f1f3f4] text-[#444746] text-xs font-medium">
                                    {item.category}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-[#1f1f1f] font-medium">₹{item.price}</td>
                            <td className="px-6 py-4">
                                <span className={cn(
                                    "font-medium",
                                    item.stock < 20 ? "text-[#d93025]" : "text-[#1f1f1f]"
                                )}>
                                    {item.stock} units
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <span className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
                                    item.status === 'In Stock' && "bg-[#e6f4ea] text-[#137333]",
                                    item.status === 'Low Stock' && "bg-[#fef7e0] text-[#c5221f] border border-[#fce8b2]",
                                    item.status === 'Out of Stock' && "bg-[#fce8e6] text-[#c5221f]"
                                )}>
                                    {item.status === 'In Stock' && <span className="w-1.5 h-1.5 rounded-full bg-[#137333]"></span>}
                                    {item.status === 'Low Stock' && <span className="w-1.5 h-1.5 rounded-full bg-[#e37400]"></span>}
                                    {item.status === 'Out of Stock' && <AlertCircle className="w-3 h-3" />}
                                    {item.status}
                                </span>
                            </td>
                        </motion.tr>
                    ))}
                    {filteredItems.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-[#444746]">
                                <Package className="w-12 h-12 mx-auto mb-3 text-[#dadce0]" />
                                <p className="font-medium">No items found</p>
                                <p className="text-sm mt-1">Try adjusting your search or category filter.</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
} 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
