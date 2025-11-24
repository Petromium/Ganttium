import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail, Phone, Edit, Trash2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useProject } from "@/contexts/ProjectContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Stakeholder } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function StakeholdersPage() {
  const { selectedProjectId } = useProject();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStakeholder, setEditingStakeholder] = useState<Stakeholder | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "other" as "consultant" | "sponsor" | "client" | "team-member" | "contractor" | "other",
    email: "",
    phone: "",
    organization: "",
  });

  // Fetch stakeholders
  const { 
    data: stakeholders = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery<Stakeholder[]>({
    queryKey: [`/api/projects/${selectedProjectId}/stakeholders`],
    enabled: !!selectedProjectId,
    retry: 1,
  });

  // Create stakeholder mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!selectedProjectId) throw new Error("No project selected");
      await apiRequest("POST", "/api/stakeholders", {
        ...data,
        projectId: selectedProjectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/stakeholders`] });
      setDialogOpen(false);
      setEditingStakeholder(null);
      setFormData({
        name: "",
        role: "other",
        email: "",
        phone: "",
        organization: "",
      });
      toast({
        title: "Success",
        description: "Stakeholder added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add stakeholder",
        variant: "destructive",
      });
    },
  });

  // Update stakeholder mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      await apiRequest("PATCH", `/api/stakeholders/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/stakeholders`] });
      setDialogOpen(false);
      setEditingStakeholder(null);
      setFormData({
        name: "",
        role: "other",
        email: "",
        phone: "",
        organization: "",
      });
      toast({
        title: "Success",
        description: "Stakeholder updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update stakeholder",
        variant: "destructive",
      });
    },
  });

  // Delete stakeholder mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/stakeholders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/stakeholders`] });
      toast({
        title: "Success",
        description: "Stakeholder deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete stakeholder",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStakeholder) {
      updateMutation.mutate({ id: editingStakeholder.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (stakeholder: Stakeholder) => {
    setEditingStakeholder(stakeholder);
    setFormData({
      name: stakeholder.name,
      role: stakeholder.role as any,
      email: stakeholder.email || "",
      phone: stakeholder.phone || "",
      organization: stakeholder.organization || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this stakeholder?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddNew = () => {
    setEditingStakeholder(null);
    setFormData({
      name: "",
      role: "other",
      email: "",
      phone: "",
      organization: "",
    });
    setDialogOpen(true);
  };

  if (!selectedProjectId) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">No Project Selected</h2>
          <p className="text-muted-foreground">Please select a project from the dropdown above</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Stakeholders</h1>
          <p className="text-muted-foreground">Project team and external contacts</p>
        </div>
        <Button onClick={handleAddNew} data-testid="button-add-stakeholder">
          Add Stakeholder
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load stakeholders. {(error as Error).message}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              data-testid="button-retry"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search stakeholders..."
          className="pl-9"
          data-testid="input-search-stakeholders"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading stakeholders...</p>
        </div>
      ) : stakeholders.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">No Stakeholders Found</h2>
          <p className="text-muted-foreground mb-4">Get started by adding stakeholders to your project</p>
          <Button onClick={handleAddNew} data-testid="button-add-first-stakeholder">
            Add Stakeholder
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {stakeholders.map((stakeholder) => (
            <Card
              key={stakeholder.id}
              className="hover-elevate cursor-pointer transition-shadow"
              data-testid={`card-stakeholder-${stakeholder.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="text-sm">
                      {stakeholder.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-semibold">{stakeholder.name}</h3>
                      <p className="text-sm text-muted-foreground">{stakeholder.role}</p>
                    </div>

                    {stakeholder.organization && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{stakeholder.organization}</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      {stakeholder.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <a href={`mailto:${stakeholder.email}`} className="hover:text-foreground">
                            {stakeholder.email}
                          </a>
                        </div>
                      )}
                      {stakeholder.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <a href={`tel:${stakeholder.phone}`} className="hover:text-foreground">
                            {stakeholder.phone}
                          </a>
                        </div>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" data-testid={`button-actions-${stakeholder.id}`}>
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(stakeholder)} data-testid={`action-edit-${stakeholder.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(stakeholder.id)} 
                          className="text-destructive"
                          data-testid={`action-delete-${stakeholder.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="dialog-stakeholder">
          <DialogHeader>
            <DialogTitle>{editingStakeholder ? "Edit Stakeholder" : "Add Stakeholder"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="input-stakeholder-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: any) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger data-testid="select-stakeholder-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sponsor">Sponsor</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="team-member">Team Member</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                  <SelectItem value="consultant">Consultant</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="input-stakeholder-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                data-testid="input-stakeholder-phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                data-testid="input-stakeholder-organization"
              />
            </div>


            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending || updateMutation.isPending 
                  ? "Saving..." 
                  : editingStakeholder 
                    ? "Update Stakeholder" 
                    : "Add Stakeholder"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
