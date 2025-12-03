import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useProject } from "@/contexts/ProjectContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tags, Plus, Pencil, Trash2, X } from "lucide-react";
import type { Tag } from "@shared/schema";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";

export function TagManagement() {
  const { selectedOrgId } = useProject();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    color: "",
    description: "",
  });

  const { data: tags = [], isLoading } = useQuery<Tag[]>({
    queryKey: [`/api/organizations/${selectedOrgId}/tags`, categoryFilter],
    queryFn: async () => {
      const url = categoryFilter === "all" 
        ? `/api/organizations/${selectedOrgId}/tags`
        : `/api/organizations/${selectedOrgId}/tags?category=${categoryFilter}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
    enabled: !!selectedOrgId,
  });

  // Get unique categories
  const categories = Array.from(new Set(tags.map(t => t.category).filter(Boolean))) as string[];

  const createTagMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", `/api/organizations/${selectedOrgId}/tags`, {
        name: data.name,
        category: data.category || undefined,
        color: data.color || undefined,
        description: data.description || undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${selectedOrgId}/tags`] });
      setIsCreateOpen(false);
      setFormData({ name: "", category: "", color: "", description: "" });
      toast({ title: "Success", description: "Tag created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof formData> }) => {
      const response = await apiRequest("PATCH", `/api/tags/${id}`, {
        name: data.name,
        category: data.category || undefined,
        color: data.color || undefined,
        description: data.description || undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${selectedOrgId}/tags`] });
      setIsEditOpen(false);
      setEditingTag(null);
      setFormData({ name: "", category: "", color: "", description: "" });
      toast({ title: "Success", description: "Tag updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tags/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${selectedOrgId}/tags`] });
      setIsDeleteOpen(false);
      setTagToDelete(null);
      toast({ title: "Success", description: "Tag deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCreate = () => {
    setEditingTag(null);
    setFormData({ name: "", category: "", color: "", description: "" });
    setIsCreateOpen(true);
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      category: tag.category || "",
      color: tag.color || "",
      description: tag.description || "",
    });
    setIsEditOpen(true);
  };

  const handleDelete = (tag: Tag) => {
    setTagToDelete(tag);
    setIsDeleteOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Tag name is required", variant: "destructive" });
      return;
    }

    if (editingTag) {
      updateTagMutation.mutate({ id: editingTag.id, data: formData });
    } else {
      createTagMutation.mutate(formData);
    }
  };

  const columns: ColumnDef<Tag>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const tag = row.original;
        return (
          <div className="flex items-center gap-2">
            {tag.color && (
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: tag.color }}
              />
            )}
            <span className="font-medium">{tag.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.original.category;
        return category ? <Badge variant="outline">{category}</Badge> : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      accessorKey: "usageCount",
      header: "Usage",
      cell: ({ row }) => {
        return <span className="text-muted-foreground">{row.original.usageCount}</span>;
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const desc = row.original.description;
        return desc ? <span className="text-sm text-muted-foreground">{desc}</span> : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const tag = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(tag)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(tag)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (!selectedOrgId) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Tags className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Organization Selected</h2>
          <p className="text-muted-foreground">
            Please select an organization to manage tags.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5" />
                Tag Management
              </CardTitle>
              <CardDescription>
                Create and manage tags for categorizing and filtering projects, tasks, risks, issues, and other entities.
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Tag
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Label>Filter by Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DataTable
            columns={columns}
            data={tags}
            isLoading={isLoading}
            enablePagination={true}
            enableSearch={true}
            searchPlaceholder="Search tags..."
          />
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setIsEditOpen(false);
          setEditingTag(null);
          setFormData({ name: "", category: "", color: "", description: "" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTag ? "Edit Tag" : "Create Tag"}</DialogTitle>
            <DialogDescription>
              {editingTag ? "Update tag details" : "Create a new tag for your organization"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., construction, quality-issue, HSE"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category (Optional)</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., project-type, issue-type"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color (Optional)</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                placeholder="e.g., blue, #FF5733"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Tag description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
                setEditingTag(null);
                setFormData({ name: "", category: "", color: "", description: "" });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createTagMutation.isPending || updateTagMutation.isPending}
            >
              {editingTag ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the tag "{tagToDelete?.name}"? This will remove it from all entities it's assigned to.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => tagToDelete && deleteTagMutation.mutate(tagToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

