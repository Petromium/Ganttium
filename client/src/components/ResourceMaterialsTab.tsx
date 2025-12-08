import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, TrendingUp, AlertTriangle, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskMaterial, Task, Resource } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface ResourceMaterialsTabProps {
  projectId: number;
  materialResourceId?: number; // If provided, filter to this material only
}

interface MaterialUsage extends TaskMaterial {
  task: Task | null;
  resource: Resource | null;
}

export function ResourceMaterialsTab({ projectId, materialResourceId }: ResourceMaterialsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "on-track" | "at-risk" | "over-consumed">("all");

  // Fetch all tasks for the project
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: [`/api/projects/${projectId}/tasks`],
    enabled: !!projectId,
  });

  // Fetch materials for all tasks
  const { data: allMaterials = [], isLoading } = useQuery<MaterialUsage[]>({
    queryKey: [`/api/projects/${projectId}/materials`],
    enabled: !!projectId,
    queryFn: async () => {
      // Fetch materials for each task
      const materialsPromises = tasks.map(async (task) => {
        try {
          const res = await apiRequest("GET", `/api/tasks/${task.id}/materials`);
          const taskMaterials: TaskMaterial[] = await res.json();
          return taskMaterials.map((tm) => ({
            ...tm,
            task,
            resource: null, // Will be populated if needed
          }));
        } catch {
          return [];
        }
      });
      const allTaskMaterials = (await Promise.all(materialsPromises)).flat();
      
      // Filter by materialResourceId if provided
      if (materialResourceId) {
        return allTaskMaterials.filter(m => m.materialId === materialResourceId);
      }
      
      return allTaskMaterials;
    },
  });

  // Filter materials
  const filteredMaterials = allMaterials.filter((material) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const taskName = material.task?.name?.toLowerCase() || "";
      const resourceName = material.resource?.name?.toLowerCase() || "";
      if (!taskName.includes(query) && !resourceName.includes(query)) {
        return false;
      }
    }

    // Status filter
    const plannedQty = parseFloat(material.quantity || "0");
    const consumedQty = parseFloat(material.actualQuantity || "0");
    const percentageUsed = plannedQty > 0 ? (consumedQty / plannedQty) * 100 : 0;

    if (statusFilter === "on-track" && percentageUsed > 80) return false;
    if (statusFilter === "at-risk" && (percentageUsed <= 80 || percentageUsed > 100)) return false;
    if (statusFilter === "over-consumed" && percentageUsed <= 100) return false;

    return true;
  });

  // Aggregate statistics
  const totalPlanned = filteredMaterials.reduce((sum, m) => sum + parseFloat(m.quantity || "0"), 0);
  const totalConsumed = filteredMaterials.reduce((sum, m) => sum + parseFloat(m.actualQuantity || "0"), 0);
  const totalRemaining = totalPlanned - totalConsumed;
  const overallPercentage = totalPlanned > 0 ? (totalConsumed / totalPlanned) * 100 : 0;

  // Group by material resource
  const materialsByResource = filteredMaterials.reduce((acc, material) => {
    const key = material.materialId;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(material);
    return acc;
  }, {} as Record<number, MaterialUsage[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Package className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredMaterials.length}</p>
                <p className="text-sm text-muted-foreground">Material Items</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPlanned.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Total Planned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalConsumed.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Total Consumed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalRemaining.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Remaining</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Overall Material Consumption</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{overallPercentage.toFixed(1)}%</span>
            </div>
            <Progress 
              value={Math.min(overallPercentage, 100)} 
              className={cn(
                "h-3",
                overallPercentage > 100 && "bg-destructive",
                overallPercentage > 80 && overallPercentage <= 100 && "bg-amber-500",
                overallPercentage <= 80 && "bg-primary"
              )}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Consumed: {totalConsumed.toFixed(1)}</span>
              <span>Planned: {totalPlanned.toFixed(1)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by task or material name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="on-track">On Track (&lt;80%)</SelectItem>
            <SelectItem value="at-risk">At Risk (80-100%)</SelectItem>
            <SelectItem value="over-consumed">Over Consumed (&gt;100%)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Materials List */}
      {Object.keys(materialsByResource).length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Materials Found</h2>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== "all" 
                ? "Try adjusting your filters"
                : "No materials have been added to tasks yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(materialsByResource).map(([resourceId, materials]) => {
            const resourceTotalPlanned = materials.reduce((sum, m) => sum + parseFloat(m.quantity || "0"), 0);
            const resourceTotalConsumed = materials.reduce((sum, m) => sum + parseFloat(m.actualQuantity || "0"), 0);
            const resourcePercentage = resourceTotalPlanned > 0 ? (resourceTotalConsumed / resourceTotalPlanned) * 100 : 0;

            return (
              <Card key={resourceId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Material Resource #{resourceId}
                    </CardTitle>
                    <Badge variant={resourcePercentage > 100 ? "destructive" : resourcePercentage > 80 ? "default" : "secondary"}>
                      {resourcePercentage.toFixed(0)}% Used
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {materials.map((material) => {
                      const plannedQty = parseFloat(material.quantity || "0");
                      const consumedQty = parseFloat(material.actualQuantity || "0");
                      const remaining = plannedQty - consumedQty;
                      const percentageUsed = plannedQty > 0 ? (consumedQty / plannedQty) * 100 : 0;

                      return (
                        <div key={material.id} className="p-3 border rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{material.task?.name || `Task #${material.taskId}`}</p>
                              <p className="text-xs text-muted-foreground">
                                {material.task?.wbsCode || ""} • Unit: {material.unit}
                              </p>
                            </div>
                            <Badge variant={percentageUsed > 100 ? "destructive" : percentageUsed > 80 ? "default" : "secondary"}>
                              {percentageUsed.toFixed(0)}%
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Planned:</span>{" "}
                              <span className="font-medium">{plannedQty.toFixed(2)} {material.unit}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Consumed:</span>{" "}
                              <span className="font-medium">{consumedQty.toFixed(2)} {material.unit}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Remaining:</span>{" "}
                              <span className={cn("font-medium", remaining < 0 && "text-destructive")}>
                                {remaining.toFixed(2)} {material.unit}
                              </span>
                            </div>
                          </div>
                          <Progress 
                            value={Math.min(percentageUsed, 100)} 
                            className={cn(
                              "h-2",
                              percentageUsed > 100 && "bg-destructive",
                              percentageUsed > 80 && percentageUsed <= 100 && "bg-amber-500",
                              percentageUsed <= 80 && "bg-primary"
                            )}
                          />
                          {percentageUsed > 100 && (
                            <div className="flex items-center gap-2 text-xs text-destructive">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Consumption exceeds planned quantity</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

