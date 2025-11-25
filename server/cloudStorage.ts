import { storage } from "./storage";
import type { CloudStorageConnection, CloudSyncedFile } from "@shared/schema";

// Provider configuration types
interface ProviderConfig {
  name: string;
  displayName: string;
  icon: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientIdEnv: string;
  clientSecretEnv: string;
}

// Provider configurations
export const CLOUD_PROVIDERS: Record<string, ProviderConfig> = {
  google_drive: {
    name: "google_drive",
    displayName: "Google Drive",
    icon: "google-drive",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile"
    ],
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET"
  },
  onedrive: {
    name: "onedrive",
    displayName: "OneDrive",
    icon: "microsoft-onedrive",
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scopes: [
      "Files.Read.All",
      "User.Read",
      "offline_access"
    ],
    clientIdEnv: "ONEDRIVE_CLIENT_ID",
    clientSecretEnv: "ONEDRIVE_CLIENT_SECRET"
  },
  dropbox: {
    name: "dropbox",
    displayName: "Dropbox",
    icon: "dropbox",
    authUrl: "https://www.dropbox.com/oauth2/authorize",
    tokenUrl: "https://api.dropbox.com/oauth2/token",
    scopes: [],
    clientIdEnv: "DROPBOX_CLIENT_ID",
    clientSecretEnv: "DROPBOX_CLIENT_SECRET"
  }
};

// Cloud file interface
interface CloudFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  path: string;
  modifiedAt: Date;
  isFolder: boolean;
  downloadUrl?: string;
}

// Abstract cloud storage provider
abstract class CloudStorageProvider {
  protected connection: CloudStorageConnection;
  protected config: ProviderConfig;

  constructor(connection: CloudStorageConnection, config: ProviderConfig) {
    this.connection = connection;
    this.config = config;
  }

  abstract listFiles(folderId?: string): Promise<CloudFile[]>;
  abstract downloadFile(fileId: string): Promise<Buffer>;
  abstract getFileMetadata(fileId: string): Promise<CloudFile>;
  abstract getUserInfo(): Promise<{ email: string; name: string }>;
  abstract refreshAccessToken(): Promise<{ accessToken: string; expiresAt: Date }>;

  protected async ensureValidToken(): Promise<string> {
    if (!this.connection.accessToken) {
      throw new Error("No access token available");
    }

    // Check if token is expired (with 5 minute buffer)
    if (this.connection.tokenExpiresAt) {
      const expiresAt = new Date(this.connection.tokenExpiresAt);
      const now = new Date();
      const bufferMs = 5 * 60 * 1000; // 5 minutes

      if (expiresAt.getTime() - now.getTime() < bufferMs) {
        // Refresh the token
        const { accessToken, expiresAt: newExpiresAt } = await this.refreshAccessToken();
        await storage.updateCloudStorageConnectionTokens(this.connection.id, {
          accessToken,
          tokenExpiresAt: newExpiresAt
        });
        return accessToken;
      }
    }

    return this.connection.accessToken;
  }
}

// Google Drive Provider
class GoogleDriveProvider extends CloudStorageProvider {
  async listFiles(folderId?: string): Promise<CloudFile[]> {
    const accessToken = await this.ensureValidToken();
    const targetFolder = folderId || this.connection.rootFolderId || "root";

    const query = `'${targetFolder}' in parents and trashed = false`;
    const fields = "files(id,name,mimeType,size,modifiedTime,webContentLink)";
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&pageSize=100`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error(`Google Drive API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.files || []).map((file: any) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: parseInt(file.size || "0"),
      path: file.name,
      modifiedAt: new Date(file.modifiedTime),
      isFolder: file.mimeType === "application/vnd.google-apps.folder",
      downloadUrl: file.webContentLink
    }));
  }

  async downloadFile(fileId: string): Promise<Buffer> {
    const accessToken = await this.ensureValidToken();
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error(`Google Drive download error: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async getFileMetadata(fileId: string): Promise<CloudFile> {
    const accessToken = await this.ensureValidToken();
    const fields = "id,name,mimeType,size,modifiedTime,webContentLink";
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=${encodeURIComponent(fields)}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error(`Google Drive API error: ${response.status}`);
    }

    const file = await response.json();
    return {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: parseInt(file.size || "0"),
      path: file.name,
      modifiedAt: new Date(file.modifiedTime),
      isFolder: file.mimeType === "application/vnd.google-apps.folder",
      downloadUrl: file.webContentLink
    };
  }

  async getUserInfo(): Promise<{ email: string; name: string }> {
    const accessToken = await this.ensureValidToken();
    const url = "https://www.googleapis.com/oauth2/v2/userinfo";

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error(`Google userinfo error: ${response.status}`);
    }

    const data = await response.json();
    return { email: data.email, name: data.name };
  }

  async refreshAccessToken(): Promise<{ accessToken: string; expiresAt: Date }> {
    if (!this.connection.refreshToken) {
      throw new Error("No refresh token available");
    }

    const clientId = process.env[this.config.clientIdEnv];
    const clientSecret = process.env[this.config.clientSecretEnv];

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials not configured");
    }

    const response = await fetch(this.config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: this.connection.refreshToken,
        grant_type: "refresh_token"
      })
    });

    if (!response.ok) {
      throw new Error(`Token refresh error: ${response.status}`);
    }

    const data = await response.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);
    return { accessToken: data.access_token, expiresAt };
  }
}

// OneDrive Provider
class OneDriveProvider extends CloudStorageProvider {
  async listFiles(folderId?: string): Promise<CloudFile[]> {
    const accessToken = await this.ensureValidToken();
    const targetFolder = folderId || this.connection.rootFolderId || "root";
    
    const url = targetFolder === "root" 
      ? "https://graph.microsoft.com/v1.0/me/drive/root/children"
      : `https://graph.microsoft.com/v1.0/me/drive/items/${targetFolder}/children`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error(`OneDrive API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.value || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      mimeType: item.file?.mimeType || "application/octet-stream",
      size: item.size || 0,
      path: item.name,
      modifiedAt: new Date(item.lastModifiedDateTime),
      isFolder: !!item.folder,
      downloadUrl: item["@microsoft.graph.downloadUrl"]
    }));
  }

  async downloadFile(fileId: string): Promise<Buffer> {
    const accessToken = await this.ensureValidToken();
    const url = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error(`OneDrive download error: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async getFileMetadata(fileId: string): Promise<CloudFile> {
    const accessToken = await this.ensureValidToken();
    const url = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error(`OneDrive API error: ${response.status}`);
    }

    const item = await response.json();
    return {
      id: item.id,
      name: item.name,
      mimeType: item.file?.mimeType || "application/octet-stream",
      size: item.size || 0,
      path: item.name,
      modifiedAt: new Date(item.lastModifiedDateTime),
      isFolder: !!item.folder,
      downloadUrl: item["@microsoft.graph.downloadUrl"]
    };
  }

  async getUserInfo(): Promise<{ email: string; name: string }> {
    const accessToken = await this.ensureValidToken();
    const url = "https://graph.microsoft.com/v1.0/me";

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error(`OneDrive userinfo error: ${response.status}`);
    }

    const data = await response.json();
    return { email: data.userPrincipalName || data.mail, name: data.displayName };
  }

  async refreshAccessToken(): Promise<{ accessToken: string; expiresAt: Date }> {
    if (!this.connection.refreshToken) {
      throw new Error("No refresh token available");
    }

    const clientId = process.env[this.config.clientIdEnv];
    const clientSecret = process.env[this.config.clientSecretEnv];

    if (!clientId || !clientSecret) {
      throw new Error("OneDrive OAuth credentials not configured");
    }

    const response = await fetch(this.config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: this.connection.refreshToken,
        grant_type: "refresh_token"
      })
    });

    if (!response.ok) {
      throw new Error(`Token refresh error: ${response.status}`);
    }

    const data = await response.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);
    return { accessToken: data.access_token, expiresAt };
  }
}

// Dropbox Provider
class DropboxProvider extends CloudStorageProvider {
  async listFiles(folderId?: string): Promise<CloudFile[]> {
    const accessToken = await this.ensureValidToken();
    const path = folderId || this.connection.rootFolderId || "";

    const response = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        path: path === "root" || path === "" ? "" : path,
        recursive: false,
        include_media_info: false
      })
    });

    if (!response.ok) {
      throw new Error(`Dropbox API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.entries || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      mimeType: item[".tag"] === "folder" ? "application/vnd.dropbox.folder" : "application/octet-stream",
      size: item.size || 0,
      path: item.path_display,
      modifiedAt: item.client_modified ? new Date(item.client_modified) : new Date(),
      isFolder: item[".tag"] === "folder"
    }));
  }

  async downloadFile(fileId: string): Promise<Buffer> {
    const accessToken = await this.ensureValidToken();

    const response = await fetch("https://content.dropboxapi.com/2/files/download", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Dropbox-API-Arg": JSON.stringify({ path: fileId })
      }
    });

    if (!response.ok) {
      throw new Error(`Dropbox download error: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async getFileMetadata(fileId: string): Promise<CloudFile> {
    const accessToken = await this.ensureValidToken();

    const response = await fetch("https://api.dropboxapi.com/2/files/get_metadata", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ path: fileId })
    });

    if (!response.ok) {
      throw new Error(`Dropbox API error: ${response.status}`);
    }

    const item = await response.json();
    return {
      id: item.id,
      name: item.name,
      mimeType: item[".tag"] === "folder" ? "application/vnd.dropbox.folder" : "application/octet-stream",
      size: item.size || 0,
      path: item.path_display,
      modifiedAt: item.client_modified ? new Date(item.client_modified) : new Date(),
      isFolder: item[".tag"] === "folder"
    };
  }

  async getUserInfo(): Promise<{ email: string; name: string }> {
    const accessToken = await this.ensureValidToken();

    const response = await fetch("https://api.dropboxapi.com/2/users/get_current_account", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error(`Dropbox userinfo error: ${response.status}`);
    }

    const data = await response.json();
    return { 
      email: data.email, 
      name: data.name?.display_name || data.email 
    };
  }

  async refreshAccessToken(): Promise<{ accessToken: string; expiresAt: Date }> {
    if (!this.connection.refreshToken) {
      throw new Error("No refresh token available");
    }

    const clientId = process.env[this.config.clientIdEnv];
    const clientSecret = process.env[this.config.clientSecretEnv];

    if (!clientId || !clientSecret) {
      throw new Error("Dropbox OAuth credentials not configured");
    }

    const response = await fetch(this.config.tokenUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`
      },
      body: new URLSearchParams({
        refresh_token: this.connection.refreshToken,
        grant_type: "refresh_token"
      })
    });

    if (!response.ok) {
      throw new Error(`Token refresh error: ${response.status}`);
    }

    const data = await response.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);
    return { accessToken: data.access_token, expiresAt };
  }
}

// Factory function to get provider
export function getCloudStorageProvider(connection: CloudStorageConnection): CloudStorageProvider {
  const config = CLOUD_PROVIDERS[connection.provider];
  if (!config) {
    throw new Error(`Unknown cloud storage provider: ${connection.provider}`);
  }

  switch (connection.provider) {
    case "google_drive":
      return new GoogleDriveProvider(connection, config);
    case "onedrive":
      return new OneDriveProvider(connection, config);
    case "dropbox":
      return new DropboxProvider(connection, config);
    default:
      throw new Error(`Unsupported provider: ${connection.provider}`);
  }
}

// Generate OAuth authorization URL
export function getAuthorizationUrl(provider: string, state: string, redirectUri: string): string {
  const config = CLOUD_PROVIDERS[provider];
  if (!config) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  const clientId = process.env[config.clientIdEnv];
  if (!clientId) {
    throw new Error(`${config.displayName} OAuth client ID not configured`);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    state: state,
    access_type: "offline", // For Google
    prompt: "consent" // Force consent to get refresh token
  });

  if (config.scopes.length > 0) {
    params.set("scope", config.scopes.join(" "));
  }

  return `${config.authUrl}?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(
  provider: string,
  code: string,
  redirectUri: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}> {
  const config = CLOUD_PROVIDERS[provider];
  if (!config) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  const clientId = process.env[config.clientIdEnv];
  const clientSecret = process.env[config.clientSecretEnv];

  if (!clientId || !clientSecret) {
    throw new Error(`${config.displayName} OAuth credentials not configured`);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code: code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code"
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Token exchange error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt
  };
}

// Sync files from cloud storage to local storage
export async function syncCloudFiles(
  connection: CloudStorageConnection,
  projectId: number
): Promise<{ added: number; updated: number; errors: number }> {
  const provider = getCloudStorageProvider(connection);
  const stats = { added: 0, updated: 0, errors: 0 };

  try {
    await storage.updateCloudStorageConnectionSyncStatus(connection.id, {
      syncStatus: "syncing"
    });

    const cloudFiles = await provider.listFiles();

    for (const cloudFile of cloudFiles) {
      if (cloudFile.isFolder) continue; // Skip folders for now

      try {
        const existingSync = await storage.getCloudSyncedFileByCloudId(
          connection.id, 
          cloudFile.id
        );

        if (existingSync) {
          // Check if file was modified
          if (cloudFile.modifiedAt > (existingSync.cloudModifiedAt || new Date(0))) {
            await storage.updateCloudSyncedFile(existingSync.id, {
              name: cloudFile.name,
              mimeType: cloudFile.mimeType,
              size: cloudFile.size,
              cloudModifiedAt: cloudFile.modifiedAt,
              syncStatus: "pending"
            });
            stats.updated++;
          }
        } else {
          // Add new file
          await storage.createCloudSyncedFile({
            connectionId: connection.id,
            projectId,
            cloudFileId: cloudFile.id,
            cloudFilePath: cloudFile.path,
            name: cloudFile.name,
            mimeType: cloudFile.mimeType,
            size: cloudFile.size,
            cloudModifiedAt: cloudFile.modifiedAt,
            syncStatus: "pending"
          });
          stats.added++;
        }
      } catch (error) {
        console.error(`Error syncing file ${cloudFile.name}:`, error);
        stats.errors++;
      }
    }

    await storage.updateCloudStorageConnectionSyncStatus(connection.id, {
      syncStatus: "idle",
      lastSyncAt: new Date(),
      syncError: null
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await storage.updateCloudStorageConnectionSyncStatus(connection.id, {
      syncStatus: "error",
      syncError: errorMessage
    });
    throw error;
  }

  return stats;
}
