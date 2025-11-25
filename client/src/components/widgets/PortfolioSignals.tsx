import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, Calendar, DollarSign, Users, 
  TrendingUp, TrendingDown, RefreshCw 
} from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { differenceInBusinessDays, format } from "date-fns";
import type { Task, CostItem, Resource } from "@shared/schema";

interface SignalItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  status?: "success" | "warning" | "danger" | "neutral";
}

function SignalItem({ icon, label, value, subtext, status = "neutral" }: SignalItemProps) {
  const statusColors = {
    success: "text-green-600 dark:text-green-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
    neutral: "text-foreground",
  };

  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
        </div>
      </div>
      <span className={`text-sm font-semibold tabular-nums ${statusColors[status]}`}>
        {value}
      </span>
    </div>
  );
}

export function PortfolioSignals() {
  const { selectedProjectId, selectedProject } = useProject();

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/projects", selectedProjectId, "tasks"],
    enabled: !!selectedProjectId,
    refetchInterval: 15 * 60 * 1000,
  });

  const { data: costs = [], isLoading: costsLoading } = useQuery<CostItem[]>({
    queryKey: ["/api/projects", selectedProjectId, "costs"],
    enabled: !!selectedProjectId,
    refetchInterval: 15 * 60 * 1000,
  });

  const { data: resources = [], isLoading: resourcesLoading } = useQuery<Resource[]>({
    queryKey: ["/api/projects", selectedProjectId, "resources"],
    enabled: !!selectedProjectId,
    refetchInterval: 15 * 60 * 1000,
  });

  const isLoading = tasksLoading || costsLoading || resourcesLoading;

  if (isLoading) {
    return (
      <Card data-testid="widget-portfolio-signals">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Portfolio Signals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const projectEndDate = selectedProject?.endDate ? new Date(selectedProject.endDate) : null;
  const workingDaysToEnd = projectEndDate 
    ? Math.max(0, differenceInBusinessDays(projectEndDate, new Date()))
    : null;

  const totalBudget = costs.reduce((sum, c) => sum + Number(c.budgeted || 0), 0);
  const actualSpend = costs.reduce((sum, c) => sum + Number(c.actual || 0), 0);
  const budgetBurnPercent = totalBudget > 0 ? Math.round((actualSpend / totalBudget) * 100) : 0;

  const avgAvailability = resources.length > 0
    ? Math.round(resources.reduce((sum, r) => sum + (r.availability || 0), 0) / resources.length)
    : 100;

  const overallocatedCount = resources.filter(r => (r.availability || 0) > 100).length;

  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const criticalTasks = tasks.filter(t => t.isCriticalPath).length;

  const getBudgetStatus = (): "success" | "warning" | "danger" => {
    if (budgetBurnPercent > 90) return "danger";
    if (budgetBurnPercent > 75) return "warning";
    return "success";
  };

  const getAvailabilityStatus = (): "success" | "warning" | "danger" => {
    if (avgAvailability < 50) return "danger";
    if (avgAvailability < 70) return "warning";
    return "success";
  };

  return (
    <Card data-testid="widget-portfolio-signals">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Portfolio Signals
          </CardTitle>
          <Badge variant="secondary" className="text-xs gap-1">
            <RefreshCw className="h-3 w-3" />
            15m
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <SignalItem
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          label="Days to Project End"
          value={workingDaysToEnd !== null ? `${workingDaysToEnd} days` : "N/A"}
          subtext={projectEndDate ? format(projectEndDate, "MMM d, yyyy") : "No end date"}
          status={workingDaysToEnd !== null && workingDaysToEnd < 30 ? "warning" : "neutral"}
        />

        <SignalItem
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          label="Budget Burn"
          value={`${budgetBurnPercent}%`}
          subtext={`$${actualSpend.toLocaleString()} of $${totalBudget.toLocaleString()}`}
          status={getBudgetStatus()}
        />

        <SignalItem
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          label="Resource Availability"
          value={`${avgAvailability}%`}
          subtext={overallocatedCount > 0 ? `${overallocatedCount} over-allocated` : "All within capacity"}
          status={getAvailabilityStatus()}
        />

        <SignalItem
          icon={progressPercent >= 50 
            ? <TrendingUp className="h-4 w-4 text-green-500" /> 
            : <TrendingDown className="h-4 w-4 text-amber-500" />
          }
          label="Task Completion"
          value={`${progressPercent}%`}
          subtext={`${completedTasks} of ${tasks.length} tasks`}
          status={progressPercent >= 75 ? "success" : progressPercent >= 50 ? "warning" : "danger"}
        />

        {criticalTasks > 0 && (
          <div className="pt-2">
            <Badge variant="destructive" className="w-full justify-center">
              {criticalTasks} Critical Path Task{criticalTasks !== 1 ? "s" : ""}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
