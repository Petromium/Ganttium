import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProject } from "@/contexts/ProjectContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, AlertTriangle, Loader2, User, Wrench, Package, 
  DollarSign, Percent, MoreHorizontal, Pencil, Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Resource } from "@shared/schema";

const RESOURCE_TYPES = [
  { value: "human", label: "Human Resource", icon: User },
  { value: "equipment", label: "Equipment", icon: Wrench },
  { value: "material", label: "Material", icon: Package },
];

const DISCIPLINES = [
  { value: "general", label: "General" },
  { value: "civil", label: "Civil" },
  { value: "structural", label: "Structural" },
  { value: "mechanical", label: "Mechanical" },
  { value: "piping", label: "Piping" },
  { value: "electrical", label: "Electrical" },
  { value: "instrumentation", label: "Instrumentation" },
  { value: "process", label: "Process" },
  { value: "hse", label: "HSE" },
];

const RATE_TYPES = [
  { value: "per-hour", label: "Per Hour (USD/hr)" },
  { value: "per-use", label: "Per Use (USD/use)" },
  { value: "per-unit", label: "Per Unit (USD/unit)" },
];

const UNIT_TYPES = [
  { value: "ea", label: "Each (EA)" },
  { value: "lot", label: "Lot" },
  { value: "hr", label: "Hour (hr)" },
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "m", label: "Meter (m)" },
  { value: "ft", label: "Feet (ft)" },
  { value: "yd", label: "Yard (yd)" },
  { value: "km", label: "Kilometer (km)" },
  { value: "mi", label: "Mile (mi)" },
  { value: "m2", label: "Square Meter (m²)" },
  { value: "ft2", label: "Square Feet (ft²)" },
  { value: "m3", label: "Cubic Meter (m³)" },
  { value: "ft3", label: "Cubic Feet (ft³)" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "lb", label: "Pound (lb)" },
  { value: "ton", label: "Ton" },
  { value: "mt", label: "Metric Ton (MT)" },
  { value: "l", label: "Liter (L)" },
  { value: "gal", label: "Gallon (gal)" },
  { value: "scm", label: "Standard Cubic Meter (SCM)" },
  { value: "scf", label: "Standard Cubic Feet (SCF)" },
];

interface ResourceFormData {
  name: string;
  type: string;
  discipline: string;
  availability: number;
  costPerHour: string;
  currency: string;
  rateType: string;
  rate: string;
  unitType: string;
}

export default function ResourcesPage() {
  const { selectedProjectId } = useProject();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [formData, setFormData] = useState<ResourceFormData>({
    name: "",
    type: "human",
    discipline: "general",
    availability: 100,
    costPerHour: "",
    currency: "USD",
    rateType: "per-hour",
    rate: "",
    unitType: "hr",
  });

  const { data: resources = [], isLoading } = useQuery<Resource[]>({
    queryKey: [`/api/projects/${selectedProjectId}/resources`],
    enabled: !!selectedProjectId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/resources`, {
        ...data,
        projectId: selectedProjectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/resources`] });
      toast({
        title: "Success",
        description: "Resource created successfully",
      });
      handleCloseModal();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create resource",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest("PATCH", `/api/resources/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/resources`] });
      toast({
        title: "Success",
        description: "Resource updated successfully",
      });
      handleCloseModal();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update resource",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/resources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/resources`] });
      toast({
        title: "Success",
        description: "Resource deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete resource",
        variant: "destructive",
      });
    },
  });

  const handleOpenModal = (resource?: Resource) => {
    if (resource) {
      setEditingResource(resource);
      setFormData({
        name: resource.name,
        type: resource.type,
        discipline: resource.discipline || "general",
        availability: resource.availability,
        costPerHour: resource.costPerHour || "",
        currency: resource.currency,
        rateType: resource.rateType || "per-hour",
        rate: resource.rate || "",
        unitType: resource.unitType || "hr",
      });
    } else {
      setEditingResource(null);
      setFormData({
        name: "",
        type: "human",
        discipline: "general",
        availability: 100,
        costPerHour: "",
        currency: "USD",
        rateType: "per-hour",
        rate: "",
        unitType: "hr",
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingResource(null);
    setFormData({
      name: "",
      type: "human",
      discipline: "general",
      availability: 100,
      costPerHour: "",
      currency: "USD",
      rateType: "per-hour",
      rate: "",
      unitType: "hr",
    });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Resource name is required",
        variant: "destructive",
      });
      return;
    }

    const data = {
      name: formData.name,
      type: formData.type,
      discipline: formData.discipline,
      availability: formData.availability,
      costPerHour: formData.costPerHour || null,
      currency: formData.currency,
      rateType: formData.rateType,
      rate: formData.rate || null,
      unitType: formData.unitType,
    };

    if (editingResource) {
      updateMutation.mutate({ id: editingResource.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (resource: Resource) => {
    if (confirm(`Are you sure you want to delete "${resource.name}"?`)) {
      deleteMutation.mutate(resource.id);
    }
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = RESOURCE_TYPES.find(t => t.value === type);
    if (!typeConfig) return User;
    return typeConfig.icon;
  };

  const getTypeLabel = (type: string) => {
    const typeConfig = RESOURCE_TYPES.find(t => t.value === type);
    return typeConfig?.label || type;
  };

  const getDisciplineLabel = (discipline: string | null | undefined) => {
    if (!discipline) return "General";
    const disciplineConfig = DISCIPLINES.find(d => d.value === discipline);
    return disciplineConfig?.label || discipline;
  };

  const resourcesByType = RESOURCE_TYPES.map(type => ({
    ...type,
    resources: resources.filter(r => r.type === type.value),
  }));

  const totalResources = resources.length;
  const avgAvailability = resources.length > 0 
    ? Math.round(resources.reduce((sum, r) => sum + r.availability, 0) / resources.length)
    : 0;

  if (!selectedProjectId) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please select a project from the dropdown above to view resources.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isLoading2 = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="page-title-resources">Resources</h1>
          <p className="text-muted-foreground">Manage project resources and assignments</p>
        </div>
        <Button onClick={() => handleOpenModal()} data-testid="button-add-resource">
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalResources}</p>
                <p className="text-sm text-muted-foreground">Total Resources</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {resources.filter(r => r.type === "human").length}
                </p>
                <p className="text-sm text-muted-foreground">Human Resources</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Wrench className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {resources.filter(r => r.type === "equipment").length}
                </p>
                <p className="text-sm text-muted-foreground">Equipment</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Percent className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgAvailability}%</p>
                <p className="text-sm text-muted-foreground">Avg Availability</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {resources.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Resources Yet</h2>
            <p className="text-muted-foreground mb-4">
              Add resources like team members, equipment, or materials to manage your project.
            </p>
            <Button onClick={() => handleOpenModal()} data-testid="button-add-first-resource">
              <Plus className="h-4 w-4 mr-2" />
              Add First Resource
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {resourcesByType.filter(g => g.resources.length > 0).map((group) => {
            const Icon = group.icon;
            return (
              <Card key={group.value}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {group.label} ({group.resources.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {group.resources.map((resource) => {
                      const TypeIcon = getTypeIcon(resource.type);
                      return (
                        <div 
                          key={resource.id}
                          className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                          data-testid={`resource-row-${resource.id}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <TypeIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{resource.name}</p>
                                <Badge variant="secondary" className="text-xs">
                                  {getDisciplineLabel(resource.discipline)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{getTypeLabel(resource.type)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <div className="flex items-center gap-2">
                                <Progress value={resource.availability} className="w-20 h-2" />
                                <span className="text-sm font-mono">{resource.availability}%</span>
                              </div>
                              <p className="text-xs text-muted-foreground">Availability</p>
                            </div>

                            {(resource.rate || resource.costPerHour) && (
                              <div className="text-right">
                                <p className="font-mono text-sm flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {parseFloat(resource.rate || resource.costPerHour || "0").toFixed(2)}
                                  {resource.rateType === "per-hour" && "/hr"}
                                  {resource.rateType === "per-use" && "/use"}
                                  {resource.rateType === "per-unit" && `/${resource.unitType || "unit"}`}
                                  {!resource.rateType && "/hr"}
                                </p>
                                <p className="text-xs text-muted-foreground">{resource.currency}</p>
                              </div>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" data-testid={`button-resource-actions-${resource.id}`}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenModal(resource)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDelete(resource)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md" data-testid="modal-resource">
          <DialogHeader>
            <DialogTitle>{editingResource ? "Edit Resource" : "Add Resource"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resource-name">Name *</Label>
              <Input
                id="resource-name"
                placeholder="Enter resource name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-resource-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resource-type">Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="resource-type" data-testid="select-resource-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resource-discipline">Discipline</Label>
                <Select 
                  value={formData.discipline} 
                  onValueChange={(value) => setFormData({ ...formData, discipline: value })}
                >
                  <SelectTrigger id="resource-discipline" data-testid="select-resource-discipline">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCIPLINES.map((disc) => (
                      <SelectItem key={disc.value} value={disc.value}>
                        {disc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="availability">Availability ({formData.availability}%)</Label>
              <Input
                id="availability"
                type="range"
                min={0}
                max={100}
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: parseInt(e.target.value) })}
                data-testid="input-availability"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate-type">Pricing Model</Label>
              <Select 
                value={formData.rateType} 
                onValueChange={(value) => setFormData({ ...formData, rateType: value })}
              >
                <SelectTrigger id="rate-type" data-testid="select-rate-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RATE_TYPES.map((rt) => (
                    <SelectItem key={rt.value} value={rt.value}>
                      {rt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rate">Rate</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  data-testid="input-rate"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger id="currency" data-testid="select-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="AED">AED</SelectItem>
                    <SelectItem value="SAR">SAR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.rateType === "per-unit" && (
                <div className="space-y-2">
                  <Label htmlFor="unit-type">Unit</Label>
                  <Select 
                    value={formData.unitType} 
                    onValueChange={(value) => setFormData({ ...formData, unitType: value })}
                  >
                    <SelectTrigger id="unit-type" data-testid="select-unit-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_TYPES.map((ut) => (
                        <SelectItem key={ut.value} value={ut.value}>
                          {ut.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseModal} disabled={isLoading2} data-testid="button-cancel">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading2} data-testid="button-save-resource">
              {isLoading2 && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingResource ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
