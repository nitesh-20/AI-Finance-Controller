import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Navbar } from './layouts/Navbar';
import { Sidebar } from './layouts/Sidebar';
import { FinanceDashboard } from './features/dashboard/FinanceDashboard';
import { ReconciliationCenter } from './features/reconciliation/ReconciliationCenter';
import { SettlementIntelligence } from './features/settlements/SettlementIntelligence';
import { ExceptionCenter } from './features/exceptions/ExceptionCenter';
import { PerformanceView } from './features/performance/PerformanceView';
import { AuditTrailView } from './features/audit/AuditTrailView';
import { DatasetGeneratorView } from './features/dataset/DatasetGeneratorView';
import { ReportsView } from './features/reports/ReportsView';
import { VoiceAgent } from './features/voice/VoiceAgent';

const AppContent: React.FC = () => {
  const { activeTab, isReconciling, reconciliationProgress, progressStepMessage } = useFinance();
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f8f9] flex flex-col font-sans text-slate-900">
      {/* Top Navigation */}
      <Navbar onOpenVoice={() => setIsVoiceOpen(true)} />

      {/* Animated Pipeline Banner when running reconciliation */}
      {isReconciling && (
        <div className="bg-[#0c66e4] text-white px-4 py-2 text-xs flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span className="font-medium tracking-wide">{progressStepMessage}</span>
          </div>
          <span className="font-mono font-bold">{reconciliationProgress}%</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Dynamic Feature Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'overview' && <FinanceDashboard />}
          {activeTab === 'reconciliation' && <ReconciliationCenter />}
          {activeTab === 'settlements' && <SettlementIntelligence />}
          {activeTab === 'exceptions' && <ExceptionCenter />}
          {activeTab === 'audit' && <AuditTrailView />}
          {activeTab === 'performance' && <PerformanceView />}
          {activeTab === 'dataset' && <DatasetGeneratorView />}
          {activeTab === 'reports' && <ReportsView />}
        </main>
      </div>

      {/* Global Ask Vaani Voice Copilot Modal */}
      <VoiceAgent 
        userId="merchant_user_1"
        role="merchant"
        userName="Merchant Controller"
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
