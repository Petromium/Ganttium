import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, 
  Clock, Users, Package, FileText, Loader2, Target, 
  DollarSign, AlertCircle, Calendar, BarChart3 
} from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { useLocation } from "wouter";
import type { Task, Risk, Issue, Resource, Document, CostItem } from "@shared/schema";

interface MetricItemProps {
  label: string;
  value: string | number;
  trend?: "up" | "down";
  trendValue?: string;
  icon?: React.ReactNode;
}

function MetricItem({ label, value, trend, trendValue, icon }: MetricItemProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
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

function LoadingCard({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

export function RightSidebar() {
  const { selectedProjectId } = useProject();
  const [location] = useLocation();

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: [`/api/projects/${selectedProjectId}/tasks`],
    enabled: !!selectedProjectId,
  });

  const { data: risks = [], isLoading: risksLoading } = useQuery<Risk[]>({
    queryKey: [`/api/projects/${selectedProjectId}/risks`],
    enabled: !!selectedProjectId,
  });

  const { data: issues = [], isLoading: issuesLoading } = useQuery<Issue[]>({
    queryKey: [`/api/projects/${selectedProjectId}/issues`],
    enabled: !!selectedProjectId,
  });

  const { data: resources = [], isLoading: resourcesLoading } = useQuery<Resource[]>({
    queryKey: [`/api/projects/${selectedProjectId}/resources`],
    enabled: !!selectedProjectId,
  });

  const { data: documents = [], isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: [`/api/projects/${selectedProjectId}/documents`],
    enabled: !!selectedProjectId,
  });

  const { data: costs = [], isLoading: costsLoading } = useQuery<CostItem[]>({
    queryKey: [`/api/projects/${selectedProjectId}/costs`],
    enabled: !!selectedProjectId,
  });

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === "completed").length,
    inProgress: tasks.filter(t => t.status === "in-progress").length,
    review: tasks.filter(t => t.status === "review").length,
    notStarted: tasks.filter(t => t.status === "not-started").length,
    onHold: tasks.filter(t => t.status === "on-hold").length,
    overdue: tasks.filter(t => t.endDate && new Date(t.endDate) < new Date() && t.status !== "completed").length,
    progress: tasks.length > 0 ? Math.round((tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length)) : 0,
  };

  const riskStats = {
    total: risks.length,
    high: risks.filter(r => (r as any).probability === "high" || (r as any).impact === "high").length,
    critical: risks.filter(r => (r as any).probability === "high" && (r as any).impact === "high").length,
    open: risks.filter(r => r.status === "identified" || r.status === "assessed" || r.status === "mitigating").length,
  };

  const issueStats = {
    total: issues.length,
    open: issues.filter(i => i.status === "open" || i.status === "in-progress").length,
    critical: issues.filter(i => i.priority === "critical" || i.priority === "high").length,
    overdue: issues.filter(i => i.targetResolutionDate && new Date(i.targetResolutionDate) < new Date() && i.status !== "closed" && i.status !== "resolved").length,
  };

  const resourceStats = {
    total: resources.length,
    human: resources.filter(r => r.type === "human").length,
    equipment: resources.filter(r => r.type === "equipment").length,
    avgAvailability: resources.length > 0 ? Math.round(resources.reduce((sum, r) => sum + Number(r.availability || 0), 0) / resources.length) : 0,
  };

  const documentStats = {
    total: documents.length,
    draft: documents.filter(d => d.status === "draft").length,
    approved: documents.filter(d => d.status === "ifc" || d.status === "as-built").length,
  };

  const costStats = {
    budgeted: costs.reduce((sum, c) => sum + Number(c.budgeted || 0), 0),
    actual: costs.reduce((sum, c) => sum + Number(c.actual || 0), 0),
    variance: 0,
  };
  costStats.variance = costStats.budgeted - costStats.actual;

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const currentPage = location.split("/")[1] || "dashboard";

  if (!selectedProjectId) {
    return (
      <aside className="w-80 border-l bg-background p-4 overflow-y-auto" data-testid="sidebar-right">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">Select a project to view metrics</p>
          </CardContent>
        </Card>
      </aside>
    );
  }

  return (
    <aside className="w-80 border-l bg-background p-4 overflow-y-auto" data-testid="sidebar-right">
      <div className="space-y-4">
        {tasksLoading ? (
          <LoadingCard title="Project Health" />
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Project Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm font-semibold">{taskStats.progress}%</span>
                </div>
                <Progress value={taskStats.progress} className="h-2" data-testid="progress-overall" />
              </div>
              <div className="space-y-2">
                <MetricItem 
                  label="Tasks Completed" 
                  value={`${taskStats.completed}/${taskStats.total}`}
                  icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
                />
                {taskStats.overdue > 0 && (
                  <MetricItem 
                    label="Overdue Tasks" 
                    value={taskStats.overdue}
                    icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {(currentPage === "wbs" || currentPage === "dashboard" || currentPage === "") && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Task Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm">Completed</span>
                </div>
                <span className="text-sm font-semibold">{taskStats.completed}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm">In Progress</span>
                </div>
                <span className="text-sm font-semibold">{taskStats.inProgress}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-purple-500" />
                  <span className="text-sm">In Review</span>
                </div>
                <span className="text-sm font-semibold">{taskStats.review}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-gray-400" />
                  <span className="text-sm">Not Started</span>
                </div>
                <span className="text-sm font-semibold">{taskStats.notStarted}</span>
              </div>
              {taskStats.onHold > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                    <span className="text-sm">On Hold</span>
                  </div>
                  <span className="text-sm font-semibold">{taskStats.onHold}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {(currentPage === "risks" || currentPage === "dashboard" || currentPage === "") && !risksLoading && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Risk Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <MetricItem label="Total Risks" value={riskStats.total} />
              <MetricItem label="Open Risks" value={riskStats.open} />
              {riskStats.high > 0 && (
                <MetricItem 
                  label="High Priority" 
                  value={riskStats.high}
                  icon={<AlertCircle className="h-4 w-4 text-amber-500" />}
                />
              )}
              {riskStats.critical > 0 && (
                <div className="pt-2 border-t">
                  <Badge variant="destructive" className="w-full justify-center">
                    {riskStats.critical} Critical Risk{riskStats.critical !== 1 ? "s" : ""}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {(currentPage === "issues" || currentPage === "dashboard" || currentPage === "") && !issuesLoading && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Issue Tracker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <MetricItem label="Total Issues" value={issueStats.total} />
              <MetricItem label="Open Issues" value={issueStats.open} />
              {issueStats.critical > 0 && (
                <MetricItem 
                  label="Critical/High" 
                  value={issueStats.critical}
                  icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
                />
              )}
              {issueStats.overdue > 0 && (
                <div className="pt-2 border-t">
                  <Badge variant="destructive" className="w-full justify-center">
                    {issueStats.overdue} Overdue
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {(currentPage === "resources" || currentPage === "dashboard" || currentPage === "") && !resourcesLoading && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <MetricItem label="Team Members" value={resourceStats.human} icon={<Users className="h-4 w-4" />} />
              <MetricItem label="Equipment" value={resourceStats.equipment} icon={<Package className="h-4 w-4" />} />
              <MetricItem 
                label="Avg Availability" 
                value={`${resourceStats.avgAvailability}%`}
                trend={resourceStats.avgAvailability >= 80 ? "up" : "down"}
                trendValue={resourceStats.avgAvailability >= 80 ? "Good" : "Low"}
              />
            </CardContent>
          </Card>
        )}

        {(currentPage === "sop" || currentPage === "documents") && !documentsLoading && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <MetricItem label="Total Documents" value={documentStats.total} />
              <MetricItem label="Drafts" value={documentStats.draft} />
              <MetricItem label="Approved/IFC" value={documentStats.approved} />
            </CardContent>
          </Card>
        )}

        {(currentPage === "cost" || currentPage === "analytics" || currentPage === "dashboard" || currentPage === "") && !costsLoading && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Cost Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <MetricItem label="Budgeted" value={formatCurrency(costStats.budgeted)} />
              <MetricItem label="Actual Spend" value={formatCurrency(costStats.actual)} />
              <MetricItem 
                label="Variance" 
                value={formatCurrency(Math.abs(costStats.variance))}
                trend={costStats.variance >= 0 ? "up" : "down"}
                trendValue={costStats.variance >= 0 ? "Under" : "Over"}
              />
            </CardContent>
          </Card>
        )}

        {(currentPage === "calendar" || currentPage === "gantt") && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasks
                .filter(t => t.endDate && new Date(t.endDate) >= new Date() && t.status !== "completed")
                .sort((a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime())
                .slice(0, 5)
                .map(task => (
                  <div key={task.id} className="flex items-center justify-between py-1">
                    <span className="text-xs truncate max-w-[150px]">{task.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(task.endDate!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              {tasks.filter(t => t.endDate && new Date(t.endDate) >= new Date() && t.status !== "completed").length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming deadlines</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </aside>
  );
}
