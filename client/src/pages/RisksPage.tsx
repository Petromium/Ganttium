import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TableRowCard } from "@/components/TableRowCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Edit, Trash2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useProject } from "@/contexts/ProjectContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Textarea } from "@/components/ui/textarea";
import type { Risk } from "@shared/schema";

export default function RisksPage() {
  const { selectedProjectId } = useProject();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [selectedRisks, setSelectedRisks] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    probability: 3, // 1-5 scale
    impact: "medium" as "low" | "medium" | "high" | "critical",
    status: "identified" as "identified" | "assessed" | "mitigating" | "closed",
    mitigationPlan: "",
    owner: "",
  });

  const { 
    data: risks = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery<Risk[]>({
    queryKey: [`/api/projects/${selectedProjectId}/risks`],
    enabled: !!selectedProjectId,
    retry: 1,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!selectedProjectId) throw new Error("No project selected");
      await apiRequest("POST", "/api/risks", {
        ...data,
        projectId: selectedProjectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/risks`] });
      setDialogOpen(false);
      setEditingRisk(null);
      resetForm();
      toast({ title: "Success", description: "Risk added successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      await apiRequest("PATCH", `/api/risks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/risks`] });
      setDialogOpen(false);
      setEditingRisk(null);
      resetForm();
      toast({ title: "Success", description: "Risk updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/risks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/risks`] });
      toast({ title: "Success", description: "Risk deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      probability: 3,
      impact: "medium",
      status: "identified",
      mitigationPlan: "",
      owner: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRisk) {
      updateMutation.mutate({ id: editingRisk.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (risk: Risk) => {
    setEditingRisk(risk);
    setFormData({
      title: risk.title,
      description: risk.description || "",
      probability: risk.probability,
      impact: risk.impact as any,
      status: risk.status as any,
      mitigationPlan: risk.mitigationPlan || "",
      owner: risk.owner || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this risk?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddNew = () => {
    setEditingRisk(null);
    resetForm();
    setDialogOpen(true);
  };

  const getRiskLevel = (probability: number, impact: string) => {
    // Probability is 1-5, Impact is low/medium/high/critical
    if ((probability >= 4 && (impact === "high" || impact === "critical")) || (probability === 5)) {
      return { level: "Critical", variant: "destructive" as const };
    }
    if ((probability >= 3 && (impact === "high" || impact === "critical")) || (probability >= 4 && impact === "medium")) {
      return { level: "High", variant: "default" as const };
    }
    if ((probability >= 2 && impact === "medium") || (probability >= 3 && impact === "low")) {
      return { level: "Medium", variant: "secondary" as const };
    }
    return { level: "Low", variant: "outline" as const };
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
          <h1 className="text-3xl font-semibold">Risk Management</h1>
          <p className="text-muted-foreground">Track and mitigate project risks</p>
        </div>
        <Button onClick={handleAddNew} data-testid="button-add-risk">Add Risk</Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load risks. {(error as Error).message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-retry">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search risks..."
          className="pl-9"
          data-testid="input-search-risks"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading risks...</p>
        </div>
      ) : risks.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">No Risks Found</h2>
          <p className="text-muted-foreground mb-4">Get started by adding risks to your project</p>
          <Button onClick={handleAddNew} data-testid="button-add-first-risk">Add Risk</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {risks.map((risk) => {
            const riskLevel = getRiskLevel(risk.probability, risk.impact);
            return (
              <TableRowCard
                key={risk.id}
                id={risk.id.toString()}
                selected={selectedRisks.includes(risk.id)}
                onSelect={(selected) => {
                  setSelectedRisks(prev =>
                    selected ? [...prev, risk.id] : prev.filter(id => id !== risk.id)
                  );
                }}
                data-testid={`row-risk-${risk.id}`}
              >
                <div className="grid grid-cols-[3fr,1fr,1fr,1fr,100px] gap-4 items-center flex-1">
                  <div>
                    <div className="font-medium">{risk.title}</div>
                    {risk.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1">{risk.description}</div>
                    )}
                  </div>
                  <Badge variant={riskLevel.variant}>{riskLevel.level}</Badge>
                  <div className="text-sm capitalize">{risk.probability}/5 / {risk.impact}</div>
                  <Badge variant={risk.status === "identified" || risk.status === "assessed" ? "default" : "secondary"} className="capitalize">
                    {risk.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" data-testid={`button-actions-${risk.id}`}>
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(risk)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(risk.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableRowCard>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="dialog-risk">
          <DialogHeader>
            <DialogTitle>{editingRisk ? "Edit Risk" : "Add Risk"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                data-testid="input-risk-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="input-risk-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="probability">Probability (1-5)</Label>
                <Select
                  value={formData.probability.toString()}
                  onValueChange={(value) => setFormData({ ...formData, probability: parseInt(value) })}
                >
                  <SelectTrigger data-testid="select-risk-probability">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Very Low</SelectItem>
                    <SelectItem value="2">2 - Low</SelectItem>
                    <SelectItem value="3">3 - Medium</SelectItem>
                    <SelectItem value="4">4 - High</SelectItem>
                    <SelectItem value="5">5 - Very High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="impact">Impact</Label>
                <Select
                  value={formData.impact}
                  onValueChange={(value: any) => setFormData({ ...formData, impact: value })}
                >
                  <SelectTrigger data-testid="select-risk-impact">
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
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger data-testid="select-risk-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="identified">Identified</SelectItem>
                  <SelectItem value="assessed">Assessed</SelectItem>
                  <SelectItem value="mitigating">Mitigating</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mitigationPlan">Mitigation Plan</Label>
              <Textarea
                id="mitigationPlan"
                value={formData.mitigationPlan}
                onChange={(e) => setFormData({ ...formData, mitigationPlan: e.target.value })}
                data-testid="input-risk-mitigationPlan"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner">Owner</Label>
              <Input
                id="owner"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                data-testid="input-risk-owner"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingRisk
                    ? "Update Risk"
                    : "Add Risk"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
