import { useState } from 'react';
import { ArrowUpDown, ExternalLink } from 'lucide-react';

interface Risk {
  id: string;
  description: string;
  owner: string;
  probability: number;
  impact: number;
  status: 'Active' | 'Monitoring' | 'Mitigating' | 'Closed';
}

const risks: Risk[] = [
  {
    id: 'R-001',
    description: 'Foundation work delayed due to underground utility conflicts',
    owner: 'Mike Johnson',
    probability: 85,
    impact: 450000,
    status: 'Mitigating',
  },
  {
    id: 'R-002',
    description: 'Steel material shortage affecting structural timeline',
    owner: 'Sarah Chen',
    probability: 70,
    impact: 280000,
    status: 'Active',
  },
  {
    id: 'R-003',
    description: 'Weather delays during concrete pour season',
    owner: 'Tom Rodriguez',
    probability: 90,
    impact: 120000,
    status: 'Monitoring',
  },
  {
    id: 'R-004',
    description: 'Environmental permit approval pending state review',
    owner: 'Lisa Wang',
    probability: 45,
    impact: 650000,
    status: 'Mitigating',
  },
  {
    id: 'R-005',
    description: 'Subcontractor labor availability constraints',
    owner: 'James Miller',
    probability: 65,
    impact: 190000,
    status: 'Active',
  },
  {
    id: 'R-006',
    description: 'HVAC system supply chain disruptions',
    owner: 'Sarah Chen',
    probability: 55,
    impact: 85000,
    status: 'Monitoring',
  },
  {
    id: 'R-007',
    description: 'Design changes requested by stakeholder committee',
    owner: 'Mike Johnson',
    probability: 75,
    impact: 320000,
    status: 'Active',
  },
  {
    id: 'R-008',
    description: 'Electrical inspection delays due to inspector shortage',
    owner: 'Tom Rodriguez',
    probability: 60,
    impact: 95000,
    status: 'Mitigating',
  },
];

export function TopRisksList() {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  function getStatusColor(status: Risk['status']) {
    switch (status) {
      case 'Active':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Monitoring':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Mitigating':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Closed':
        return 'bg-green-100 text-green-800 border-green-200';
    }
  }

  function formatCurrency(value: number) {
    return `$${(value / 1000).toFixed(0)}K`;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-gray-900">Top Risks</h2>
        <p className="text-gray-600 mt-1">
          Showing {risks.length} active risks requiring immediate attention
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-gray-700 uppercase text-xs tracking-wider">
                <button className="flex items-center gap-1 hover:text-gray-900">
                  Risk ID
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-gray-700 uppercase text-xs tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-gray-700 uppercase text-xs tracking-wider">
                <button className="flex items-center gap-1 hover:text-gray-900">
                  Owner
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-gray-700 uppercase text-xs tracking-wider">
                <button className="flex items-center gap-1 hover:text-gray-900">
                  Probability
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-gray-700 uppercase text-xs tracking-wider">
                <button className="flex items-center gap-1 hover:text-gray-900">
                  Impact
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-gray-700 uppercase text-xs tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-gray-700 uppercase text-xs tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {risks.map((risk) => (
              <tr
                key={risk.id}
                className={`transition-colors ${
                  hoveredRow === risk.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onMouseEnter={() => setHoveredRow(risk.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <code className="text-blue-600 bg-blue-50 px-2 py-1 rounded">{risk.id}</code>
                </td>
                <td className="px-6 py-4">
                  <div className="max-w-md text-gray-900">{risk.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">{risk.owner}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 w-16">
                      <div
                        className={`h-2 rounded-full ${
                          risk.probability >= 70 ? 'bg-red-500' : risk.probability >= 50 ? 'bg-orange-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${risk.probability}%` }}
                      />
                    </div>
                    <span className="text-gray-900 w-10 text-right">{risk.probability}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  {formatCurrency(risk.impact)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(risk.status)}`}>
                    {risk.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button className="text-blue-600 hover:text-blue-800 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
