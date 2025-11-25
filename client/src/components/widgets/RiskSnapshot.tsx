import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, Shield, Target, TrendingUp, 
  TrendingDown, Eye, Zap
} from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import type { Risk, Issue } from "@shared/schema";

interface StatItemProps {
  label: string;
  value: number;
  icon?: React.ReactNode;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

function StatItem({ label, value, icon, badgeVariant }: StatItemProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <Badge variant={badgeVariant || "secondary"} className="tabular-nums">
        {value}
      </Badge>
    </div>
  );
}

export function RiskSnapshot() {
  const { selectedProjectId } = useProject();

  const { data: risks = [], isLoading: risksLoading } = useQuery<Risk[]>({
    queryKey: ["/api/projects", selectedProjectId, "risks"],
    enabled: !!selectedProjectId,
    refetchInterval: 15 * 60 * 1000,
  });

  const { data: issues = [], isLoading: issuesLoading } = useQuery<Issue[]>({
    queryKey: ["/api/projects", selectedProjectId, "issues"],
    enabled: !!selectedProjectId,
    refetchInterval: 15 * 60 * 1000,
  });

  const isLoading = risksLoading || issuesLoading;

  if (isLoading) {
    return (
      <Card data-testid="widget-risk-snapshot">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Risk & Issue Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-8" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const openRisks = risks.filter(r => r.status !== "closed");
  const criticalRisks = risks.filter(r => 
    (r.impact === "critical" || r.impact === "high") && r.status !== "closed"
  );
  const mitigatingRisks = risks.filter(r => r.status === "mitigating");

  const openIssues = issues.filter(i => i.status === "open" || i.status === "in-progress");
  const criticalIssues = issues.filter(i => 
    (i.priority === "critical" || i.priority === "high") && 
    i.status !== "closed" && i.status !== "resolved"
  );
  const overdueIssues = issues.filter(i => 
    i.targetResolutionDate && 
    new Date(i.targetResolutionDate) < new Date() && 
    i.status !== "closed" && i.status !== "resolved"
  );

  const totalExposure = risks.reduce((sum, r) => {
    return sum + parseFloat(r.riskExposure || "0");
  }, 0);

  const avgRiskScore = openRisks.length > 0
    ? (openRisks.reduce((sum, r) => sum + (r.probability || 0), 0) / openRisks.length).toFixed(1)
    : "0";

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  return (
    <Card data-testid="widget-risk-snapshot">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Risk & Issue Snapshot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Eye className="h-3 w-3" />
            Risk Watchlist
          </p>
          <StatItem
            label="Open Risks"
            value={openRisks.length}
            icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
          />
          {criticalRisks.length > 0 && (
            <StatItem
              label="Critical/High"
              value={criticalRisks.length}
              icon={<Zap className="h-3.5 w-3.5 text-red-500" />}
              badgeVariant="destructive"
            />
          )}
          <StatItem
            label="In Mitigation"
            value={mitigatingRisks.length}
            icon={<Shield className="h-3.5 w-3.5 text-blue-500" />}
          />
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Target className="h-3 w-3" />
            Issue Tracker
          </p>
          <StatItem
            label="Open Issues"
            value={openIssues.length}
            icon={<AlertTriangle className="h-3.5 w-3.5 text-orange-500" />}
          />
          {criticalIssues.length > 0 && (
            <StatItem
              label="Critical/High"
              value={criticalIssues.length}
              badgeVariant="destructive"
            />
          )}
          {overdueIssues.length > 0 && (
            <StatItem
              label="Overdue"
              value={overdueIssues.length}
              icon={<TrendingDown className="h-3.5 w-3.5 text-red-500" />}
              badgeVariant="destructive"
            />
          )}
        </div>

        <div className="pt-2 border-t space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Avg Risk Score</span>
            <span className="text-sm font-semibold">{avgRiskScore}/5</span>
          </div>
          {totalExposure > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Exposure</span>
              <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                {formatCurrency(totalExposure)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
