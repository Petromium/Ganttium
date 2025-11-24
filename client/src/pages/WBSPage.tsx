import { useState } from "react";
import { TableRowCard } from "@/components/TableRowCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, LayoutGrid, List, Calendar as CalendarIcon, GanttChartSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TaskModal } from "@/components/TaskModal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockTasks = [
  { id: "WBS-1.0", name: "Engineering & Design", status: "in-progress", progress: 85, priority: "high", children: 12 },
  { id: "WBS-1.1", name: "Conceptual Design", status: "completed", progress: 100, priority: "high", parent: "WBS-1.0" },
  { id: "WBS-1.2", name: "Detailed Engineering", status: "in-progress", progress: 78, priority: "high", parent: "WBS-1.0" },
  { id: "WBS-2.0", name: "Procurement", status: "in-progress", progress: 72, priority: "medium", children: 8 },
  { id: "WBS-2.1", name: "Equipment Procurement", status: "in-progress", progress: 65, priority: "high", parent: "WBS-2.0" },
  { id: "WBS-3.0", name: "Construction", status: "in-progress", progress: 45, priority: "critical", children: 15 },
];

export default function WBSPage() {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<string[]>(["WBS-1.0", "WBS-2.0"]);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<string>("list");

  const handleSelectTask = (id: string, selected: boolean) => {
    setSelectedTasks(prev =>
      selected ? [...prev, id] : prev.filter(t => t !== id)
    );
  };

  const handleToggleExpand = (id: string) => {
    setExpandedTasks(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "in-progress": return "secondary";
      case "at-risk": return "destructive";
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

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Work Breakdown Structure</h1>
          <p className="text-muted-foreground">Manage tasks and deliverables</p>
        </div>
        <Button onClick={() => setTaskModalOpen(true)} data-testid="button-create-task">
          Create Task
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tasks..."
            className="pl-9"
            data-testid="input-search-tasks"
          />
        </div>

        <Tabs value={viewMode} onValueChange={setViewMode}>
          <TabsList>
            <TabsTrigger value="list" data-testid="tab-view-list">
              <List className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="grid" data-testid="tab-view-grid">
              <LayoutGrid className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="gantt" data-testid="tab-view-gantt">
              <GanttChartSquare className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="calendar" data-testid="tab-view-calendar">
              <CalendarIcon className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button variant="outline" size="icon" data-testid="button-filter">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {selectedTasks.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedTasks.length} selected</span>
          <Button variant="outline" size="sm" data-testid="button-bulk-edit">
            Bulk Edit
          </Button>
          <Button variant="outline" size="sm" data-testid="button-bulk-delete">
            Delete
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {mockTasks.map((task) => {
          const isExpanded = expandedTasks.includes(task.id);
          const hasChildren = task.children !== undefined && task.children > 0;
          const isChild = task.parent !== undefined;
          const parentExpanded = task.parent ? expandedTasks.includes(task.parent) : true;

          if (isChild && !parentExpanded) return null;

          return (
            <div key={task.id} className={isChild ? "ml-12" : ""}>
              <TableRowCard
                id={task.id}
                selected={selectedTasks.includes(task.id)}
                onSelect={(selected) => handleSelectTask(task.id, selected)}
                onClick={() => console.log("Task clicked:", task.id)}
                expandable={hasChildren}
                expanded={isExpanded}
                onToggleExpand={() => handleToggleExpand(task.id)}
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">{task.id}</Badge>
                      <span className="font-medium">{task.name}</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Badge variant={getStatusColor(task.status)}>
                      {task.status.replace("-", " ")}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono">{task.progress}%</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Badge variant={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {hasChildren && `${task.children} subtasks`}
                  </div>
                </div>
              </TableRowCard>
            </div>
          );
        })}
      </div>

      <TaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
      />
    </div>
  );
}
