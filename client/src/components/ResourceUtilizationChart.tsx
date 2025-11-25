import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, AlertTriangle, User, Wrench, Package, Calendar } from "lucide-react";
import { format, differenceInWeeks } from "date-fns";
import { useProject } from "@/contexts/ProjectContext";

interface ResourceUtilizationData {
  resources: Array<{
    resourceId: number;
    resourceName: string;
    resourceType: string;
    periods: Array<{
      periodStart: string;
      periodEnd: string;
      utilization: number;
      isOverAllocated: boolean;
      assignments: Array<{
        taskId: number;
        taskName: string;
        allocation: number;
      }>;
    }>;
  }>;
}

const RESOURCE_TYPE_ICONS: Record<string, typeof User> = {
  human: User,
  equipment: Wrench,
  material: Package,
};

function getUtilizationColor(utilization: number): string {
  if (utilization === 0) return "bg-muted";
  if (utilization <= 50) return "bg-green-500/70";
  if (utilization <= 80) return "bg-yellow-500/70";
  if (utilization <= 100) return "bg-orange-500/70";
  return "bg-red-500";
}

function getUtilizationTextColor(utilization: number): string {
  if (utilization === 0) return "text-muted-foreground";
  return "text-white";
}

export function ResourceUtilizationChart() {
  const { selectedProjectId } = useProject();

  const { data, isLoading, error } = useQuery<ResourceUtilizationData>({
    queryKey: [`/api/projects/${selectedProjectId}/resource-utilization`],
    enabled: !!selectedProjectId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <p>Failed to load resource utilization data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.resources.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Utilization Data</h2>
          <p className="text-muted-foreground">
            Add resources and assign them to tasks to see utilization data.
          </p>
        </CardContent>
      </Card>
    );
  }

  const periods = data.resources[0]?.periods || [];
  const overAllocatedResources = data.resources.filter(r => 
    r.periods.some(p => p.isOverAllocated)
  );

  return (
    <div className="space-y-4">
      {overAllocatedResources.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="font-medium text-destructive">
                {overAllocatedResources.length} resource(s) are over-allocated
              </p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {overAllocatedResources.map(r => r.resourceName).join(", ")}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Resource Utilization Timeline
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Weekly view of resource allocation across project tasks
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/70" />
              <span className="text-xs text-muted-foreground">0-50%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500/70" />
              <span className="text-xs text-muted-foreground">51-80%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500/70" />
              <span className="text-xs text-muted-foreground">81-100%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500" />
              <span className="text-xs text-muted-foreground">Over-allocated</span>
            </div>
          </div>

          <ScrollArea className="w-full" type="always">
            <div className="min-w-max">
              <div className="flex border-b">
                <div className="w-48 shrink-0 p-2 font-medium text-sm border-r bg-muted/30">
                  Resource
                </div>
                {periods.map((period, idx) => (
                  <div 
                    key={idx}
                    className="w-16 shrink-0 p-2 text-center text-xs text-muted-foreground border-r"
                  >
                    {format(new Date(period.periodStart), "MMM d")}
                  </div>
                ))}
              </div>

              {data.resources.map((resource) => {
                const TypeIcon = RESOURCE_TYPE_ICONS[resource.resourceType] || User;
                return (
                  <div 
                    key={resource.resourceId} 
                    className="flex border-b hover:bg-muted/20"
                    data-testid={`utilization-row-${resource.resourceId}`}
                  >
                    <div className="w-48 shrink-0 p-2 border-r flex items-center gap-2">
                      <TypeIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium truncate" title={resource.resourceName}>
                        {resource.resourceName}
                      </span>
                    </div>
                    {resource.periods.map((period, idx) => (
                      <Tooltip key={idx}>
                        <TooltipTrigger asChild>
                          <div 
                            className={`w-16 shrink-0 p-1 border-r flex items-center justify-center cursor-pointer ${period.isOverAllocated ? 'animate-pulse' : ''}`}
                            data-testid={`utilization-cell-${resource.resourceId}-${idx}`}
                          >
                            <div 
                              className={`w-12 h-8 rounded flex items-center justify-center text-xs font-mono ${getUtilizationColor(period.utilization)} ${getUtilizationTextColor(period.utilization)}`}
                            >
                              {period.utilization > 0 ? `${period.utilization}%` : '-'}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <div className="space-y-2">
                            <div className="font-medium">
                              {format(new Date(period.periodStart), "MMM d")} - {format(new Date(period.periodEnd), "MMM d, yyyy")}
                            </div>
                            <div className="text-sm">
                              Utilization: <span className={period.isOverAllocated ? 'text-destructive font-bold' : ''}>
                                {period.utilization}%
                              </span>
                              {period.isOverAllocated && (
                                <Badge variant="destructive" className="ml-2 text-xs">
                                  Over-allocated
                                </Badge>
                              )}
                            </div>
                            {period.assignments.length > 0 && (
                              <div className="border-t pt-2 mt-2">
                                <p className="text-xs font-medium mb-1">Assigned Tasks:</p>
                                <ul className="text-xs space-y-1">
                                  {period.assignments.map((assignment, aIdx) => (
                                    <li key={aIdx} className="flex justify-between gap-4">
                                      <span className="truncate">{assignment.taskName}</span>
                                      <span className="shrink-0 font-mono">{assignment.allocation}%</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
