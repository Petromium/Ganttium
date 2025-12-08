/**
 * Import/Export Service Tests
 * Validates that helper functions preserve extended EPC fields.
 */

import { describe, it, expect } from 'vitest';
import type { Project, Task, Risk, Issue } from '@shared/schema';
import {
  buildProjectExportPayload,
  buildTaskInsertData,
  buildRiskInsertData,
  buildIssueInsertData,
} from '../../server/services/importExportService';

describe('Import/Export Service', () => {
  it('buildProjectExportPayload includes extended EPC fields', () => {
    const project = {
      id: 1,
      organizationId: 1,
      name: 'Export Project',
      code: 'EXP-001',
      description: 'Export desc',
      status: 'active',
      startDate: '2025-01-01T00:00:00.000Z',
      endDate: '2025-12-31T00:00:00.000Z',
      budget: '1000000',
      currency: 'USD',
    } as Project;

    const task = {
      wbsCode: '1.0',
      name: 'Task',
      description: 'Desc',
      status: 'in-progress',
      progress: 50,
      startDate: '2025-01-01T00:00:00.000Z',
      endDate: '2025-01-15T00:00:00.000Z',
      assignedTo: 'user-1',
      priority: 'high',
      estimatedHours: '120',
      actualHours: '100',
      discipline: 'engineering',
      disciplineLabel: 'Engineering',
      areaCode: 'AREA-1',
      weightFactor: '1.5',
      constraintType: 'asap',
      constraintDate: '2025-01-05T00:00:00.000Z',
      baselineStart: '2025-01-01T00:00:00.000Z',
      baselineFinish: '2025-01-10T00:00:00.000Z',
      actualStartDate: '2025-01-02T00:00:00.000Z',
      actualFinishDate: '2025-01-12T00:00:00.000Z',
      workMode: 'fixed-duration',
      isMilestone: true,
      isCriticalPath: true,
      baselineCost: '50000',
      actualCost: '52000',
      earnedValue: '48000',
      id: 1,
      projectId: 1,
      parentId: null,
      customStatusId: null,
      assignedToName: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Task;

    const risk = {
      code: 'R-1',
      title: 'Risk',
      description: 'Risk desc',
      category: 'technical',
      probability: 3,
      impact: 'medium',
      status: 'identified',
      owner: 'user-1',
      assignedTo: 'user-2',
      mitigationPlan: 'Mitigate',
      responseStrategy: 'avoid',
      costImpact: '10000',
      scheduleImpact: 4,
      riskExposure: '2000',
      contingencyReserve: '1500',
      targetResolutionDate: '2025-02-01T00:00:00.000Z',
      identifiedDate: '2025-01-05T00:00:00.000Z',
      closedDate: '2025-03-01T00:00:00.000Z',
      id: 1,
      projectId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Risk;

    const issue = {
      code: 'I-1',
      title: 'Issue',
      description: 'Issue desc',
      priority: 'critical',
      status: 'in-progress',
      assignedTo: 'user-3',
      reportedBy: 'user-1',
      resolution: 'Pending',
      issueType: 'ncr',
      category: 'quality',
      impactCost: '8000',
      impactSchedule: 3,
      impactQuality: 'major',
      impactSafety: 'minor',
      discipline: 'safety',
      escalationLevel: 'level-2',
      targetResolutionDate: '2025-02-10T00:00:00.000Z',
      reportedDate: '2025-01-12T00:00:00.000Z',
      resolvedDate: '2025-02-20T00:00:00.000Z',
      id: 1,
      projectId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Issue;

    const payload = buildProjectExportPayload({
      project,
      tasks: [task],
      risks: [risk],
      issues: [issue],
      stakeholders: [],
      costItems: [],
      documents: [],
    });

    expect(payload.tasks[0].disciplineLabel).toBe('Engineering');
    expect(payload.tasks[0].baselineCost).toBe('50000');
    expect(payload.risks[0].responseStrategy).toBe('avoid');
    expect(payload.risks[0].riskExposure).toBe('2000');
    expect(payload.issues[0].issueType).toBe('ncr');
    expect(payload.issues[0].impactCost).toBe('8000');
  });

  it('buildTaskInsertData maps extended fields and defaults', () => {
    const insert = buildTaskInsertData({
      projectId: 1,
      parentId: null,
      rawTask: {
        name: 'Imported Task',
        wbsCode: '1.0',
        progress: 110,
        startDate: '2025-04-01T00:00:00.000Z',
        endDate: '2025-04-05T00:00:00.000Z',
        areaCode: 'ZONE-1',
        weightFactor: '2.0',
        constraintType: 'mso',
        constraintDate: '2025-04-02T00:00:00.000Z',
        baselineStart: '2025-04-01T00:00:00.000Z',
        baselineFinish: '2025-04-05T00:00:00.000Z',
        actualStartDate: '2025-04-01T00:00:00.000Z',
        actualFinishDate: '2025-04-04T00:00:00.000Z',
        workMode: 'fixed-work',
        isMilestone: true,
        isCriticalPath: false,
        estimatedHours: '80',
        actualHours: '72',
        baselineCost: '90000',
        actualCost: '88000',
        earnedValue: '85000',
      },
      createdBy: 'user-1',
      mappedPriority: 'high',
      mappedStatus: 'in-progress',
      assignedToName: 'Lead Engineer',
      disciplineEnumValue: 'electrical',
      disciplineLabelValue: 'Electrical',
    });

    expect(insert.progress).toBe(100); // capped
    expect(insert.areaCode).toBe('ZONE-1');
    expect(insert.baselineCost).toBe('90000');
    expect(insert.discipline).toBe('electrical');
    expect(insert.assignedTo).toBeNull();
    expect(insert.workMode).toBe('fixed-work');
  });

  it('buildRiskInsertData maps quantitative metrics', () => {
    const insert = buildRiskInsertData({
      projectId: 1,
      code: 'R-1',
      rawRisk: {
        title: 'Risk',
        probability: 10,
        costImpact: '12000',
        scheduleImpact: 6,
        riskExposure: '3000',
        contingencyReserve: '1500',
        targetResolutionDate: '2025-05-01T00:00:00.000Z',
      },
      mappedStatus: 'mitigating',
      mappedImpact: 'high',
    });

    expect(insert.probability).toBe(5);
    expect(insert.costImpact).toBe('12000');
    expect(insert.scheduleImpact).toBe(6);
    expect(insert.targetResolutionDate).toEqual(new Date('2025-05-01T00:00:00.000Z'));
  });

  it('buildIssueInsertData maps impact fields', () => {
    const insert = buildIssueInsertData({
      projectId: 1,
      code: 'I-1',
      rawIssue: {
        title: 'Issue',
        impactCost: '7000',
        impactSchedule: 3,
        impactQuality: 'minor',
        impactSafety: 'major',
        discipline: 'construction',
        escalationLevel: 'level-1',
      },
      mappedStatus: 'open',
      mappedPriority: 'medium',
      fallbackReporter: 'user-1',
    });

    expect(insert.impactCost).toBe('7000');
    expect(insert.impactSchedule).toBe(3);
    expect(insert.discipline).toBe('construction');
    expect(insert.reportedBy).toBe('user-1');
  });

  it('should allow defaults for missing dates in Risk and Issue', () => {
    // For Risk: identifiedDate should be undefined (not null) to trigger defaultNow()
    const riskInsert = buildRiskInsertData({
      projectId: 1,
      code: 'R-2',
      rawRisk: { title: 'No Date Risk' },
      mappedStatus: 'identified',
      mappedImpact: 'low',
    });
    // We expect undefined, because null overrides defaultNow()
    expect(riskInsert.identifiedDate).toBeUndefined();

    // For Issue: reportedDate should be undefined (not null) to trigger defaultNow()
    const issueInsert = buildIssueInsertData({
      projectId: 1,
      code: 'I-2',
      rawIssue: { title: 'No Date Issue' },
      mappedStatus: 'open',
      mappedPriority: 'low',
      fallbackReporter: 'user-1',
    });
    expect(issueInsert.reportedDate).toBeUndefined();
  });
});
