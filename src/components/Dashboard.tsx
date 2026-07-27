import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  IndianRupee,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  Utensils,
  Zap,
  CreditCard,
  Building2,
  Store,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Transaction } from "../types";
import { cn } from "../lib/utils";
import { formatDistanceToNow } from "date-fns";

interface DashboardProps {
  transactions: Transaction[];
  onSetView: (view: "chat" | "transactions" | "dashboard") => void;
}

export default function Dashboard({ transactions, onSetView }: DashboardProps) {
  const stats = useMemo(() => {
    let totalBalance = 245000; // Mock starting balance for realism
    let totalReceived = 0;
    let totalSpent = 0;
    let failedCount = 0;
    const categorySpends: Record<string, number> = {};
    const merchantSpends: Record<string, { count: number; total: number }> = {};
    const statusCounts = { success: 0, pending: 0, failed: 0 };

    // Process Special Failed Transaction
    const recentFailed = transactions.filter(
      (t) =>
        t.status === "failed" &&
        new Date(t.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000,
    );

    transactions.forEach((t) => {
      // Accumulate Status
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;

      if (t.status === "failed") {
        failedCount++;
        return; // Don't count failed toward spend/balance
      }

      const amount = Number(t.amount);

      if (t.type === "Received" || t.type === "Cashback") {
        totalReceived += amount;
      } else {
        totalSpent += amount;

        // Category Breakdown
        const cat = t.category || "Other";
        categorySpends[cat] = (categorySpends[cat] || 0) + amount;

        // Merchant Breakdown
        const merch = t.merchantName || "Unknown";
        if (!merchantSpends[merch])
          merchantSpends[merch] = { count: 0, total: 0 };
        merchantSpends[merch].count += 1;
        merchantSpends[merch].total += amount;
      }
    });

    const netBalance = totalBalance + totalReceived - totalSpent;

    return {
      netBalance,
      totalSpent,
      totalReceived,
      failedCount,
      recentFailed,
      statusCounts,
      categories: Object.entries(categorySpends)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8),
      topMerchants: Object.entries(merchantSpends)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, 5),
    };
  }, [transactions]);

  const [expandedTxs, setExpandedTxs] = React.useState(false);
  const [expandedRowId, setExpandedRowId] = React.useState<string | null>(null);

  const recentTransactions = [...transactions]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, expandedTxs ? transactions.length : 5);

  const getCategoryIcon = (category: string, type?: string) => {
    switch (category) {
      case "Food & Grocery":
        return <Utensils className="w-5 h-5" />;
      case "Shopping":
      case "Paytm Stores":
      case "Gift Cards & Deals":
        return <ShoppingBag className="w-5 h-5" />;
      case "Recharges & Bill Payments":
        return <Zap className="w-5 h-5" />;
      case "Travel":
      case "Movies & Events":
        return <Store className="w-5 h-5" />;
      case "Insurance":
      case "Paytm Gold":
        return <Building2 className="w-5 h-5" />;
      case "Transfer":
        return type === "Received" ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-6 lg:p-10 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-8 pb-32">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">
            Financial Overview
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your spending and manage your payments.
          </p>
        </div>

        {/* Failed Transaction Alert */}
        {stats.recentFailed.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-100 rounded-3xl p-5 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-red-900">
                  Recent Payment Failed
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {stats.recentFailed[0].description}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-xs font-medium bg-white text-red-700 px-3 py-1 rounded-full shadow-sm">
                    {stats.recentFailed[0].failure_reason || "Server Timeout"}
                  </span>
                  <button className="flex items-center gap-1 text-sm font-semibold text-red-700 hover:text-red-800">
                    <RefreshCw className="w-4 h-4" />
                    Retry Payment
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-900">
                  ₹{stats.recentFailed[0].amount}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {formatDistanceToNow(
                    new Date(stats.recentFailed[0].timestamp),
                    { addSuffix: true },
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-900/20 relative overflow-hidden"
          >
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <p className="text-blue-100 font-medium text-sm drop-shadow-sm">
              Total Balance
            </p>
            <h2 className="text-4xl font-bold mt-2 tracking-tight drop-shadow-md flex items-center gap-1">
              ₹{stats.netBalance.toLocaleString("en-IN")}
            </h2>
            <div className="mt-6 flex items-center justify-between text-sm">
              <span className="text-blue-100 font-medium">
                Available to spend
              </span>
              <Building2 className="w-5 h-5 text-white/50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 font-medium text-sm">
                  Monthly Spends
                </p>
                <h2 className="text-3xl font-bold text-gray-900 mt-2">
                  ₹{stats.totalSpent.toLocaleString("en-IN")}
                </h2>
              </div>
              <div className="bg-red-50 p-2.5 rounded-2xl text-red-600">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-6">
              <span className="text-red-600 font-medium">21% more</span> vs last
              month
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 font-medium text-sm">
                  Total Received
                </p>
                <h2 className="text-3xl font-bold text-gray-900 mt-2">
                  ₹{stats.totalReceived.toLocaleString("en-IN")}
                </h2>
              </div>
              <div className="bg-green-50 p-2.5 rounded-2xl text-green-600">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-6">
              <span className="text-green-600 font-medium">8% more</span> vs
              last month
            </p>
          </motion.div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spending Analytics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-6 px-7 shadow-sm border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Spending Snapshot
            </h3>
            <div className="space-y-5">
              {stats.categories.map(([category, amount], idx) => {
                const percentage = (amount / stats.totalSpent) * 100;
                return (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-gray-700 flex items-center gap-2">
                        {category}
                      </span>
                      <span className="font-bold text-gray-900">
                        ₹{amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          idx === 0
                            ? "bg-blue-600"
                            : idx === 1
                              ? "bg-indigo-500"
                              : idx === 2
                                ? "bg-violet-500"
                                : "bg-gray-400",
                        )}
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Merchant Insights & Payment Status */}
          <div className="grid grid-rows-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top Merchants
              </h3>
              <div className="space-y-4">
                {stats.topMerchants.slice(0, 3).map(([merchant, details]) => (
                  <div
                    key={merchant}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center font-bold text-gray-700 uppercase tracking-wider text-xs">
                        {merchant.substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {merchant}
                        </p>
                        <p className="text-xs text-gray-500">
                          {details.count} transactions
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      ₹{details.total.toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Status Breakdown
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  All transactions this period
                </p>
                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Success</span>
                    <span className="font-bold text-green-600 text-lg">
                      {stats.statusCounts.success || 0}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Failed</span>
                    <span className="font-bold text-red-600 text-lg">
                      {stats.statusCounts.failed || 0}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Pending</span>
                    <span className="font-bold text-yellow-600 text-lg">
                      {stats.statusCounts.pending || 0}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Recent Transactions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100"
        >
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Transactions
            </h3>
            <button
                onClick={() => setExpandedTxs(!expandedTxs)}
                className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"

            >
              {expandedTxs ? "View Less" : "View All History"}
            </button>
          </div>
            <div className={cn("divide-y divide-gray-50", expandedTxs && "max-h-[600px] overflow-y-auto")}>
            {recentTransactions.map((t) => (
              <div key={t.id} className="flex flex-col border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                <div
                  className="p-5 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedRowId(expandedRowId === t.id ? null : t.id)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "p-3 rounded-2xl",
                        t.type === "Received"
                          ? "bg-green-50 text-green-600"
                          : t.status === "failed"
                            ? "bg-red-50 text-red-600"
                            : "bg-blue-50 text-blue-600",
                      )}
                    >
                      {getCategoryIcon(t.category, t.type)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        {t.merchantName || t.customerName}
                        {t.items && t.items.length > 0 && (
                           expandedRowId === t.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(t.timestamp).toLocaleDateString()} at{" "}
                        {new Date(t.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        • {t.payment_method || "UPI"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        "text-sm font-bold",
                        t.type === "Received" || t.type === "Cashback"
                          ? "text-green-600"
                          : "text-gray-900",
                      )}
                    >
                      {t.type === "Received" || t.type === "Cashback" ? "+" : "-"}
                      ₹{t.amount.toLocaleString("en-IN")}
                    </p>
                    {t.status === "failed" && (
                      <p className="text-[10px] font-bold text-red-600 mt-1 uppercase tracking-wider">
                        FAILED
                      </p>
                    )}
                    {t.status === "success" && (
                      <p className="text-[10px] font-bold text-green-600 mt-1 uppercase tracking-wider">
                        SUCCESS
                      </p>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedRowId === t.id && t.items && t.items.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-gray-50/50"
                    >
                      <div className="px-5 pb-5 pl-[72px] space-y-2">
                        {t.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">{item.name} <span className="text-gray-400 ml-1">x{item.qty}</span></span>
                            <span className="font-medium text-gray-900">₹{item.price * item.qty}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
