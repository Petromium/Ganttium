import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { TopBar } from './components/TopBar';
import { MetricsCards } from './components/MetricsCards';
import { RiskHeatmap } from './components/RiskHeatmap';
import { TopRisksList } from './components/TopRisksList';
import { MitigationTimeline } from './components/MitigationTimeline';

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left: Navigation Sidebar */}
      <Navigation 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top: Global Action Bar */}
        <TopBar />

        {/* Center: Main Workspace */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1600px] mx-auto space-y-8">
            {/* Page Header */}
            <div>
              <h1 className="text-gray-900 mb-2">Risk Management Dashboard</h1>
              <p className="text-gray-600">Monitor and mitigate project risks in real-time</p>
            </div>

            {/* Metrics Cards */}
            <MetricsCards />

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Risk Heatmap */}
              <RiskHeatmap />

              {/* Mitigation Timeline */}
              <MitigationTimeline />
            </div>

            {/* Top Risks List */}
            <TopRisksList />
          </div>
        </main>
      </div>
    </div>
  );
}
