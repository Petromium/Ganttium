import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import type { InsertUserActivityLog } from "@shared/schema";

/**
 * Create audit log entry for user activity
 */
export async function logUserActivity(
  userId: string,
  action: string,
  options: {
    organizationId?: number;
    projectId?: number;
    entityType?: string;
    entityId?: string | number;
    details?: Record<string, any>;
    req?: Request;
  }
): Promise<void> {
  try {
    const ipAddress = options.req?.ip || options.req?.socket.remoteAddress || undefined;
    const userAgent = options.req?.get("user-agent") || undefined;

    await storage.createUserActivityLog({
      userId,
      organizationId: options.organizationId || null,
      projectId: options.projectId || null,
      action,
      entityType: options.entityType || null,
      entityId: options.entityId ? String(options.entityId) : null,
      details: options.details || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Middleware to automatically log API requests (optional, can be added to specific routes)
 */
export function auditMiddleware(action?: string) {
  return async (req: Request & { userId?: string }, res: Response, next: NextFunction) => {
    // Log after response is sent
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      if (req.userId && action) {
        // Extract organization/project from params or body
        const orgId = req.params.orgId ? parseInt(req.params.orgId) : undefined;
        const projectId = req.params.projectId ? parseInt(req.params.projectId) : undefined;

        logUserActivity(req.userId, action, {
          organizationId: orgId,
          projectId: projectId,
          req,
        }).catch(console.error);
      }
      return originalJson(body);
    };
    next();
  };
}

