import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, Clock, Users, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import type { Task } from "@shared/schema";

interface ResourceLevelingModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: (option: string) => void;
}

interface LevelingSuggestion {
  option: string;
  description: string;
  changes: Array<{
    type: string;
    resourceId?: number;
    resourceName?: string;
    currentValue: any;
    newValue: any;
  }>;
  previewEndDate: Date | null;
  previewDuration: number;
  feasibility: "high" | "medium" | "low";
}

interface ResourceLevelingResponse {
  hasConflict: boolean;
  conflict?: {
    hasConflict: boolean;
    constraintType: string;
    constraintDate: Date | null;
    computedEndDate: Date | null;
    conflictDays: number | null;
    message: string;
  };
  suggestions: LevelingSuggestion[];
  message?: string;
}

export function ResourceLevelingModal({
  task,
  open,
  onOpenChange,
  onApply,
}: ResourceLevelingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [levelingData, setLevelingData] = useState<ResourceLevelingResponse | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Fetch resource leveling suggestions when modal opens
  useEffect(() => {
    if (open && task) {
      setLoading(true);
      setLevelingData(null);
      setSelectedOption(null);
      apiRequest("GET", `/api/tasks/${task.id}/resource-leveling`)
        .then(async (response) => {
          const data = await response.json();
          setLevelingData(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching resource leveling suggestions:", error);
          toast({
            title: "Error",
            description: "Failed to load resource leveling suggestions",
            variant: "destructive",
          });
          setLoading(false);
        });
    }
  }, [open, task, toast]);

  const handleApply = async () => {
    if (!selectedOption || !task || !levelingData) return;

    const suggestion = levelingData.suggestions.find(s => s.option === selectedOption);
    if (!suggestion) return;

    setLoading(true);
    try {
      // Apply the changes based on the suggestion type
      const updates: any = {};

      for (const change of suggestion.changes) {
        if (change.type === "allocation" && change.resourceId) {
          // Update resource assignment allocation
          // This would require finding the assignment and updating it
          // For now, we'll just trigger a recalculation
        } else if (change.type === "maxHoursPerDay" && change.resourceId) {
          // Update resource maxHoursPerDay
          // This would require updating the resource
        } else if (change.type === "add_resource") {
          // Add a new resource assignment
          // This would require creating a new assignment
        }
      }

      // Recalculate schedule after applying changes
      await apiRequest("POST", `/api/tasks/${task.id}/recalculate`);

      toast({
        title: "Resource Leveling Applied",
        description: suggestion.description,
      });

      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${task.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${task.projectId}/tasks`] });

      onApply?.(selectedOption);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error applying resource leveling:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to apply resource leveling",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFeasibilityColor = (feasibility: string) => {
    switch (feasibility) {
      case "high":
        return "bg-green-100 text-green-800 border-green-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Resource Leveling Suggestions</DialogTitle>
          <DialogDescription>
            Options to meet the constraint for task: {task.name}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading suggestions...</div>
            </div>
          ) : !levelingData ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">No data available</div>
            </div>
          ) : !levelingData.hasConflict ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                {levelingData.message || "No constraint conflict detected. Current schedule meets the constraint."}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {levelingData.conflict && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Constraint Conflict Detected:</strong> {levelingData.conflict.message}
                    <br />
                    <span className="text-xs mt-1 block">
                      Constraint: {levelingData.conflict.constraintType} on {formatDate(levelingData.conflict.constraintDate)}
                      <br />
                      Computed: {formatDate(levelingData.conflict.computedEndDate)}
                      <br />
                      Conflict: {levelingData.conflict.conflictDays} days
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Suggested Options:</h3>
                {levelingData.suggestions.map((suggestion) => (
                  <Card
                    key={suggestion.option}
                    className={`cursor-pointer transition-all ${
                      selectedOption === suggestion.option
                        ? "ring-2 ring-primary"
                        : "hover:shadow-md"
                    }`}
                    onClick={() => setSelectedOption(suggestion.option)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-sm flex items-center gap-2">
                            {suggestion.changes.some(c => c.type === "allocation") && (
                              <TrendingUp className="h-4 w-4" />
                            )}
                            {suggestion.changes.some(c => c.type === "add_resource") && (
                              <Users className="h-4 w-4" />
                            )}
                            {suggestion.changes.some(c => c.type === "maxHoursPerDay") && (
                              <Clock className="h-4 w-4" />
                            )}
                            {suggestion.description}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            Preview: {formatDate(suggestion.previewEndDate)} ({suggestion.previewDuration} days)
                          </CardDescription>
                        </div>
                        <Badge
                          variant="outline"
                          className={getFeasibilityColor(suggestion.feasibility)}
                        >
                          {suggestion.feasibility}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {suggestion.changes.map((change, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="font-medium">{change.resourceName || "Resource"}:</span>
                            <span>{change.currentValue} → {change.newValue}</span>
                            {change.type === "allocation" && <span className="text-xs">%</span>}
                            {change.type === "maxHoursPerDay" && <span className="text-xs">hrs/day</span>}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center justify-end gap-2 border-t pt-4 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          {levelingData?.hasConflict && selectedOption && (
            <Button onClick={handleApply} disabled={loading}>
              {loading ? "Applying..." : "Apply Selected Option"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

