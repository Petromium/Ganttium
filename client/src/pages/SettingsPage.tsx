import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useProject } from "@/contexts/ProjectContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Cloud, HardDrive, RefreshCw, Unlink, Check, AlertCircle, Clock, Loader2, ExternalLink, FolderSync, Sparkles, Mail, Users, FolderKanban, CreditCard, Tags, Replace, Search, UserPlus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { SiGoogledrive, SiDropbox } from "react-icons/si";
import { Progress } from "@/components/ui/progress";
import { format, formatDistanceToNow } from "date-fns";
import type { User, UserInvitation } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CloudStorageProvider {
  id: string;
  name: string;
  icon: string;
  configured: boolean;
}

interface CloudStorageConnection {
  id: number;
  provider: string;
  accountEmail: string | null;
  accountName: string | null;
  rootFolderName: string | null;
  syncEnabled: boolean;
  syncStatus: string;
  lastSyncAt: string | null;
  syncError: string | null;
  createdAt: string;
}

interface StorageQuota {
  usedBytes: number;
  quotaBytes: number;
  usedPercent: number;
}

interface UsageStats {
  storage: { usedBytes: number; quotaBytes: number; usedPercent: number };
  ai: { tokensUsed: number; tokenLimit: number; requestCount: number; usedPercent: number };
  email: { emailsSent: number; emailLimit: number; usedPercent: number };
  projects: { count: number; limit: number };
  users: { count: number; limit: number };
  plan: { tier: string; name: string; includesCloudSync: boolean; includesAdvancedReports: boolean } | null;
}

function ProviderIcon({ provider, className = "h-5 w-5" }: { provider: string; className?: string }) {
  switch (provider) {
    case "google_drive":
      return <SiGoogledrive className={className} />;
    case "onedrive":
      return <Cloud className={className} />;
    case "dropbox":
      return <SiDropbox className={className} />;
    default:
      return <Cloud className={className} />;
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Label Management Section Component
interface LabelData {
  value: string;
  disciplineEnum?: string | null;
  disciplineLabel?: string | null;
  linkedUserId?: string | null;
  taskCount: number;
}

function LabelManagementSection({ projectId }: { projectId: number }) {
  const { toast } = useToast();
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<{ type: 'discipline' | 'assignee'; value: string } | null>(null);
  const [newValue, setNewValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch discipline labels - only when projectId is valid
  const { data: disciplineData, isLoading: disciplinesLoading, refetch: refetchDisciplines } = useQuery<{ disciplines: LabelData[]; total: number }>({
    queryKey: ['/api/projects', projectId, 'labels', 'disciplines'],
    enabled: Boolean(projectId),
  });

  // Fetch assignee labels - only when projectId is valid
  const { data: assigneeData, isLoading: assigneesLoading, refetch: refetchAssignees } = useQuery<{ assignees: LabelData[]; total: number }>({
    queryKey: ['/api/projects', projectId, 'labels', 'assignees'],
    enabled: Boolean(projectId),
  });

  // Replace discipline mutation - guard against undefined projectId
  const replaceDisciplineMutation = useMutation({
    mutationFn: async ({ oldValue, newValue }: { oldValue: string; newValue: string }) => {
      if (!projectId) throw new Error('No project selected');
      const res = await apiRequest('POST', `/api/projects/${projectId}/labels/disciplines/replace`, { oldValue, newValue, updateEnum: true });
      return res.json();
    },
    onSuccess: (data: { message?: string; updated?: number }) => {
      toast({
        title: "Labels Updated",
        description: data.message || `Successfully updated ${data.updated || 0} tasks`,
      });
      refetchDisciplines();
      setReplaceDialogOpen(false);
      setSelectedLabel(null);
      setNewValue('');
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Replace assignee mutation - guard against undefined projectId
  const replaceAssigneeMutation = useMutation({
    mutationFn: async ({ oldValue, newValue }: { oldValue: string; newValue: string }) => {
      if (!projectId) throw new Error('No project selected');
      const res = await apiRequest('POST', `/api/projects/${projectId}/labels/assignees/replace`, { oldValue, newValue });
      return res.json();
    },
    onSuccess: (data: { message?: string; updated?: number }) => {
      toast({
        title: "Labels Updated",
        description: data.message || `Successfully updated ${data.updated || 0} tasks`,
      });
      refetchAssignees();
      setReplaceDialogOpen(false);
      setSelectedLabel(null);
      setNewValue('');
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleReplace = () => {
    if (!selectedLabel || !newValue.trim()) return;
    
    if (selectedLabel.type === 'discipline') {
      replaceDisciplineMutation.mutate({ oldValue: selectedLabel.value, newValue: newValue.trim() });
    } else {
      replaceAssigneeMutation.mutate({ oldValue: selectedLabel.value, newValue: newValue.trim() });
    }
  };

  const filteredDisciplines = (disciplineData?.disciplines || []).filter(d => 
    d.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAssignees = (assigneeData?.assignees || []).filter(a => 
    a.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Label Management
          </CardTitle>
          <CardDescription>
            Normalize discipline and assignee labels for consistency. After importing data with flexible labels, use this tool to standardize terminology across your project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search labels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-labels"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Discipline Labels</CardTitle>
            <CardDescription>
              {disciplineData?.disciplines?.length || 0} unique discipline values in {disciplineData?.total || 0} tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            {disciplinesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : filteredDisciplines.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No discipline labels found
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredDisciplines.map((label) => (
                  <div
                    key={label.value}
                    className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                    data-testid={`label-discipline-${label.value}`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{label.taskCount}</Badge>
                      <div>
                        <p className="font-medium">{label.value}</p>
                        {label.disciplineLabel && label.disciplineLabel !== label.value && (
                          <p className="text-xs text-muted-foreground">Label: {label.disciplineLabel}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedLabel({ type: 'discipline', value: label.value });
                        setNewValue(label.value);
                        setReplaceDialogOpen(true);
                      }}
                      data-testid={`button-replace-discipline-${label.value}`}
                    >
                      <Replace className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assignee Labels</CardTitle>
            <CardDescription>
              {assigneeData?.assignees?.length || 0} unique assignee identifiers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assigneesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : filteredAssignees.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No assignee labels found
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredAssignees.map((label) => (
                  <div
                    key={label.value}
                    className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                    data-testid={`label-assignee-${label.value}`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{label.taskCount}</Badge>
                      <div>
                        <p className="font-medium">{label.value}</p>
                        {label.linkedUserId && (
                          <p className="text-xs text-muted-foreground">Linked to user</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedLabel({ type: 'assignee', value: label.value });
                        setNewValue(label.value);
                        setReplaceDialogOpen(true);
                      }}
                      data-testid={`button-replace-assignee-${label.value}`}
                    >
                      <Replace className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={replaceDialogOpen} onOpenChange={setReplaceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace Label</AlertDialogTitle>
            <AlertDialogDescription>
              Replace all occurrences of "{selectedLabel?.value}" with a new value. This will update all tasks that use this {selectedLabel?.type === 'discipline' ? 'discipline' : 'assignee'} label.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Enter new value..."
              data-testid="input-new-label-value"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setSelectedLabel(null);
              setNewValue('');
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReplace}
              disabled={!newValue.trim() || (replaceDisciplineMutation.isPending || replaceAssigneeMutation.isPending)}
            >
              {(replaceDisciplineMutation.isPending || replaceAssigneeMutation.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Replace All'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// User Management Section Component
interface UserWithRole extends User {
  role: string;
  joinedAt: string | null;
}

function UserManagementSection() {
  const { selectedOrgId } = useProject();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "admin" | "member" | "viewer">("member");
  const [editRole, setEditRole] = useState<"owner" | "admin" | "member" | "viewer">("member");

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<UserWithRole[]>({
    queryKey: [`/api/organizations/${selectedOrgId}/users`],
    enabled: !!selectedOrgId,
    retry: 1,
  });

  // Fetch invitations
  const { data: invitations = [] } = useQuery<UserInvitation[]>({
    queryKey: [`/api/organizations/${selectedOrgId}/users/invitations`],
    enabled: !!selectedOrgId,
    retry: 1,
  });

  // Invite user mutation
  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; role: string }) => {
      const res = await apiRequest("POST", `/api/organizations/${selectedOrgId}/users/invite`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${selectedOrgId}/users/invitations`] });
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("member");
      toast({ title: "Success", description: "Invitation sent" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await apiRequest("PATCH", `/api/organizations/${selectedOrgId}/users/${userId}`, { role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${selectedOrgId}/users`] });
      setEditDialogOpen(false);
      setSelectedUser(null);
      toast({ title: "Success", description: "User role updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Remove user mutation
  const removeUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/organizations/${selectedOrgId}/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${selectedOrgId}/users`] });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      toast({ title: "Success", description: "User removed from organization" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete invitation mutation
  const deleteInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      await apiRequest("DELETE", `/api/organizations/${selectedOrgId}/users/invitations/${invitationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${selectedOrgId}/users/invitations`] });
      toast({ title: "Success", description: "Invitation cancelled" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredUsers = users.filter(user =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingInvitations = invitations.filter(inv => !inv.acceptedAt);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'member': return 'outline';
      default: return 'outline';
    }
  };

  const getInitials = (user: User) => {
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U';
  };

  if (!selectedOrgId) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please select an organization to manage users</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">User Management</h2>
          <p className="text-muted-foreground">Manage users and permissions for your organization</p>
        </div>
        <Button onClick={() => setInviteDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations
            </CardTitle>
            <CardDescription>Invitations awaiting acceptance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {invitation.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Invited {format(new Date(invitation.createdAt), "MMM d, yyyy")} • Expires {format(new Date(invitation.expiresAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getRoleColor(invitation.role)}>{invitation.role}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteInvitationMutation.mutate(invitation.id)}
                      disabled={deleteInvitationMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Organization Members
              </CardTitle>
              <CardDescription>{users.length} members in your organization</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No users found" : "No users in this organization"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.profileImageUrl || undefined} />
                          <AvatarFallback>{getInitials(user)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {user.firstName} {user.lastName}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleColor(user.role)}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.joinedAt ? format(new Date(user.joinedAt), "MMM d, yyyy") : "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setEditRole(user.role as any);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
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

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User to Organization</DialogTitle>
            <DialogDescription>
              Send an invitation email to add a new member to your organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer - Read only access</SelectItem>
                  <SelectItem value="member">Member - Standard access</SelectItem>
                  <SelectItem value="admin">Admin - Manage users and settings</SelectItem>
                  <SelectItem value="owner">Owner - Full control</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
              disabled={!inviteEmail || inviteMutation.isPending}
            >
              {inviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select value={editRole} onValueChange={(value: any) => setEditRole(value)}>
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer - Read only access</SelectItem>
                  <SelectItem value="member">Member - Standard access</SelectItem>
                  <SelectItem value="admin">Admin - Manage users and settings</SelectItem>
                  <SelectItem value="owner">Owner - Full control</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedUser && updateRoleMutation.mutate({ userId: selectedUser.id, role: editRole })}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User from Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedUser?.firstName} {selectedUser?.lastName} from this organization? 
              They will lose access to all organization projects and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUser && removeUserMutation.mutate(selectedUser.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function SettingsPage() {
  const { selectedProject } = useProject();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  const [disconnectingId, setDisconnectingId] = useState<number | null>(null);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("usage");

  const organizationId = selectedProject?.organizationId;

  // Set active tab from URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["usage", "cloud-storage", "storage", "users", "labels"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const provider = searchParams.get("provider");

    if (success === "cloud_storage_connected" && provider) {
      toast({
        title: "Cloud Storage Connected",
        description: `Successfully connected your ${provider.replace("_", " ")} account.`,
      });
      window.history.replaceState({}, "", "/settings");
    } else if (error) {
      let errorMessage = "An error occurred during connection.";
      if (error === "oauth_failed") errorMessage = "OAuth authentication failed.";
      if (error === "state_expired") errorMessage = "Session expired. Please try again.";
      if (error === "invalid_callback") errorMessage = "Invalid callback received.";
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParams, toast]);

  const { data: providers = [], isLoading: providersLoading } = useQuery<CloudStorageProvider[]>({
    queryKey: ["/api/cloud-storage/providers"],
    queryFn: async () => {
      const response = await fetch("/api/cloud-storage/providers", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch providers");
      return response.json();
    },
  });

  const { data: connections = [], isLoading: connectionsLoading } = useQuery<CloudStorageConnection[]>({
    queryKey: ["/api/organizations", organizationId, "cloud-storage"],
    enabled: !!organizationId,
    queryFn: async () => {
      const response = await fetch(`/api/organizations/${organizationId}/cloud-storage`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch connections");
      return response.json();
    },
  });

  const { data: storageQuota, isLoading: quotaLoading } = useQuery<StorageQuota>({
    queryKey: ["/api/organizations", organizationId, "storage"],
    enabled: !!organizationId,
    queryFn: async () => {
      const response = await fetch(`/api/organizations/${organizationId}/storage`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch storage quota");
      return response.json();
    },
  });

  const { data: usageStats, isLoading: usageLoading } = useQuery<UsageStats>({
    queryKey: ["/api/organizations", organizationId, "usage"],
    enabled: !!organizationId,
    queryFn: async () => {
      const response = await fetch(`/api/organizations/${organizationId}/usage`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch usage stats");
      return response.json();
    },
  });

  const connectMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await apiRequest("POST", `/api/organizations/${organizationId}/cloud-storage/auth-url`, {
        provider,
      });
      return response.json();
    },
    onSuccess: (data) => {
      window.location.href = data.authUrl;
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      await apiRequest("DELETE", `/api/organizations/${organizationId}/cloud-storage/${connectionId}`);
    },
    onSuccess: () => {
      toast({
        title: "Disconnected",
        description: "Cloud storage has been disconnected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", organizationId, "cloud-storage"] });
      setDisconnectingId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Disconnect Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async ({ connectionId, projectId }: { connectionId: number; projectId: number }) => {
      const response = await apiRequest("POST", `/api/organizations/${organizationId}/cloud-storage/${connectionId}/sync`, {
        projectId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sync Complete",
        description: `Added ${data.added} files, updated ${data.updated} files.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", organizationId, "cloud-storage"] });
      setSyncingId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
      setSyncingId(null);
    },
  });

  const getConnectedProviders = () => connections.map((c) => c.provider);

  if (!selectedProject) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a project to configure settings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-settings-title">Settings</h1>
        <p className="text-muted-foreground">Manage integrations and storage for your organization</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage" data-testid="tab-usage">
            <CreditCard className="h-4 w-4 mr-2" />
            Usage & Plan
          </TabsTrigger>
          <TabsTrigger value="cloud-storage" data-testid="tab-cloud-storage">
            <Cloud className="h-4 w-4 mr-2" />
            Cloud Storage
          </TabsTrigger>
          <TabsTrigger value="storage" data-testid="tab-storage">
            <HardDrive className="h-4 w-4 mr-2" />
            Storage Quota
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="h-4 w-4 mr-2" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="labels" data-testid="tab-labels">
            <Tags className="h-4 w-4 mr-2" />
            Label Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          {usageLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          ) : usageStats ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Current Plan
                        <Badge variant={usageStats.plan?.tier === 'free' ? 'secondary' : 'default'}>
                          {usageStats.plan?.name || 'Free'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Your organization's subscription and resource usage
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" data-testid="button-upgrade-plan">
                      Upgrade Plan
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <HardDrive className="h-4 w-4 text-muted-foreground" />
                          Storage
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatBytes(usageStats.storage.usedBytes)} / {formatBytes(usageStats.storage.quotaBytes)}
                        </span>
                      </div>
                      <Progress 
                        value={usageStats.storage.usedPercent} 
                        className={usageStats.storage.usedPercent > 90 ? "bg-destructive/20" : ""}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Sparkles className="h-4 w-4 text-muted-foreground" />
                          AI Tokens
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {usageStats.ai.tokensUsed.toLocaleString()} / {usageStats.ai.tokenLimit.toLocaleString()}
                        </span>
                      </div>
                      <Progress 
                        value={usageStats.ai.usedPercent} 
                        className={usageStats.ai.usedPercent > 90 ? "bg-destructive/20" : ""}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          Emails Sent
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {usageStats.email.emailsSent} / {usageStats.email.emailLimit}
                        </span>
                      </div>
                      <Progress 
                        value={usageStats.email.usedPercent} 
                        className={usageStats.email.usedPercent > 90 ? "bg-destructive/20" : ""}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-muted">
                          <FolderKanban className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">Projects</p>
                          <p className="text-sm text-muted-foreground">Active projects</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold">{usageStats.projects.count}</p>
                        <p className="text-sm text-muted-foreground">of {usageStats.projects.limit} max</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-muted">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">Team Members</p>
                          <p className="text-sm text-muted-foreground">Organization users</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold">{usageStats.users.count}</p>
                        <p className="text-sm text-muted-foreground">of {usageStats.users.limit} max</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Plan Features</CardTitle>
                  <CardDescription>
                    Features included in your current subscription
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    <div className="flex items-center gap-2 p-3 rounded-lg border">
                      {usageStats.plan?.includesCloudSync ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={!usageStats.plan?.includesCloudSync ? "text-muted-foreground" : ""}>
                        Cloud Storage Sync
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg border">
                      {usageStats.plan?.includesAdvancedReports ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={!usageStats.plan?.includesAdvancedReports ? "text-muted-foreground" : ""}>
                        Advanced Reports
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg border">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>AI Assistant</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg border">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Email Notifications</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg border">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Real-time Collaboration</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg border">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>PDF Reports</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-muted-foreground text-center">
                  Unable to load usage information.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cloud-storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connected Cloud Storage</CardTitle>
              <CardDescription>
                Connect your cloud storage accounts to sync files with your projects.
                Files are synchronized one-way from cloud storage to the platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {connectionsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : connections.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No cloud storage connected. Connect a provider below.
                </p>
              ) : (
                <div className="space-y-3">
                  {connections.map((connection) => (
                    <div
                      key={connection.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                      data-testid={`connection-${connection.provider}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-md bg-muted">
                          <ProviderIcon provider={connection.provider} className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{connection.accountName || connection.accountEmail}</span>
                            {connection.syncStatus === "syncing" && (
                              <Badge variant="outline">
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                Syncing
                              </Badge>
                            )}
                            {connection.syncStatus === "error" && (
                              <Badge variant="destructive">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Error
                              </Badge>
                            )}
                            {connection.syncStatus === "idle" && connection.lastSyncAt && (
                              <Badge variant="secondary">
                                <Check className="h-3 w-3 mr-1" />
                                Synced
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{connection.accountEmail}</span>
                            {connection.lastSyncAt && (
                              <>
                                <span>-</span>
                                <Clock className="h-3 w-3" />
                                <span>Last sync: {formatDistanceToNow(new Date(connection.lastSyncAt))} ago</span>
                              </>
                            )}
                          </div>
                          {connection.syncError && (
                            <p className="text-sm text-destructive mt-1">{connection.syncError}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSyncingId(connection.id);
                            syncMutation.mutate({
                              connectionId: connection.id,
                              projectId: selectedProject.id,
                            });
                          }}
                          disabled={syncMutation.isPending && syncingId === connection.id}
                          data-testid={`button-sync-${connection.provider}`}
                        >
                          {syncMutation.isPending && syncingId === connection.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FolderSync className="h-4 w-4 mr-1" />
                          )}
                          Sync Now
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDisconnectingId(connection.id)}
                          data-testid={`button-disconnect-${connection.provider}`}
                        >
                          <Unlink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Providers</CardTitle>
              <CardDescription>
                Connect additional cloud storage providers to access your files.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {providersLoading ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  {providers.map((provider) => {
                    const isConnected = getConnectedProviders().includes(provider.id);
                    return (
                      <div
                        key={provider.id}
                        className={`p-4 rounded-lg border ${isConnected ? "bg-muted/50" : "bg-card hover-elevate"}`}
                        data-testid={`provider-${provider.id}`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-md bg-muted">
                            <ProviderIcon provider={provider.id} className="h-5 w-5" />
                          </div>
                          <span className="font-medium">{provider.name}</span>
                        </div>
                        {isConnected ? (
                          <Badge variant="secondary" className="w-full justify-center">
                            <Check className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : provider.configured ? (
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => connectMutation.mutate(provider.id)}
                            disabled={connectMutation.isPending}
                            data-testid={`button-connect-${provider.id}`}
                          >
                            {connectMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <ExternalLink className="h-4 w-4 mr-1" />
                            )}
                            Connect
                          </Button>
                        ) : (
                          <Badge variant="outline" className="w-full justify-center">
                            Not Configured
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Storage Usage</CardTitle>
              <CardDescription>
                Monitor your organization's storage usage and quota.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quotaLoading ? (
                <Skeleton className="h-32" />
              ) : storageQuota ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-semibold">
                      {formatBytes(storageQuota.usedBytes)}
                    </span>
                    <span className="text-muted-foreground">
                      of {formatBytes(storageQuota.quotaBytes)}
                    </span>
                  </div>
                  <div className="h-4 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        storageQuota.usedPercent > 90
                          ? "bg-destructive"
                          : storageQuota.usedPercent > 75
                          ? "bg-yellow-500"
                          : "bg-primary"
                      }`}
                      style={{ width: `${Math.min(storageQuota.usedPercent, 100)}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    {storageQuota.usedPercent}% of storage used
                  </p>
                  
                  {storageQuota.usedPercent > 90 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Storage is almost full. Consider deleting unused files or upgrading your plan.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Unable to load storage information.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserManagementSection />
        </TabsContent>

        <TabsContent value="labels" className="space-y-4">
          <LabelManagementSection projectId={selectedProject.id} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={disconnectingId !== null} onOpenChange={() => setDisconnectingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Cloud Storage</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect this cloud storage? Synced files will remain in your projects, but future syncs will stop.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => disconnectingId && disconnectMutation.mutate(disconnectingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
