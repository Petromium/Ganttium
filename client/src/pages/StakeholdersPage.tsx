import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useProject } from "@/contexts/ProjectContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Stakeholder } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function StakeholdersPage() {
  const { selectedProjectId } = useProject();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    role: "other" as "consultant" | "sponsor" | "client" | "team-member" | "contractor" | "other",
    email: "",
    phone: "",
    organization: "",
  });

  // Fetch stakeholders
  const { data: stakeholders = [], isLoading } = useQuery<Stakeholder[]>({
    queryKey: [`/api/projects/${selectedProjectId}/stakeholders`],
    enabled: !!selectedProjectId,
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
      setFormData({
        name: "",
        role: "other",
        email: "",
        phone: "",
        organization: "",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
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
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-stakeholder">
          Add Stakeholder
        </Button>
      </div>

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
          <Button onClick={() => setDialogOpen(true)} data-testid="button-add-first-stakeholder">
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="dialog-add-stakeholder">
          <DialogHeader>
            <DialogTitle>Add Stakeholder</DialogTitle>
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
                disabled={createMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending ? "Adding..." : "Add Stakeholder"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
