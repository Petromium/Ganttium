import { useState } from 'react';

// Mock risk data positioned on the 5x5 matrix
const risks = [
  { id: 'R-001', probability: 4, impact: 5, name: 'Foundation Delay', count: 2 },
  { id: 'R-002', probability: 3, impact: 4, name: 'Material Shortage', count: 3 },
  { id: 'R-003', probability: 5, impact: 3, name: 'Weather Delays', count: 5 },
  { id: 'R-004', probability: 2, impact: 5, name: 'Permit Issues', count: 1 },
  { id: 'R-005', probability: 2, impact: 2, name: 'Minor Equipment', count: 4 },
  { id: 'R-006', probability: 1, impact: 3, name: 'Vendor Late', count: 2 },
  { id: 'R-007', probability: 4, impact: 2, name: 'Staff Turnover', count: 3 },
  { id: 'R-008', probability: 3, impact: 3, name: 'Subcontractor', count: 6 },
];

// Calculate color based on risk score
function getRiskColor(probability: number, impact: number) {
  const score = probability * impact;
  if (score >= 20) return 'bg-red-500 border-red-600';
  if (score >= 15) return 'bg-orange-500 border-orange-600';
  if (score >= 10) return 'bg-yellow-400 border-yellow-500';
  if (score >= 6) return 'bg-lime-400 border-lime-500';
  return 'bg-green-400 border-green-500';
}

export function RiskHeatmap() {
  const [hoveredCell, setHoveredCell] = useState<{ prob: number; imp: number } | null>(null);

  // Group risks by position
  const risksByPosition = risks.reduce((acc, risk) => {
    const key = `${risk.probability}-${risk.impact}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(risk);
    return acc;
  }, {} as Record<string, typeof risks>);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-gray-900 mb-6">Risk Heatmap</h2>

      <div className="relative">
        {/* Y-axis label */}
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 text-gray-600 text-sm whitespace-nowrap">
          Probability
        </div>

        {/* Grid */}
        <div className="ml-12 mb-12">
          {/* Y-axis labels */}
          <div className="flex">
            <div className="w-12 flex flex-col-reverse justify-between py-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <div key={num} className="h-16 flex items-center justify-end pr-2 text-gray-600 text-sm">
                  {num}
                </div>
              ))}
            </div>

            {/* Matrix */}
            <div className="flex-1">
              {[5, 4, 3, 2, 1].map((probability) => (
                <div key={probability} className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((impact) => {
                    const key = `${probability}-${impact}`;
                    const cellRisks = risksByPosition[key] || [];
                    const isHovered = hoveredCell?.prob === probability && hoveredCell?.imp === impact;

                    return (
                      <div
                        key={impact}
                        className={`flex-1 h-16 border-2 rounded-lg transition-all cursor-pointer ${getRiskColor(
                          probability,
                          impact
                        )} ${isHovered ? 'ring-2 ring-gray-900 scale-105' : 'hover:scale-102'}`}
                        onMouseEnter={() => setHoveredCell({ prob: probability, imp: impact })}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {cellRisks.length > 0 && (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-white text-sm drop-shadow-lg">
                              {cellRisks.reduce((sum, r) => sum + r.count, 0)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="flex ml-12 mt-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="flex-1 text-center text-gray-600 text-sm">
                {num}
              </div>
            ))}
          </div>
        </div>

        {/* X-axis label */}
        <div className="text-center text-gray-600 text-sm -mt-4">Impact</div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-4 justify-center flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-400 border-2 border-green-500 rounded"></div>
            <span className="text-gray-600 text-sm">Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-lime-400 border-2 border-lime-500 rounded"></div>
            <span className="text-gray-600 text-sm">Minor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 border-2 border-yellow-500 rounded"></div>
            <span className="text-gray-600 text-sm">Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 border-2 border-orange-600 rounded"></div>
            <span className="text-gray-600 text-sm">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 border-2 border-red-600 rounded"></div>
            <span className="text-gray-600 text-sm">Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
}
