import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2, Clock, DollarSign } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Project Overview</h1>
        <p className="text-muted-foreground">Refinery Expansion Project - Q4 2024</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Tasks"
          value="212"
          change={8}
          icon={BarChart3}
        />
        <MetricCard
          title="Completion Rate"
          value="67%"
          change={12}
          icon={TrendingUp}
        />
        <MetricCard
          title="Budget Utilization"
          value="$1.2M"
          change={-3}
          icon={DollarSign}
        />
        <MetricCard
          title="At Risk Items"
          value="12"
          change={-15}
          icon={AlertTriangle}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Work Breakdown Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Engineering & Design</span>
                  <Badge variant="secondary">WBS 1.0</Badge>
                </div>
                <span className="text-sm font-semibold">85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Procurement</span>
                  <Badge variant="secondary">WBS 2.0</Badge>
                </div>
                <span className="text-sm font-semibold">72%</span>
              </div>
              <Progress value={72} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Construction</span>
                  <Badge variant="secondary">WBS 3.0</Badge>
                </div>
                <span className="text-sm font-semibold">45%</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Commissioning</span>
                  <Badge variant="secondary">WBS 4.0</Badge>
                </div>
                <span className="text-sm font-semibold">12%</span>
              </div>
              <Progress value={12} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-chart-3 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Task Completed: Structural Analysis</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-chart-2 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Risk Identified: Material Delivery Delay</p>
                <p className="text-xs text-muted-foreground">5 hours ago</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-chart-1 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Milestone Approaching: Foundation Complete</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-chart-3 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Change Request Approved: CR-2024-018</p>
                <p className="text-xs text-muted-foreground">2 days ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Critical Path Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { id: "T-245", name: "Foundation Excavation", progress: 90, status: "In Progress" },
              { id: "T-246", name: "Steel Framework Assembly", progress: 65, status: "In Progress" },
              { id: "T-247", name: "Electrical Infrastructure", progress: 30, status: "At Risk" },
              { id: "T-248", name: "HVAC Installation", progress: 0, status: "Not Started" },
            ].map((task) => (
              <div key={task.id} className="flex items-center gap-4">
                <Badge variant="outline" className="font-mono">{task.id}</Badge>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{task.name}</span>
                    <Badge variant={task.status === "At Risk" ? "destructive" : "secondary"}>
                      {task.status}
                    </Badge>
                  </div>
                  <Progress value={task.progress} className="h-1.5" />
                </div>
                <span className="text-sm text-muted-foreground w-12 text-right">{task.progress}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
