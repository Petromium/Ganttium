import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText, AlertTriangle, AlertCircle, User, Calendar, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Task, Risk, Issue, User as UserType } from "@shared/schema";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <Card
      className={cn("my-2 border cursor-pointer hover:bg-muted/50 transition-colors", onClick && "cursor-pointer")}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{task.name}</CardTitle>
          </div>
          {task.wbsCode && (
            <Badge variant="outline" className="text-xs">
              {task.wbsCode}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1 text-xs text-muted-foreground">
          {task.status && (
            <div className="flex items-center gap-2">
              <span>Status:</span>
              <Badge variant="secondary" className="text-xs">
                {task.status}
              </Badge>
            </div>
          )}
          {task.priority && (
            <div className="flex items-center gap-2">
              <span>Priority:</span>
              <Badge
                variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"}
                className="text-xs"
              >
                {task.priority}
              </Badge>
            </div>
          )}
          {task.startDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Start: {format(new Date(task.startDate), "MMM d, yyyy")}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface RiskCardProps {
  risk: Risk;
  onClick?: () => void;
}

export function RiskCard({ risk, onClick }: RiskCardProps) {
  const getImpactValue = (impact: string | null) => {
    switch (impact?.toLowerCase()) {
      case "high": return 5;
      case "medium": return 3;
      case "low": return 1;
      default: return 3;
    }
  };

  const impactValue = getImpactValue(risk.impact);
  const riskScore = (risk.probability || 3) * impactValue;

  return (
    <Card
      className={cn("my-2 border cursor-pointer hover:bg-muted/50 transition-colors", onClick && "cursor-pointer")}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <CardTitle className="text-sm font-medium">{risk.title}</CardTitle>
          </div>
          {risk.code && (
            <Badge variant="outline" className="text-xs">
              {risk.code}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Risk Level:</span>
            <Badge
              variant={
                riskScore > 15
                  ? "destructive"
                  : riskScore > 8
                  ? "default"
                  : "secondary"
              }
              className="text-xs"
            >
              {riskScore}
            </Badge>
          </div>
          {risk.status && (
            <div className="flex items-center gap-2">
              <span>Status:</span>
              <Badge variant="secondary" className="text-xs">
                {risk.status}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface IssueCardProps {
  issue: Issue;
  onClick?: () => void;
}

export function IssueCard({ issue, onClick }: IssueCardProps) {
  return (
    <Card
      className={cn("my-2 border cursor-pointer hover:bg-muted/50 transition-colors", onClick && "cursor-pointer")}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <CardTitle className="text-sm font-medium">{issue.title}</CardTitle>
          </div>
          {issue.code && (
            <Badge variant="outline" className="text-xs">
              {issue.code}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1 text-xs text-muted-foreground">
          {issue.priority && (
            <div className="flex items-center gap-2">
              <span>Priority:</span>
              <Badge
                variant={issue.priority === "high" ? "destructive" : issue.priority === "medium" ? "default" : "secondary"}
                className="text-xs"
              >
                {issue.priority}
              </Badge>
            </div>
          )}
          {issue.status && (
            <div className="flex items-center gap-2">
              <span>Status:</span>
              <Badge variant="secondary" className="text-xs">
                {issue.status}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface UserCardProps {
  user: UserType;
  onClick?: () => void;
}

export function UserCard({ user, onClick }: UserCardProps) {
  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.email;

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <Card
      className={cn("my-2 border cursor-pointer hover:bg-muted/50 transition-colors", onClick && "cursor-pointer")}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.profileImageUrl || undefined} />
            <AvatarFallback>
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{displayName}</p>
            {user.email && (
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            )}
            <Badge variant="secondary" className="text-xs mt-1">
              {user.isSystemAdmin ? "System Admin" : "User"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

