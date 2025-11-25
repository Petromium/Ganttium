import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useProject } from "@/contexts/ProjectContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { AlertCircle, Users, FolderTree, Search, Download, Filter } from "lucide-react";
import type { Task, Stakeholder, StakeholderRaci } from "@shared/schema";

type RaciType = "R" | "A" | "C" | "I" | null;

const RACI_LABELS: Record<string, { label: string; description: string; color: string }> = {
  R: { label: "Responsible", description: "Does the work to complete the task", color: "bg-blue-500 text-white" },
  A: { label: "Accountable", description: "Ultimately answerable for the task completion", color: "bg-green-500 text-white" },
  C: { label: "Consulted", description: "Provides input before work is done", color: "bg-yellow-500 text-black" },
  I: { label: "Informed", description: "Kept up-to-date on progress", color: "bg-purple-500 text-white" },
};

function RaciCell({
  value,
  onChange,
  isLoading,
  taskName,
  stakeholderName,
}: {
  value: RaciType;
  onChange: (newValue: RaciType) => void;
  isLoading: boolean;
  taskName: string;
  stakeholderName: string;
}) {
  const cycleRaci = () => {
    const order: RaciType[] = [null, "R", "A", "C", "I"];
    const currentIndex = order.indexOf(value);
    const nextIndex = (currentIndex + 1) % order.length;
    onChange(order[nextIndex]);
  };

  if (isLoading) {
    return <Skeleton className="h-8 w-8" />;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={cycleRaci}
            className={`h-8 w-8 rounded-md flex items-center justify-center font-bold text-sm transition-all hover-elevate ${
              value ? RACI_LABELS[value].color : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            data-testid={`raci-cell-${taskName}-${stakeholderName}`}
          >
            {value || "-"}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">{taskName}</p>
            <p className="text-muted-foreground">{stakeholderName}</p>
            {value && (
              <p className="mt-1">
                <span className="font-medium">{value}</span> - {RACI_LABELS[value].label}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Click to change</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function RACIMatrixPage() {
  const { selectedProject } = useProject();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDiscipline, setFilterDiscipline] = useState<string>("all");
  const [pendingChanges, setPendingChanges] = useState<Map<string, RaciType>>(new Map());

  const projectId = selectedProject?.id;

  // Fetch tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/projects", projectId, "tasks"],
    enabled: Boolean(projectId),
  });

  // Fetch stakeholders
  const { data: stakeholders = [], isLoading: stakeholdersLoading } = useQuery<Stakeholder[]>({
    queryKey: ["/api/projects", projectId, "stakeholders"],
    enabled: Boolean(projectId),
  });

  // Fetch RACI assignments
  const { data: raciAssignments = [], isLoading: raciLoading, refetch: refetchRaci } = useQuery<StakeholderRaci[]>({
    queryKey: ["/api/projects", projectId, "raci"],
    enabled: Boolean(projectId),
  });

  // Upsert RACI mutation
  const upsertRaciMutation = useMutation({
    mutationFn: async ({ projectId, stakeholderId, taskId, raciType }: { 
      projectId: number; 
      stakeholderId: number; 
      taskId: number; 
      raciType: RaciType;
    }) => {
      if (raciType === null) {
        // Find and delete existing assignment
        const existing = raciAssignments.find(
          r => r.stakeholderId === stakeholderId && r.taskId === taskId
        );
        if (existing) {
          await apiRequest("DELETE", `/api/raci/${existing.id}`);
        }
        return null;
      }
      const res = await apiRequest("PUT", "/api/raci/upsert", {
        projectId,
        stakeholderId,
        taskId,
        raciType,
      });
      return res.json();
    },
    onSuccess: () => {
      refetchRaci();
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Build RACI lookup map
  const raciMap = useMemo(() => {
    const map = new Map<string, RaciType>();
    raciAssignments.forEach((raci) => {
      map.set(`${raci.taskId}-${raci.stakeholderId}`, raci.raciType as RaciType);
    });
    return map;
  }, [raciAssignments]);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        t => t.name.toLowerCase().includes(search) || 
             t.wbsCode.toLowerCase().includes(search)
      );
    }
    
    if (filterDiscipline !== "all") {
      filtered = filtered.filter(t => t.discipline === filterDiscipline);
    }
    
    // Sort by WBS code
    return filtered.sort((a, b) => a.wbsCode.localeCompare(b.wbsCode, undefined, { numeric: true }));
  }, [tasks, searchTerm, filterDiscipline]);

  // Get unique disciplines for filter
  const disciplines = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => {
      if (t.discipline) set.add(t.discipline);
    });
    return Array.from(set).sort();
  }, [tasks]);

  const handleRaciChange = (taskId: number, stakeholderId: number, newValue: RaciType) => {
    if (!projectId) return;
    
    const key = `${taskId}-${stakeholderId}`;
    setPendingChanges(prev => new Map(prev).set(key, newValue));
    
    upsertRaciMutation.mutate(
      { projectId, stakeholderId, taskId, raciType: newValue },
      {
        onSettled: () => {
          setPendingChanges(prev => {
            const next = new Map(prev);
            next.delete(key);
            return next;
          });
        },
      }
    );
  };

  const getRaciValue = (taskId: number, stakeholderId: number): RaciType => {
    const key = `${taskId}-${stakeholderId}`;
    if (pendingChanges.has(key)) {
      return pendingChanges.get(key) ?? null;
    }
    return raciMap.get(key) ?? null;
  };

  if (!selectedProject) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a project to view the RACI Matrix.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isLoading = tasksLoading || stakeholdersLoading || raciLoading;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-raci-title">RACI Matrix</h1>
          <p className="text-muted-foreground">
            Assign Responsible, Accountable, Consulted, and Informed roles to stakeholders for each task
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <FolderTree className="h-3 w-3" />
            {filteredTasks.length} Tasks
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            {stakeholders.length} Stakeholders
          </Badge>
        </div>
      </div>

      {/* RACI Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">RACI Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Object.entries(RACI_LABELS).map(([key, { label, description, color }]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`h-6 w-6 rounded flex items-center justify-center font-bold text-xs ${color}`}>
                  {key}
                </div>
                <div>
                  <span className="font-medium text-sm">{label}</span>
                  <span className="text-xs text-muted-foreground ml-1">- {description}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks by name or WBS code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-tasks"
          />
        </div>
        <Select value={filterDiscipline} onValueChange={setFilterDiscipline}>
          <SelectTrigger className="w-48" data-testid="select-discipline-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by discipline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Disciplines</SelectItem>
            {disciplines.map((d) => (
              <SelectItem key={d} value={d}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* RACI Matrix Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Responsibility Assignment Matrix</CardTitle>
          <CardDescription>
            Click on cells to cycle through R → A → C → I → empty. Each stakeholder can have one role per task.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : stakeholders.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No stakeholders found. Add stakeholders to this project first before creating RACI assignments.
              </AlertDescription>
            </Alert>
          ) : filteredTasks.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No tasks found matching your filters. Try adjusting your search or filter criteria.
              </AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="w-full">
              <div className="min-w-max">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 bg-background border-b p-2 text-left font-medium min-w-[200px]">
                        WBS / Task
                      </th>
                      {stakeholders.map((stakeholder) => (
                        <th
                          key={stakeholder.id}
                          className="border-b p-2 text-center font-medium min-w-[60px]"
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex flex-col items-center cursor-help">
                                  <span className="text-xs truncate max-w-[80px]">
                                    {stakeholder.name.split(" ")[0]}
                                  </span>
                                  <Badge variant="outline" className="text-[10px] mt-1">
                                    {stakeholder.role}
                                  </Badge>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div>
                                  <p className="font-medium">{stakeholder.name}</p>
                                  <p className="text-sm text-muted-foreground">{stakeholder.organization}</p>
                                  <p className="text-sm text-muted-foreground">{stakeholder.role}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-muted/50" data-testid={`raci-row-${task.id}`}>
                        <td className="sticky left-0 z-10 bg-background border-b p-2">
                          <div className="flex flex-col">
                            <span className="font-mono text-xs text-muted-foreground">
                              {task.wbsCode}
                            </span>
                            <span className="text-sm font-medium truncate max-w-[200px]">
                              {task.name}
                            </span>
                            {task.discipline && (
                              <Badge variant="outline" className="text-[10px] w-fit mt-1">
                                {task.discipline}
                              </Badge>
                            )}
                          </div>
                        </td>
                        {stakeholders.map((stakeholder) => {
                          const key = `${task.id}-${stakeholder.id}`;
                          const isPending = pendingChanges.has(key);
                          return (
                            <td key={stakeholder.id} className="border-b p-2 text-center">
                              <RaciCell
                                value={getRaciValue(task.id, stakeholder.id)}
                                onChange={(newValue) => handleRaciChange(task.id, stakeholder.id, newValue)}
                                isLoading={isPending}
                                taskName={task.name}
                                stakeholderName={stakeholder.name}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
