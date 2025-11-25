import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, TrendingUp, TrendingDown, 
  Target, BarChart3, Gauge
} from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import type { CostItem, Task } from "@shared/schema";

function GaugeIndicator({ value, label, thresholds }: { 
  value: number; 
  label: string;
  thresholds: { warning: number; danger: number };
}) {
  const getColor = () => {
    if (value < thresholds.warning) return "text-green-600 dark:text-green-400";
    if (value < thresholds.danger) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getBgColor = () => {
    if (value < thresholds.warning) return "bg-green-100 dark:bg-green-900/30";
    if (value < thresholds.danger) return "bg-amber-100 dark:bg-amber-900/30";
    return "bg-red-100 dark:bg-red-900/30";
  };

  return (
    <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${getBgColor()}`}>
        <span className={`text-lg font-bold tabular-nums ${getColor()}`}>
          {value.toFixed(2)}
        </span>
      </div>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

export function CostSnapshot() {
  const { selectedProjectId, selectedProject } = useProject();

  const { data: costs = [], isLoading: costsLoading } = useQuery<CostItem[]>({
    queryKey: ["/api/projects", selectedProjectId, "costs"],
    enabled: !!selectedProjectId,
    refetchInterval: 15 * 60 * 1000,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/projects", selectedProjectId, "tasks"],
    enabled: !!selectedProjectId,
    refetchInterval: 15 * 60 * 1000,
  });

  const isLoading = costsLoading || tasksLoading;

  if (isLoading) {
    return (
      <Card data-testid="widget-cost-snapshot">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Cost & EVM Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-20 flex-1 rounded-lg" />
            <Skeleton className="h-20 flex-1 rounded-lg" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const totalBudget = parseFloat(selectedProject?.budget || "0") || 
    costs.reduce((sum, c) => sum + Number(c.budgeted || 0), 0);
  const actualCost = costs.reduce((sum, c) => sum + Number(c.actual || 0), 0);
  const variance = totalBudget - actualCost;
  const burnPercent = totalBudget > 0 ? (actualCost / totalBudget) * 100 : 0;

  const plannedValue = tasks.reduce((sum, t) => sum + parseFloat(t.baselineCost || "0"), 0);
  const earnedValue = tasks.reduce((sum, t) => sum + parseFloat(t.earnedValue || "0"), 0);
  const actualTaskCost = tasks.reduce((sum, t) => sum + parseFloat(t.actualCost || "0"), 0);

  const cpi = actualTaskCost > 0 ? earnedValue / actualTaskCost : 1;
  const spi = plannedValue > 0 ? earnedValue / plannedValue : 1;

  const eac = cpi > 0 ? totalBudget / cpi : totalBudget;
  const vac = totalBudget - eac;

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  return (
    <Card data-testid="widget-cost-snapshot">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Cost & EVM Snapshot
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {selectedProject?.currency || "USD"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <GaugeIndicator 
            value={cpi} 
            label="CPI" 
            thresholds={{ warning: 0.95, danger: 0.85 }}
          />
          <GaugeIndicator 
            value={spi} 
            label="SPI" 
            thresholds={{ warning: 0.95, danger: 0.85 }}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Budget Burn</span>
            <span className="font-medium tabular-nums">{burnPercent.toFixed(1)}%</span>
          </div>
          <Progress value={Math.min(burnPercent, 100)} className="h-2" />
        </div>

        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between py-1 border-b">
            <div className="flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm">Budget</span>
            </div>
            <span className="text-sm font-semibold tabular-nums">
              {formatCurrency(totalBudget)}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm">Actual Cost</span>
            </div>
            <span className="text-sm font-semibold tabular-nums">
              {formatCurrency(actualCost)}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              {variance >= 0 
                ? <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                : <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              }
              <span className="text-sm">Variance</span>
            </div>
            <span className={`text-sm font-semibold tabular-nums ${
              variance >= 0 
                ? "text-green-600 dark:text-green-400" 
                : "text-red-600 dark:text-red-400"
            }`}>
              {variance >= 0 ? "+" : ""}{formatCurrency(variance)}
            </span>
          </div>
        </div>

        {vac !== 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Est. at Completion</span>
              <span className="text-sm font-semibold">{formatCurrency(eac)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Variance at Completion</span>
              <span className={`text-sm font-semibold ${
                vac >= 0 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              }`}>
                {vac >= 0 ? "+" : ""}{formatCurrency(vac)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
