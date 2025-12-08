import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, X } from "lucide-react";
import type { ResourceGroup, Resource, InsertResourceGroup } from "@shared/schema";

interface ResourceGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  group?: ResourceGroup;
}

export function ResourceGroupModal({ open, onOpenChange, projectId, group }: ResourceGroupModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [selectedResourceIds, setSelectedResourceIds] = useState<number[]>([]);

  // Fetch all resources
  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: [`/api/projects/${projectId}/resources`],
    enabled: open && !!projectId,
  });

  const { data: project } = useQuery<{ organizationId: number }>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });

  // Fetch group members if editing
  const { data: groupMembers = [] } = useQuery<number[]>({
    queryKey: [`/api/resource-groups/${group?.id}/members`],
    enabled: open && !!group?.id,
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/resource-groups/${group!.id}/members`
      );
      const members = await res.json();
      return members.map((m: any) => m.resourceId);
    },
  });

  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description || "");
      setColor(group.color || "#3b82f6");
    } else {
      setName("");
      setDescription("");
      setColor("#3b82f6");
      setSelectedResourceIds([]);
    }
  }, [group, open]);

  useEffect(() => {
    if (groupMembers.length > 0) {
      setSelectedResourceIds(groupMembers);
    }
  }, [groupMembers]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertResourceGroup) => {
      const res = await apiRequest("POST", "/api/resource-groups", data);
      const createdGroup: ResourceGroup = await res.json();
      
      // Add members
      for (const resourceId of selectedResourceIds) {
        await apiRequest("POST", `/api/resource-groups/${createdGroup.id}/members`, { resourceId });
      }
      
      return createdGroup;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/resource-groups`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/resources`] });
      toast({ title: "Group Created", description: "Resource group has been created successfully." });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertResourceGroup>) => {
      const updatedGroup = await apiRequest<ResourceGroup>("PATCH", `/api/resource-groups/${group!.id}`, data);
      
      // Update members
      const currentMembers = groupMembers;
      const toAdd = selectedResourceIds.filter(id => !currentMembers.includes(id));
      const toRemove = currentMembers.filter(id => !selectedResourceIds.includes(id));
      
      for (const resourceId of toAdd) {
        await apiRequest("POST", `/api/resource-groups/${group!.id}/members`, { resourceId });
      }
      
      for (const resourceId of toRemove) {
        await apiRequest("DELETE", `/api/resource-groups/${group!.id}/members/${resourceId}`);
      }
      
      return updatedGroup;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/resource-groups`] });
      queryClient.invalidateQueries({ queryKey: [`/api/resource-groups/${group!.id}/members`] });
      toast({ title: "Group Updated", description: "Resource group has been updated successfully." });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleToggleResource = (resourceId: number) => {
    setSelectedResourceIds(prev =>
      prev.includes(resourceId)
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({ title: "Name Required", description: "Please enter a group name.", variant: "destructive" });
      return;
    }

    if (!project) return;

    const data: InsertResourceGroup = {
      organizationId: (project as any).organizationId,
      name: name.trim(),
      description: description.trim() || undefined,
      color,
    };

    if (group) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{group ? "Edit Resource Group" : "Create Resource Group"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Engineering Team, Equipment Pool"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-20 h-10"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#3b82f6"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Select Resources</Label>
            <ScrollArea className="h-64 border rounded-md p-4">
              <div className="space-y-2">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                    onClick={() => handleToggleResource(resource.id)}
                  >
                    <Checkbox
                      checked={selectedResourceIds.includes(resource.id)}
                      onCheckedChange={() => handleToggleResource(resource.id)}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{resource.name}</p>
                      <p className="text-xs text-muted-foreground">{resource.type} • {resource.discipline}</p>
                    </div>
                    {selectedResourceIds.includes(resource.id) && (
                      <Badge variant="secondary">{selectedResourceIds.length} selected</Badge>
                    )}
                  </div>
                ))}
                {resources.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No resources available</p>
                )}
              </div>
            </ScrollArea>
            {selectedResourceIds.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedResourceIds.length} resource{selectedResourceIds.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? "Saving..." : group ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

