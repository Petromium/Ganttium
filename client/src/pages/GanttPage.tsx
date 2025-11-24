import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const mockGanttTasks = [
  { id: "WBS-1.0", name: "Engineering & Design", start: 0, duration: 60, progress: 85, color: "bg-chart-1" },
  { id: "WBS-1.1", name: "Conceptual Design", start: 0, duration: 20, progress: 100, color: "bg-chart-1", parent: true },
  { id: "WBS-1.2", name: "Detailed Engineering", start: 15, duration: 45, progress: 78, color: "bg-chart-1", parent: true },
  { id: "WBS-2.0", name: "Procurement", start: 30, duration: 50, progress: 72, color: "bg-chart-2" },
  { id: "WBS-2.1", name: "Equipment Procurement", start: 35, duration: 40, progress: 65, color: "bg-chart-2", parent: true },
  { id: "WBS-3.0", name: "Construction", start: 60, duration: 90, progress: 45, color: "bg-chart-3" },
  { id: "WBS-3.1", name: "Foundation Work", start: 60, duration: 25, progress: 90, color: "bg-chart-3", parent: true },
  { id: "WBS-3.2", name: "Structural Assembly", start: 80, duration: 45, progress: 35, color: "bg-chart-3", parent: true },
];

export default function GanttPage() {
  const totalDays = 150;
  const monthsToShow = 6;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Gantt Chart</h1>
          <p className="text-muted-foreground">Timeline view with dependencies</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" data-testid="button-zoom-in">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" data-testid="button-zoom-out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" data-testid="button-fit-screen">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              <div className="grid grid-cols-12 gap-px mb-4 bg-border rounded-lg overflow-hidden">
                <div className="col-span-3 bg-muted p-3 font-semibold text-sm">Task</div>
                <div className="col-span-9 bg-muted">
                  <div className="grid grid-cols-6 text-center text-sm font-semibold">
                    {Array.from({ length: monthsToShow }).map((_, i) => (
                      <div key={i} className="p-3 border-l border-border">
                        Month {i + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {mockGanttTasks.map((task) => {
                  const startPercent = (task.start / totalDays) * 100;
                  const widthPercent = (task.duration / totalDays) * 100;

                  return (
                    <div
                      key={task.id}
                      className={`grid grid-cols-12 gap-px items-center ${task.parent ? 'ml-8' : ''}`}
                    >
                      <div className="col-span-3 flex items-center gap-2 py-2">
                        <Badge variant="outline" className="font-mono text-xs">{task.id}</Badge>
                        <span className="text-sm font-medium truncate">{task.name}</span>
                      </div>
                      <div className="col-span-9 relative h-12 bg-muted/30 rounded">
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 h-8 rounded ${task.color} flex items-center px-2 text-white text-xs font-semibold shadow hover-elevate cursor-pointer transition-shadow`}
                          style={{
                            left: `${startPercent}%`,
                            width: `${widthPercent}%`,
                          }}
                          data-testid={`gantt-bar-${task.id}`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="truncate">{task.progress}%</span>
                            <div
                              className="absolute inset-0 bg-white/20 rounded"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h3 className="text-sm font-semibold mb-2">Dependencies Legend</h3>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-chart-1" />
                    <span>Finish-to-Start (FS)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-chart-2 border-t-2 border-chart-1" />
                    <span>Start-to-Start (SS)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-destructive" />
                    <span>Critical Path</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
