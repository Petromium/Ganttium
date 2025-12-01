import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useProject } from "@/contexts/ProjectContext";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Search, Edit, Trash2, Copy, Settings, Loader2, 
  Calendar, DollarSign, Users, FolderKanban, AlertCircle,
  ChevronRight, X
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Project, ProjectStatus, KanbanColumn } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function ProjectsPage() {
  const { user } = useAuth();
  const { selectedProjectId, setSelectedProjectId } = useProject();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [projectToDuplicate, setProjectToDuplicate] = useState<Project | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [projectForSettings, setProjectForSettings] = useState<Project | null>(null);
  const [activeSettingsTab, setActiveSettingsTab] = useState("statuses");

  // Get user's organizations
  const { data: organizations = [] } = useQuery({
    queryKey: ["/api/organizations"],
    enabled: !!user,
  });

  const selectedOrgId = organizations[0]?.id; // For now, use first org

  // Fetch projects
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: [`/api/organizations/${selectedOrgId}/projects`],
    enabled: !!selectedOrgId,
  });

  // Filter projects
  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: { name: string; code: string; description?: string; organizationId: number }) => {
      const res = await apiRequest("POST", "/api/projects", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${selectedOrgId}/projects`] });
      setProjectModalOpen(false);
      toast({ title: "Success", description: "Project created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to create project", variant: "destructive" });
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; name?: string; code?: string; description?: string; status?: string }) => {
      const res = await apiRequest("PATCH", `/api/projects/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${selectedOrgId}/projects`] });
      setProjectModalOpen(false);
      setEditingProject(null);
      toast({ title: "Success", description: "Project updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to update project", variant: "destructive" });
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${selectedOrgId}/projects`] });
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      if (selectedProjectId === projectToDelete?.id) {
        setSelectedProjectId(null);
      }
      toast({ title: "Success", description: "Project deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to delete project", variant: "destructive" });
    },
  });

  // Duplicate project mutation
  const duplicateProjectMutation = useMutation({
    mutationFn: async ({ id, name, code }: { id: number; name: string; code: string }) => {
      const res = await apiRequest("POST", `/api/projects/${id}/duplicate`, { name, code });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${selectedOrgId}/projects`] });
      setDuplicateDialogOpen(false);
      setProjectToDuplicate(null);
      toast({ title: "Success", description: "Project duplicated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to duplicate project", variant: "destructive" });
    },
  });

  const handleCreateProject = () => {
    setEditingProject(null);
    setProjectModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectModalOpen(true);
  };

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleDuplicateProject = (project: Project) => {
    setProjectToDuplicate(project);
    setDuplicateDialogOpen(true);
  };

  const handleOpenSettings = (project: Project) => {
    setProjectForSettings(project);
    setSettingsModalOpen(true);
    setActiveSettingsTab("statuses");
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-500",
      "on-hold": "bg-amber-500",
      completed: "bg-gray-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-blue-500";
  };

  if (!selectedOrgId) {
    return (
      <div className="p-6">
        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
        <p className="text-center text-muted-foreground">Please select an organization</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage all projects in your organization</p>
        </div>
        <Button onClick={handleCreateProject}>
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Projects Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              {searchQuery ? "No projects found" : "No projects yet. Create your first project!"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell className="font-mono text-sm">{project.code}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {project.startDate ? new Date(project.startDate).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      {project.endDate ? new Date(project.endDate).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      {project.budget ? `$${Number(project.budget).toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditProject(project)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenSettings(project)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateProject(project)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteProject(project)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Project Modal */}
      <ProjectModal
        open={projectModalOpen}
        onOpenChange={setProjectModalOpen}
        project={editingProject}
        organizationId={selectedOrgId}
        onCreate={createProjectMutation.mutate}
        onUpdate={(data) => editingProject && updateProjectMutation.mutate({ id: editingProject.id, ...data })}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone and will delete all tasks, resources, and other project data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => projectToDelete && deleteProjectMutation.mutate(projectToDelete.id)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Project Dialog */}
      <DuplicateProjectDialog
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        project={projectToDuplicate}
        onDuplicate={(name, code) => projectToDuplicate && duplicateProjectMutation.mutate({ id: projectToDuplicate.id, name, code })}
      />

      {/* Project Settings Modal */}
      {projectForSettings && (
        <ProjectSettingsModal
          open={settingsModalOpen}
          onOpenChange={setSettingsModalOpen}
          project={projectForSettings}
        />
      )}
    </div>
  );
}

// Project Modal Component
function ProjectModal({
  open,
  onOpenChange,
  project,
  organizationId,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  organizationId: number;
  onCreate: (data: any) => void;
  onUpdate: (data: any) => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");

  useEffect(() => {
    if (project) {
      setName(project.name);
      setCode(project.code);
      setDescription(project.description || "");
      setStatus(project.status);
    } else {
      setName("");
      setCode("");
      setDescription("");
      setStatus("active");
    }
  }, [project]);

  const handleSubmit = () => {
    if (!name.trim() || !code.trim()) {
      return;
    }

    const data = { name, code, description: description || undefined, organizationId, status };
    if (project) {
      onUpdate(data);
    } else {
      onCreate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Create Project"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
            />
          </div>
          <div>
            <Label htmlFor="code">Code *</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="PRJ-001"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project description"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>{project ? "Update" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Duplicate Project Dialog
function DuplicateProjectDialog({
  open,
  onOpenChange,
  project,
  onDuplicate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onDuplicate: (name: string, code: string) => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    if (project) {
      setName(`${project.name} (Copy)`);
      setCode(`${project.code}-COPY`);
    } else {
      setName("");
      setCode("");
    }
  }, [project]);

  const handleDuplicate = () => {
    if (!name.trim() || !code.trim()) {
      return;
    }
    onDuplicate(name, code);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicate Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="dup-name">New Project Name *</Label>
            <Input
              id="dup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
            />
          </div>
          <div>
            <Label htmlFor="dup-code">New Project Code *</Label>
            <Input
              id="dup-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="PRJ-001"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleDuplicate}>Duplicate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Project Settings Modal Component
function ProjectSettingsModal({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("statuses");

  // Fetch project statuses
  const { data: projectStatuses = [], refetch: refetchStatuses } = useQuery<ProjectStatus[]>({
    queryKey: [`/api/projects/${project.id}/statuses`],
    enabled: open && project.id > 0,
  });

  // Fetch kanban columns
  const { data: kanbanColumns = [], refetch: refetchColumns } = useQuery<KanbanColumn[]>({
    queryKey: [`/api/projects/${project.id}/kanban-columns`],
    enabled: open && project.id > 0,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Project Settings: {project.name}</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList>
            <TabsTrigger value="statuses">Status Configuration</TabsTrigger>
            <TabsTrigger value="kanban">Kanban Columns</TabsTrigger>
          </TabsList>
          <TabsContent value="statuses" className="flex-1 overflow-y-auto">
            <StatusConfigurationTab 
              projectId={project.id} 
              statuses={projectStatuses}
              onUpdate={refetchStatuses}
            />
          </TabsContent>
          <TabsContent value="kanban" className="flex-1 overflow-y-auto">
            <KanbanColumnsTab 
              projectId={project.id}
              columns={kanbanColumns}
              statuses={projectStatuses}
              onUpdate={refetchColumns}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Status Configuration Tab
function StatusConfigurationTab({
  projectId,
  statuses,
  onUpdate,
}: {
  projectId: number;
  statuses: ProjectStatus[];
  onUpdate: () => void;
}) {
  const { toast } = useToast();
  const [editingStatus, setEditingStatus] = useState<ProjectStatus | null>(null);
  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusCode, setNewStatusCode] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("blue");

  const createStatusMutation = useMutation({
    mutationFn: async (data: { name: string; code: string; color?: string }) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/statuses`, {
        ...data,
        projectId,
        order: statuses.length,
        isActive: true,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/statuses`] });
      setNewStatusName("");
      setNewStatusCode("");
      setNewStatusColor("blue");
      onUpdate();
      toast({ title: "Success", description: "Status created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to create status", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; name?: string; code?: string; color?: string; isActive?: boolean }) => {
      const res = await apiRequest("PATCH", `/api/project-statuses/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/statuses`] });
      setEditingStatus(null);
      onUpdate();
      toast({ title: "Success", description: "Status updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to update status", variant: "destructive" });
    },
  });

  const deleteStatusMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/project-statuses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/statuses`] });
      onUpdate();
      toast({ title: "Success", description: "Status deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to delete status", variant: "destructive" });
    },
  });

  const handleCreateStatus = () => {
    if (!newStatusName.trim() || !newStatusCode.trim()) {
      toast({ title: "Error", description: "Name and code are required", variant: "destructive" });
      return;
    }
    createStatusMutation.mutate({
      name: newStatusName,
      code: newStatusCode.toLowerCase().replace(/\s+/g, "-"),
      color: newStatusColor,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Custom Statuses</h3>
          <p className="text-sm text-muted-foreground">Define custom statuses for this project</p>
        </div>
      </div>

      {/* Add New Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add New Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status-name">Name</Label>
              <Input
                id="status-name"
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                placeholder="e.g., Stuck, Internal Approval"
              />
            </div>
            <div>
              <Label htmlFor="status-code">Code</Label>
              <Input
                id="status-code"
                value={newStatusCode}
                onChange={(e) => setNewStatusCode(e.target.value)}
                placeholder="e.g., stuck, internal-approval"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="status-color">Color</Label>
            <Select value={newStatusColor} onValueChange={setNewStatusColor}>
              <SelectTrigger id="status-color">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="red">Red</SelectItem>
                <SelectItem value="amber">Amber</SelectItem>
                <SelectItem value="purple">Purple</SelectItem>
                <SelectItem value="gray">Gray</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreateStatus} disabled={createStatusMutation.isPending}>
            {createStatusMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Add Status
          </Button>
        </CardContent>
      </Card>

      {/* Existing Statuses */}
      <div className="space-y-2">
        <h4 className="font-semibold">Existing Statuses</h4>
        {statuses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No custom statuses defined</p>
        ) : (
          <div className="space-y-2">
            {statuses.map((status) => (
              <StatusRow
                key={status.id}
                status={status}
                onEdit={setEditingStatus}
                onUpdate={(data) => updateStatusMutation.mutate({ id: status.id, ...data })}
                onDelete={() => deleteStatusMutation.mutate(status.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Status Dialog */}
      {editingStatus && (
        <EditStatusDialog
          status={editingStatus}
          open={!!editingStatus}
          onOpenChange={(open) => !open && setEditingStatus(null)}
          onUpdate={(data) => updateStatusMutation.mutate({ id: editingStatus.id, ...data })}
        />
      )}
    </div>
  );
}

// Status Row Component
function StatusRow({
  status,
  onEdit,
  onUpdate,
  onDelete,
}: {
  status: ProjectStatus;
  onEdit: (status: ProjectStatus) => void;
  onUpdate: (data: any) => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full bg-${status.color || "blue"}-500`} />
            <div>
              <div className="font-medium">{status.name}</div>
              <div className="text-sm text-muted-foreground font-mono">{status.code}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={status.isActive}
              onCheckedChange={(checked) => onUpdate({ isActive: checked === true })}
            />
            <Button variant="ghost" size="sm" onClick={() => onEdit(status)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Edit Status Dialog
function EditStatusDialog({
  status,
  open,
  onOpenChange,
  onUpdate,
}: {
  status: ProjectStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (data: any) => void;
}) {
  const [name, setName] = useState(status.name);
  const [code, setCode] = useState(status.code);
  const [color, setColor] = useState(status.color || "blue");

  useEffect(() => {
    setName(status.name);
    setCode(status.code);
    setColor(status.color || "blue");
  }, [status]);

  const handleUpdate = () => {
    onUpdate({ name, code, color });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-status-name">Name</Label>
            <Input
              id="edit-status-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="edit-status-code">Code</Label>
            <Input
              id="edit-status-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="edit-status-color">Color</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger id="edit-status-color">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="red">Red</SelectItem>
                <SelectItem value="amber">Amber</SelectItem>
                <SelectItem value="purple">Purple</SelectItem>
                <SelectItem value="gray">Gray</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleUpdate}>Update</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Kanban Columns Tab
function KanbanColumnsTab({
  projectId,
  columns,
  statuses,
  onUpdate,
}: {
  projectId: number;
  columns: KanbanColumn[];
  statuses: ProjectStatus[];
  onUpdate: () => void;
}) {
  const { toast } = useToast();
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState<"system" | "custom">("system");
  const [newColumnStatusId, setNewColumnStatusId] = useState<string>("not-started");
  const [newColumnCustomStatusId, setNewColumnCustomStatusId] = useState<number | null>(null);

  const SYSTEM_STATUSES = [
    { id: "not-started", name: "Not Started" },
    { id: "in-progress", name: "In Progress" },
    { id: "review", name: "In Review" },
    { id: "completed", name: "Completed" },
    { id: "on-hold", name: "On Hold" },
  ];

  const createColumnMutation = useMutation({
    mutationFn: async (data: { name: string; statusId?: string; customStatusId?: number }) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/kanban-columns`, {
        ...data,
        projectId,
        order: columns.length,
        isActive: true,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/kanban-columns`] });
      setNewColumnName("");
      setNewColumnType("system");
      setNewColumnStatusId("not-started");
      setNewColumnCustomStatusId(null);
      onUpdate();
      toast({ title: "Success", description: "Column created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to create column", variant: "destructive" });
    },
  });

  const updateColumnMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; name?: string; statusId?: string; customStatusId?: number; isActive?: boolean }) => {
      const res = await apiRequest("PATCH", `/api/kanban-columns/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/kanban-columns`] });
      setEditingColumn(null);
      onUpdate();
      toast({ title: "Success", description: "Column updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to update column", variant: "destructive" });
    },
  });

  const deleteColumnMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/kanban-columns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/kanban-columns`] });
      onUpdate();
      toast({ title: "Success", description: "Column deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to delete column", variant: "destructive" });
    },
  });

  const handleCreateColumn = () => {
    if (!newColumnName.trim()) {
      toast({ title: "Error", description: "Column name is required", variant: "destructive" });
      return;
    }

    if (newColumnType === "system" && !newColumnStatusId) {
      toast({ title: "Error", description: "Please select a system status", variant: "destructive" });
      return;
    }

    if (newColumnType === "custom" && !newColumnCustomStatusId) {
      toast({ title: "Error", description: "Please select a custom status", variant: "destructive" });
      return;
    }

    createColumnMutation.mutate({
      name: newColumnName,
      statusId: newColumnType === "system" ? newColumnStatusId : undefined,
      customStatusId: newColumnType === "custom" ? newColumnCustomStatusId || undefined : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Kanban Columns</h3>
          <p className="text-sm text-muted-foreground">Configure Kanban board columns for this project</p>
        </div>
      </div>

      {/* Add New Column */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add New Column</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="column-name">Column Name</Label>
            <Input
              id="column-name"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder="e.g., Stuck, Internal Approval"
            />
          </div>
          <div>
            <Label htmlFor="column-type">Map To</Label>
            <Select value={newColumnType} onValueChange={(val: "system" | "custom") => setNewColumnType(val)}>
              <SelectTrigger id="column-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System Status</SelectItem>
                <SelectItem value="custom">Custom Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {newColumnType === "system" ? (
            <div>
              <Label htmlFor="column-status">System Status</Label>
              <Select value={newColumnStatusId} onValueChange={setNewColumnStatusId}>
                <SelectTrigger id="column-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SYSTEM_STATUSES.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <Label htmlFor="column-custom-status">Custom Status</Label>
              {statuses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No custom statuses available. Create one in the Status Configuration tab.</p>
              ) : (
                <Select 
                  value={newColumnCustomStatusId?.toString() || ""} 
                  onValueChange={(val) => setNewColumnCustomStatusId(parseInt(val))}
                >
                  <SelectTrigger id="column-custom-status">
                    <SelectValue placeholder="Select custom status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id.toString()}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
          <Button onClick={handleCreateColumn} disabled={createColumnMutation.isPending}>
            {createColumnMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Add Column
          </Button>
        </CardContent>
      </Card>

      {/* Existing Columns */}
      <div className="space-y-2">
        <h4 className="font-semibold">Existing Columns</h4>
        {columns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No custom columns defined. Default columns will be used.</p>
        ) : (
          <div className="space-y-2">
            {columns.map((column) => (
              <ColumnRow
                key={column.id}
                column={column}
                statuses={statuses}
                systemStatuses={SYSTEM_STATUSES}
                onEdit={setEditingColumn}
                onUpdate={(data) => updateColumnMutation.mutate({ id: column.id, ...data })}
                onDelete={() => deleteColumnMutation.mutate(column.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Column Dialog */}
      {editingColumn && (
        <EditColumnDialog
          column={editingColumn}
          statuses={statuses}
          systemStatuses={SYSTEM_STATUSES}
          open={!!editingColumn}
          onOpenChange={(open) => !open && setEditingColumn(null)}
          onUpdate={(data) => updateColumnMutation.mutate({ id: editingColumn.id, ...data })}
        />
      )}
    </div>
  );
}

// Column Row Component
function ColumnRow({
  column,
  statuses,
  systemStatuses,
  onEdit,
  onUpdate,
  onDelete,
}: {
  column: KanbanColumn;
  statuses: ProjectStatus[];
  systemStatuses: Array<{ id: string; name: string }>;
  onEdit: (column: KanbanColumn) => void;
  onUpdate: (data: any) => void;
  onDelete: () => void;
}) {
  const mappedStatus = column.statusId 
    ? systemStatuses.find(s => s.id === column.statusId)?.name
    : statuses.find(s => s.id === column.customStatusId)?.name || "Unknown";

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">{column.name}</div>
            <div className="text-sm text-muted-foreground">Maps to: {mappedStatus}</div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={column.isActive}
              onCheckedChange={(checked) => onUpdate({ isActive: checked === true })}
            />
            <Button variant="ghost" size="sm" onClick={() => onEdit(column)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Edit Column Dialog
function EditColumnDialog({
  column,
  statuses,
  systemStatuses,
  open,
  onOpenChange,
  onUpdate,
}: {
  column: KanbanColumn;
  statuses: ProjectStatus[];
  systemStatuses: Array<{ id: string; name: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (data: any) => void;
}) {
  const [name, setName] = useState(column.name);
  const [type, setType] = useState<"system" | "custom">(column.statusId ? "system" : "custom");
  const [statusId, setStatusId] = useState(column.statusId || "not-started");
  const [customStatusId, setCustomStatusId] = useState<number | null>(column.customStatusId || null);

  useEffect(() => {
    setName(column.name);
    setType(column.statusId ? "system" : "custom");
    setStatusId(column.statusId || "not-started");
    setCustomStatusId(column.customStatusId || null);
  }, [column]);

  const handleUpdate = () => {
    onUpdate({
      name,
      statusId: type === "system" ? statusId : undefined,
      customStatusId: type === "custom" ? customStatusId || undefined : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Column</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-column-name">Column Name</Label>
            <Input
              id="edit-column-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="edit-column-type">Map To</Label>
            <Select value={type} onValueChange={(val: "system" | "custom") => setType(val)}>
              <SelectTrigger id="edit-column-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System Status</SelectItem>
                <SelectItem value="custom">Custom Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {type === "system" ? (
            <div>
              <Label htmlFor="edit-column-status">System Status</Label>
              <Select value={statusId} onValueChange={setStatusId}>
                <SelectTrigger id="edit-column-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {systemStatuses.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <Label htmlFor="edit-column-custom-status">Custom Status</Label>
              {statuses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No custom statuses available.</p>
              ) : (
                <Select 
                  value={customStatusId?.toString() || ""} 
                  onValueChange={(val) => setCustomStatusId(parseInt(val))}
                >
                  <SelectTrigger id="edit-column-custom-status">
                    <SelectValue placeholder="Select custom status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id.toString()}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleUpdate}>Update</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

