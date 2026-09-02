import React from 'react';
import { useFinance, AppTab } from '../context/FinanceContext';
import { 
  LayoutDashboard, 
  CheckCheck, 
  ArrowLeftRight, 
  AlertTriangle,
  History,
  TrendingUp,
  Database,
  FileText,
  ShieldCheck
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, exceptions, threeWayRecords, metrics } = useFinance();

  const openExceptionsCount = threeWayRecords.filter(r => r.current_status === 'EXCEPTION').length || exceptions.filter(e => e.status === 'OPEN').length;

  const navItems: { id: AppTab; label: string; icon: React.FC<{ className?: string }>; badge?: string | number; badgeColor?: string }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { 
      id: 'reconciliation', 
      label: '3-Way Reconciliation', 
      icon: CheckCheck, 
      badge: `${metrics.matchRatePercentage}%`, 
      badgeColor: 'bg-blue-50 text-[#0c66e4] font-semibold' 
    },
    { id: 'settlements', label: 'Settlements', icon: ArrowLeftRight },
    { 
      id: 'exceptions', 
      label: 'Exceptions', 
      icon: AlertTriangle, 
      badge: openExceptionsCount > 0 ? openExceptionsCount : undefined, 
      badgeColor: 'bg-red-50 text-red-700 font-semibold' 
    },
    { id: 'audit', label: 'Audit Trail', icon: History },
    { id: 'performance', label: 'Benchmark & Precision', icon: TrendingUp },
    { id: 'dataset', label: 'Data Generator', icon: Database },
    { id: 'reports', label: 'Reports', icon: FileText }
  ];

  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between hidden md:flex">
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Reconciliation Engine
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-[#0c66e4] font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon
                  className={`h-4 w-4 transition-colors ${
                    isActive ? 'text-[#0c66e4]' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Audit Statement */}
      <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
        <div className="text-slate-700 font-semibold flex items-center">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 mr-1" />
          Deterministic Gate
        </div>
        <p className="text-[10px] leading-relaxed text-slate-500">
          AI proposes. Deterministic verification decides.
        </p>
      </div>
    </aside>
  );
};
