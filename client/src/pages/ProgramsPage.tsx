import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { useProject } from "@/contexts/ProjectContext";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Plus, Edit, Trash2, Loader2, 
  AlertCircle, MoreHorizontal, FolderKanban
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Program } from "@shared/schema";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { useSelection } from "@/contexts/SelectionContext";
import { registerBulkActionHandler } from "@/components/BottomSelectionToolbar";

export default function ProgramsPage() {
  const { user } = useAuth();
  const { selectedOrgId, terminology } = useProject();
  const { toast } = useToast();
  const { selectedPrograms, setSelectedPrograms } = useSelection();
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Fetch programs
  const { data: programs = [], isLoading: isLoadingPrograms } = useQuery<Program[]>({
    queryKey: selectedOrgId ? [`/api/organizations/${selectedOrgId}/programs`] : ["/api/organizations/null/programs"],
    enabled: !!selectedOrgId,
  });

  // Fetch projects to count per program
  const { data: allProjects = [] } = useQuery({
    queryKey: selectedOrgId ? [`/api/organizations/${selectedOrgId}/projects`] : ["/api/organizations/null/projects"],
    enabled: !!selectedOrgId,
  });

  const isLoading = isLoadingPrograms;

  // Define columns
  const columns = useMemo<ColumnDef<Program>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <SortableHeader column={column}>Name</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.original.name}</div>
        ),
      },
      {
        accessorKey: "slug",
        header: ({ column }) => (
          <SortableHeader column={column}>Slug</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="font-mono text-sm text-muted-foreground">{row.original.slug}</div>
        ),
      },
      {
        id: "description",
        header: "Description",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground max-w-md truncate">
            {row.original.description || "-"}
          </div>
        ),
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant={row.original.isVirtual ? "secondary" : "default"}>
            {row.original.isVirtual ? "Virtual" : "Real"}
          </Badge>
        ),
      },
      {
        id: "stats",
        header: "Stats",
        cell: ({ row }) => {
          const projectCount = allProjects.filter(p => p.programId === row.original.id).length;
          return (
            <div className="text-sm">
              {projectCount} project{projectCount !== 1 ? "s" : ""}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const program = row.original;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditProgram(program)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDeleteProgram(program)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [allProjects]
  );

  const handleCreateProgram = () => {
    setEditingProgram(null);
    setProgramModalOpen(true);
  };

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program);
    setProgramModalOpen(true);
  };

  const handleDeleteProgram = (program: Program) => {
    setProgramToDelete(program);
    setDeleteDialogOpen(true);
  };

  const handleBulkAction = (action: string, items: Program[]) => {
    if (action === "delete") {
      setBulkDeleteDialogOpen(true);
    }
  };

  // Register bulk action handler for bottom toolbar
  React.useEffect(() => {
    return registerBulkActionHandler("programs", handleBulkAction);
  }, []);

  // Create program mutation
  const createProgramMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string; description?: string; isVirtual?: boolean }) => {
      if (!selectedOrgId) throw new Error("No organization selected");
      const res = await apiRequest("POST", `/api/organizations/${selectedOrgId}/programs`, data);
      return res.json();
    },
    onSuccess: () => {
      if (selectedOrgId) {
        queryClient.invalidateQueries({ queryKey: [`/api/organizations/${selectedOrgId}/programs`] });
      }
      setProgramModalOpen(false);
      toast({ title: "Success", description: `${terminology.program} created successfully` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || `Failed to create ${terminology.program}`, variant: "destructive" });
    },
  });

  // Update program mutation
  const updateProgramMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; name?: string; slug?: string; description?: string; isVirtual?: boolean }) => {
      const res = await apiRequest("PATCH", `/api/programs/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      if (selectedOrgId) {
        queryClient.invalidateQueries({ queryKey: [`/api/organizations/${selectedOrgId}/programs`] });
      }
      setProgramModalOpen(false);
      setEditingProgram(null);
      toast({ title: "Success", description: `${terminology.program} updated successfully` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || `Failed to update ${terminology.program}`, variant: "destructive" });
    },
  });

  // Delete program mutation
  const deleteProgramMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/programs/${id}`);
    },
    onSuccess: () => {
      if (selectedOrgId) {
        queryClient.invalidateQueries({ queryKey: [`/api/organizations/${selectedOrgId}/programs`] });
      }
      setDeleteDialogOpen(false);
      setProgramToDelete(null);
      toast({ title: "Success", description: `${terminology.program} deleted successfully` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || `Failed to delete ${terminology.program}`, variant: "destructive" });
    },
  });

  // Bulk delete programs mutation
  const bulkDeleteProgramsMutation = useMutation({
    mutationFn: async (programIds: number[]) => {
      await Promise.all(programIds.map(id => apiRequest("DELETE", `/api/programs/${id}`)));
    },
    onSuccess: () => {
      if (selectedOrgId) {
        queryClient.invalidateQueries({ queryKey: [`/api/organizations/${selectedOrgId}/programs`] });
      }
      setBulkDeleteDialogOpen(false);
      setSelectedPrograms([]);
      toast({ title: "Success", description: `${selectedPrograms.length} ${terminology.program}(s) deleted successfully` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || `Failed to delete ${terminology.program}s`, variant: "destructive" });
    },
  });

  if (!selectedOrgId) {
    return (
      <div className="p-6">
        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
        <p className="text-center text-muted-foreground">No {terminology.topLevel.toLowerCase()} found. Please select an {terminology.topLevel.toLowerCase()} first.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{terminology.program}s</h1>
          <p className="text-muted-foreground mt-1">Manage {terminology.program.toLowerCase()}s in your {terminology.topLevel.toLowerCase()}</p>
        </div>
        <Button onClick={handleCreateProgram}>
          <Plus className="h-4 w-4 mr-2" />
          Create {terminology.program}
        </Button>
      </div>

      {/* Programs Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            data={programs}
            searchKey="name"
            searchPlaceholder={`Search ${terminology.program.toLowerCase()}s by name or slug...`}
            enableSelection={true}
            enableColumnVisibility={true}
            enableExport={true}
            enableSorting={true}
            enableFiltering={true}
            enablePagination={false}
            maxHeight="calc(100vh - 400px)"
            onSelectionChange={setSelectedPrograms}
            emptyMessage={programs.length === 0 ? `No ${terminology.program.toLowerCase()}s yet. Create your first ${terminology.program.toLowerCase()}!` : `No ${terminology.program.toLowerCase()}s found.`}
            getRowId={(row) => row.id.toString()}
          />
        </div>
      )}

      {/* Create/Edit Program Modal */}
      <ProgramModal
        open={programModalOpen}
        onOpenChange={setProgramModalOpen}
        program={editingProgram}
        organizationId={selectedOrgId}
        onCreate={createProgramMutation.mutate}
        onUpdate={(data) => editingProgram && updateProgramMutation.mutate({ ...data, id: editingProgram.id })}
        terminology={terminology}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {terminology.program}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{programToDelete?.name}"? This action cannot be undone.
              Projects in this {terminology.program.toLowerCase()} will remain but will no longer be grouped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => programToDelete && deleteProgramMutation.mutate(programToDelete.id)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple {terminology.program}s</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedPrograms.length} selected {terminology.program.toLowerCase()}(s)? This action cannot be undone.
              Projects in these {terminology.program.toLowerCase()}s will remain but will no longer be grouped.
              <br /><br />
              <strong>{terminology.program}s to delete:</strong>
              <ul className="list-disc list-inside mt-2 max-h-32 overflow-y-auto">
                {selectedPrograms.map(p => <li key={p.id}>{p.name} ({p.slug})</li>)}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const ids = selectedPrograms.map(p => p.id);
                bulkDeleteProgramsMutation.mutate(ids);
              }}
              className="bg-destructive text-destructive-foreground"
              disabled={bulkDeleteProgramsMutation.isPending}
            >
              {bulkDeleteProgramsMutation.isPending ? "Deleting..." : `Delete ${selectedPrograms.length} ${terminology.program}(s)`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Program Modal Component
function ProgramModal({
  open,
  onOpenChange,
  program,
  organizationId,
  onCreate,
  onUpdate,
  terminology,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: Program | null;
  organizationId: number;
  onCreate: (data: { name: string; slug: string; description?: string; isVirtual?: boolean }) => void;
  onUpdate: (data: { name?: string; slug?: string; description?: string; isVirtual?: boolean }) => void;
  terminology: { topLevel: string; program: string };
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isVirtual, setIsVirtual] = useState(false);

  useEffect(() => {
    if (program) {
      setName(program.name);
      setSlug(program.slug);
      setDescription(program.description || "");
      setIsVirtual(program.isVirtual || false);
    } else {
      setName("");
      setSlug("");
      setDescription("");
      setIsVirtual(false);
    }
  }, [program, open]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!program && name) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlug(generatedSlug);
    }
  }, [name, program]);

  const handleSubmit = () => {
    if (!name.trim() || !slug.trim()) {
      return;
    }

    if (program) {
      onUpdate({ name, slug, description: description || undefined, isVirtual });
    } else {
      onCreate({ name, slug, description: description || undefined, isVirtual });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{program ? `Edit ${terminology.program}` : `Create ${terminology.program}`}</DialogTitle>
          <DialogDescription>
            {program ? `Update ${terminology.program.toLowerCase()} details` : `Create a new ${terminology.program.toLowerCase()} to group related projects`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`${terminology.program} name`}
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="url-friendly-identifier"
            />
            <p className="text-xs text-muted-foreground mt-1">
              URL-friendly identifier (auto-generated from name)
            </p>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Brief description of this ${terminology.program.toLowerCase()}`}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isVirtual"
              checked={isVirtual}
              onChange={(e) => setIsVirtual(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="isVirtual" className="text-sm font-normal cursor-pointer">
              Virtual {terminology.program} (organizational grouping, not a real department)
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !slug.trim()}>
            {program ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

