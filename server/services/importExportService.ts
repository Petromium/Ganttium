import type { Project, Task, Risk, Issue, Stakeholder, CostItem, Document } from "@shared/schema";

type NullableDate = string | Date | null | undefined;

const normalizeDate = (value: NullableDate): string | Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export interface ExportEntities {
  project: Project;
  tasks: Task[];
  risks: Risk[];
  issues: Issue[];
  stakeholders: Stakeholder[];
  costItems: CostItem[];
  documents: Document[];
}

export function buildProjectExportPayload(entities: ExportEntities) {
  const { project, tasks, risks, issues, stakeholders, costItems, documents } = entities;

  return {
    exportDate: new Date().toISOString(),
    version: "1.0",
    project: {
      name: project.name,
      code: project.code,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      budget: project.budget,
      currency: project.currency,
    },
    tasks: tasks.map(mapTaskToExport),
    risks: risks.map(mapRiskToExport),
    issues: issues.map(mapIssueToExport),
    stakeholders: stakeholders.map((s) => ({
      name: s.name,
      role: s.role,
      organization: s.organization,
      email: s.email,
      phone: s.phone,
      influence: s.influence,
      interest: s.interest,
    })),
    costItems: costItems.map((c) => ({
      description: c.description,
      category: c.category,
      budgeted: c.budgeted,
      actual: c.actual,
      currency: c.currency,
    })),
    documents: documents.map((d) => ({
      documentNumber: (d as any).documentNumber,
      title: (d as any).title,
      revision: (d as any).revision,
      discipline: d.discipline,
      documentType: d.documentType,
      status: d.status,
    })),
  };
}

export function mapTaskToExport(task: Task) {
  return {
    wbsCode: task.wbsCode,
    name: task.name,
    description: task.description,
    status: task.status,
    progress: task.progress,
    startDate: task.startDate,
    endDate: task.endDate,
    assignedTo: task.assignedTo,
    priority: task.priority,
    estimatedHours: task.estimatedHours,
    actualHours: task.actualHours,
    discipline: task.discipline,
    disciplineLabel: (task as any).disciplineLabel,
    areaCode: (task as any).areaCode,
    weightFactor: (task as any).weightFactor,
    constraintType: (task as any).constraintType,
    constraintDate: (task as any).constraintDate,
    baselineStart: (task as any).baselineStart,
    baselineFinish: (task as any).baselineFinish,
    actualStartDate: (task as any).actualStartDate,
    actualFinishDate: (task as any).actualFinishDate,
    workMode: (task as any).workMode,
    isMilestone: (task as any).isMilestone,
    isCriticalPath: (task as any).isCriticalPath,
    baselineCost: (task as any).baselineCost,
    actualCost: (task as any).actualCost,
    earnedValue: (task as any).earnedValue,
  };
}

export function mapRiskToExport(risk: Risk) {
  return {
    code: risk.code,
    title: risk.title,
    description: risk.description,
    category: risk.category,
    probability: risk.probability,
    impact: risk.impact,
    status: risk.status,
    owner: risk.owner,
    assignedTo: (risk as any).assignedTo,
    mitigationPlan: risk.mitigationPlan,
    responseStrategy: (risk as any).responseStrategy,
    costImpact: (risk as any).costImpact,
    scheduleImpact: (risk as any).scheduleImpact,
    riskExposure: (risk as any).riskExposure,
    contingencyReserve: (risk as any).contingencyReserve,
    targetResolutionDate: (risk as any).targetResolutionDate,
    identifiedDate: (risk as any).identifiedDate,
    closedDate: (risk as any).closedDate,
  };
}

export function mapIssueToExport(issue: Issue) {
  return {
    code: issue.code,
    title: issue.title,
    description: issue.description,
    priority: issue.priority,
    status: issue.status,
    assignedTo: issue.assignedTo,
    reportedBy: issue.reportedBy,
    resolution: issue.resolution,
    issueType: issue.issueType,
    category: issue.category,
    impactCost: (issue as any).impactCost,
    impactSchedule: (issue as any).impactSchedule,
    impactQuality: (issue as any).impactQuality,
    impactSafety: (issue as any).impactSafety,
    discipline: (issue as any).discipline,
    escalationLevel: (issue as any).escalationLevel,
    targetResolutionDate: (issue as any).targetResolutionDate,
    reportedDate: (issue as any).reportedDate,
    resolvedDate: (issue as any).resolvedDate,
  };
}

export interface TaskInsertOptions {
  projectId: number;
  parentId: number | null;
  rawTask: any;
  createdBy: string;
  mappedPriority: "low" | "medium" | "high" | "critical";
  mappedStatus: "not-started" | "in-progress" | "review" | "completed" | "on-hold";
  assignedToName: string | null;
  disciplineEnumValue: string | null;
  disciplineLabelValue: string | null;
}

export function buildTaskInsertData(options: TaskInsertOptions) {
  const {
    projectId,
    parentId,
    rawTask,
    createdBy,
    mappedPriority,
    mappedStatus,
    assignedToName,
    disciplineEnumValue,
    disciplineLabelValue,
  } = options;

  const safeProgress = Math.min(100, Math.max(0, parseInt(rawTask.progress) || 0));

  return {
    projectId,
    parentId,
    name: rawTask.name || rawTask.title || "Untitled Task",
    wbsCode: rawTask.wbsCode || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdBy,
    description: rawTask.description,
    status: mappedStatus,
    progress: safeProgress,
    startDate: normalizeDate(rawTask.startDate),
    endDate: normalizeDate(rawTask.endDate),
    assignedTo: null,
    assignedToName,
    priority: mappedPriority,
    discipline: (disciplineEnumValue || "general") as any,
    disciplineLabel: disciplineLabelValue,
    areaCode: rawTask.areaCode || null,
    weightFactor: rawTask.weightFactor || null,
    constraintType: rawTask.constraintType || null,
    constraintDate: normalizeDate(rawTask.constraintDate),
    baselineStart: normalizeDate(rawTask.baselineStart),
    baselineFinish: normalizeDate(rawTask.baselineFinish),
    actualStartDate: normalizeDate(rawTask.actualStartDate),
    actualFinishDate: normalizeDate(rawTask.actualFinishDate),
    workMode: rawTask.workMode || "fixed-duration",
    isMilestone: Boolean(rawTask.isMilestone),
    isCriticalPath: Boolean(rawTask.isCriticalPath),
    estimatedHours: rawTask.estimatedHours || null,
    actualHours: rawTask.actualHours || null,
    baselineCost: rawTask.baselineCost || "0",
    actualCost: rawTask.actualCost || "0",
    earnedValue: rawTask.earnedValue || "0",
  };
}

export interface RiskInsertOptions {
  projectId: number;
  code: string;
  rawRisk: any;
  mappedStatus: "identified" | "assessed" | "mitigating" | "closed";
  mappedImpact: "low" | "medium" | "high" | "critical";
}

export function buildRiskInsertData(options: RiskInsertOptions) {
  const { projectId, code, rawRisk, mappedStatus, mappedImpact } = options;
  return {
    projectId,
    code,
    title: rawRisk.title || "Untitled Risk",
    description: rawRisk.description,
    category: rawRisk.category || "other",
    probability: Math.min(5, Math.max(1, parseInt(rawRisk.probability) || 3)),
    impact: mappedImpact,
    status: mappedStatus,
    owner: rawRisk.owner || null,
    assignedTo: rawRisk.assignedTo || null,
    mitigationPlan: rawRisk.mitigationPlan || rawRisk.mitigationStrategy || rawRisk.mitigation,
    responseStrategy: rawRisk.responseStrategy || null,
    costImpact: rawRisk.costImpact || null,
    scheduleImpact: rawRisk.scheduleImpact || null,
    riskExposure: rawRisk.riskExposure || null,
    contingencyReserve: rawRisk.contingencyReserve || null,
    targetResolutionDate: normalizeDate(rawRisk.targetResolutionDate),
    identifiedDate: normalizeDate(rawRisk.identifiedDate),
    closedDate: normalizeDate(rawRisk.closedDate),
  };
}

export interface IssueInsertOptions {
  projectId: number;
  code: string;
  rawIssue: any;
  mappedStatus: "open" | "in-progress" | "resolved" | "closed";
  mappedPriority: "low" | "medium" | "high" | "critical";
  fallbackReporter: string;
}

export function buildIssueInsertData(options: IssueInsertOptions) {
  const { projectId, code, rawIssue, mappedStatus, mappedPriority, fallbackReporter } = options;
  return {
    projectId,
    code,
    title: rawIssue.title || "Untitled Issue",
    description: rawIssue.description,
    priority: mappedPriority,
    status: mappedStatus,
    assignedTo: rawIssue.assignedTo || null,
    reportedBy: rawIssue.reportedBy || fallbackReporter,
    resolution: rawIssue.resolution || null,
    issueType: rawIssue.issueType || "standard",
    category: rawIssue.category || null,
    impactCost: rawIssue.impactCost || null,
    impactSchedule: rawIssue.impactSchedule || null,
    impactQuality: rawIssue.impactQuality || null,
    impactSafety: rawIssue.impactSafety || null,
    discipline: rawIssue.discipline || null,
    escalationLevel: rawIssue.escalationLevel || null,
    targetResolutionDate: normalizeDate(rawIssue.targetResolutionDate),
    reportedDate: normalizeDate(rawIssue.reportedDate),
    resolvedDate: normalizeDate(rawIssue.resolvedDate),
  };
}


