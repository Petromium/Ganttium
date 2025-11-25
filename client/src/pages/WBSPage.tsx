import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TableRowCard } from "@/components/TableRowCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, Filter, LayoutGrid, List, Calendar as CalendarIcon, 
  GanttChartSquare, AlertCircle, Plus, Clock, AlertTriangle, 
  Loader2, ZoomIn, ZoomOut, Maximize2, ChevronLeft, ChevronRight, X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { TaskModal } from "@/components/TaskModal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useProject } from "@/contexts/ProjectContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { Task, TaskDependency } from "@shared/schema";

type TaskStatus = "not-started" | "in-progress" | "review" | "completed" | "on-hold";
type ViewMode = "list" | "kanban" | "gantt" | "calendar";
type ZoomLevel = "week" | "month" | "quarter";

const KANBAN_COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: "not-started", title: "Not Started" },
  { id: "in-progress", title: "In Progress" },
  { id: "review", title: "In Review" },
  { id: "completed", title: "Completed" },
];

const ZOOM_CONFIGS: Record<ZoomLevel, { daysPerUnit: number; unitLabel: string }> = {
  week: { daysPerUnit: 7, unitLabel: "Week" },
  month: { daysPerUnit: 30, unitLabel: "Month" },
  quarter: { daysPerUnit: 90, unitLabel: "Quarter" },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function WBSPage() {
  const { selectedProjectId } = useProject();
  const { toast } = useToast();
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<number[]>([]);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("not-started");
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [zoom, setZoom] = useState<ZoomLevel>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilters, setStatusFilters] = useState<TaskStatus[]>([]);
  const [priorityFilters, setPriorityFilters] = useState<string[]>([]);
  const [disciplineFilters, setDisciplineFilters] = useState<string[]>([]);
  const [dateRangeStart, setDateRangeStart] = useState<string>("");
  const [dateRangeEnd, setDateRangeEnd] = useState<string>("");

  const { 
    data: tasks = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery<Task[]>({
    queryKey: [`/api/projects/${selectedProjectId}/tasks`],
    enabled: !!selectedProjectId,
    retry: 1,
  });

  const { data: dependencies = [] } = useQuery<TaskDependency[]>({
    queryKey: [`/api/projects/${selectedProjectId}/dependencies`],
    enabled: !!selectedProjectId && viewMode === "gantt",
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: number) => {
      await apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/tasks`] });
      toast({ title: "Success", description: "Task deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to delete task", variant: "destructive" });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: TaskStatus }) => {
      await apiRequest("PATCH", `/api/tasks/${taskId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/tasks`] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to update task status", variant: "destructive" });
    },
  });

  const uniqueDisciplines = useMemo(() => {
    const disciplines = new Set<string>();
    tasks.forEach(t => {
      if (t.discipline) disciplines.add(t.discipline);
    });
    return Array.from(disciplines).sort();
  }, [tasks]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilters.length > 0) count++;
    if (priorityFilters.length > 0) count++;
    if (disciplineFilters.length > 0) count++;
    if (dateRangeStart || dateRangeEnd) count++;
    return count;
  }, [statusFilters, priorityFilters, disciplineFilters, dateRangeStart, dateRangeEnd]);

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.name.toLowerCase().includes(query) || 
        t.wbsCode?.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }

    if (statusFilters.length > 0) {
      result = result.filter(t => statusFilters.includes(t.status as TaskStatus));
    }

    if (priorityFilters.length > 0) {
      result = result.filter(t => t.priority && priorityFilters.includes(t.priority));
    }

    if (disciplineFilters.length > 0) {
      result = result.filter(t => t.discipline && disciplineFilters.includes(t.discipline));
    }

    if (dateRangeStart) {
      const startDate = new Date(dateRangeStart);
      result = result.filter(t => t.startDate && new Date(t.startDate) >= startDate);
    }

    if (dateRangeEnd) {
      const endDate = new Date(dateRangeEnd);
      result = result.filter(t => t.endDate && new Date(t.endDate) <= endDate);
    }

    return result;
  }, [tasks, searchQuery, statusFilters, priorityFilters, disciplineFilters, dateRangeStart, dateRangeEnd]);

  const clearFilters = () => {
    setStatusFilters([]);
    setPriorityFilters([]);
    setDisciplineFilters([]);
    setDateRangeStart("");
    setDateRangeEnd("");
  };

  const toggleStatusFilter = (status: TaskStatus) => {
    setStatusFilters(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const togglePriorityFilter = (priority: string) => {
    setPriorityFilters(prev => 
      prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]
    );
  };

  const toggleDisciplineFilter = (discipline: string) => {
    setDisciplineFilters(prev => 
      prev.includes(discipline) ? prev.filter(d => d !== discipline) : [...prev, discipline]
    );
  };

  const handleSelectTask = (id: number, selected: boolean) => {
    setSelectedTasks(prev => selected ? [...prev, id] : prev.filter(t => t !== id));
  };

  const handleToggleExpand = (id: number) => {
    setExpandedTasks(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleDeleteTask = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleAddTask = (status: TaskStatus = "not-started") => {
    setEditingTask(undefined);
    setDefaultStatus(status);
    setTaskModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "in-progress": return "secondary";
      case "review": return "outline";
      default: return "outline";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "destructive";
      case "high": return "secondary";
      default: return "outline";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "in-progress": return "bg-blue-500";
      case "review": return "bg-purple-500";
      case "on-hold": return "bg-amber-500";
      default: return "bg-gray-400";
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const isOverdue = (task: Task) => {
    if (!task.endDate) return false;
    return new Date(task.endDate) < new Date() && task.status !== "completed";
  };

  const rootTasks = filteredTasks.filter(t => !t.parentId);
  const getChildren = (parentId: number) => filteredTasks.filter(t => t.parentId === parentId);

  const renderListTask = (task: Task, level = 0) => {
    const children = getChildren(task.id);
    const isExpanded = expandedTasks.includes(task.id);
    const hasChildren = children.length > 0;

    return (
      <div key={task.id}>
        <div style={{ marginLeft: `${level * 1.5}rem` }}>
          <TableRowCard
            id={task.id.toString()}
            selected={selectedTasks.includes(task.id)}
            onSelect={(selected) => handleSelectTask(task.id, selected)}
            expanded={isExpanded}
            onToggleExpand={hasChildren ? () => handleToggleExpand(task.id) : undefined}
            expandable={hasChildren}
            data-testid={`row-task-${task.id}`}
          >
            <div 
              className="grid grid-cols-[2fr,1fr,1fr,1fr,100px,80px] gap-4 items-center flex-1 cursor-pointer"
              onClick={() => handleEditTask(task)}
            >
              <div>
                <div className="font-medium">{task.name}</div>
                <div className="text-sm text-muted-foreground">{task.wbsCode}</div>
              </div>
              <Badge variant={getStatusColor(task.status)} data-testid={`badge-status-${task.id}`}>
                {task.status.replace("-", " ")}
              </Badge>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${task.progress}%` }} />
                </div>
                <span className="text-sm text-muted-foreground w-12 text-right">{task.progress}%</span>
              </div>
              <Badge variant={getPriorityColor(task.priority)} data-testid={`badge-priority-${task.id}`}>
                {task.priority}
              </Badge>
              <div className="text-sm text-muted-foreground">{task.assignedTo || "Unassigned"}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                disabled={deleteMutation.isPending}
                data-testid={`button-delete-${task.id}`}
              >
                Delete
              </Button>
            </div>
          </TableRowCard>
        </div>
        {isExpanded && children.map(child => renderListTask(child, level + 1))}
      </div>
    );
  };

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    if (draggedTaskId !== null) {
      const task = filteredTasks.find(t => t.id === draggedTaskId);
      if (task && task.status !== targetStatus) {
        updateTaskMutation.mutate({ taskId: draggedTaskId, status: targetStatus });
      }
    }
    setDraggedTaskId(null);
  };

  const handleDragEnd = () => setDraggedTaskId(null);

  const groupedTasks: Record<TaskStatus, Task[]> = {
    "not-started": [],
    "in-progress": [],
    "review": [],
    "completed": [],
    "on-hold": [],
  };
  filteredTasks.forEach((task) => {
    if (groupedTasks[task.status as TaskStatus]) {
      groupedTasks[task.status as TaskStatus].push(task);
    }
  });

  const { minDate, maxDate, totalDays, units } = useMemo(() => {
    if (filteredTasks.length === 0) {
      const now = new Date();
      return { minDate: now, maxDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000), totalDays: 180, units: 6 };
    }
    let min = new Date();
    let max = new Date();
    filteredTasks.forEach(task => {
      if (task.startDate) {
        const start = new Date(task.startDate);
        if (!min || start < min) min = start;
      }
      if (task.endDate) {
        const end = new Date(task.endDate);
        if (!max || end > max) max = end;
      }
    });
    min.setDate(min.getDate() - 7);
    max.setDate(max.getDate() + 30);
    const daysDiff = Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24));
    const { daysPerUnit } = ZOOM_CONFIGS[zoom];
    return { minDate: min, maxDate: max, totalDays: daysDiff, units: Math.ceil(daysDiff / daysPerUnit) };
  }, [filteredTasks, zoom]);

  const getTaskPosition = (task: Task) => {
    if (!task.startDate || !task.endDate) return { left: 0, width: 0 };
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);
    const startOffset = Math.floor((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return { left: (startOffset / totalDays) * 100, width: Math.max((duration / totalDays) * 100, 1) };
  };

  const getUnitLabels = () => {
    const labels: string[] = [];
    const { daysPerUnit, unitLabel } = ZOOM_CONFIGS[zoom];
    for (let i = 0; i < units; i++) {
      const unitDate = new Date(minDate.getTime() + i * daysPerUnit * 24 * 60 * 60 * 1000);
      if (zoom === "week") labels.push(`${unitLabel} ${i + 1}`);
      else if (zoom === "month") labels.push(unitDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" }));
      else labels.push(`Q${Math.floor(unitDate.getMonth() / 3) + 1} ${unitDate.getFullYear()}`);
    }
    return labels;
  };

  const handleZoomIn = () => { if (zoom === "quarter") setZoom("month"); else if (zoom === "month") setZoom("week"); };
  const handleZoomOut = () => { if (zoom === "week") setZoom("month"); else if (zoom === "month") setZoom("quarter"); };

  const renderGanttTask = (task: Task, level = 0): JSX.Element[] => {
    const children = getChildren(task.id);
    const { left, width } = getTaskPosition(task);
    const hasValidDates = task.startDate && task.endDate;
    const elements: JSX.Element[] = [
      <div
        key={task.id}
        className={`grid grid-cols-12 gap-px items-center ${task.priority === "critical" ? "border-l-4 border-l-red-500" : task.priority === "high" ? "border-l-4 border-l-orange-500" : ""}`}
        style={{ paddingLeft: `${level * 1.5}rem` }}
      >
        <div className="col-span-3 flex items-center gap-2 py-2 pr-2">
          <Badge variant="outline" className="font-mono text-xs shrink-0">{task.wbsCode || `#${task.id}`}</Badge>
          <span className="text-sm font-medium truncate">{task.name}</span>
        </div>
        <div className="col-span-9 relative h-10 bg-muted/30 rounded">
          {hasValidDates ? (
            <div
              className={`absolute top-1/2 -translate-y-1/2 h-6 rounded ${getStatusBgColor(task.status)} flex items-center px-2 text-white text-xs font-semibold shadow hover-elevate cursor-pointer transition-shadow overflow-hidden`}
              style={{ left: `${left}%`, width: `${width}%`, minWidth: "40px" }}
              onClick={() => handleEditTask(task)}
              data-testid={`gantt-bar-${task.id}`}
            >
              <div className="flex items-center justify-between w-full"><span className="truncate">{task.progress || 0}%</span></div>
              <div className="absolute inset-0 bg-white/20 rounded pointer-events-none" style={{ width: `${task.progress || 0}%` }} />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">No dates set</div>
          )}
        </div>
      </div>
    ];
    children.forEach(child => elements.push(...renderGanttTask(child, level + 1)));
    return elements;
  };

  const { year, month, daysInMonth, startDay, today, monthName } = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    const todayDate = new Date();
    return {
      year: y, month: m, daysInMonth: lastDay.getDate(), startDay: firstDay.getDay(),
      today: todayDate.getFullYear() === y && todayDate.getMonth() === m ? todayDate.getDate() : -1,
      monthName: firstDay.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    };
  }, [currentDate]);

  const tasksOnDate = useMemo(() => {
    const taskMap: Map<number, Task[]> = new Map();
    filteredTasks.forEach(task => {
      if (task.startDate) {
        const startDate = new Date(task.startDate);
        if (startDate.getFullYear() === year && startDate.getMonth() === month) {
          const day = startDate.getDate();
          if (!taskMap.has(day)) taskMap.set(day, []);
          taskMap.get(day)!.push({ ...task, _isStart: true } as any);
        }
      }
      if (task.endDate) {
        const endDate = new Date(task.endDate);
        if (endDate.getFullYear() === year && endDate.getMonth() === month) {
          const day = endDate.getDate();
          if (!taskMap.has(day)) taskMap.set(day, []);
          const existing = taskMap.get(day)!.find(t => t.id === task.id);
          if (!existing) taskMap.get(day)!.push({ ...task, _isEnd: true } as any);
        }
      }
    });
    return taskMap;
  }, [filteredTasks, year, month]);

  const weeks = Math.ceil((daysInMonth + startDay) / 7);
  const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  if (!selectedProjectId) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">No Project Selected</h2>
          <p className="text-muted-foreground">Please select a project from the dropdown above</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="page-title-wbs">Work Breakdown Structure</h1>
          <p className="text-muted-foreground">Manage tasks and deliverables</p>
        </div>
        <Button onClick={() => handleAddTask()} data-testid="button-create-task">
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load tasks. {(error as Error).message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-retry">Retry</Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tasks..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-tasks"
          />
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="list" data-testid="tab-view-list"><List className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="kanban" data-testid="tab-view-kanban"><LayoutGrid className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="gantt" data-testid="tab-view-gantt"><GanttChartSquare className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="calendar" data-testid="tab-view-calendar"><CalendarIcon className="h-4 w-4" /></TabsTrigger>
          </TabsList>
        </Tabs>

        {viewMode === "gantt" && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoom === "week"} data-testid="button-zoom-in"><ZoomIn className="h-4 w-4" /></Button>
            <Badge variant="secondary" className="px-3">{ZOOM_CONFIGS[zoom].unitLabel}</Badge>
            <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoom === "quarter"} data-testid="button-zoom-out"><ZoomOut className="h-4 w-4" /></Button>
          </div>
        )}

        {viewMode === "calendar" && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday} data-testid="button-today">Today</Button>
            <Button variant="outline" size="icon" onClick={goToPrevMonth} data-testid="button-prev-month"><ChevronLeft className="h-4 w-4" /></Button>
            <div className="px-4 font-semibold min-w-[180px] text-center">{monthName}</div>
            <Button variant="outline" size="icon" onClick={goToNextMonth} data-testid="button-next-month"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        )}

        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative" data-testid="button-filter">
              <Filter className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Filters</h4>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
                    <X className="h-3 w-3 mr-1" />Clear All
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <div className="grid grid-cols-2 gap-2">
                  {KANBAN_COLUMNS.map((col) => (
                    <div key={col.id} className="flex items-center gap-2">
                      <Checkbox 
                        id={`status-${col.id}`}
                        checked={statusFilters.includes(col.id)}
                        onCheckedChange={() => toggleStatusFilter(col.id)}
                        data-testid={`filter-status-${col.id}`}
                      />
                      <Label htmlFor={`status-${col.id}`} className="text-sm font-normal cursor-pointer">{col.title}</Label>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="status-on-hold"
                      checked={statusFilters.includes("on-hold")}
                      onCheckedChange={() => toggleStatusFilter("on-hold")}
                      data-testid="filter-status-on-hold"
                    />
                    <Label htmlFor="status-on-hold" className="text-sm font-normal cursor-pointer">On Hold</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Priority</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["critical", "high", "medium", "low"].map((priority) => (
                    <div key={priority} className="flex items-center gap-2">
                      <Checkbox 
                        id={`priority-${priority}`}
                        checked={priorityFilters.includes(priority)}
                        onCheckedChange={() => togglePriorityFilter(priority)}
                        data-testid={`filter-priority-${priority}`}
                      />
                      <Label htmlFor={`priority-${priority}`} className="text-sm font-normal cursor-pointer capitalize">{priority}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {uniqueDisciplines.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Discipline</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {uniqueDisciplines.map((discipline) => (
                      <div key={discipline} className="flex items-center gap-2">
                        <Checkbox 
                          id={`discipline-${discipline}`}
                          checked={disciplineFilters.includes(discipline)}
                          onCheckedChange={() => toggleDisciplineFilter(discipline)}
                          data-testid={`filter-discipline-${discipline}`}
                        />
                        <Label htmlFor={`discipline-${discipline}`} className="text-sm font-normal cursor-pointer truncate">{discipline}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Start After</Label>
                    <Input 
                      type="date"
                      value={dateRangeStart}
                      onChange={(e) => setDateRangeStart(e.target.value)}
                      className="h-8 text-sm"
                      data-testid="filter-date-start"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">End Before</Label>
                    <Input 
                      type="date"
                      value={dateRangeEnd}
                      onChange={(e) => setDateRangeEnd(e.target.value)}
                      className="h-8 text-sm"
                      data-testid="filter-date-end"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t text-xs text-muted-foreground">
                Showing {filteredTasks.length} of {tasks.length} tasks
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {selectedTasks.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedTasks.length} selected</span>
          <Button variant="outline" size="sm" data-testid="button-bulk-edit">Bulk Edit</Button>
          <Button variant="outline" size="sm" data-testid="button-bulk-delete">Delete</Button>
        </div>
      )}

      {viewMode === "list" && (
        filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-2">No Tasks Found</h2>
            <p className="text-muted-foreground mb-4">Get started by creating your first task</p>
            <Button onClick={() => handleAddTask()} data-testid="button-create-first-task">Create Task</Button>
          </div>
        ) : (
          <div className="space-y-2">{rootTasks.map(task => renderListTask(task))}</div>
        )
      )}

      {viewMode === "kanban" && (
        <div className="grid grid-cols-4 gap-4 min-h-[500px]">
          {KANBAN_COLUMNS.map((column) => (
            <div 
              key={column.id} 
              className="flex flex-col min-h-[400px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              data-testid={`column-${column.id}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{column.title}</h3>
                  <Badge variant="secondary" data-testid={`count-${column.id}`}>{groupedTasks[column.id].length}</Badge>
                </div>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto">
                {groupedTasks[column.id].map((task) => (
                  <Card
                    key={task.id}
                    className={`cursor-grab active:cursor-grabbing hover-elevate active-elevate-2 transition-all ${draggedTaskId === task.id ? "opacity-50" : ""}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleEditTask(task)}
                    data-testid={`kanban-card-${task.id}`}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="outline" className="font-mono text-xs" data-testid={`task-code-${task.id}`}>{task.wbsCode || `T-${task.id}`}</Badge>
                        {isOverdue(task) && <AlertTriangle className="h-4 w-4 text-destructive" />}
                      </div>
                      <h4 className="font-medium text-sm leading-tight" data-testid={`task-name-${task.id}`}>{task.name}</h4>
                      {task.progress !== undefined && task.progress > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground"><span>Progress</span><span>{task.progress}%</span></div>
                          <Progress value={task.progress} className="h-1.5" />
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <Badge variant={task.priority === "critical" ? "destructive" : task.priority === "high" ? "default" : "outline"} className="text-xs">{task.priority}</Badge>
                        <div className="flex items-center gap-2">
                          {task.endDate && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(task.endDate).toLocaleDateString()}
                            </div>
                          )}
                          {task.assignedTo && (
                            <Avatar className="h-6 w-6"><AvatarFallback className="text-xs">{getInitials(task.assignedTo)}</AvatarFallback></Avatar>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button variant="outline" className="w-full border-dashed" onClick={() => handleAddTask(column.id)} data-testid={`button-add-card-${column.id}`}>
                  <Plus className="h-4 w-4 mr-2" />Add Task
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === "gantt" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Project Timeline ({filteredTasks.length} tasks)</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold mb-2">No Tasks Yet</h2>
                <p className="text-muted-foreground">Create tasks with start and end dates to see them on the Gantt chart</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[1000px]">
                  <div className="grid grid-cols-12 gap-px mb-4 bg-border rounded-lg overflow-hidden">
                    <div className="col-span-3 bg-muted p-3 font-semibold text-sm">Task</div>
                    <div className="col-span-9 bg-muted">
                      <div className="grid text-center text-sm font-semibold" style={{ gridTemplateColumns: `repeat(${Math.min(units, 12)}, 1fr)` }}>
                        {getUnitLabels().slice(0, 12).map((label, i) => (
                          <div key={i} className="p-3 border-l border-border">{label}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">{rootTasks.map(task => renderGanttTask(task))}</div>
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h3 className="text-sm font-semibold mb-3">Legend</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-green-500" /><span>Completed</span></div>
                      <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-500" /><span>In Progress</span></div>
                      <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-purple-500" /><span>In Review</span></div>
                      <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-amber-500" /><span>On Hold</span></div>
                      <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-gray-400" /><span>Not Started</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === "calendar" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Monthly View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {WEEKDAYS.map((day) => (
                <div key={day} className="bg-muted p-3 text-center text-sm font-semibold">{day}</div>
              ))}
              {Array.from({ length: weeks * 7 }).map((_, index) => {
                const dayNumber = index - startDay + 1;
                const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth;
                const isToday = dayNumber === today;
                const dayTasks = tasksOnDate.get(dayNumber) || [];
                return (
                  <div
                    key={index}
                    className={cn("bg-background p-2 min-h-28", isToday && "ring-2 ring-primary ring-inset", !isValidDay && "bg-muted/30")}
                    data-testid={isValidDay ? `calendar-day-${dayNumber}` : undefined}
                  >
                    {isValidDay && (
                      <>
                        <div className={cn("text-sm font-semibold mb-2", isToday && "text-primary")}>{dayNumber}</div>
                        <div className="space-y-1">
                          {dayTasks.slice(0, 3).map((task: any) => (
                            <div
                              key={`${task.id}-${task._isStart ? 'start' : 'end'}`}
                              className={cn("text-xs px-1.5 py-0.5 rounded text-white truncate cursor-pointer hover:opacity-80", getStatusBgColor(task.status))}
                              title={`${task.name} (${task._isStart ? 'Start' : 'Due'})`}
                              onClick={() => handleEditTask(task)}
                              data-testid={`calendar-task-${task.id}`}
                            >
                              {task._isStart ? "▶ " : "◼ "}{task.name}
                            </div>
                          ))}
                          {dayTasks.length > 3 && <div className="text-xs text-muted-foreground">+{dayTasks.length - 3} more</div>}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <TaskModal
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        task={editingTask}
        defaultStatus={defaultStatus}
      />
    </div>
  );
}
