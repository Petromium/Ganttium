import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useProject } from "@/contexts/ProjectContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Users, Plus, Mail, MoreVertical, Pencil, Trash2, UserPlus, Search, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import type { User, UserInvitation } from "@shared/schema";

interface UserWithRole extends User {
  role: string;
  joinedAt: string | null;
}

export default function UserManagementPage() {
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
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery<UserWithRole[]>({
    queryKey: [`/api/organizations/${selectedOrgId}/users`],
    enabled: !!selectedOrgId,
    retry: 1,
  });

  // Fetch invitations
  const { data: invitations = [], isLoading: invitationsLoading, refetch: refetchInvitations } = useQuery<UserInvitation[]>({
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
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Please select an organization to manage users</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
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

