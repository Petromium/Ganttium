import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useProject } from "@/contexts/ProjectContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, AlertTriangle, AlertCircle, User, Calendar, FileText, 
  ArrowRight, ArrowLeft, Clock, Activity, Plus, X, Link2, GitBranch
} from "lucide-react";
import type { Task, Risk, Issue, ResourceAssignment, Resource, Document, TaskDependency } from "@shared/schema";

type TaskStatus = "not-started" | "in-progress" | "review" | "completed" | "on-hold";
type TaskPriority = "low" | "medium" | "high" | "critical";
type DependencyType = "FS" | "SS" | "FF" | "SF";

const DISCIPLINES = [
  { value: "civil", label: "Civil" },
  { value: "structural", label: "Structural" },
  { value: "mechanical", label: "Mechanical" },
  { value: "piping", label: "Piping" },
  { value: "electrical", label: "Electrical" },
  { value: "instrumentation", label: "Instrumentation" },
  { value: "process", label: "Process" },
  { value: "hvac", label: "HVAC" },
  { value: "architectural", label: "Architectural" },
  { value: "general", label: "General" },
];

const CONSTRAINT_TYPES = [
  { value: "asap", label: "As Soon As Possible" },
  { value: "alap", label: "As Late As Possible" },
  { value: "mso", label: "Must Start On" },
  { value: "mfo", label: "Must Finish On" },
  { value: "snet", label: "Start No Earlier Than" },
  { value: "snlt", label: "Start No Later Than" },
  { value: "fnet", label: "Finish No Earlier Than" },
  { value: "fnlt", label: "Finish No Later Than" },
];

const DEPENDENCY_TYPES = [
  { value: "FS", label: "Finish-to-Start (FS)" },
  { value: "SS", label: "Start-to-Start (SS)" },
  { value: "FF", label: "Finish-to-Finish (FF)" },
  { value: "SF", label: "Start-to-Finish (SF)" },
];

interface TaskFormData {
  name: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string;
  endDate: string;
  progress: number;
  discipline: string;
  areaCode: string;
  weightFactor: number;
  constraintType: string;
  baselineStart: string;
  baselineFinish: string;
  responsibleContractor: string;
}

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  defaultStatus?: TaskStatus;
  onClose?: () => void;
  onSave?: (data: any) => void;
}

export function TaskModal({ 
  open, 
  onOpenChange, 
  task, 
  defaultStatus = "not-started",
  onClose,
  onSave 
}: TaskModalProps) {
  const { selectedProjectId } = useProject();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  const [selectedDependencyType, setSelectedDependencyType] = useState<DependencyType>("FS");
  const [selectedPredecessor, setSelectedPredecessor] = useState<string>("");
  const [lagDays, setLagDays] = useState<number>(0);
  
  const getDefaultFormData = (): TaskFormData => ({
    name: "",
    description: "",
    status: defaultStatus,
    priority: "medium",
    startDate: "",
    endDate: "",
    progress: 0,
    discipline: "",
    areaCode: "",
    weightFactor: 1.0,
    constraintType: "asap",
    baselineStart: "",
    baselineFinish: "",
    responsibleContractor: "",
  });

  const [formData, setFormData] = useState<TaskFormData>(getDefaultFormData());
  
  const { data: allTasks = [] } = useQuery<Task[]>({
    queryKey: [`/api/projects/${selectedProjectId}/tasks`],
    enabled: !!selectedProjectId && open,
  });

  const { data: risks = [] } = useQuery<Risk[]>({
    queryKey: [`/api/projects/${selectedProjectId}/risks`],
    enabled: !!selectedProjectId && !!task && open,
  });

  const { data: issues = [] } = useQuery<Issue[]>({
    queryKey: [`/api/projects/${selectedProjectId}/issues`],
    enabled: !!selectedProjectId && !!task && open,
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: [`/api/projects/${selectedProjectId}/resources`],
    enabled: !!selectedProjectId && open,
  });

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: [`/api/projects/${selectedProjectId}/documents`],
    enabled: !!selectedProjectId && open,
  });

  const { data: assignments = [] } = useQuery<ResourceAssignment[]>({
    queryKey: [`/api/tasks/${task?.id}/assignments`],
    enabled: !!task?.id && open,
  });

  const { data: dependencies = [] } = useQuery<TaskDependency[]>({
    queryKey: [`/api/projects/${selectedProjectId}/dependencies`],
    enabled: !!selectedProjectId && open,
  });

  const { data: taskDocuments = [] } = useQuery<any[]>({
    queryKey: [`/api/tasks/${task?.id}/documents`],
    enabled: !!task?.id && open,
  });

  const { data: taskRisks = [] } = useQuery<any[]>({
    queryKey: [`/api/tasks/${task?.id}/risks`],
    enabled: !!task?.id && open,
  });

  const { data: taskIssues = [] } = useQuery<any[]>({
    queryKey: [`/api/tasks/${task?.id}/issues`],
    enabled: !!task?.id && open,
  });

  const { data: inheritedResources = [] } = useQuery<any[]>({
    queryKey: [`/api/tasks/${task?.id}/inherited/resources`],
    enabled: !!task?.id && open,
  });

  const { data: inheritedDocuments = [] } = useQuery<any[]>({
    queryKey: [`/api/tasks/${task?.id}/inherited/documents`],
    enabled: !!task?.id && open,
  });

  const { data: inheritedRisks = [] } = useQuery<any[]>({
    queryKey: [`/api/tasks/${task?.id}/inherited/risks`],
    enabled: !!task?.id && open,
  });

  const { data: inheritedIssues = [] } = useQuery<any[]>({
    queryKey: [`/api/tasks/${task?.id}/inherited/issues`],
    enabled: !!task?.id && open,
  });
  
  useEffect(() => {
    if (open) {
      if (task) {
        setFormData({
          name: task.name || "",
          description: task.description || "",
          status: (task.status as TaskStatus) || "not-started",
          priority: (task.priority as TaskPriority) || "medium",
          startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : "",
          endDate: task.endDate ? new Date(task.endDate).toISOString().split('T')[0] : "",
          progress: task.progress || 0,
          discipline: (task as any).discipline || "",
          areaCode: (task as any).areaCode || "",
          weightFactor: (task as any).weightFactor || 1.0,
          constraintType: (task as any).constraintType || "asap",
          baselineStart: (task as any).baselineStart ? new Date((task as any).baselineStart).toISOString().split('T')[0] : "",
          baselineFinish: (task as any).baselineFinish ? new Date((task as any).baselineFinish).toISOString().split('T')[0] : "",
          responsibleContractor: (task as any).responsibleContractor || "",
        });
      } else {
        setFormData({
          ...getDefaultFormData(),
          status: defaultStatus,
        });
      }
      setActiveTab("details");
      setSelectedPredecessor("");
      setLagDays(0);
    }
  }, [open, task, defaultStatus]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/tasks`, {
        ...data,
        projectId: selectedProjectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/tasks`] });
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create task",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/tasks/${task?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/tasks`] });
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    },
  });

  const addDependencyMutation = useMutation({
    mutationFn: async (data: { predecessorId: number; successorId: number; type: DependencyType; lagDays: number }) => {
      return await apiRequest("POST", `/api/dependencies`, {
        ...data,
        projectId: selectedProjectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/dependencies`] });
      toast({ title: "Success", description: "Dependency added" });
      setSelectedPredecessor("");
      setLagDays(0);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removeDependencyMutation = useMutation({
    mutationFn: async (dependencyId: number) => {
      return await apiRequest("DELETE", `/api/dependencies/${dependencyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/dependencies`] });
      toast({ title: "Success", description: "Dependency removed" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addResourceMutation = useMutation({
    mutationFn: async (data: { resourceId: number; allocation: number }) => {
      return await apiRequest("POST", `/api/assignments`, {
        taskId: task?.id,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${task?.id}/assignments`] });
      toast({ title: "Success", description: "Resource assigned" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removeResourceMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      return await apiRequest("DELETE", `/api/assignments/${assignmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${task?.id}/assignments`] });
      toast({ title: "Success", description: "Resource removed" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addDocumentMutation = useMutation({
    mutationFn: async (data: { documentId: number; relationship?: string }) => {
      return await apiRequest("POST", `/api/tasks/${task?.id}/documents`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${task?.id}/documents`] });
      toast({ title: "Success", description: "Document linked" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removeDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      return await apiRequest("DELETE", `/api/tasks/${task?.id}/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${task?.id}/documents`] });
      toast({ title: "Success", description: "Document unlinked" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addRiskMutation = useMutation({
    mutationFn: async (riskId: number) => {
      return await apiRequest("POST", `/api/tasks/${task?.id}/risks`, { riskId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${task?.id}/risks`] });
      toast({ title: "Success", description: "Risk linked" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removeRiskMutation = useMutation({
    mutationFn: async (riskId: number) => {
      return await apiRequest("DELETE", `/api/tasks/${task?.id}/risks/${riskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${task?.id}/risks`] });
      toast({ title: "Success", description: "Risk unlinked" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addIssueMutation = useMutation({
    mutationFn: async (issueId: number) => {
      return await apiRequest("POST", `/api/tasks/${task?.id}/issues`, { issueId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${task?.id}/issues`] });
      toast({ title: "Success", description: "Issue linked" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removeIssueMutation = useMutation({
    mutationFn: async (issueId: number) => {
      return await apiRequest("DELETE", `/api/tasks/${task?.id}/issues/${issueId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${task?.id}/issues`] });
      toast({ title: "Success", description: "Issue unlinked" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleClose = () => {
    setFormData(getDefaultFormData());
    if (onClose) {
      onClose();
    } else {
      onOpenChange(false);
    }
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Task name is required",
        variant: "destructive",
      });
      return;
    }

    const taskData = {
      name: formData.name,
      description: formData.description || undefined,
      status: formData.status,
      priority: formData.priority,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      progress: formData.progress,
      discipline: formData.discipline || undefined,
      areaCode: formData.areaCode || undefined,
      weightFactor: formData.weightFactor || undefined,
      constraintType: formData.constraintType || undefined,
      baselineStart: formData.baselineStart ? new Date(formData.baselineStart).toISOString() : undefined,
      baselineFinish: formData.baselineFinish ? new Date(formData.baselineFinish).toISOString() : undefined,
      responsibleContractor: formData.responsibleContractor || undefined,
    };

    if (onSave) {
      onSave(taskData);
      handleClose();
    } else if (task) {
      updateMutation.mutate(taskData);
    } else {
      createMutation.mutate(taskData);
    }
  };

  const predecessors = dependencies.filter((dep) => dep.successorId === task?.id);
  const successors = dependencies.filter((dep) => dep.predecessorId === task?.id);
  const availableTasks = allTasks.filter(t => t.id !== task?.id);
  const linkedDocIds = taskDocuments.map((td: any) => td.documentId);
  const linkedRiskIds = taskRisks.map((tr: any) => tr.riskId);
  const linkedIssueIds = taskIssues.map((ti: any) => ti.issueId);
  const assignedResourceIds = assignments.map(a => a.resourceId);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "not-started": "secondary",
      "in-progress": "default",
      "review": "outline",
      "completed": "default",
      "on-hold": "destructive",
      "identified": "secondary",
      "analyzing": "outline",
      "mitigating": "default",
      "closed": "default",
      "accepted": "secondary",
      "open": "destructive",
      "in_progress": "default",
      "resolved": "default",
    };
    return variants[status] || "secondary";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "text-green-600",
      medium: "text-amber-600",
      high: "text-orange-600",
      critical: "text-red-600",
    };
    return colors[priority] || "text-muted-foreground";
  };

  const getTaskName = (taskId: number) => {
    const t = allTasks.find(task => task.id === taskId);
    return t ? `${t.wbsCode || '#' + t.id} - ${t.name}` : `Task #${taskId}`;
  };

  const handleAddPredecessor = () => {
    if (!selectedPredecessor || !task) return;
    addDependencyMutation.mutate({
      predecessorId: parseInt(selectedPredecessor),
      successorId: task.id,
      type: selectedDependencyType,
      lagDays,
    });
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isEditing = !!task;

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) handleClose();
      else onOpenChange(open);
    }}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col" data-testid="modal-task">
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Badge variant="outline" className="font-mono">
                    {task.wbsCode || `#${task.id}`}
                  </Badge>
                  <span>{task.name}</span>
                </>
              ) : (
                "Create New Task"
              )}
            </DialogTitle>
            {isEditing && (
              <div className="flex items-center gap-2">
                <Badge variant={getStatusBadge(formData.status)}>
                  {formData.status.replace("-", " ")}
                </Badge>
                <Badge variant="outline" className={getPriorityColor(formData.priority)}>
                  {formData.priority}
                </Badge>
              </div>
            )}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-6 shrink-0">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="dependencies" disabled={!isEditing}>
              Dependencies {isEditing && (predecessors.length + successors.length > 0) && `(${predecessors.length + successors.length})`}
            </TabsTrigger>
            <TabsTrigger value="resources" disabled={!isEditing}>
              Resources {isEditing && assignments.length > 0 && `(${assignments.length})`}
            </TabsTrigger>
            <TabsTrigger value="documents" disabled={!isEditing}>
              Documents {isEditing && taskDocuments.length > 0 && `(${taskDocuments.length})`}
            </TabsTrigger>
            <TabsTrigger value="risks" disabled={!isEditing}>
              Risks {isEditing && taskRisks.length > 0 && `(${taskRisks.length})`}
            </TabsTrigger>
            <TabsTrigger value="issues" disabled={!isEditing}>
              Issues {isEditing && taskIssues.length > 0 && `(${taskIssues.length})`}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <div className="pr-4 pb-4">
              <TabsContent value="details" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground">Basic Information</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="task-name">Task Name *</Label>
                      <Input
                        id="task-name"
                        placeholder="Enter task name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        data-testid="input-task-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="task-description">Description</Label>
                      <Textarea
                        id="task-description"
                        placeholder="Enter task description"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        data-testid="textarea-task-description"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="task-status">Status</Label>
                        <Select 
                          value={formData.status} 
                          onValueChange={(value: TaskStatus) => setFormData({ ...formData, status: value })}
                        >
                          <SelectTrigger id="task-status" data-testid="select-task-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not-started">Not Started</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="review">In Review</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="on-hold">On Hold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="task-priority">Priority</Label>
                        <Select 
                          value={formData.priority} 
                          onValueChange={(value: TaskPriority) => setFormData({ ...formData, priority: value })}
                        >
                          <SelectTrigger id="task-priority" data-testid="select-task-priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="task-progress">Progress: {formData.progress}%</Label>
                      <Input
                        id="task-progress"
                        type="range"
                        min="0"
                        max="100"
                        value={formData.progress}
                        onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                        className="cursor-pointer"
                        data-testid="slider-task-progress"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-date">Start Date</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          data-testid="input-start-date"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="end-date">End Date</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          data-testid="input-end-date"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground">EPC Details</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="discipline">Discipline</Label>
                        <Select 
                          value={formData.discipline} 
                          onValueChange={(value) => setFormData({ ...formData, discipline: value })}
                        >
                          <SelectTrigger id="discipline" data-testid="select-discipline">
                            <SelectValue placeholder="Select discipline" />
                          </SelectTrigger>
                          <SelectContent>
                            {DISCIPLINES.map((disc) => (
                              <SelectItem key={disc.value} value={disc.value}>{disc.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="area-code">Area Code</Label>
                        <Input
                          id="area-code"
                          placeholder="e.g., A-100"
                          value={formData.areaCode}
                          onChange={(e) => setFormData({ ...formData, areaCode: e.target.value })}
                          data-testid="input-area-code"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contractor">Responsible Contractor</Label>
                      <Input
                        id="contractor"
                        placeholder="Enter contractor name"
                        value={formData.responsibleContractor}
                        onChange={(e) => setFormData({ ...formData, responsibleContractor: e.target.value })}
                        data-testid="input-contractor"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="constraint-type">Constraint Type</Label>
                        <Select 
                          value={formData.constraintType} 
                          onValueChange={(value) => setFormData({ ...formData, constraintType: value })}
                        >
                          <SelectTrigger id="constraint-type" data-testid="select-constraint">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CONSTRAINT_TYPES.map((ct) => (
                              <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="weight-factor">Weight Factor</Label>
                        <Input
                          id="weight-factor"
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={formData.weightFactor}
                          onChange={(e) => setFormData({ ...formData, weightFactor: parseFloat(e.target.value) || 0 })}
                          data-testid="input-weight-factor"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="baseline-start">Baseline Start</Label>
                        <Input
                          id="baseline-start"
                          type="date"
                          value={formData.baselineStart}
                          onChange={(e) => setFormData({ ...formData, baselineStart: e.target.value })}
                          data-testid="input-baseline-start"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="baseline-finish">Baseline Finish</Label>
                        <Input
                          id="baseline-finish"
                          type="date"
                          value={formData.baselineFinish}
                          onChange={(e) => setFormData({ ...formData, baselineFinish: e.target.value })}
                          data-testid="input-baseline-finish"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="dependencies" className="space-y-4 mt-0">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                    <GitBranch className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Task Dependencies</p>
                      <p className="text-xs text-muted-foreground">Define predecessor and successor relationships for this task</p>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Predecessors ({predecessors.length})
                    </h4>
                    
                    <div className="flex gap-2 items-end flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <Label className="text-xs">Select Predecessor</Label>
                        <Select value={selectedPredecessor} onValueChange={setSelectedPredecessor}>
                          <SelectTrigger data-testid="select-predecessor">
                            <SelectValue placeholder="Choose a task..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTasks
                              .filter(t => !predecessors.some(p => p.predecessorId === t.id))
                              .map((t) => (
                                <SelectItem key={t.id} value={t.id.toString()}>
                                  {t.wbsCode || `#${t.id}`} - {t.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-[140px]">
                        <Label className="text-xs">Type</Label>
                        <Select value={selectedDependencyType} onValueChange={(v: DependencyType) => setSelectedDependencyType(v)}>
                          <SelectTrigger data-testid="select-dependency-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DEPENDENCY_TYPES.map((dt) => (
                              <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-[80px]">
                        <Label className="text-xs">Lag (days)</Label>
                        <Input
                          type="number"
                          value={lagDays}
                          onChange={(e) => setLagDays(parseInt(e.target.value) || 0)}
                          data-testid="input-lag-days"
                        />
                      </div>
                      <Button 
                        size="sm" 
                        onClick={handleAddPredecessor}
                        disabled={!selectedPredecessor || addDependencyMutation.isPending}
                        data-testid="button-add-predecessor"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>

                    {predecessors.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No predecessors defined</p>
                    ) : (
                      <div className="space-y-2">
                        {predecessors.map((dep) => (
                          <div key={dep.id} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="font-mono text-xs">{dep.type}</Badge>
                              <span className="text-sm">{getTaskName(dep.predecessorId)}</span>
                              {dep.lagDays !== 0 && (
                                <span className="text-xs text-muted-foreground">
                                  ({dep.lagDays > 0 ? "+" : ""}{dep.lagDays} days)
                                </span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDependencyMutation.mutate(dep.id)}
                              disabled={removeDependencyMutation.isPending}
                              data-testid={`button-remove-predecessor-${dep.id}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      Successors ({successors.length})
                    </h4>
                    
                    {successors.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No successors defined</p>
                    ) : (
                      <div className="space-y-2">
                        {successors.map((dep) => (
                          <div key={dep.id} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="font-mono text-xs">{dep.type}</Badge>
                              <span className="text-sm">{getTaskName(dep.successorId)}</span>
                              {dep.lagDays !== 0 && (
                                <span className="text-xs text-muted-foreground">
                                  ({dep.lagDays > 0 ? "+" : ""}{dep.lagDays} days)
                                </span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDependencyMutation.mutate(dep.id)}
                              disabled={removeDependencyMutation.isPending}
                              data-testid={`button-remove-successor-${dep.id}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="resources" className="space-y-4 mt-0">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Resource Assignments</p>
                      <p className="text-xs text-muted-foreground">Assign resources to this task. Inherited resources from parent tasks are shown below.</p>
                    </div>
                  </div>

                  {assignments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Directly Assigned Resources</h4>
                      {assignments.map((assignment) => {
                        const resource = resources.find(r => r.id === assignment.resourceId);
                        return (
                          <div key={assignment.id} className="flex items-center justify-between p-3 border rounded">
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
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeResourceMutation.mutate(assignment.id)}
                                disabled={removeResourceMutation.isPending}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {inheritedResources.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Link2 className="h-4 w-4" />
                        Inherited from Parent Tasks
                      </h4>
                      {inheritedResources.map((ir: any) => (
                        <div key={`inherited-${ir.assignmentId}`} className="flex items-center justify-between p-3 border border-dashed rounded bg-muted/20">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{ir.resource?.name || `Resource #${ir.resourceId}`}</p>
                              <p className="text-xs text-muted-foreground">{ir.resource?.type} • {ir.resource?.discipline}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            From: {ir.sourceTask?.wbsCode || `#${ir.sourceTaskId}`}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Available Resources</h4>
                    {resources.filter(r => !assignedResourceIds.includes(r.id)).length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">All resources are already assigned</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {resources.filter(r => !assignedResourceIds.includes(r.id)).map((resource) => (
                          <Card key={resource.id} className="hover-elevate cursor-pointer" onClick={() => addResourceMutation.mutate({ resourceId: resource.id, allocation: 100 })}>
                            <CardContent className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">{resource.name}</p>
                                  <p className="text-xs text-muted-foreground">{resource.type} • {resource.discipline}</p>
                                </div>
                              </div>
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4 mt-0">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Linked Documents</p>
                      <p className="text-xs text-muted-foreground">Attach documents to this task. Inherited documents from parent tasks are shown below.</p>
                    </div>
                  </div>

                  {taskDocuments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Directly Attached Documents</h4>
                      {taskDocuments.map((td: any) => {
                        const doc = documents.find(d => d.id === td.documentId);
                        return (
                          <div key={td.id} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{doc?.title || `Document #${td.documentId}`}</p>
                                <p className="text-xs text-muted-foreground">{doc?.documentNumber} • {doc?.documentType}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocumentMutation.mutate(td.documentId)}
                              disabled={removeDocumentMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {inheritedDocuments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Link2 className="h-4 w-4" />
                        Inherited from Parent Tasks
                      </h4>
                      {inheritedDocuments.map((id: any) => (
                        <div key={`inherited-doc-${id.taskDocumentId}`} className="flex items-center justify-between p-3 border border-dashed rounded bg-muted/20">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{id.document?.title || `Document #${id.documentId}`}</p>
                              <p className="text-xs text-muted-foreground">{id.document?.documentNumber} • {id.document?.documentType}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            From: {id.sourceTask?.wbsCode || `#${id.sourceTaskId}`}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Available Documents</h4>
                    {documents.filter(d => !linkedDocIds.includes(d.id)).length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No documents available to link</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto">
                        {documents.filter(d => !linkedDocIds.includes(d.id)).map((doc) => (
                          <Card key={doc.id} className="hover-elevate cursor-pointer" onClick={() => addDocumentMutation.mutate({ documentId: doc.id })}>
                            <CardContent className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">{doc.title}</p>
                                  <p className="text-xs text-muted-foreground">{doc.documentNumber} • Rev {doc.revision}</p>
                                </div>
                              </div>
                              <Link2 className="h-4 w-4 text-muted-foreground" />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="risks" className="space-y-4 mt-0">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">Linked Risks</p>
                      <p className="text-xs text-muted-foreground">Associate risks with this task. Inherited risks from parent tasks are shown below.</p>
                    </div>
                  </div>

                  {taskRisks.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Directly Associated Risks</h4>
                      {taskRisks.map((tr: any) => {
                        const risk = risks.find(r => r.id === tr.riskId);
                        return (
                          <div key={tr.id} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center gap-3">
                              <AlertTriangle className="h-5 w-5 text-amber-500" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="font-mono text-xs">{risk?.code}</Badge>
                                  <p className="text-sm font-medium">{risk?.title}</p>
                                </div>
                                <p className="text-xs text-muted-foreground">Impact: {risk?.impact} • Status: {risk?.status}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRiskMutation.mutate(tr.riskId)}
                              disabled={removeRiskMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {inheritedRisks.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Link2 className="h-4 w-4" />
                        Inherited from Parent Tasks
                      </h4>
                      {inheritedRisks.map((ir: any) => (
                        <div key={`inherited-risk-${ir.taskRiskId}`} className="flex items-center justify-between p-3 border border-dashed rounded bg-muted/20">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-400" />
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono text-xs">{ir.risk?.code}</Badge>
                                <p className="text-sm font-medium">{ir.risk?.title}</p>
                              </div>
                              <p className="text-xs text-muted-foreground">Impact: {ir.risk?.impact} • Status: {ir.risk?.status}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            From: {ir.sourceTask?.wbsCode || `#${ir.sourceTaskId}`}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Available Risks</h4>
                    {risks.filter(r => !linkedRiskIds.includes(r.id)).length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No risks available to link</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto">
                        {risks.filter(r => !linkedRiskIds.includes(r.id)).map((risk) => (
                          <Card key={risk.id} className="hover-elevate cursor-pointer" onClick={() => addRiskMutation.mutate(risk.id)}>
                            <CardContent className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-mono text-xs">{risk.code}</Badge>
                                    <p className="text-sm font-medium">{risk.title}</p>
                                  </div>
                                  <p className="text-xs text-muted-foreground">Impact: {risk.impact}</p>
                                </div>
                              </div>
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="issues" className="space-y-4 mt-0">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">Linked Issues</p>
                      <p className="text-xs text-muted-foreground">Associate issues with this task. Inherited issues from parent tasks are shown below.</p>
                    </div>
                  </div>

                  {taskIssues.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Directly Associated Issues</h4>
                      {taskIssues.map((ti: any) => {
                        const issue = issues.find(i => i.id === ti.issueId);
                        return (
                          <div key={ti.id} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center gap-3">
                              <AlertCircle className="h-5 w-5 text-red-500" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="font-mono text-xs">{issue?.code}</Badge>
                                  <p className="text-sm font-medium">{issue?.title}</p>
                                </div>
                                <p className="text-xs text-muted-foreground">Priority: {issue?.priority} • Status: {issue?.status}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeIssueMutation.mutate(ti.issueId)}
                              disabled={removeIssueMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {inheritedIssues.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Link2 className="h-4 w-4" />
                        Inherited from Parent Tasks
                      </h4>
                      {inheritedIssues.map((ii: any) => (
                        <div key={`inherited-issue-${ii.taskIssueId}`} className="flex items-center justify-between p-3 border border-dashed rounded bg-muted/20">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono text-xs">{ii.issue?.code}</Badge>
                                <p className="text-sm font-medium">{ii.issue?.title}</p>
                              </div>
                              <p className="text-xs text-muted-foreground">Priority: {ii.issue?.priority} • Status: {ii.issue?.status}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            From: {ii.sourceTask?.wbsCode || `#${ii.sourceTaskId}`}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Available Issues</h4>
                    {issues.filter(i => !linkedIssueIds.includes(i.id)).length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No issues available to link</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto">
                        {issues.filter(i => !linkedIssueIds.includes(i.id)).map((issue) => (
                          <Card key={issue.id} className="hover-elevate cursor-pointer" onClick={() => addIssueMutation.mutate(issue.id)}>
                            <CardContent className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-mono text-xs">{issue.code}</Badge>
                                    <p className="text-sm font-medium">{issue.title}</p>
                                  </div>
                                  <p className="text-xs text-muted-foreground">Priority: {issue.priority}</p>
                                </div>
                              </div>
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="gap-2 shrink-0 border-t pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isLoading} data-testid="button-cancel">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading} data-testid="button-save-task">
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? "Update Task" : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
