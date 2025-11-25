import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  Users, Wrench, Package, AlertCircle, 
  DollarSign, TrendingUp, TrendingDown
} from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import type { Resource, ResourceAssignment } from "@shared/schema";

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: "up" | "down";
}

function StatItem({ icon, label, value, subValue, trend }: StatItemProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-right">
        <span className="text-sm font-semibold tabular-nums flex items-center gap-1">
          {value}
          {trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
          {trend === "down" && <TrendingDown className="h-3 w-3 text-red-500" />}
        </span>
        {subValue && <span className="text-xs text-muted-foreground">{subValue}</span>}
      </div>
    </div>
  );
}

export function ResourceSnapshot() {
  const { selectedProjectId } = useProject();

  const { data: resources = [], isLoading } = useQuery<Resource[]>({
    queryKey: ["/api/projects", selectedProjectId, "resources"],
    enabled: !!selectedProjectId,
    refetchInterval: 15 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card data-testid="widget-resource-snapshot">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Resource Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const humanResources = resources.filter(r => r.type === "human");
  const equipmentResources = resources.filter(r => r.type === "equipment");
  const materialResources = resources.filter(r => r.type === "material");

  const totalResources = resources.length;
  const avgAvailability = resources.length > 0
    ? Math.round(resources.reduce((sum, r) => sum + (r.availability || 0), 0) / resources.length)
    : 0;

  const overAllocated = resources.filter(r => (r.availability || 0) > 100).length;
  const underUtilized = resources.filter(r => (r.availability || 0) < 50).length;

  const totalCostExposure = resources.reduce((sum, r) => {
    const rate = parseFloat(r.rate || r.costPerHour || "0");
    return sum + rate;
  }, 0);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toFixed(0)}`;
  };

  return (
    <Card data-testid="widget-resource-snapshot">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4" />
          Resource Snapshot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <StatItem
          icon={<Users className="h-4 w-4 text-blue-500" />}
          label="Team Members"
          value={humanResources.length}
          subValue={`of ${totalResources} total`}
        />

        <StatItem
          icon={<Wrench className="h-4 w-4 text-amber-500" />}
          label="Equipment"
          value={equipmentResources.length}
        />

        <StatItem
          icon={<Package className="h-4 w-4 text-green-500" />}
          label="Materials"
          value={materialResources.length}
        />

        <StatItem
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          label="Hourly Rate Total"
          value={formatCurrency(totalCostExposure)}
          subValue="/hr combined"
        />

        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Avg Availability</span>
            <span className="text-xs font-medium">{avgAvailability}%</span>
          </div>
          <Progress value={avgAvailability} className="h-1.5" />
        </div>

        {(overAllocated > 0 || underUtilized > 0) && (
          <div className="pt-2 flex flex-wrap gap-2">
            {overAllocated > 0 && (
              <Badge variant="destructive" className="text-xs gap-1">
                <AlertCircle className="h-3 w-3" />
                {overAllocated} Over-allocated
              </Badge>
            )}
            {underUtilized > 0 && (
              <Badge variant="secondary" className="text-xs gap-1">
                {underUtilized} Under-utilized
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
