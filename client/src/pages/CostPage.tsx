import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useProject } from "@/contexts/ProjectContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/MetricCard";
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Plus, Pencil, Trash2, FolderKanban } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CostItem, Task } from "@shared/schema";

const COST_CATEGORIES = ['labor', 'materials', 'equipment', 'subcontractor', 'overhead', 'other'] as const;

interface CostFormData {
  category: string;
  description: string;
  budgeted: string;
  actual: string;
  currency: string;
  taskId?: number;
}

function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatShortCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function parseNumeric(value: string): number {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

interface CategoryBreakdown {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  itemCount: number;
}

function aggregateCostsByCategory(costItems: CostItem[]): CategoryBreakdown[] {
  const categoryMap = new Map<string, { budgeted: number; actual: number; count: number }>();
  
  costItems.forEach(item => {
    const cat = item.category || 'other';
    const existing = categoryMap.get(cat) || { budgeted: 0, actual: 0, count: 0 };
    existing.budgeted += parseNumeric(item.budgeted);
    existing.actual += parseNumeric(item.actual);
    existing.count += 1;
    categoryMap.set(cat, existing);
  });
  
  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      budgeted: data.budgeted,
      actual: data.actual,
      variance: data.actual - data.budgeted,
      itemCount: data.count
    }))
    .sort((a, b) => b.budgeted - a.budgeted);
}

interface EarnedValueMetrics {
  pv: number;
  ev: number;
  ac: number;
  cpi: number;
  spi: number;
  cv: number;
  sv: number;
}

function calculateEarnedValue(
  costItems: CostItem[],
  tasks: Task[]
): EarnedValueMetrics {
  const totalBudget = costItems.reduce((sum, c) => sum + parseNumeric(c.budgeted), 0);
  const actualCost = costItems.reduce((sum, c) => sum + parseNumeric(c.actual), 0);
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const avgProgress = totalTasks > 0 
    ? tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / totalTasks / 100
    : 0;
  
  const plannedProgress = totalTasks > 0 
    ? tasks.filter(t => {
        if (!t.endDate) return false;
        return new Date(t.endDate) <= new Date();
      }).length / totalTasks
    : 0.5;
  
  const pv = totalBudget * Math.max(plannedProgress, 0.1);
  const ev = totalBudget * avgProgress;
  const ac = actualCost;
  
  const cpi = ac > 0 ? ev / ac : (ev > 0 ? 1 : 0);
  const spi = pv > 0 ? ev / pv : (ev > 0 ? 1 : 0);
  const cv = ev - ac;
  const sv = ev - pv;
  
  return { pv, ev, ac, cpi, spi, cv, sv };
}

export default function CostPage() {
  const { selectedProject } = useProject();
  const { toast } = useToast();
  const projectId = selectedProject?.id;
  const projectCurrency = selectedProject?.currency || 'USD';

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CostItem | null>(null);
  const [formData, setFormData] = useState<CostFormData>({
    category: 'labor',
    description: '',
    budgeted: '',
    actual: '0',
    currency: projectCurrency,
    taskId: undefined,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data: costItems = [], isLoading } = useQuery<CostItem[]>({
    queryKey: ['/api/projects', projectId, 'costs'],
    enabled: !!projectId,
    retry: 1,
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/costs`, { credentials: 'include' });
      if (res.status === 401) return [];
      if (!res.ok) throw new Error('Failed to fetch costs');
      return res.json();
    }
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/projects', projectId, 'tasks'],
    enabled: !!projectId,
    retry: 1,
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/tasks`, { credentials: 'include' });
      if (res.status === 401) return [];
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    }
  });

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    const budgetedNum = parseFloat(formData.budgeted);
    if (isNaN(budgetedNum) || budgetedNum < 0) {
      errors.budgeted = 'Please enter a valid positive number';
    }
    
    const actualNum = parseFloat(formData.actual);
    if (formData.actual && (isNaN(actualNum) || actualNum < 0)) {
      errors.actual = 'Please enter a valid positive number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: async (data: CostFormData) => {
      const budgetedNum = parseFloat(data.budgeted) || 0;
      const actualNum = parseFloat(data.actual) || 0;
      
      const response = await apiRequest('POST', `/api/costs`, {
        projectId,
        category: data.category,
        description: data.description.trim(),
        budgeted: budgetedNum.toString(),
        actual: actualNum.toString(),
        currency: data.currency,
        taskId: data.taskId || null,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Cost item created successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'costs'] });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create cost item', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CostFormData }) => {
      const budgetedNum = parseFloat(data.budgeted) || 0;
      const actualNum = parseFloat(data.actual) || 0;
      
      const response = await apiRequest('PATCH', `/api/costs/${id}`, {
        category: data.category,
        description: data.description.trim(),
        budgeted: budgetedNum.toString(),
        actual: actualNum.toString(),
        currency: data.currency,
        taskId: data.taskId || null,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Cost item updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'costs'] });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update cost item', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/costs/${id}`);
    },
    onSuccess: () => {
      toast({ title: 'Cost item deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'costs'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete cost item', description: error.message, variant: 'destructive' });
    },
  });

  const handleOpenDialog = (item?: CostItem) => {
    setFormErrors({});
    if (item) {
      setEditingItem(item);
      setFormData({
        category: item.category,
        description: item.description,
        budgeted: item.budgeted,
        actual: item.actual,
        currency: item.currency,
        taskId: item.taskId || undefined,
      });
    } else {
      setEditingItem(null);
      setFormData({
        category: 'labor',
        description: '',
        budgeted: '',
        actual: '0',
        currency: projectCurrency,
        taskId: undefined,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormErrors({});
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (!selectedProject) {
    return (
      <div className="p-6">
        <Alert>
          <FolderKanban className="h-4 w-4" />
          <AlertDescription>
            Please select a project to view cost management.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const totalBudget = costItems.reduce((sum, c) => sum + parseNumeric(c.budgeted), 0);
  const totalActual = costItems.reduce((sum, c) => sum + parseNumeric(c.actual), 0);
  const variance = totalActual - totalBudget;
  const variancePercent = totalBudget > 0 ? Math.round((variance / totalBudget) * 100) : 0;

  const categoryBreakdown = aggregateCostsByCategory(costItems);
  const earnedValue = calculateEarnedValue(costItems, tasks);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-cost-title">Cost Management</h1>
          <p className="text-muted-foreground">Budget tracking and cost analytics</p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-add-cost">
          <Plus className="h-4 w-4 mr-2" />
          Add Cost Item
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Total Budget"
            value={formatShortCurrency(totalBudget)}
            icon={DollarSign}
            data-testid="metric-total-budget"
          />
          <MetricCard
            title="Actual Cost"
            value={formatShortCurrency(totalActual)}
            change={variancePercent < 0 ? Math.abs(variancePercent) : undefined}
            icon={TrendingDown}
            data-testid="metric-actual-cost"
          />
          <MetricCard
            title="Budget Remaining"
            value={formatShortCurrency(Math.max(0, totalBudget - totalActual))}
            change={variancePercent > 0 ? -variancePercent : undefined}
            icon={TrendingUp}
            data-testid="metric-remaining"
          />
          <MetricCard
            title="Variance"
            value={`${variance >= 0 ? '+' : ''}${formatShortCurrency(variance)}`}
            change={variancePercent}
            icon={AlertTriangle}
            data-testid="metric-variance"
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown by Category</CardTitle>
          <CardDescription>Budgeted vs actual costs per category</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : categoryBreakdown.length > 0 ? (
            categoryBreakdown.map((cat) => {
              const budgetUsed = cat.budgeted > 0 ? (cat.actual / cat.budgeted) * 100 : 0;
              const catVariancePercent = cat.budgeted > 0 ? (cat.variance / cat.budgeted) * 100 : 0;

              return (
                <div key={cat.category} className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <h3 className="font-semibold capitalize">{cat.category}</h3>
                      <p className="text-sm text-muted-foreground">
                        Budget: {formatCurrency(cat.budgeted, projectCurrency)} ({cat.itemCount} items)
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(cat.actual, projectCurrency)}
                      </div>
                      <Badge
                        variant={cat.variance > 0 ? "destructive" : "default"}
                        className="mt-1"
                      >
                        {cat.variance > 0 ? "+" : ""}
                        {catVariancePercent.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Budget Utilization</span>
                      <span className="font-medium">{budgetUsed.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(budgetUsed, 100)} 
                      className={`h-2 ${budgetUsed > 100 ? 'bg-destructive/20' : ''}`}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No cost items added yet. Click "Add Cost Item" to get started.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Earned Value Analysis</CardTitle>
            <CardDescription>Project performance metrics based on schedule and cost</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Planned Value (PV)</span>
                  <span className="font-semibold font-mono">{formatCurrency(earnedValue.pv, projectCurrency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Earned Value (EV)</span>
                  <span className="font-semibold font-mono">{formatCurrency(earnedValue.ev, projectCurrency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Actual Cost (AC)</span>
                  <span className="font-semibold font-mono">{formatCurrency(earnedValue.ac, projectCurrency)}</span>
                </div>
                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cost Performance Index (CPI)</span>
                    <Badge variant={earnedValue.cpi >= 1 ? "default" : "destructive"}>
                      {earnedValue.cpi.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Schedule Performance Index (SPI)</span>
                    <Badge variant={earnedValue.spi >= 1 ? "default" : "secondary"}>
                      {earnedValue.spi.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cost Variance (CV)</span>
                    <span className={`font-mono text-sm ${earnedValue.cv >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {earnedValue.cv >= 0 ? '+' : ''}{formatCurrency(earnedValue.cv, projectCurrency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Schedule Variance (SV)</span>
                    <span className={`font-mono text-sm ${earnedValue.sv >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {earnedValue.sv >= 0 ? '+' : ''}{formatCurrency(earnedValue.sv, projectCurrency)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Items</CardTitle>
            <CardDescription>All cost line items for this project</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48" />
            ) : costItems.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {costItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 p-3 rounded-lg border bg-card hover-elevate"
                    data-testid={`cost-item-${item.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{item.description}</span>
                        <Badge variant="outline" className="text-xs capitalize">{item.category}</Badge>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
                        <span>Budget: {formatCurrency(parseNumeric(item.budgeted), item.currency)}</span>
                        <span>Actual: {formatCurrency(parseNumeric(item.actual), item.currency)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(item)}
                        data-testid={`button-edit-cost-${item.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(item.id)}
                        data-testid={`button-delete-cost-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No cost items yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Cost Item' : 'Add Cost Item'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the cost item details.' : 'Add a new cost item to track budget and expenses.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {COST_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="capitalize">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (formErrors.description) setFormErrors({ ...formErrors, description: '' });
                }}
                placeholder="Enter cost description"
                data-testid="input-description"
                className={formErrors.description ? 'border-destructive' : ''}
              />
              {formErrors.description && (
                <p className="text-xs text-destructive">{formErrors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budgeted">Budgeted Amount *</Label>
                <Input
                  id="budgeted"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.budgeted}
                  onChange={(e) => {
                    setFormData({ ...formData, budgeted: e.target.value });
                    if (formErrors.budgeted) setFormErrors({ ...formErrors, budgeted: '' });
                  }}
                  placeholder="0"
                  data-testid="input-budgeted"
                  className={formErrors.budgeted ? 'border-destructive' : ''}
                />
                {formErrors.budgeted && (
                  <p className="text-xs text-destructive">{formErrors.budgeted}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="actual">Actual Amount</Label>
                <Input
                  id="actual"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.actual}
                  onChange={(e) => {
                    setFormData({ ...formData, actual: e.target.value });
                    if (formErrors.actual) setFormErrors({ ...formErrors, actual: '' });
                  }}
                  placeholder="0"
                  data-testid="input-actual"
                  className={formErrors.actual ? 'border-destructive' : ''}
                />
                {formErrors.actual && (
                  <p className="text-xs text-destructive">{formErrors.actual}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task">Link to Task (optional)</Label>
              <Select
                value={formData.taskId?.toString() || 'none'}
                onValueChange={(v) => setFormData({ ...formData, taskId: v && v !== 'none' ? parseInt(v) : undefined })}
              >
                <SelectTrigger data-testid="select-task">
                  <SelectValue placeholder="Select task (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id.toString()}>
                      {task.wbsCode} - {task.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-submit-cost"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
