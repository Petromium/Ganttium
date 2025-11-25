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
import { Cloud, HardDrive, RefreshCw, Unlink, Check, AlertCircle, Clock, Loader2, ExternalLink, FolderSync } from "lucide-react";
import { SiGoogledrive, SiDropbox } from "react-icons/si";
import { format, formatDistanceToNow } from "date-fns";

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

export default function SettingsPage() {
  const { selectedProject } = useProject();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  const [disconnectingId, setDisconnectingId] = useState<number | null>(null);
  const [syncingId, setSyncingId] = useState<number | null>(null);

  const organizationId = selectedProject?.organizationId;

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

      <Tabs defaultValue="cloud-storage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cloud-storage" data-testid="tab-cloud-storage">
            <Cloud className="h-4 w-4 mr-2" />
            Cloud Storage
          </TabsTrigger>
          <TabsTrigger value="storage" data-testid="tab-storage">
            <HardDrive className="h-4 w-4 mr-2" />
            Storage Quota
          </TabsTrigger>
        </TabsList>

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
