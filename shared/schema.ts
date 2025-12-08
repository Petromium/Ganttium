import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, pgEnum, unique, index, bigint, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Existing tables
export const users = pgTable("users", {
  id: varchar("id", { length: 100 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }),
  googleId: varchar("google_id", { length: 255 }),
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token", { length: 255 }),
  emailVerificationExpires: timestamp("email_verification_expires"),
  passwordResetToken: varchar("password_reset_token", { length: 255 }),
  passwordResetExpires: timestamp("password_reset_expires"),
  totpSecret: varchar("totp_secret", { length: 255 }),
  totpEnabled: boolean("totp_enabled").default(false),
  backupCodes: text("backup_codes"),
  lastLoginAt: timestamp("last_login_at"),
  isSystemAdmin: boolean("is_system_admin").default(false),
});

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  currency: varchar("currency", { length: 10 }),
  logoUrl: text("logo_url"),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  country: varchar("country", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  taxId: varchar("tax_id", { length: 100 }),
  registrationNumber: varchar("registration_number", { length: 100 }),
  topLevelEntityLabel: varchar("top_level_entity_label", { length: 50 }).default("Organization"),
  topLevelEntityLabelCustom: varchar("top_level_entity_label_custom", { length: 50 }),
  programEntityLabel: varchar("program_entity_label", { length: 50 }).default("Program"),
  programEntityLabelCustom: varchar("program_entity_label_custom", { length: 50 }),
});

export const userOrganizations = pgTable("user_organizations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 100 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  role: text("role").default("member").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userInvitations = pgTable("user_invitations", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 50 }).default("member").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  invitedBy: varchar("invited_by", { length: 100 }).references(() => users.id),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, accepted, expired, revoked
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userActivityLogs = pgTable("user_activity_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 100 }).references(() => users.id, { onDelete: "set null" }),
  organizationId: integer("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }),
  entityId: integer("entity_id"),
  details: jsonb("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }),
  description: text("description"),
  managerId: varchar("manager_id", { length: 100 }).references(() => users.id),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: varchar("status", { length: 20 }).default("active"),
  isVirtual: boolean("is_virtual").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgSlugUnique: unique().on(table.organizationId, table.slug),
}));

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  programId: integer("program_id").references(() => programs.id), // Optional link to program/group
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  budget: numeric("budget"),
  currency: varchar("currency", { length: 3 }).default("USD"),
  status: varchar("status", { length: 50 }).default("planning"),
  // EPC Performance Metrics
  baselineCost: numeric("baseline_cost").default("0"),
  actualCost: numeric("actual_cost").default("0"),
  earnedValue: numeric("earned_value").default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectTemplates = pgTable("project_templates", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  structure: jsonb("structure"),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  parentId: integer("parent_id"), // Self-reference for subtasks
  wbsCode: varchar("wbs_code", { length: 50 }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  assignedTo: varchar("assigned_to", { length: 100 }).references(() => users.id),
  assignedToName: varchar("assigned_to_name", { length: 255 }),
  status: varchar("status", { length: 50 }).default("not-started"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  customStatusId: integer("custom_status_id").references(() => projectStatuses.id),
  
  // Advanced Fields
  discipline: varchar("discipline", { length: 50 }),
  disciplineLabel: varchar("discipline_label", { length: 100 }),
  areaCode: varchar("area_code", { length: 50 }),
  weightFactor: numeric("weight_factor"),
  constraintType: varchar("constraint_type", { length: 50 }),
  constraintDate: timestamp("constraint_date"),
  baselineStart: timestamp("baseline_start"),
  baselineFinish: timestamp("baseline_finish"),
  actualStartDate: timestamp("actual_start_date"),
  actualFinishDate: timestamp("actual_finish_date"),
  workMode: varchar("work_mode", { length: 20 }).default("fixed-duration"),
  isMilestone: boolean("is_milestone").default(false),
  isCriticalPath: boolean("is_critical_path").default(false),
  estimatedHours: numeric("estimated_hours"),
  actualHours: numeric("actual_hours"),
  // Task EVA Metrics
  baselineCost: numeric("baseline_cost").default("0"),
  actualCost: numeric("actual_cost").default("0"),
  earnedValue: numeric("earned_value").default("0"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  progress: integer("progress").default(0),
  createdBy: varchar("created_by", { length: 100 }), // User ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Self-relation for tasks
export const taskRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  parent: one(tasks, {
    fields: [tasks.parentId],
    references: [tasks.id],
    relationName: "subtasks",
  }),
  children: many(tasks, {
    relationName: "subtasks",
  }),
}));

export const taskMaterials = pgTable("task_materials", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  materialId: integer("material_id").notNull(), 
  name: varchar("name", { length: 255 }).notNull(),
  quantity: decimal("quantity").notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  cost: decimal("cost").default("0").notNull(),
  actualQuantity: decimal("actual_quantity").default("0"),
  actualCost: decimal("actual_cost").default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const materialConsumptions = pgTable("material_consumptions", {
  id: serial("id").primaryKey(),
  taskMaterialId: integer("task_material_id").notNull().references(() => taskMaterials.id),
  quantity: decimal("quantity").notNull(),
  consumedAt: timestamp("consumed_at").defaultNow().notNull(),
  consumedBy: varchar("consumed_by", { length: 100 }).references(() => users.id),
  notes: text("notes"),
});

export const materialDeliveries = pgTable("material_deliveries", {
  id: serial("id").primaryKey(),
  taskMaterialId: integer("task_material_id").notNull().references(() => taskMaterials.id),
  quantity: decimal("quantity").notNull(),
  deliveredAt: timestamp("delivered_at").defaultNow().notNull(),
  supplier: varchar("supplier", { length: 100 }),
  notes: text("notes"),
});

export const risks = pgTable("risks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  code: varchar("code", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  status: varchar("status", { length: 50 }).default("identified"),
  probability: integer("probability").default(3), // 1-5
  impact: varchar("impact", { length: 20 }).default("medium"),
  mitigationPlan: text("mitigation_plan"),
  // Response Strategy
  responseStrategy: varchar("response_strategy", { length: 50 }), // 'avoid', 'mitigate', 'transfer', 'accept'
  owner: varchar("owner", { length: 100 }),
  // Risk Quantitative Metrics
  costImpact: numeric("cost_impact"),
  scheduleImpact: integer("schedule_impact"), // Days
  riskExposure: numeric("risk_exposure"), // Monetary value (Probability% * Cost Impact)
  contingencyReserve: numeric("contingency_reserve"),
  assignedTo: varchar("assigned_to", { length: 100 }),
  targetResolutionDate: timestamp("target_resolution_date"),
  identifiedDate: timestamp("identified_date").defaultNow(),
  closedDate: timestamp("closed_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  code: varchar("code", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("open"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  category: varchar("category", { length: 100 }),
  assignedTo: varchar("assigned_to", { length: 100 }),
  reportedBy: varchar("reported_by", { length: 100 }),
  reportedDate: timestamp("reported_date").defaultNow(),
  resolvedDate: timestamp("resolved_date"),
  resolution: text("resolution"),
  issueType: varchar("issue_type", { length: 50 }).default("standard"), // 'standard', 'ncr', 'hse', etc.
  impactCost: numeric("impact_cost"),
  impactSchedule: integer("impact_schedule"), // Days
  impactQuality: varchar("impact_quality", { length: 50 }),
  impactSafety: varchar("impact_safety", { length: 50 }),
  discipline: varchar("discipline", { length: 50 }),
  escalationLevel: varchar("escalation_level", { length: 50 }),
  targetResolutionDate: timestamp("target_resolution_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const stakeholders = pgTable("stakeholders", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  name: varchar("name", { length: 100 }).notNull(),
  role: varchar("role", { length: 100 }),
  organization: varchar("organization", { length: 100 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  influence: varchar("influence", { length: 20 }).default("medium"),
  interest: varchar("interest", { length: 20 }).default("medium"),
  notes: text("notes"),
  // Communication Intelligence Fields
  communicationStyle: varchar("communication_style", { length: 50 }), // 'direct', 'diplomatic', 'detailed', 'brief'
  preferredChannel: varchar("preferred_channel", { length: 50 }), // 'email', 'chat', 'phone', 'meeting'
  updateFrequency: varchar("update_frequency", { length: 50 }), // 'daily', 'weekly', 'bi-weekly', 'milestone-only'
  engagementLevel: integer("engagement_level"), // 1-5 (Manual or calculated)
  lastInteractionDate: timestamp("last_interaction_date"), // Auto-updated from messages/comments
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const costItems = pgTable("cost_items", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  taskId: integer("task_id").references(() => tasks.id),
  category: varchar("category", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  budgeted: numeric("budgeted").notNull(),
  actual: numeric("actual").default("0"),
  variance: numeric("variance").default("0"), // Calculated
  committed: numeric("committed").default("0"),
  forecast: numeric("forecast").default("0"),
  referenceNumber: varchar("reference_number", { length: 50 }),
  status: varchar("status", { length: 50 }),
  invoiceDate: timestamp("invoice_date"),
  paidDate: timestamp("paid_date"),
  currency: varchar("currency", { length: 10 }).default("USD"),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Communication Intelligence System
export const communicationMetrics = pgTable("communication_metrics", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  stakeholderId: integer("stakeholder_id").references(() => stakeholders.id, { onDelete: "cascade" }),
  userId: integer("user_id"), // For internal team members (no FK due to users.id type mismatch)
  
  // Core Metrics
  responseTimeAvg: integer("response_time_avg"), // Average response time in minutes
  overdueCount: integer("overdue_count").default(0), // Unanswered critical messages
  messageCount: integer("message_count").default(0), // Total messages sent/received
  escalationCount: integer("escalation_count").default(0), // Number of escalations
  
  // Health Status
  healthStatus: varchar("health_status", { length: 20 }).default("healthy"), // 'healthy', 'at-risk', 'critical'
  healthScore: integer("health_score").default(100), // 0-100 calculated score
  
  // Timestamps
  lastInteractionDate: timestamp("last_interaction_date"),
  lastResponseDate: timestamp("last_response_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  projectStakeholderIdx: index("comm_metrics_project_stakeholder_idx").on(table.projectId, table.stakeholderId),
  projectUserIdx: index("comm_metrics_project_user_idx").on(table.projectId, table.userId),
}));

// Resources tables
export const resourceGroups = pgTable("resource_groups", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 20 }),
  parentId: integer("parent_id"), // For hierarchy
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const resourceGroupMembers = pgTable("resource_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => resourceGroups.id, { onDelete: "cascade" }),
  resourceId: integer("resource_id").notNull(), // ref defined later
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Resource Pricing Tiers
export const resourcePricingTiers = pgTable("resource_pricing_tiers", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").notNull(), // Will add reference after resources table defined
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Standard", "Overtime", "Weekend"
  rate: numeric("rate").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  multiplier: numeric("multiplier").default("1.0"), // For calculating from base rate
  effectiveDate: timestamp("effective_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id), // Should be organizationId in improved model but sticking to project based on current flow
  groupId: integer("group_id").references(() => resourceGroups.id),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'labor', 'equipment', 'material'
  discipline: varchar("discipline", { length: 100 }),
  role: varchar("role", { length: 100 }),
  status: varchar("status", { length: 50 }).default("active"),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  
  // Availability
  calendarId: integer("calendar_id"), // Reference to calendar table (future)
  availability: numeric("availability").default("100"), // % availability
  
  // Costing
  costType: varchar("cost_type", { length: 50 }).default("hourly"), // 'hourly', 'fixed', 'unit'
  baseRate: numeric("base_rate"),
  currency: varchar("currency", { length: 3 }).default("USD"),
  
  // Material specific
  unit: varchar("unit", { length: 20 }), // e.g., 'm3', 'kg', 'each'
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Add foreign key for resourcePricingTiers
export const resourcePricingTiersRelations = relations(resourcePricingTiers, ({ one }) => ({
  resource: one(resources, {
    fields: [resourcePricingTiers.resourceId],
    references: [resources.id],
  }),
}));

export const resourceAssignments = pgTable("resource_assignments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  resourceId: integer("resource_id").notNull().references(() => resources.id),
  allocation: integer("allocation").default(100).notNull(), // Percentage
  effortHours: numeric("effort_hours"), // Planned effort for this resource on this task
  cost: numeric("cost"), // Calculated cost
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const resourceTimeEntries = pgTable("resource_time_entries", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").notNull().references(() => resources.id),
  taskId: integer("task_id").references(() => tasks.id),
  projectId: integer("project_id").notNull().references(() => projects.id),
  date: timestamp("date").notNull(),
  hours: decimal("hours").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tags System
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }), // e.g., "Project Type", "Risk Area", "Discipline"
  color: varchar("color", { length: 20 }).default("#007bff"), // Hex color for UI
  description: text("description"),
  usageCount: integer("usage_count").default(0).notNull(), // How many times this tag is assigned
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgNameUnique: unique("tags_org_name_unique").on(table.organizationId, table.name),
  orgCategoryIdx: index("tags_org_category_idx").on(table.organizationId, table.category),
}));

export const tagEntityTypeEnum = pgEnum("tag_entity_type", [
  "organization", "program", "project", "task", "risk", "issue", "document", "resource", "contact", "lesson"
]);

export const tagAssignments = pgTable("tag_assignments", {
  id: serial("id").primaryKey(),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  entityType: tagEntityTypeEnum("entity_type").notNull(),
  entityId: integer("entity_id").notNull(), // ID of the assigned entity (project, task, etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  tagEntityUnique: unique("tag_assignments_unique").on(table.tagId, table.entityType, table.entityId),
  entityIdx: index("tag_assignments_entity_idx").on(table.entityType, table.entityId),
}));

// Lessons Learned System
export const lessonsLearned = pgTable("lessons_learned", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  projectId: integer("project_id").references(() => projects.id), // Optional link to specific project
  issueId: integer("issue_id").references(() => issues.id), // Optional link to source issue
  riskId: integer("risk_id").references(() => risks.id), // Optional link to source risk
  
  category: varchar("category", { length: 50 }).notNull(), // e.g., "Procurement", "Safety", "Quality", "Schedule"
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(), // The "Situation" / "Context"
  rootCause: text("root_cause"), // "Why it happened"
  actionTaken: text("action_taken"), // "What we did"
  outcome: text("outcome"), // "Result"
  
  impactRating: integer("impact_rating").default(1), // 1-5 (1: Low, 5: Critical)
  
  // Metadata for applicability
  applicability: varchar("applicability", { length: 50 }).default("global"), // 'global', 'project_specific', 'department'
  
  createdBy: varchar("created_by", { length: 100 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Documents table (schema placeholder – align with actual DB structure)
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
  documentNumber: varchar("document_number", { length: 100 }),
  name: varchar("name", { length: 200 }).notNull(),
  title: varchar("title", { length: 255 }), // Often same as name but formal title
  description: text("description"),
  category: varchar("category", { length: 50 }),
  discipline: varchar("discipline", { length: 50 }),
  documentType: varchar("document_type", { length: 50 }), // e.g., 'drawing', 'spec', 'report'
  revision: varchar("revision", { length: 20 }).default("0"),
  status: varchar("status", { length: 50 }).default("draft"),
  fileUrl: text("file_url"),
  fileType: varchar("file_type", { length: 50 }),
  sizeBytes: integer("size_bytes"),
  uploadedBy: varchar("uploaded_by", { length: 100 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Notification rules (schema placeholder – align with actual DB structure)
export const notificationRules = pgTable("notification_rules", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  eventType: varchar("event_type", { length: 50 }), // e.g., "task-overdue"
  condition: jsonb("condition"),
  recipients: jsonb("recipients").$type<number[]>().default([]),
  channel: varchar("channel", { length: 20 }).default("email"),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by", { length: 100 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notificationLogs = pgTable("notification_logs", {
  id: serial("id").primaryKey(),
  notificationId: integer("notification_id").references(() => notifications.id),
  ruleId: integer("rule_id").references(() => notificationRules.id),
  projectId: integer("project_id").references(() => projects.id),
  recipient: varchar("recipient", { length: 255 }),
  channel: varchar("channel", { length: 20 }),
  status: varchar("status", { length: 50 }),
  sentAt: timestamp("sent_at").defaultNow(),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Push notification subscriptions for PWA
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 100 }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(), // Public key
  auth: text("auth").notNull(), // Auth secret
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- New Tables for Admin Dashboard & Subscription System ---

export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  tier: varchar("tier", { length: 50 }).notNull().unique(), // free, pro, enterprise
  name: varchar("name", { length: 100 }).notNull(),
  priceMonthly: integer("price_monthly"), // In cents
  priceYearly: integer("price_yearly"), // In cents
  currency: varchar("currency", { length: 3 }).default("USD"),
  storageQuotaBytes: bigint("storage_quota_bytes", { mode: "number" }),
  aiTokenLimit: integer("ai_token_limit"),
  projectLimit: integer("project_limit"),
  userLimit: integer("user_limit"),
  features: jsonb("features"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const organizationSubscriptions = pgTable("organization_subscriptions", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
  status: varchar("status", { length: 50 }).default("active"), // active, cancelled, past_due
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  autoRenew: boolean("auto_renew").default(true),
  paymentMethodId: varchar("payment_method_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const aiActionLogs = pgTable("ai_action_logs", {
  id: serial("id").primaryKey(),
  actionId: varchar("action_id", { length: 100 }).notNull(),
  userId: varchar("user_id", { length: 100 }).references(() => users.id),
  projectId: integer("project_id").references(() => projects.id),
  action: varchar("action", { length: 100 }).notNull(),
  details: jsonb("details"),
  status: varchar("status", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const aiUsageSummary = pgTable("ai_usage_summary", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM
  tokensUsed: integer("tokens_used").default(0).notNull(),
  requestCount: integer("request_count").default(0).notNull(),
  tokenLimit: integer("token_limit"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgMonthUnique: unique("ai_usage_org_month_unique").on(table.organizationId, table.month),
}));

export const cloudStorageConnections = pgTable("cloud_storage_connections", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 50 }).notNull(), // 'google-drive', 'dropbox', 'onedrive'
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  syncStatus: varchar("sync_status", { length: 50 }).default("inactive"), // 'active', 'syncing', 'error', 'inactive'
  lastSyncAt: timestamp("last_sync_at"),
  syncError: text("sync_error"),
  connectedBy: varchar("connected_by", { length: 100 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgProviderUnique: unique("cloud_storage_org_provider_unique").on(table.organizationId, table.provider),
}));

export const cloudSyncedFiles = pgTable("cloud_synced_files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
  connectionId: integer("connection_id").references(() => cloudStorageConnections.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  cloudFileId: varchar("cloud_file_id", { length: 255 }).notNull(),
  cloudFilePath: text("cloud_file_path"),
  fileType: varchar("file_type", { length: 50 }),
  sizeBytes: bigint("size_bytes", { mode: "number" }),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Custom Dashboard Layouts (Epic 16: Advanced Features)
export const customDashboards = pgTable("custom_dashboards", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 100 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }), // null = global dashboard
  name: varchar("name", { length: 100 }).notNull(),
  layout: jsonb("layout").notNull(), // Array of widget configurations with positions
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userProjectUnique: unique("custom_dashboards_user_project_unique").on(table.userId, table.projectId),
}));

// Bug Reports & User Feedback
export const bugReports = pgTable("bug_reports", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 100 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: integer("organization_id").references(() => organizations.id, { onDelete: "set null" }),
  
  // Report Details
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // bug, feature-request, feedback, other
  severity: varchar("severity", { length: 20 }).default("medium"), // low, medium, high, critical
  status: varchar("status", { length: 20 }).default("pending"), // pending, reviewing, in-progress, resolved, rejected, duplicate
  
  // Additional Context
  stepsToReproduce: text("steps_to_reproduce"),
  expectedBehavior: text("expected_behavior"),
  actualBehavior: text("actual_behavior"),
  screenshots: jsonb("screenshots"), // Array of URLs or base64
  browserInfo: jsonb("browser_info"), // { name, version, os, userAgent }
  deviceInfo: jsonb("device_info"), // { type, screenSize, etc }
  
  // Sanitization & Moderation
  sanitized: boolean("sanitized").default(false),
  sanitizedAt: timestamp("sanitized_at"),
  sanitizedBy: varchar("sanitized_by", { length: 100 }), // User ID of admin who sanitized
  moderationNotes: text("moderation_notes"), // Internal notes from moderation
  
  // Backlog Integration
  backlogItemId: integer("backlog_item_id"), // Reference to backlog item if created
  backlogStatus: varchar("backlog_status", { length: 50 }), // Synced from backlog
  
  // Resolution
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by", { length: 100 }), // User ID of admin who resolved
  resolutionNotes: text("resolution_notes"), // Public resolution notes
  internalResolutionNotes: text("internal_resolution_notes"), // Private admin notes
  
  // Notifications
  initialNotificationSent: boolean("initial_notification_sent").default(false),
  resolutionNotificationSent: boolean("resolution_notification_sent").default(false),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("bug_reports_user_id_idx").on(table.userId),
  statusIdx: index("bug_reports_status_idx").on(table.status),
  createdAtIdx: index("bug_reports_created_at_idx").on(table.createdAt),
}));

// --- RESTORED MISSING TABLES ---

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  jobTitle: varchar("job_title", { length: 100 }),
  company: varchar("company", { length: 100 }),
  type: varchar("type", { length: 50 }),
  role: varchar("role", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contactLogs = pgTable("contact_logs", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 100 }).references(() => users.id),
  type: varchar("type", { length: 50 }), // 'call', 'email', 'meeting'
  notes: text("notes"),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
  taskId: integer("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).default("channel"), // 'channel', 'dm'
  name: varchar("name", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const   chatParticipants = pgTable("chat_participants", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 100 }).notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  lastReadAt: timestamp("last_read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => chatConversations.id, { onDelete: "cascade" }), // Changed from projectId
  userId: varchar("user_id", { length: 100 }).notNull().references(() => users.id),
  message: text("message").notNull(),
  attachments: jsonb("attachments"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messageReactions = pgTable("message_reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => chatMessages.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 100 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  emoji: varchar("emoji", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const changeRequests = pgTable("change_requests", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  code: varchar("code", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("draft"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  reason: text("reason"),
  impactAnalysis: text("impact_analysis"),
  costImpact: numeric("cost_impact"),
  scheduleImpact: integer("schedule_impact"), // Days
  requestedBy: varchar("requested_by", { length: 100 }).references(() => users.id),
  requestedDate: timestamp("requested_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const changeRequestApprovals = pgTable("change_request_approvals", {
  id: serial("id").primaryKey(),
  changeRequestId: integer("change_request_id").notNull().references(() => changeRequests.id, { onDelete: "cascade" }),
  reviewerId: varchar("reviewer_id", { length: 100 }).references(() => users.id),
  status: varchar("status", { length: 50 }).default("pending"),
  sequence: integer("sequence").default(1),
  comments: text("comments"),
  approvalDate: timestamp("approval_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const changeRequestTasks = pgTable("change_request_tasks", {
  id: serial("id").primaryKey(),
  changeRequestId: integer("change_request_id").notNull().references(() => changeRequests.id, { onDelete: "cascade" }),
  taskId: integer("task_id").references(() => tasks.id), // Existing task modified
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const changeRequestTemplates = pgTable("change_request_templates", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  name: varchar("name", { length: 100 }).notNull(),
  fields: jsonb("fields"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const taskDependencies = pgTable("task_dependencies", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  predecessorId: integer("predecessor_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  successorId: integer("successor_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).default("fs"), // FS, SS, FF, SF
  lag: integer("lag").default(0),
  lagDays: integer("lag_days").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projectStatuses = pgTable("project_status", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 50 }).notNull(),
  code: varchar("code", { length: 20 }),
  color: varchar("color", { length: 20 }),
  order: integer("order").default(0),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const kanbanColumns = pgTable("kanban_columns", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 50 }).notNull(),
  statusId: varchar("status_id", { length: 50 }), // For mapping to system statuses
  customStatusId: integer("custom_status_id").references(() => projectStatuses.id),
  order: integer("order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const exchangeRates = pgTable("exchange_rates", {
  id: serial("id").primaryKey(),
  baseCurrency: varchar("base_currency", { length: 3 }).default("USD").notNull(),
  targetCurrency: varchar("target_currency", { length: 3 }).notNull(),
  rate: numeric("rate").notNull(), // base -> target
  date: timestamp("date").notNull(),
  source: varchar("source", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const exchangeRateSyncs = pgTable("exchange_rate_sync", {
  id: serial("id").primaryKey(),
  status: varchar("status", { length: 50 }),
  syncDate: timestamp("sync_date"),
  error: text("error"),
});

export const costBreakdownStructure = pgTable("cost_breakdown_structure", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"),
  code: varchar("code", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  level: integer("level").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const costItemCBSLinks = pgTable("cost_item_cbs_links", {
  id: serial("id").primaryKey(),
  costItemId: integer("cost_item_id").notNull().references(() => costItems.id, { onDelete: "cascade" }),
  cbsId: integer("cbs_id").notNull().references(() => costBreakdownStructure.id, { onDelete: "cascade" }),
  allocation: numeric("allocation").default("100"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const procurementRequisitions = pgTable("procurement_requisitions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  description: text("description").notNull(),
  requisitionNumber: varchar("requisition_number", { length: 50 }),
  requestedBy: varchar("requested_by", { length: 100 }).references(() => users.id),
  status: varchar("status", { length: 50 }).default("draft"),
  requestedDate: timestamp("requested_date"),
  requiredDate: timestamp("required_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const resourceRequirements = pgTable("resource_requirements", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  taskId: integer("task_id").references(() => tasks.id),
  resourceType: varchar("resource_type", { length: 50 }),
  quantity: numeric("quantity"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const inventoryAllocations = pgTable("inventory_allocations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  resourceId: integer("resource_id").references(() => resources.id),
  quantity: numeric("quantity"),
  allocatedDate: timestamp("allocated_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const googleConnections = pgTable("google_connections", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 100 }).notNull().references(() => users.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  scope: text("scope"),
  expiryDate: bigint("expiry_date", { mode: "number" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const aiConversations = pgTable("ai_conversations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 100 }).notNull().references(() => users.id),
  projectId: integer("project_id").references(() => projects.id),
  title: varchar("title", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const aiMessages = pgTable("ai_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => aiConversations.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(), // user, assistant, system
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiUsage = pgTable("ai_usage", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 100 }).notNull().references(() => users.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  tokensInput: integer("tokens_input"),
  tokensOutput: integer("tokens_output"),
  model: varchar("model", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }),
  subject: varchar("subject", { length: 255 }),
  body: text("body"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sentEmails = pgTable("sent_emails", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  recipient: varchar("recipient", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  status: varchar("status", { length: 50 }),
});

export const emailUsage = pgTable("email_usage", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  emailsSent: integer("emails_sent").default(0).notNull(),
  month: varchar("month", { length: 7 }), // YYYY-MM
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectFiles = pgTable("project_files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  organizationId: integer("organization_id").references(() => organizations.id), // Added for direct org access
  name: varchar("name", { length: 255 }).notNull(),
  url: text("url").notNull(),
  size: integer("size"),
  type: varchar("type", { length: 50 }),
  uploadedBy: varchar("uploaded_by", { length: 100 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const storageQuotas = pgTable("storage_quota", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  usedBytes: bigint("used_bytes", { mode: "number" }).default(0),
  limitBytes: bigint("limit_bytes", { mode: "number" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const taskDocuments = pgTable("task_documents", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  documentId: integer("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const taskRisks = pgTable("task_risks", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  riskId: integer("risk_id").notNull().references(() => risks.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const taskIssues = pgTable("task_issues", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  issueId: integer("issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 100 }).notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  type: varchar("type", { length: 50 }), // info, warning, error
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projectEvents = pgTable("project_events", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  type: varchar("type", { length: 50 }), // milestone, meeting, etc
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Helper for stakeholderRaci
export const stakeholderRaci = pgTable("stakeholder_raci", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id),
  stakeholderId: integer("stakeholder_id").notNull().references(() => stakeholders.id),
  projectId: integer("project_id").references(() => projects.id), // Added for project level context
  resourceId: integer("resource_id").references(() => resources.id), // Added for resource linkage
  inheritedFromTaskId: integer("inherited_from_task_id").references(() => tasks.id), // Added for inheritance
  raciType: varchar("raci_type", { length: 1 }).notNull(), // R, A, C, I
  isInherited: boolean("is_inherited").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod Schemas
export const insertUserSchema = createInsertSchema(users);
export const insertProjectTemplateSchema = createInsertSchema(projectTemplates);
export const insertProjectSchema = createInsertSchema(projects);
export const insertTaskSchema = createInsertSchema(tasks);
export const insertRiskSchema = createInsertSchema(risks);
export const insertIssueSchema = createInsertSchema(issues);
export const insertStakeholderSchema = createInsertSchema(stakeholders);
export const insertCostItemSchema = createInsertSchema(costItems);
export const insertOrganizationSchema = createInsertSchema(organizations);
export const insertProgramSchema = createInsertSchema(programs);
export const insertResourceSchema = createInsertSchema(resources);
export const insertDocumentSchema = createInsertSchema(documents);
export const insertNotificationRuleSchema = createInsertSchema(notificationRules);

// Tags Zod Schemas
export const insertTagSchema = createInsertSchema(tags).omit({ 
  id: true, 
  usageCount: true, 
  createdAt: true, 
  updatedAt: true 
});
export const updateTagSchema = insertTagSchema.partial();
export const insertTagAssignmentSchema = createInsertSchema(tagAssignments).omit({ 
  id: true, 
  createdAt: true 
});

// Lessons Learned Zod Schemas
export const insertLessonLearnedSchema = createInsertSchema(lessonsLearned).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export const updateLessonLearnedSchema = insertLessonLearnedSchema.partial();

// Communication Metrics Zod Schemas
export const insertCommunicationMetricsSchema = createInsertSchema(communicationMetrics).omit({
  id: true, 
  createdAt: true, 
  updatedAt: true
});
export const updateCommunicationMetricsSchema = insertCommunicationMetricsSchema.partial();

// New Schemas
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans);
export const insertOrganizationSubscriptionSchema = createInsertSchema(organizationSubscriptions);
export const insertAiUsageSummarySchema = createInsertSchema(aiUsageSummary);
export const insertCloudStorageConnectionSchema = createInsertSchema(cloudStorageConnections);
export const insertCloudSyncedFileSchema = createInsertSchema(cloudSyncedFiles);
export const insertCustomDashboardSchema = createInsertSchema(customDashboards);
export const insertBugReportSchema = createInsertSchema(bugReports).omit({
  id: true,
  sanitized: true,
  sanitizedAt: true,
  sanitizedBy: true,
  moderationNotes: true,
  backlogItemId: true,
  backlogStatus: true,
  resolvedAt: true,
  resolvedBy: true,
  resolutionNotes: true,
  internalResolutionNotes: true,
  initialNotificationSent: true,
  resolutionNotificationSent: true,
  createdAt: true,
  updatedAt: true,
});
export const updateBugReportSchema = insertBugReportSchema.partial();

export const insertContactSchema = createInsertSchema(contacts);
export const insertContactLogSchema = createInsertSchema(contactLogs);
export const insertChatConversationSchema = createInsertSchema(chatConversations);
export const insertChatParticipantSchema = createInsertSchema(chatParticipants);
export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const insertChangeRequestSchema = createInsertSchema(changeRequests);
export const insertChangeRequestApprovalSchema = createInsertSchema(changeRequestApprovals);
export const insertChangeRequestTaskSchema = createInsertSchema(changeRequestTasks);
export const insertChangeRequestTemplateSchema = createInsertSchema(changeRequestTemplates);
export const insertTaskDependencySchema = createInsertSchema(taskDependencies);
export const insertProjectStatusSchema = createInsertSchema(projectStatuses);
export const updateProjectStatusSchema = insertProjectStatusSchema.partial();
export const insertKanbanColumnSchema = createInsertSchema(kanbanColumns);
export const updateKanbanColumnSchema = insertKanbanColumnSchema.partial();
export const insertExchangeRateSchema = createInsertSchema(exchangeRates);
export const insertExchangeRateSyncSchema = createInsertSchema(exchangeRateSyncs);
export const insertProcurementRequisitionSchema = createInsertSchema(procurementRequisitions);
export const insertResourceRequirementSchema = createInsertSchema(resourceRequirements);
export const insertInventoryAllocationSchema = createInsertSchema(inventoryAllocations);
export const insertGoogleConnectionSchema = createInsertSchema(googleConnections);
export const insertAiConversationSchema = createInsertSchema(aiConversations);
export const insertAiMessageSchema = createInsertSchema(aiMessages);
export const insertAiUsageSchema = createInsertSchema(aiUsage);
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates);
export const insertSentEmailSchema = createInsertSchema(sentEmails);
export const insertEmailUsageSchema = createInsertSchema(emailUsage);
export const insertProjectFileSchema = createInsertSchema(projectFiles);
export const insertStorageQuotaSchema = createInsertSchema(storageQuotas);
export const insertTaskDocumentSchema = createInsertSchema(taskDocuments);
export const insertTaskRiskSchema = createInsertSchema(taskRisks);
export const insertTaskIssueSchema = createInsertSchema(taskIssues);
export const insertNotificationSchema = createInsertSchema(notifications);
export const updateNotificationSchema = insertNotificationSchema.partial();
export const insertNotificationLogSchema = createInsertSchema(notificationLogs);
export const insertProjectEventSchema = createInsertSchema(projectEvents);
export const insertStakeholderRaciSchema = createInsertSchema(stakeholderRaci);
export const insertCostBreakdownStructureSchema = createInsertSchema(costBreakdownStructure);
export const insertCostItemCBSLinkSchema = createInsertSchema(costItemCBSLinks);
export const insertTaskMaterialSchema = createInsertSchema(taskMaterials);
export const insertMaterialConsumptionSchema = createInsertSchema(materialConsumptions);
export const insertMaterialDeliverySchema = createInsertSchema(materialDeliveries);
export const insertResourceGroupSchema = createInsertSchema(resourceGroups);
export const insertResourceGroupMemberSchema = createInsertSchema(resourceGroupMembers);
export const insertResourceTimeEntrySchema = createInsertSchema(resourceTimeEntries);
export const insertMessageReactionSchema = createInsertSchema(messageReactions);
export const insertAiActionLogSchema = createInsertSchema(aiActionLogs);

export type CostBreakdownStructure = typeof costBreakdownStructure.$inferSelect;
export type InsertCostBreakdownStructure = typeof costBreakdownStructure.$inferInsert;
export type CostItemCBSLink = typeof costItemCBSLinks.$inferSelect;
export type InsertCostItemCBSLink = typeof costItemCBSLinks.$inferInsert;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UserOrganization = typeof userOrganizations.$inferSelect;
export type InsertUserOrganization = typeof userOrganizations.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;
export type Program = typeof programs.$inferSelect;
export type InsertProgram = typeof programs.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
export type ProjectTemplate = typeof projectTemplates.$inferSelect;
export type InsertProjectTemplate = typeof projectTemplates.$inferInsert;
export type Risk = typeof risks.$inferSelect;
export type InsertRisk = typeof risks.$inferInsert;
export type Issue = typeof issues.$inferSelect;
export type InsertIssue = typeof issues.$inferInsert;
export type Stakeholder = typeof stakeholders.$inferSelect;
export type InsertStakeholder = typeof stakeholders.$inferInsert;
export type CostItem = typeof costItems.$inferSelect;
export type InsertCostItem = typeof costItems.$inferInsert;
export type Resource = typeof resources.$inferSelect;
export type InsertResource = typeof resources.$inferInsert;
export type ResourceAssignment = typeof resourceAssignments.$inferSelect;
export const insertResourceAssignmentSchema = createInsertSchema(resourceAssignments);
export type InsertResourceAssignment = typeof resourceAssignments.$inferInsert;

export const insertUserInvitationSchema = createInsertSchema(userInvitations);
export type UserInvitation = typeof userInvitations.$inferSelect;
export type InsertUserInvitation = typeof userInvitations.$inferInsert;

export const insertUserActivityLogSchema = createInsertSchema(userActivityLogs);
export type UserActivityLog = typeof userActivityLogs.$inferSelect;
export type InsertUserActivityLog = typeof userActivityLogs.$inferInsert;

// Tags Types
export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type UpdateTag = z.infer<typeof updateTagSchema>;
export type TagAssignment = typeof tagAssignments.$inferSelect;
export type InsertTagAssignment = z.infer<typeof insertTagAssignmentSchema>;
export type TagEntityType = "organization" | "program" | "project" | "task" | "risk" | "issue" | "document" | "resource" | "contact" | "lesson";

// Lessons Learned Types
export type LessonLearned = typeof lessonsLearned.$inferSelect;
export type InsertLessonLearned = z.infer<typeof insertLessonLearnedSchema>;
export type UpdateLessonLearned = z.infer<typeof updateLessonLearnedSchema>;

// Communication Metrics Types
export type CommunicationMetrics = typeof communicationMetrics.$inferSelect;
export type InsertCommunicationMetrics = z.infer<typeof insertCommunicationMetricsSchema>;
export type UpdateCommunicationMetrics = z.infer<typeof updateCommunicationMetricsSchema>;

// Document Types
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// Notification Rule Types
export type NotificationRule = typeof notificationRules.$inferSelect;
export type InsertNotificationRule = typeof notificationRules.$inferInsert;

// Push Subscription Types
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

// New Types
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type OrganizationSubscription = typeof organizationSubscriptions.$inferSelect;
export type InsertOrganizationSubscription = typeof organizationSubscriptions.$inferInsert;
export type AiUsageSummary = typeof aiUsageSummary.$inferSelect;
export type InsertAiUsageSummary = typeof aiUsageSummary.$inferInsert;
export type CloudStorageConnection = typeof cloudStorageConnections.$inferSelect;
export type InsertCloudStorageConnection = typeof cloudStorageConnections.$inferInsert;
export type CloudSyncedFile = typeof cloudSyncedFiles.$inferSelect;
export type InsertCloudSyncedFile = typeof cloudSyncedFiles.$inferInsert;
export type CustomDashboard = typeof customDashboards.$inferSelect;
export type InsertCustomDashboard = typeof customDashboards.$inferInsert;
export type BugReport = typeof bugReports.$inferSelect;
export type InsertBugReport = z.infer<typeof insertBugReportSchema>;
export type UpdateBugReport = z.infer<typeof updateBugReportSchema>;

// Types for Restored Tables
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;
export type ContactLog = typeof contactLogs.$inferSelect;
export type InsertContactLog = typeof contactLogs.$inferInsert;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = typeof chatConversations.$inferInsert;
export type ChatParticipant = typeof chatParticipants.$inferSelect;
export type InsertChatParticipant = typeof chatParticipants.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
export type ChangeRequest = typeof changeRequests.$inferSelect;
export type InsertChangeRequest = typeof changeRequests.$inferInsert;
export type ChangeRequestApproval = typeof changeRequestApprovals.$inferSelect;
export type InsertChangeRequestApproval = typeof changeRequestApprovals.$inferInsert;
export type ChangeRequestTask = typeof changeRequestTasks.$inferSelect;
export type InsertChangeRequestTask = typeof changeRequestTasks.$inferInsert;
export type ChangeRequestTemplate = typeof changeRequestTemplates.$inferSelect;
export type InsertChangeRequestTemplate = typeof changeRequestTemplates.$inferInsert;
export type TaskDependency = typeof taskDependencies.$inferSelect;
export type InsertTaskDependency = typeof taskDependencies.$inferInsert;
export type ProjectStatus = typeof projectStatuses.$inferSelect;
export type InsertProjectStatus = typeof projectStatuses.$inferInsert;
export type UpdateProjectStatus = z.infer<typeof updateProjectStatusSchema>;
export type KanbanColumn = typeof kanbanColumns.$inferSelect;
export type InsertKanbanColumn = typeof kanbanColumns.$inferInsert;
export type UpdateKanbanColumn = z.infer<typeof updateKanbanColumnSchema>;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertExchangeRate = typeof exchangeRates.$inferInsert;
export type ExchangeRateSync = typeof exchangeRateSyncs.$inferSelect;
export type InsertExchangeRateSync = typeof exchangeRateSyncs.$inferInsert;
export type ProcurementRequisition = typeof procurementRequisitions.$inferSelect;
export type InsertProcurementRequisition = typeof procurementRequisitions.$inferInsert;
export type ResourceRequirement = typeof resourceRequirements.$inferSelect;
export type InsertResourceRequirement = typeof resourceRequirements.$inferInsert;
export type InventoryAllocation = typeof inventoryAllocations.$inferSelect;
export type InsertInventoryAllocation = typeof inventoryAllocations.$inferInsert;
export type GoogleConnection = typeof googleConnections.$inferSelect;
export type InsertGoogleConnection = typeof googleConnections.$inferInsert;
export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = typeof aiConversations.$inferInsert;
export type AiMessage = typeof aiMessages.$inferSelect;
export type InsertAiMessage = typeof aiMessages.$inferInsert;
export type AiUsage = typeof aiUsage.$inferSelect;
export type InsertAiUsage = typeof aiUsage.$inferInsert;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;
export type SentEmail = typeof sentEmails.$inferSelect;
export type InsertSentEmail = typeof sentEmails.$inferInsert;
export type EmailUsage = typeof emailUsage.$inferSelect;
export type InsertEmailUsage = typeof emailUsage.$inferInsert;
export type ProjectFile = typeof projectFiles.$inferSelect;
export type InsertProjectFile = typeof projectFiles.$inferInsert;
export type StorageQuota = typeof storageQuotas.$inferSelect;
export type TaskDocument = typeof taskDocuments.$inferSelect;
export type InsertTaskDocument = typeof taskDocuments.$inferInsert;
export type TaskRisk = typeof taskRisks.$inferSelect;
export type InsertTaskRisk = typeof taskRisks.$inferInsert;
export type TaskIssue = typeof taskIssues.$inferSelect;
export type InsertTaskIssue = typeof taskIssues.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type UpdateNotification = z.infer<typeof updateNotificationSchema>;
export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = typeof notificationLogs.$inferInsert;
export type ProjectEvent = typeof projectEvents.$inferSelect;
export type InsertProjectEvent = typeof projectEvents.$inferInsert;
export type StakeholderRaci = typeof stakeholderRaci.$inferSelect;
export type InsertStakeholderRaci = typeof stakeholderRaci.$inferInsert;

export type ResourceGroupMember = typeof resourceGroupMembers.$inferSelect;
export type InsertResourceGroupMember = typeof resourceGroupMembers.$inferInsert;

export type InsertResourceGroup = typeof resourceGroups.$inferInsert;
export type ResourceGroup = typeof resourceGroups.$inferSelect;

export type TaskMaterial = typeof taskMaterials.$inferSelect;
export type InsertTaskMaterial = typeof taskMaterials.$inferInsert;

export type MaterialConsumption = typeof materialConsumptions.$inferSelect;
export type InsertMaterialConsumption = typeof materialConsumptions.$inferInsert;

export type MaterialDelivery = typeof materialDeliveries.$inferSelect;
export type InsertMaterialDelivery = typeof materialDeliveries.$inferInsert;

export type AiActionLog = typeof aiActionLogs.$inferSelect;
export type InsertAiActionLog = typeof aiActionLogs.$inferInsert;

export type MessageReaction = typeof messageReactions.$inferSelect;
export type InsertMessageReaction = typeof messageReactions.$inferInsert;

export type ResourceTimeEntry = typeof resourceTimeEntries.$inferSelect;
export type InsertResourceTimeEntry = typeof resourceTimeEntries.$inferInsert;

// Legacy Aliases
export type Conversation = ChatConversation;
export type InsertConversation = InsertChatConversation;
export type Message = ChatMessage;
export type InsertMessage = InsertChatMessage;
export type Participant = ChatParticipant;
export type InsertParticipant = InsertChatParticipant;
