import React from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { FinanceDashboard } from './components/FinanceDashboard';
import { ReconciliationCenter } from './components/ReconciliationCenter';
import { SettlementIntelligence } from './components/SettlementIntelligence';
import { ExceptionCenter } from './components/ExceptionCenter';
import VoiceAgent from './components/VoiceAgent';
import { LayoutDashboard, CheckCheck, ArrowLeftRight, AlertTriangle } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, isVoiceOpen, setIsVoiceOpen, exceptions } = useFinance();
  const openExceptionsCount = exceptions.filter(e => e.status === 'OPEN').length;

  return (
    <div className="flex h-screen w-full flex-col bg-[#f8fafc] text-slate-900 font-sans antialiased overflow-hidden selection:bg-blue-100 selection:text-blue-900">
      {/* Global Header */}
      <Navbar />

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Clean 4-Item Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 bg-[#f8fafc]">
          <div className="mx-auto max-w-6xl">
            {activeTab === 'overview' && <FinanceDashboard />}
            {activeTab === 'reconciliation' && <ReconciliationCenter />}
            {activeTab === 'settlements' && <SettlementIntelligence />}
            {activeTab === 'exceptions' && <ExceptionCenter />}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="flex md:hidden border-t border-slate-200 bg-white px-2 py-1.5 justify-around items-center text-[10px] text-slate-500 z-30 shadow-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center py-1 px-3 rounded-md ${
            activeTab === 'overview' ? 'text-[#0c66e4] font-semibold' : ''
          }`}
        >
          <LayoutDashboard className="h-4 w-4 mb-0.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`flex flex-col items-center py-1 px-3 rounded-md ${
            activeTab === 'reconciliation' ? 'text-[#0c66e4] font-semibold' : ''
          }`}
        >
          <CheckCheck className="h-4 w-4 mb-0.5" />
          <span>Reconcile</span>
        </button>

        <button
          onClick={() => setActiveTab('settlements')}
          className={`flex flex-col items-center py-1 px-3 rounded-md ${
            activeTab === 'settlements' ? 'text-[#0c66e4] font-semibold' : ''
          }`}
        >
          <ArrowLeftRight className="h-4 w-4 mb-0.5" />
          <span>Settlements</span>
        </button>

        <button
          onClick={() => setActiveTab('exceptions')}
          className={`flex flex-col items-center py-1 px-3 rounded-md relative ${
            activeTab === 'exceptions' ? 'text-[#0c66e4] font-semibold' : ''
          }`}
        >
          <AlertTriangle className="h-4 w-4 mb-0.5" />
          <span>Exceptions</span>
          {openExceptionsCount > 0 && (
            <span className="absolute top-0.5 right-2 h-1.5 w-1.5 rounded-full bg-red-600" />
          )}
        </button>
      </nav>

      {/* Global Persistent Voice Copilot Panel */}
      <VoiceAgent
        userId="demo-merchant-01"
        role="merchant"
        userName="Bharat Merchants"
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <FinanceProvider>
      <MainLayout />
    </FinanceProvider>
  );
};

export default App;
