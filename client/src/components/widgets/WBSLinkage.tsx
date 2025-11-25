import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Link2, FileText, AlertTriangle, Users, 
  ExternalLink, ChevronRight
} from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { useLocation } from "wouter";
import type { Task, TaskDocument, TaskRisk, TaskIssue } from "@shared/schema";

interface LinkageItemProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  onClick?: () => void;
}

function LinkageItem({ icon, label, count, onClick }: LinkageItemProps) {
  return (
    <div 
      className={`flex items-center justify-between py-2 border-b last:border-0 ${
        onClick ? "cursor-pointer hover-elevate rounded-md px-2 -mx-2" : ""
      }`}
      onClick={onClick}
      data-testid={`linkage-item-${label.toLowerCase().replace(/\s/g, "-")}`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="tabular-nums">{count}</Badge>
        {onClick && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
      </div>
    </div>
  );
}

export function WBSLinkage() {
  const { selectedProjectId } = useProject();
  const [, setLocation] = useLocation();

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/projects", selectedProjectId, "tasks"],
    enabled: !!selectedProjectId,
  });

  const { data: taskDocuments = [] } = useQuery<TaskDocument[]>({
    queryKey: ["/api/projects", selectedProjectId, "task-documents"],
    enabled: !!selectedProjectId,
  });

  const { data: taskRisks = [] } = useQuery<TaskRisk[]>({
    queryKey: ["/api/projects", selectedProjectId, "task-risks"],
    enabled: !!selectedProjectId,
  });

  const { data: taskIssues = [] } = useQuery<TaskIssue[]>({
    queryKey: ["/api/projects", selectedProjectId, "task-issues"],
    enabled: !!selectedProjectId,
  });

  if (tasksLoading) {
    return (
      <Card data-testid="widget-wbs-linkage">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            WBS Linkages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-8" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const totalTasks = tasks.length;
  const milestoneTasks = tasks.filter(t => t.isMilestone).length;
  const criticalPathTasks = tasks.filter(t => t.isCriticalPath).length;

  const tasksWithDependencies = tasks.filter(t => t.parentId !== null).length;

  const uniqueDocLinks = new Set(taskDocuments.map(td => td.documentId)).size;
  const uniqueRiskLinks = new Set(taskRisks.map(tr => tr.riskId)).size;
  const uniqueIssueLinks = new Set(taskIssues.map(ti => ti.issueId)).size;

  return (
    <Card data-testid="widget-wbs-linkage">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            WBS Linkages
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-xs gap-1"
            onClick={() => setLocation("/wbs")}
          >
            View WBS
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="pb-2 border-b">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total WBS Items</span>
            <span className="text-lg font-bold tabular-nums">{totalTasks}</span>
          </div>
        </div>

        <LinkageItem
          icon={<FileText className="h-4 w-4 text-blue-500" />}
          label="Linked Documents"
          count={uniqueDocLinks}
          onClick={() => setLocation("/sop")}
        />

        <LinkageItem
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          label="Linked Risks"
          count={uniqueRiskLinks}
          onClick={() => setLocation("/risks")}
        />

        <LinkageItem
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          label="Linked Issues"
          count={uniqueIssueLinks}
          onClick={() => setLocation("/issues")}
        />

        <div className="pt-2 border-t space-y-1">
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-muted-foreground">Milestones</span>
            <Badge variant="outline" className="tabular-nums">{milestoneTasks}</Badge>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-muted-foreground">Critical Path</span>
            <Badge variant="destructive" className="tabular-nums">{criticalPathTasks}</Badge>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-muted-foreground">With Dependencies</span>
            <Badge variant="secondary" className="tabular-nums">{tasksWithDependencies}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
