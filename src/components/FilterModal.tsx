import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check } from "lucide-react";
import { cn } from "../lib/utils";

export interface FilterState {
  paymentSource: string[];
  status: string[];
  type: string[];
  amountRange: { min: string; max: string };
  dateRange: string;
  customDate: { start: string; end: string };
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  currentFilters: FilterState;
}

const TABS = [
  { id: "paymentSource", label: "Payment Source" },
  { id: "status", label: "Status" },
  { id: "type", label: "Type" },
  { id: "amount", label: "Amount" },
  { id: "date", label: "Date Range" },
] as const;

export default function FilterModal({
  isOpen,
  onClose,
  onApply,
  currentFilters,
}: FilterModalProps) {
  const [activeTab, setActiveTab] =
    useState<(typeof TABS)[number]["id"]>("status");

  const [localFilters, setLocalFilters] = useState<FilterState>({
    paymentSource: currentFilters?.paymentSource || [],
    status: currentFilters?.status || [],
    type: currentFilters?.type || [],
    amountRange: currentFilters?.amountRange || { min: "", max: "" },
    dateRange: currentFilters?.dateRange || "",
    customDate: currentFilters?.customDate || { start: "", end: "" },
  });

  const toggleArrayItem = (
    key: keyof Pick<FilterState, "status" | "type" | "paymentSource">,
    value: string,
  ) => {
    setLocalFilters((prev) => {
      const arr = prev[key] || [];
      return {
        ...prev,
        [key]: arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value],
      };
    });
  };

  const setSingleString = (key: keyof FilterState, value: string) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    const cleared = {
      paymentSource: [],
      status: [],
      type: [],
      amountRange: { min: "", max: "" },
      dateRange: "",
      customDate: { start: "", end: "" },
    };
    setLocalFilters(cleared);
    // Don't apply immediately to let user choose
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white shadow-xl z-[70] h-[85vh] flex flex-col md:h-[600px] md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-1/2 md:-translate-x-1/2 md:w-[700px] md:rounded-3xl rounded-t-3xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  Filter by
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden bg-white">
              {/* Left Sidebar */}
              <div className="w-[35%] bg-[#f8fafc] overflow-y-auto hidden-scrollbar py-3 border-r border-gray-100">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full text-left px-5 py-3.5 text-[13px] font-semibold transition-all relative",
                      activeTab === tab.id
                        ? "bg-white text-blue-600 drop-shadow-sm z-10"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50",
                    )}
                  >
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full"
                      />
                    )}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Right Content Area */}
              <div className="w-[65%] p-6 overflow-y-auto custom-scrollbar">
                {activeTab === "paymentSource" && (
                  <div className="space-y-4">
                    {["UPI", "Wallet", "Card"].map((source) => (
                      <label
                        key={source}
                        className="flex items-center gap-4 cursor-pointer group"
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                            localFilters.paymentSource?.includes(source)
                              ? "bg-blue-600 border-blue-600"
                              : "border-gray-300 group-hover:border-blue-400",
                          )}
                        >
                          {localFilters.paymentSource?.includes(source) && (
                            <Check className="w-3.5 h-3.5 text-white" />
                          )}
                        </div>
                        <span className="text-[15px] text-gray-700 font-medium">
                          {source}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {activeTab === "status" && (
                  <div className="space-y-4">
                    {["Successful", "Pending", "Failed"].map((status) => (
                      <label
                        key={status}
                        className="flex items-center gap-4 cursor-pointer group"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleArrayItem("status", status.toLowerCase());
                        }}
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                            localFilters.status?.includes(status.toLowerCase())
                              ? "bg-blue-600 border-blue-600"
                              : "border-gray-300 group-hover:border-blue-400",
                          )}
                        >
                          {localFilters.status?.includes(
                            status.toLowerCase(),
                          ) && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className="text-[15px] text-gray-700 font-medium">
                          {status}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {activeTab === "type" && (
                  <div className="space-y-4">
                    {["Paid", "Received", "Self Transfer", "Cashback"].map(
                      (type) => (
                        <label
                          key={type}
                          className="flex items-center gap-4 cursor-pointer group"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleArrayItem("type", type);
                          }}
                        >
                          <div
                            className={cn(
                              "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                              localFilters.type?.includes(type)
                                ? "bg-blue-600 border-blue-600"
                                : "border-gray-300 group-hover:border-blue-400",
                            )}
                          >
                            {localFilters.type?.includes(type) && (
                              <Check className="w-3.5 h-3.5 text-white" />
                            )}
                          </div>
                          <span className="text-[15px] text-gray-700 font-medium">
                            {type}
                          </span>
                        </label>
                      ),
                    )}
                  </div>
                )}

                {activeTab === "amount" && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Min Amount (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={localFilters.amountRange?.min || ""}
                        onChange={(e) =>
                          setLocalFilters((prev) => ({
                            ...prev,
                            amountRange: {
                              ...prev.amountRange,
                              min: e.target.value,
                            },
                          }))
                        }
                        className="w-full p-4 bg-gray-50 rounded-2xl text-[15px] border-none focus:ring-2 focus:ring-blue-500/20 font-medium text-gray-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Max Amount (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="1,00,000"
                        value={localFilters.amountRange?.max || ""}
                        onChange={(e) =>
                          setLocalFilters((prev) => ({
                            ...prev,
                            amountRange: {
                              ...prev.amountRange,
                              max: e.target.value,
                            },
                          }))
                        }
                        className="w-full p-4 bg-gray-50 rounded-2xl text-[15px] border-none focus:ring-2 focus:ring-blue-500/20 font-medium text-gray-900"
                      />
                    </div>
                  </div>
                )}

                {activeTab === "date" && (
                  <div className="space-y-4">
                    {[
                      "Last 1 month",
                      "Last 3 months",
                      "Last 6 months",
                      "Last 1 year",
                      "Custom Range",
                    ].map((date) => (
                      <label
                        key={date}
                        className="flex items-center gap-4 cursor-pointer group"
                        onClick={() => setSingleString("dateRange", date)}
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                            localFilters.dateRange === date
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-300 group-hover:border-blue-400",
                          )}
                        >
                          {localFilters.dateRange === date && (
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                          )}
                        </div>
                        <span className="text-[15px] text-gray-700 font-medium">
                          {date}
                        </span>
                      </label>
                    ))}

                    {localFilters.dateRange === "Custom Range" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="pt-4 space-y-4 overflow-hidden"
                      >
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={localFilters.customDate?.start || ""}
                            onChange={(e) =>
                              setLocalFilters((p) => ({
                                ...p,
                                customDate: {
                                  ...p.customDate,
                                  start: e.target.value,
                                },
                              }))
                            }
                            className="w-full p-4 bg-gray-50 rounded-2xl text-[15px] border-none font-medium text-gray-900"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={localFilters.customDate?.end || ""}
                            onChange={(e) =>
                              setLocalFilters((p) => ({
                                ...p,
                                customDate: {
                                  ...p.customDate,
                                  end: e.target.value,
                                },
                              }))
                            }
                            className="w-full p-4 bg-gray-50 rounded-2xl text-[15px] border-none font-medium text-gray-900"
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Fallbacks for non-implemented dummy tabs */}
                {["auto", "orders", "hidden"].includes(activeTab) && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                      <Check className="w-8 h-8 text-gray-300" />
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold">Coming Soon</p>
                      <p className="text-sm text-gray-500 mt-1">
                        This filter category will be active in the next update.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 flex items-center gap-4 bg-white rounded-b-3xl">
              <button
                onClick={handleClear}
                className="flex-1 py-4 px-6 rounded-2xl text-[15px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Clear all
              </button>
              <button
                onClick={handleApply}
                className="flex-[2] py-4 px-6 rounded-2xl text-[15px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
