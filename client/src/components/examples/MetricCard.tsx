import { MetricCard } from '../MetricCard';
import { DollarSign } from 'lucide-react';

export default function MetricCardExample() {
  return (
    <div className="p-4">
      <MetricCard
        title="Total Budget"
        value="$4.5M"
        change={12}
        icon={DollarSign}
      />
    </div>
  );
}
