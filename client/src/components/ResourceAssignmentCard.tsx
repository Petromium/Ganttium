import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User, Clock, X } from "lucide-react";
import type { ResourceAssignment, Resource, ResourceTimeEntry } from "@shared/schema";

interface ResourceAssignmentCardProps {
  assignment: ResourceAssignment;
  resource: Resource | undefined;
  onRemove: (assignmentId: number) => void;
  onAddTimeEntry: (assignmentId: number) => void;
  isEditing: boolean;
}

export function ResourceAssignmentCard({
  assignment,
  resource,
  onRemove,
  onAddTimeEntry,
  isEditing,
}: ResourceAssignmentCardProps) {
  const { data: timeEntries = [] } = useQuery<ResourceTimeEntry[]>({
    queryKey: [`/api/assignments/${assignment.id}/time-entries`],
    enabled: !!assignment.id && isEditing,
  });

  const totalActualHours = timeEntries.reduce((sum, e) => sum + parseFloat(e.hoursWorked || "0"), 0);
  const plannedHours = parseFloat(assignment.effortHours || "0");

  return (
    <Card className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{resource?.name || `Resource #${assignment.resourceId}`}</p>
            <p className="text-xs text-muted-foreground">{resource?.type} • {resource?.discipline}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{assignment.allocation}%</Badge>
          {isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(assignment.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Planned:</span>{" "}
          <span className="font-medium">{plannedHours.toFixed(1)}h</span>
        </div>
        <div>
          <span className="text-muted-foreground">Actual:</span>{" "}
          <span className="font-medium">{totalActualHours.toFixed(1)}h</span>
        </div>
      </div>
      {isEditing && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddTimeEntry(assignment.id)}
            className="flex-1 gap-2"
          >
            <Clock className="h-3 w-3" />
            Add Time Entry
          </Button>
          {timeEntries.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {timeEntries.length} entries
            </Badge>
          )}
        </div>
      )}
    </Card>
  );
}

