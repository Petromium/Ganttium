import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, DollarSign } from 'lucide-react';

const metrics = [
  {
    title: 'Total Active Risks',
    value: '23',
    change: '+3',
    trend: 'up',
    icon: AlertTriangle,
    color: 'orange',
    sparkline: [12, 15, 14, 18, 20, 19, 23],
  },
  {
    title: 'Mitigated Risks',
    value: '47',
    change: '+12',
    trend: 'up',
    icon: CheckCircle2,
    color: 'green',
    sparkline: [25, 28, 32, 35, 38, 42, 47],
  },
  {
    title: 'Potential Cost Exposure',
    value: '$2.4M',
    change: '-$340K',
    trend: 'down',
    icon: DollarSign,
    color: 'blue',
    sparkline: [3.2, 3.1, 2.9, 2.8, 2.7, 2.5, 2.4],
  },
];

export function MetricsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {metrics.map((metric) => (
        <div
          key={metric.title}
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-600 mb-2">{metric.title}</p>
              <p className="text-gray-900">{metric.value}</p>
            </div>
            <div
              className={`p-3 rounded-lg ${
                metric.color === 'orange'
                  ? 'bg-orange-50'
                  : metric.color === 'green'
                  ? 'bg-green-50'
                  : 'bg-blue-50'
              }`}
            >
              <metric.icon
                className={`w-6 h-6 ${
                  metric.color === 'orange'
                    ? 'text-orange-600'
                    : metric.color === 'green'
                    ? 'text-green-600'
                    : 'text-blue-600'
                }`}
              />
            </div>
          </div>

          {/* Sparkline */}
          <div className="flex items-end gap-1 h-12 mb-3">
            {metric.sparkline.map((value, index) => {
              const maxValue = Math.max(...metric.sparkline);
              const height = (value / maxValue) * 100;
              return (
                <div
                  key={index}
                  className={`flex-1 rounded-t transition-all ${
                    metric.color === 'orange'
                      ? 'bg-orange-200'
                      : metric.color === 'green'
                      ? 'bg-green-200'
                      : 'bg-blue-200'
                  }`}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>

          {/* Trend */}
          <div className="flex items-center gap-2">
            {metric.trend === 'up' ? (
              <TrendingUp
                className={`w-4 h-4 ${
                  metric.color === 'orange' || metric.title === 'Total Active Risks'
                    ? 'text-orange-600'
                    : 'text-green-600'
                }`}
              />
            ) : (
              <TrendingDown className="w-4 h-4 text-green-600" />
            )}
            <span
              className={`text-sm ${
                metric.trend === 'up' && metric.title === 'Total Active Risks'
                  ? 'text-orange-600'
                  : 'text-green-600'
              }`}
            >
              {metric.change} from last month
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
