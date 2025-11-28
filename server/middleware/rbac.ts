import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// Helper to get user ID from request
function getUserId(req: any): string {
  return req.user?.id;
}

// Role hierarchy: owner > admin > member > viewer
const roleHierarchy: Record<string, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

export function requireRole(minRole: 'owner' | 'admin' | 'member' | 'viewer') {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get organization ID from params
      const orgId = req.params.orgId ? parseInt(req.params.orgId) : null;
      
      // For project-based routes, get org from project
      let organizationId = orgId;
      if (!organizationId && req.params.id) {
        // Try to get from project
        const projectId = parseInt(req.params.id);
        if (!isNaN(projectId)) {
          const project = await storage.getProject(projectId);
          if (project) {
            organizationId = project.organizationId;
          }
        }
      }

      if (!organizationId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const userOrg = await storage.getUserOrganization(userId, organizationId);
      if (!userOrg) {
        return res.status(403).json({ message: "Access denied" });
      }

      const userRoleLevel = roleHierarchy[userOrg.role] || 0;
      const requiredRoleLevel = roleHierarchy[minRole] || 0;

      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({ 
          message: `This action requires ${minRole} role or higher` 
        });
      }

      // Attach user role to request for use in handlers
      req.userRole = userOrg.role;
      req.userOrganization = userOrg;
      next();
    } catch (error) {
      console.error("RBAC middleware error:", error);
      res.status(500).json({ message: "Authorization check failed" });
    }
  };
}

// Middleware to check if user has admin or owner role
export const requireAdmin = requireRole('admin');

// Middleware to check if user has owner role
export const requireOwner = requireRole('owner');

// Check if user can manage another user
export async function canManageUser(
  requestingUserId: string,
  targetUserId: string,
  organizationId: number
): Promise<boolean> {
  const requestingUserOrg = await storage.getUserOrganization(requestingUserId, organizationId);
  const targetUserOrg = await storage.getUserOrganization(targetUserId, organizationId);

  if (!requestingUserOrg || !['owner', 'admin'].includes(requestingUserOrg.role)) {
    return false;
  }

  // Owners can manage anyone, admins cannot manage owners
  if (requestingUserOrg.role === 'owner') {
    return true;
  }

  if (requestingUserOrg.role === 'admin' && targetUserOrg?.role !== 'owner') {
    return true;
  }

  return false;
}

