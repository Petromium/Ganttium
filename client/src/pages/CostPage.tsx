import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const costCategories = [
  { name: "Engineering & Design", budgeted: 450000, actual: 382500, forecast: 445000 },
  { name: "Procurement", budgeted: 1200000, actual: 864000, forecast: 1150000 },
  { name: "Construction", budgeted: 2500000, actual: 1125000, forecast: 2650000 },
  { name: "Commissioning", budgeted: 350000, actual: 42000, forecast: 355000 },
];

export default function CostPage() {
  const totalBudget = costCategories.reduce((sum, cat) => sum + cat.budgeted, 0);
  const totalActual = costCategories.reduce((sum, cat) => sum + cat.actual, 0);
  const totalForecast = costCategories.reduce((sum, cat) => sum + cat.forecast, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Cost Management</h1>
        <p className="text-muted-foreground">Budget tracking and cost analytics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Total Budget"
          value={`$${(totalBudget / 1000000).toFixed(1)}M`}
          icon={DollarSign}
        />
        <MetricCard
          title="Actual Cost"
          value={`$${(totalActual / 1000000).toFixed(1)}M`}
          change={-8}
          icon={TrendingDown}
        />
        <MetricCard
          title="Forecast at Completion"
          value={`$${(totalForecast / 1000000).toFixed(1)}M`}
          change={3}
          icon={TrendingUp}
        />
        <MetricCard
          title="Variance"
          value={`$${((totalForecast - totalBudget) / 1000).toFixed(0)}K`}
          change={5}
          icon={AlertTriangle}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown by Category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {costCategories.map((category) => {
            const budgetUsed = (category.actual / category.budgeted) * 100;
            const variance = category.forecast - category.budgeted;
            const variancePercent = (variance / category.budgeted) * 100;

            return (
              <div key={category.name} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Budget: ${(category.budgeted / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      ${(category.actual / 1000).toFixed(0)}K
                    </div>
                    <Badge
                      variant={variance > 0 ? "destructive" : "default"}
                      className="mt-1"
                    >
                      {variance > 0 ? "+" : ""}
                      {variancePercent.toFixed(1)}%
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Budget Utilization</span>
                    <span className="font-medium">{budgetUsed.toFixed(1)}%</span>
                  </div>
                  <Progress value={budgetUsed} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2 border-t text-sm">
                  <div>
                    <div className="text-muted-foreground">Budgeted</div>
                    <div className="font-semibold font-mono">
                      ${(category.budgeted / 1000).toFixed(0)}K
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Actual</div>
                    <div className="font-semibold font-mono">
                      ${(category.actual / 1000).toFixed(0)}K
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Forecast</div>
                    <div className="font-semibold font-mono">
                      ${(category.forecast / 1000).toFixed(0)}K
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Earned Value Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Planned Value (PV)</span>
              <span className="font-semibold font-mono">$2.8M</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Earned Value (EV)</span>
              <span className="font-semibold font-mono">$2.4M</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Actual Cost (AC)</span>
              <span className="font-semibold font-mono">$2.4M</span>
            </div>
            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cost Performance Index (CPI)</span>
                <Badge variant="default">1.00</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Schedule Performance Index (SPI)</span>
                <Badge variant="secondary">0.86</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              Cost trend chart visualization
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
