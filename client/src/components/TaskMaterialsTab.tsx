import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, X, Package, TrendingUp, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { TaskMaterial, MaterialConsumption, MaterialDelivery, Resource, InsertTaskMaterial, InsertMaterialConsumption, InsertMaterialDelivery } from "@shared/schema";

interface TaskMaterialsTabProps {
  taskId: number;
  projectId: number;
}

export function TaskMaterialsTab({ taskId, projectId }: TaskMaterialsTabProps) {
  const { toast } = useToast();
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<TaskMaterial | null>(null);
  const [selectedMaterialForConsumption, setSelectedMaterialForConsumption] = useState<number | null>(null);
  const [selectedMaterialForDelivery, setSelectedMaterialForDelivery] = useState<number | null>(null);

  // Fetch materials
  const { data: materials = [], refetch: refetchMaterials } = useQuery<TaskMaterial[]>({
    queryKey: [`/api/tasks/${taskId}/materials`],
    enabled: !!taskId,
  });

  // Fetch material resources (type='material')
  const { data: materialResources = [] } = useQuery<Resource[]>({
    queryKey: [`/api/projects/${projectId}/resources`],
    enabled: !!projectId,
    select: (resources) => resources.filter(r => r.type === "material"),
  });

  // Fetch consumptions for selected material
  const { data: consumptions = [] } = useQuery<MaterialConsumption[]>({
    queryKey: [`/api/task-materials/${selectedMaterialForConsumption}/consumptions`],
    enabled: !!selectedMaterialForConsumption,
  });

  // Fetch deliveries for selected material
  const { data: deliveries = [] } = useQuery<MaterialDelivery[]>({
    queryKey: [`/api/task-materials/${selectedMaterialForDelivery}/deliveries`],
    enabled: !!selectedMaterialForDelivery,
  });

  const createMaterialMutation = useMutation({
    mutationFn: async (data: InsertTaskMaterial) => {
      return await apiRequest<TaskMaterial>("POST", "/api/task-materials", data);
    },
    onSuccess: () => {
      refetchMaterials();
      setShowMaterialModal(false);
      toast({ title: "Material Added", description: "Material has been added to the task." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/task-materials/${id}`);
    },
    onSuccess: () => {
      refetchMaterials();
      toast({ title: "Material Removed", description: "Material has been removed from the task." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-4 bg-accent/5 border border-accent/20 rounded-lg">
        <Package className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Task Materials</p>
          <p className="text-xs text-muted-foreground">Track material requirements, consumption, and deliveries for this task.</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Materials ({materials.length})</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedMaterial(null);
            setShowMaterialModal(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Material
        </Button>
      </div>

      {materials.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No materials added yet</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedMaterial(null);
              setShowMaterialModal(true);
            }}
            className="mt-4 gap-2"
          >
            <Plus className="h-4 w-4" />
            Add First Material
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((material) => {
            const resource = materialResources.find(r => r.id === material.materialId);
            const plannedQty = parseFloat(material.quantity || "0");
            const cumulativeConsumption = parseFloat(material.actualQuantity || "0");
            const percentageUsed = plannedQty > 0 ? (cumulativeConsumption / plannedQty) * 100 : 0;
            const remaining = plannedQty - cumulativeConsumption;

            return (
              <Card key={material.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium">{resource?.name || `Material #${material.materialId}`}</h5>
                      <Badge variant="outline">{material.unit}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{resource?.notes || "No description"}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMaterialMutation.mutate(material.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Planned</Label>
                    <p className="text-sm font-medium">{plannedQty.toFixed(2)} {material.unit}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Consumed</Label>
                    <p className="text-sm font-medium">{cumulativeConsumption.toFixed(2)} {material.unit}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Remaining</Label>
                    <p className={cn(
                      "text-sm font-medium",
                      remaining < 0 && "text-destructive"
                    )}>
                      {remaining.toFixed(2)} {material.unit}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Progress</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all",
                            percentageUsed > 100 ? "bg-destructive" : percentageUsed > 80 ? "bg-amber-500" : "bg-primary"
                          )}
                          style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{percentageUsed.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                {percentageUsed > 100 && (
                  <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive mb-3">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Consumption exceeds planned quantity</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedMaterialForConsumption(material.id);
                      setShowConsumptionModal(true);
                    }}
                    className="flex-1 gap-2"
                  >
                    <TrendingUp className="h-3 w-3" />
                    Record Consumption
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedMaterialForDelivery(material.id);
                      setShowDeliveryModal(true);
                    }}
                    className="flex-1 gap-2"
                  >
                    <Package className="h-3 w-3" />
                    Record Delivery
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Material Modal */}
      {showMaterialModal && (
        <MaterialModal
          open={showMaterialModal}
          onOpenChange={setShowMaterialModal}
          taskId={taskId}
          material={selectedMaterial}
          materialResources={materialResources}
          onSuccess={() => {
            refetchMaterials();
            setShowMaterialModal(false);
          }}
        />
      )}

      {/* Consumption Modal */}
      {showConsumptionModal && selectedMaterialForConsumption && (
        <ConsumptionModal
          open={showConsumptionModal}
          onOpenChange={setShowConsumptionModal}
          taskMaterialId={selectedMaterialForConsumption}
          onSuccess={() => {
            refetchMaterials();
            queryClient.invalidateQueries({ queryKey: [`/api/task-materials/${selectedMaterialForConsumption}/consumptions`] });
            setShowConsumptionModal(false);
          }}
        />
      )}

      {/* Delivery Modal */}
      {showDeliveryModal && selectedMaterialForDelivery && (
        <DeliveryModal
          open={showDeliveryModal}
          onOpenChange={setShowDeliveryModal}
          taskMaterialId={selectedMaterialForDelivery}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: [`/api/task-materials/${selectedMaterialForDelivery}/deliveries`] });
            setShowDeliveryModal(false);
          }}
        />
      )}
    </div>
  );
}

// Material Modal Component
function MaterialModal({
  open,
  onOpenChange,
  taskId,
  material,
  materialResources,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: number;
  material: TaskMaterial | null;
  materialResources: Resource[];
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [selectedResourceId, setSelectedResourceId] = useState<string>(material?.materialId.toString() || "");
  const [plannedQuantity, setPlannedQuantity] = useState<string>(material?.quantity || "");
  const [unit, setUnit] = useState<string>(material?.unit || "");
  // const [notes, setNotes] = useState<string>(material?.notes || "");

  const createMutation = useMutation({
    mutationFn: async (data: InsertTaskMaterial) => {
      return await apiRequest<TaskMaterial>("POST", "/api/task-materials", data);
    },
    onSuccess: () => {
      toast({ title: "Material Added", description: "Material has been added successfully." });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!selectedResourceId) {
      toast({ title: "Resource Required", description: "Please select a material resource.", variant: "destructive" });
      return;
    }
    if (!plannedQuantity || parseFloat(plannedQuantity) <= 0) {
      toast({ title: "Quantity Required", description: "Please enter a valid planned quantity.", variant: "destructive" });
      return;
    }
    if (!unit) {
      toast({ title: "Unit Required", description: "Please enter a unit of measure.", variant: "destructive" });
      return;
    }

    // Find resource name for required field
    const resourceName = materialResources.find(r => r.id === parseInt(selectedResourceId))?.name || "Unknown Material";

    const data: InsertTaskMaterial = {
      taskId,
      materialId: parseInt(selectedResourceId),
      quantity: plannedQuantity,
      unit,
      name: resourceName, // Required by schema
      // notes: notes.trim() || undefined,
    };

    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{material ? "Edit Material" : "Add Material"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Material Resource</Label>
            <Select value={selectedResourceId} onValueChange={setSelectedResourceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select material resource" />
              </SelectTrigger>
              <SelectContent>
                {materialResources.map((resource) => (
                  <SelectItem key={resource.id} value={resource.id.toString()}>
                    {resource.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Planned Quantity</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={plannedQuantity}
                onChange={(e) => setPlannedQuantity(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="m, kg, ea"
              />
            </div>
          </div>

          {/* <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any notes about this material..."
            />
          </div> */}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Adding..." : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Consumption Modal Component
function ConsumptionModal({
  open,
  onOpenChange,
  taskMaterialId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskMaterialId: number;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [quantity, setQuantity] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const createMutation = useMutation({
    mutationFn: async (data: InsertMaterialConsumption) => {
      return await apiRequest<MaterialConsumption>("POST", "/api/material-consumptions", data);
    },
    onSuccess: () => {
      toast({ title: "Consumption Recorded", description: "Material consumption has been recorded." });
      onSuccess();
      setQuantity("");
      setNotes("");
      setDate(new Date());
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!date) {
      toast({ title: "Date Required", description: "Please select a date.", variant: "destructive" });
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      toast({ title: "Quantity Required", description: "Please enter a valid quantity.", variant: "destructive" });
      return;
    }

    const data: InsertMaterialConsumption = {
      taskMaterialId,
      quantity: quantity,
      consumedAt: date, // Pass Date object
      consumedBy: user?.id || "",
      notes: notes.trim() || undefined,
    };

    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Consumption</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Quantity Consumed</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any notes about this consumption..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Recording..." : "Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Delivery Modal Component
function DeliveryModal({
  open,
  onOpenChange,
  taskMaterialId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskMaterialId: number;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [quantity, setQuantity] = useState<string>("");
  const [supplier, setSupplier] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const createMutation = useMutation({
    mutationFn: async (data: InsertMaterialDelivery) => {
      return await apiRequest<MaterialDelivery>("POST", "/api/material-deliveries", data);
    },
    onSuccess: () => {
      toast({ title: "Delivery Recorded", description: "Material delivery has been recorded." });
      onSuccess();
      setQuantity("");
      setSupplier("");
      setNotes("");
      setDate(new Date());
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!date) {
      toast({ title: "Date Required", description: "Please select a date.", variant: "destructive" });
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      toast({ title: "Quantity Required", description: "Please enter a valid quantity.", variant: "destructive" });
      return;
    }

    const data: InsertMaterialDelivery = {
      taskMaterialId,
      quantity: quantity,
      deliveredAt: date, // Pass Date object
      supplier: supplier.trim() || undefined, // Corrected from deliveryReference
      notes: notes.trim() || undefined,
    };

    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Delivery</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Delivery Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity Delivered</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Supplier (Optional)</Label>
              <Input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Supplier name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any notes about this delivery..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Recording..." : "Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

