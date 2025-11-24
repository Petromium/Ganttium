import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const columns = [
  { id: "not-started", title: "Not Started", count: 8 },
  { id: "in-progress", title: "In Progress", count: 12 },
  { id: "review", title: "In Review", count: 5 },
  { id: "completed", title: "Completed", count: 23 },
];

const mockKanbanTasks = {
  "not-started": [
    { id: "T-301", title: "HVAC System Design", priority: "medium", assignee: "JD", estimate: "40h" },
    { id: "T-302", title: "Fire Safety Assessment", priority: "high", assignee: "SM", estimate: "24h" },
  ],
  "in-progress": [
    { id: "T-245", title: "Foundation Excavation", priority: "critical", assignee: "RJ", estimate: "80h", warning: true },
    { id: "T-246", title: "Steel Framework Assembly", priority: "high", assignee: "TK", estimate: "120h" },
    { id: "T-247", title: "Electrical Infrastructure", priority: "medium", assignee: "LP", estimate: "60h" },
  ],
  "review": [
    { id: "T-198", title: "Structural Analysis Report", priority: "high", assignee: "AM", estimate: "16h" },
    { id: "T-199", title: "Procurement Documentation", priority: "medium", assignee: "DW", estimate: "12h" },
  ],
  "completed": [
    { id: "T-156", title: "Site Survey", priority: "high", assignee: "JD", estimate: "32h" },
    { id: "T-157", title: "Soil Testing", priority: "medium", assignee: "RJ", estimate: "24h" },
  ],
};

export default function KanbanPage() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Kanban Board</h1>
          <p className="text-muted-foreground">Drag and drop task management</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{column.title}</h3>
                <Badge variant="secondary">{column.count}</Badge>
              </div>
            </div>

            <div className="space-y-3 flex-1">
              {mockKanbanTasks[column.id as keyof typeof mockKanbanTasks]?.map((task) => (
                <Card
                  key={task.id}
                  className="cursor-grab active:cursor-grabbing hover-elevate active-elevate-2 transition-shadow"
                  data-testid={`kanban-card-${task.id}`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className="font-mono text-xs">{task.id}</Badge>
                      {'warning' in task && task.warning && <AlertTriangle className="h-4 w-4 text-chart-2" />}
                    </div>

                    <h4 className="font-medium text-sm leading-tight">{task.title}</h4>

                    <div className="flex items-center justify-between">
                      <Badge
                        variant={
                          task.priority === "critical" ? "destructive" :
                          task.priority === "high" ? "default" :
                          "secondary"
                        }
                        className="text-xs"
                      >
                        {task.priority}
                      </Badge>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {task.estimate}
                        </div>
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">{task.assignee}</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                variant="outline"
                className="w-full border-dashed"
                data-testid={`button-add-card-${column.id}`}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
