import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";

interface MetricItemProps {
  label: string;
  value: string | number;
  trend?: "up" | "down";
  trendValue?: string;
}

function MetricItem({ label, value, trend, trendValue }: MetricItemProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{value}</span>
        {trend && trendValue && (
          <Badge variant="secondary" className="gap-1">
            {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trendValue}
          </Badge>
        )}
      </div>
    </div>
  );
}

export function RightSidebar() {
  return (
    <aside className="w-80 border-l bg-background p-4 overflow-y-auto" data-testid="sidebar-right">
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Project Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm font-semibold">67%</span>
              </div>
              <Progress value={67} className="h-2" data-testid="progress-overall" />
            </div>
            
            <div className="space-y-2">
              <MetricItem label="Tasks Complete" value="142/212" />
              <MetricItem label="Budget Used" value="$1.2M/$2M" trend="up" trendValue="8%" />
              <MetricItem label="Timeline" value="On Track" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-chart-3" />
                <span className="text-sm">Completed</span>
              </div>
              <span className="text-sm font-semibold">142</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-chart-1" />
                <span className="text-sm">In Progress</span>
              </div>
              <span className="text-sm font-semibold">48</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-chart-2" />
                <span className="text-sm">At Risk</span>
              </div>
              <span className="text-sm font-semibold">12</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Active Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <MetricItem label="Team Members" value="24" />
            <MetricItem label="Equipment Units" value="18" />
            <MetricItem label="Utilization" value="82%" trend="up" trendValue="5%" />
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
