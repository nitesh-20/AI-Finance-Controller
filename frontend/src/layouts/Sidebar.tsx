import React from 'react';
import { useFinance, AppTab } from '../context/FinanceContext';
import { 
  LayoutDashboard, 
  CheckCheck, 
  ArrowLeftRight, 
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, exceptions, metrics } = useFinance();

  const openExceptionsCount = exceptions.filter(e => e.status === 'OPEN').length;

  const navItems: { id: AppTab; label: string; icon: React.FC<{ className?: string }>; badge?: string | number; badgeColor?: string }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { 
      id: 'reconciliation', 
      label: 'Reconciliation', 
      icon: CheckCheck, 
      badge: `${metrics.matchRatePercentage}%`, 
      badgeColor: 'bg-slate-100 text-slate-700 font-semibold' 
    },
    { id: 'settlements', label: 'Settlements', icon: ArrowLeftRight },
    { 
      id: 'exceptions', 
      label: 'Exceptions', 
      icon: AlertTriangle, 
      badge: openExceptionsCount > 0 ? openExceptionsCount : undefined, 
      badgeColor: 'bg-red-50 text-red-700 font-semibold' 
    }
  ];

  return (
    <aside className="w-56 shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between hidden md:flex">
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Finance Operations
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
      <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400">
        <div className="text-slate-600 font-medium">Deterministic Engine</div>
        <p className="mt-0.5 text-[10px] leading-normal">
          Verified 10-step arithmetic matching with statutory bank records.
        </p>
      </div>
    </aside>
  );
};
