import React, { useState } from 'react';
import { Transaction } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Clock, CreditCard, User, ChevronDown, ChevronUp } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  role: 'merchant' | 'customer';
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, role }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string | undefined) => {
    if (!id) return;
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-semibold text-[#444746] uppercase tracking-wider">Recent Activity</h3>
      </div>
      
      <div className="space-y-3">
        {transactions.length === 0 ? (
          <div className="bg-[#f0f4f9] rounded-2xl p-12 text-center text-[#444746] border border-transparent">
            No recent activity to show.
          </div>
        ) : (
          transactions.map((tx, idx) => (
            <motion.div
              key={tx.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => toggleExpand(tx.id)}
              className="bg-white rounded-2xl p-5 border border-[#e1e5ea] hover:border-[#d2d7dd] transition-all cursor-pointer group shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    tx.status === 'success' ? 'bg-[#e8f0fe] text-[#1967d2]' : 'bg-[#fce8e6] text-[#d93025]'
                  }`}>
                    {role === 'merchant' ? (
                      <ArrowDownLeft className="w-6 h-6" />
                    ) : (
                      <ArrowUpRight className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-[#1f1f1f] text-lg">
                      {role === 'merchant' ? tx.customerName : tx.merchantName}
                    </div>
                    <div className="text-sm text-[#444746] flex items-center gap-2 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(tx.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      <span className="mx-1 opacity-30">•</span>
                      <span className="capitalize">{tx.category}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right flex items-center gap-4">
                  <div>
                    <div className={`font-semibold text-xl ${
                      tx.status === 'success' ? 'text-[#1f1f1f]' : 'text-[#c4c7c5] line-through'
                    }`}>
                      ₹{tx.amount}
                    </div>
                    <div className={`text-[11px] font-bold uppercase tracking-widest mt-1 ${
                      tx.status === 'success' ? 'text-[#1967d2]' : 'text-[#d93025]'
                    }`}>
                      {tx.status}
                    </div>
                  </div>
                  {tx.items && tx.items.length > 0 && (
                     <div className="text-[#444746] opacity-50 ml-2 group-hover:opacity-100 transition-opacity">
                        {expandedId === tx.id ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                     </div>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {expandedId === tx.id && tx.items && tx.items.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 mt-4 border-t border-[#f0f4f9]">
                      <div className="mb-2 text-xs font-bold text-[#444746] uppercase tracking-wider">
                         Items Purchased ({tx.items.length})
                      </div>
                      <div className="flex flex-col gap-2">
                        {tx.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between bg-[#f8fafd] px-4 py-2 rounded-xl">
                            <span className="font-medium text-[13px] text-[#1f1f1f]">{item.name}</span>
                            <div className="flex items-center gap-4 text-[13px]">
                               <span className="text-[#444746]">x{item.quantity}</span>
                               <span className="font-semibold text-[#1f1f1f] w-12 text-right">₹{item.price * item.quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default TransactionList;
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
