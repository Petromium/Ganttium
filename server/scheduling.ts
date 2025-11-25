import { db } from "./db";
import { tasks, taskDependencies, resourceAssignments, resources } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type { Task, TaskDependency, Resource, ResourceAssignment } from "@shared/schema";

interface ScheduleTask {
  id: number;
  name: string;
  wbsCode: string;
  duration: number; // in days
  earlyStart: Date | null;
  earlyFinish: Date | null;
  lateStart: Date | null;
  lateFinish: Date | null;
  totalFloat: number | null;
  freeFloat: number | null;
  isCriticalPath: boolean;
  predecessors: { taskId: number; type: string; lagDays: number }[];
  successors: { taskId: number; type: string; lagDays: number }[];
  constraintType: string;
  constraintDate: Date | null;
  estimatedHours: number | null;
}

interface ScheduleResult {
  success: boolean;
  message: string;
  tasksUpdated: number;
  criticalPathLength: number;
  projectEndDate: Date | null;
  criticalTasks: number[];
}

export class SchedulingService {
  /**
   * Calculate task duration in days based on estimated hours and resource capacity
   * Default: 8 hours per day if no resources assigned
   */
  calculateDuration(estimatedHours: number | null, hoursPerDay: number = 8): number {
    if (!estimatedHours || estimatedHours <= 0) {
      return 1; // Minimum 1 day duration
    }
    return Math.ceil(Number(estimatedHours) / hoursPerDay);
  }

  /**
   * Add business days to a date (skipping weekends)
   */
  addBusinessDays(startDate: Date, days: number): Date {
    const result = new Date(startDate);
    let remainingDays = days;
    
    while (remainingDays > 0) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        remainingDays--;
      }
    }
    
    return result;
  }

  /**
   * Subtract business days from a date (skipping weekends)
   */
  subtractBusinessDays(endDate: Date, days: number): Date {
    const result = new Date(endDate);
    let remainingDays = days;
    
    while (remainingDays > 0) {
      result.setDate(result.getDate() - 1);
      const dayOfWeek = result.getDay();
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        remainingDays--;
      }
    }
    
    return result;
  }

  /**
   * Calculate business days between two dates
   */
  getBusinessDaysBetween(start: Date, end: Date): number {
    let count = 0;
    const current = new Date(start);
    
    while (current < end) {
      current.setDate(current.getDate() + 1);
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
    }
    
    return count;
  }

  /**
   * Perform Forward Pass - Calculate Early Start (ES) and Early Finish (EF)
   * ES = Max(EF of all predecessors) adjusted for dependency type and lag
   * EF = ES + Duration
   */
  async forwardPass(projectId: number, projectStartDate: Date): Promise<Map<number, ScheduleTask>> {
    // Fetch all tasks for the project
    const projectTasks = await db.select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId));
    
    // Fetch all dependencies
    const dependencies = await db.select()
      .from(taskDependencies)
      .where(eq(taskDependencies.projectId, projectId));
    
    // Build schedule task map
    const taskMap = new Map<number, ScheduleTask>();
    
    for (const task of projectTasks) {
      const predecessors = dependencies
        .filter(d => d.successorId === task.id)
        .map(d => ({ taskId: d.predecessorId, type: d.type, lagDays: d.lagDays }));
      
      const successors = dependencies
        .filter(d => d.predecessorId === task.id)
        .map(d => ({ taskId: d.successorId, type: d.type, lagDays: d.lagDays }));
      
      const duration = this.calculateDuration(task.estimatedHours ? Number(task.estimatedHours) : null);
      
      taskMap.set(task.id, {
        id: task.id,
        name: task.name,
        wbsCode: task.wbsCode,
        duration,
        earlyStart: null,
        earlyFinish: null,
        lateStart: null,
        lateFinish: null,
        totalFloat: null,
        freeFloat: null,
        isCriticalPath: false,
        predecessors,
        successors,
        constraintType: task.constraintType || "asap",
        constraintDate: task.constraintDate,
        estimatedHours: task.estimatedHours ? Number(task.estimatedHours) : null,
      });
    }
    
    // Topological sort to determine processing order
    const processed = new Set<number>();
    const sortedTasks: number[] = [];
    
    const visit = (taskId: number): void => {
      if (processed.has(taskId)) return;
      
      const task = taskMap.get(taskId);
      if (!task) return;
      
      // Process all predecessors first
      for (const pred of task.predecessors) {
        if (!processed.has(pred.taskId)) {
          visit(pred.taskId);
        }
      }
      
      processed.add(taskId);
      sortedTasks.push(taskId);
    };
    
    // Visit all tasks
    for (const taskId of Array.from(taskMap.keys())) {
      visit(taskId);
    }
    
    // Forward pass: Calculate ES and EF
    for (const taskId of sortedTasks) {
      const task = taskMap.get(taskId)!;
      
      if (task.predecessors.length === 0) {
        // No predecessors - start at project start date
        task.earlyStart = new Date(projectStartDate);
        
        // Apply constraint if applicable
        if (task.constraintType === "snet" && task.constraintDate) {
          // Start No Earlier Than
          if (task.constraintDate > task.earlyStart) {
            task.earlyStart = new Date(task.constraintDate);
          }
        } else if (task.constraintType === "mso" && task.constraintDate) {
          // Must Start On
          task.earlyStart = new Date(task.constraintDate);
        }
      } else {
        // Has predecessors - calculate based on dependency types
        let maxDate = new Date(0); // Start with epoch
        
        for (const pred of task.predecessors) {
          const predTask = taskMap.get(pred.taskId);
          if (!predTask || !predTask.earlyFinish) continue;
          
          let constrainedDate: Date;
          
          switch (pred.type) {
            case "FS": // Finish-to-Start: Successor starts the next business day after predecessor finishes
              constrainedDate = this.addBusinessDays(predTask.earlyFinish, 1 + pred.lagDays);
              break;
            case "SS": // Start-to-Start: Successor starts after predecessor starts
              constrainedDate = predTask.earlyStart ? 
                this.addBusinessDays(predTask.earlyStart, pred.lagDays) : 
                this.addBusinessDays(predTask.earlyFinish, pred.lagDays - task.duration);
              break;
            case "FF": // Finish-to-Finish: Successor finishes after predecessor finishes
              constrainedDate = predTask.earlyFinish ?
                this.addBusinessDays(this.subtractBusinessDays(predTask.earlyFinish, task.duration - 1), pred.lagDays) :
                new Date(projectStartDate);
              break;
            case "SF": // Start-to-Finish: Successor finishes after predecessor starts
              constrainedDate = predTask.earlyStart ?
                this.addBusinessDays(this.subtractBusinessDays(predTask.earlyStart, task.duration - 1), pred.lagDays) :
                new Date(projectStartDate);
              break;
            default:
              constrainedDate = this.addBusinessDays(predTask.earlyFinish!, pred.lagDays);
          }
          
          if (constrainedDate > maxDate) {
            maxDate = constrainedDate;
          }
        }
        
        task.earlyStart = maxDate;
        
        // Apply constraints
        if (task.constraintType === "snet" && task.constraintDate) {
          if (task.constraintDate > task.earlyStart) {
            task.earlyStart = new Date(task.constraintDate);
          }
        } else if (task.constraintType === "mso" && task.constraintDate) {
          task.earlyStart = new Date(task.constraintDate);
        }
      }
      
      // Calculate Early Finish (duration - 1 because start day counts as day 1)
      // A 1-day task starts and finishes on the same day
      task.earlyFinish = task.duration <= 1 
        ? new Date(task.earlyStart!) 
        : this.addBusinessDays(task.earlyStart!, task.duration - 1);
    }
    
    return taskMap;
  }

  /**
   * Perform Backward Pass - Calculate Late Start (LS) and Late Finish (LF)
   * LF = Min(LS of all successors) adjusted for dependency type and lag
   * LS = LF - Duration
   */
  backwardPass(taskMap: Map<number, ScheduleTask>, projectEndDate: Date): void {
    // Get tasks in reverse topological order
    const sortedTasks = Array.from(taskMap.keys());
    const processed = new Set<number>();
    const reverseSorted: number[] = [];
    
    const visit = (taskId: number): void => {
      if (processed.has(taskId)) return;
      
      const task = taskMap.get(taskId);
      if (!task) return;
      
      // Process all successors first
      for (const succ of task.successors) {
        if (!processed.has(succ.taskId)) {
          visit(succ.taskId);
        }
      }
      
      processed.add(taskId);
      reverseSorted.push(taskId);
    };
    
    for (const taskId of sortedTasks) {
      visit(taskId);
    }
    
    // Backward pass: Calculate LS and LF
    for (const taskId of reverseSorted) {
      const task = taskMap.get(taskId)!;
      
      if (task.successors.length === 0) {
        // No successors - end at project end date
        task.lateFinish = new Date(projectEndDate);
        
        // Apply constraint if applicable
        if (task.constraintType === "fnet" && task.constraintDate) {
          // Finish No Later Than
          if (task.constraintDate < task.lateFinish) {
            task.lateFinish = new Date(task.constraintDate);
          }
        } else if (task.constraintType === "mfo" && task.constraintDate) {
          // Must Finish On
          task.lateFinish = new Date(task.constraintDate);
        }
      } else {
        // Has successors - calculate based on dependency types
        let minDate = new Date(8640000000000000); // Max date
        
        for (const succ of task.successors) {
          const succTask = taskMap.get(succ.taskId);
          if (!succTask || !succTask.lateStart) continue;
          
          let constrainedDate: Date;
          
          switch (succ.type) {
            case "FS": // Finish-to-Start: This task must finish one day before successor starts
              constrainedDate = this.subtractBusinessDays(succTask.lateStart, 1 + succ.lagDays);
              break;
            case "SS": // Start-to-Start
              constrainedDate = succTask.lateStart ?
                this.addBusinessDays(this.subtractBusinessDays(succTask.lateStart, succ.lagDays), task.duration) :
                new Date(projectEndDate);
              break;
            case "FF": // Finish-to-Finish
              constrainedDate = succTask.lateFinish ?
                this.subtractBusinessDays(succTask.lateFinish, succ.lagDays) :
                new Date(projectEndDate);
              break;
            case "SF": // Start-to-Finish
              constrainedDate = succTask.lateStart ?
                this.addBusinessDays(succTask.lateStart, task.duration - 1 - succ.lagDays) :
                new Date(projectEndDate);
              break;
            default:
              constrainedDate = this.subtractBusinessDays(succTask.lateStart!, 1 + succ.lagDays);
          }
          
          if (constrainedDate < minDate) {
            minDate = constrainedDate;
          }
        }
        
        task.lateFinish = minDate;
        
        // Apply constraints
        if (task.constraintType === "fnet" && task.constraintDate) {
          if (task.constraintDate < task.lateFinish) {
            task.lateFinish = new Date(task.constraintDate);
          }
        } else if (task.constraintType === "mfo" && task.constraintDate) {
          task.lateFinish = new Date(task.constraintDate);
        }
      }
      
      // Calculate Late Start (duration - 1 because finish day counts as part of duration)
      // A 1-day task starts and finishes on the same day
      task.lateStart = task.duration <= 1 
        ? new Date(task.lateFinish!) 
        : this.subtractBusinessDays(task.lateFinish!, task.duration - 1);
    }
  }

  /**
   * Calculate Float (Total Float and Free Float) and identify Critical Path
   */
  calculateFloatAndCriticalPath(taskMap: Map<number, ScheduleTask>): number[] {
    const criticalTasks: number[] = [];
    
    for (const [taskId, task] of Array.from(taskMap.entries())) {
      if (!task.lateFinish || !task.earlyFinish || !task.lateStart || !task.earlyStart) {
        continue;
      }
      
      // Total Float = LF - EF = LS - ES
      task.totalFloat = this.getBusinessDaysBetween(task.earlyFinish, task.lateFinish);
      
      // Free Float = Earliest ES of successors - EF of this task - 1
      if (task.successors.length > 0) {
        let minSuccessorES = new Date(8640000000000000);
        for (const succ of task.successors) {
          const succTask = taskMap.get(succ.taskId);
          if (succTask?.earlyStart && succTask.earlyStart < minSuccessorES) {
            minSuccessorES = succTask.earlyStart;
          }
        }
        task.freeFloat = Math.max(0, this.getBusinessDaysBetween(task.earlyFinish, minSuccessorES));
      } else {
        task.freeFloat = task.totalFloat;
      }
      
      // Critical Path: Tasks with zero total float
      task.isCriticalPath = task.totalFloat === 0;
      if (task.isCriticalPath) {
        criticalTasks.push(taskId);
      }
    }
    
    return criticalTasks;
  }

  /**
   * Run the complete scheduling calculation for a project
   */
  async runSchedule(projectId: number, projectStartDate?: Date): Promise<ScheduleResult> {
    try {
      // Get project info for default start date
      const [project] = await db.select()
        .from(tasks)
        .where(eq(tasks.projectId, projectId))
        .limit(1);
      
      if (!project && !projectStartDate) {
        return {
          success: false,
          message: "No tasks found for project",
          tasksUpdated: 0,
          criticalPathLength: 0,
          projectEndDate: null,
          criticalTasks: [],
        };
      }
      
      const startDate = projectStartDate || new Date();
      
      // Step 1: Forward Pass
      const taskMap = await this.forwardPass(projectId, startDate);
      
      if (taskMap.size === 0) {
        return {
          success: true,
          message: "No tasks to schedule",
          tasksUpdated: 0,
          criticalPathLength: 0,
          projectEndDate: null,
          criticalTasks: [],
        };
      }
      
      // Find project end date (max EF)
      let projectEndDate = new Date(0);
      for (const task of Array.from(taskMap.values())) {
        if (task.earlyFinish && task.earlyFinish > projectEndDate) {
          projectEndDate = task.earlyFinish;
        }
      }
      
      // Step 2: Backward Pass
      this.backwardPass(taskMap, projectEndDate);
      
      // Step 3: Calculate Float and Critical Path
      const criticalTasks = this.calculateFloatAndCriticalPath(taskMap);
      
      // Step 4: Update tasks in database
      let tasksUpdated = 0;
      for (const [taskId, task] of Array.from(taskMap.entries())) {
        await db.update(tasks)
          .set({
            duration: task.duration,
            earlyStart: task.earlyStart,
            earlyFinish: task.earlyFinish,
            lateStart: task.lateStart,
            lateFinish: task.lateFinish,
            float: task.totalFloat,
            freeFloat: task.freeFloat,
            isCriticalPath: task.isCriticalPath,
            // Also update startDate/endDate if not set
            startDate: task.earlyStart,
            endDate: task.earlyFinish,
          })
          .where(eq(tasks.id, taskId));
        tasksUpdated++;
      }
      
      // Calculate critical path length
      const criticalPathLength = criticalTasks.reduce((sum, taskId) => {
        const task = taskMap.get(taskId);
        return sum + (task?.duration || 0);
      }, 0);
      
      return {
        success: true,
        message: `Successfully scheduled ${tasksUpdated} tasks`,
        tasksUpdated,
        criticalPathLength,
        projectEndDate,
        criticalTasks,
      };
    } catch (error) {
      console.error("Scheduling error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown scheduling error",
        tasksUpdated: 0,
        criticalPathLength: 0,
        projectEndDate: null,
        criticalTasks: [],
      };
    }
  }

  /**
   * Get the scheduled data for all tasks in a project
   */
  async getScheduleData(projectId: number): Promise<ScheduleTask[]> {
    const projectTasks = await db.select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId));
    
    const dependencies = await db.select()
      .from(taskDependencies)
      .where(eq(taskDependencies.projectId, projectId));
    
    return projectTasks.map(task => {
      const predecessors = dependencies
        .filter(d => d.successorId === task.id)
        .map(d => ({ taskId: d.predecessorId, type: d.type, lagDays: d.lagDays }));
      
      const successors = dependencies
        .filter(d => d.predecessorId === task.id)
        .map(d => ({ taskId: d.successorId, type: d.type, lagDays: d.lagDays }));
      
      return {
        id: task.id,
        name: task.name,
        wbsCode: task.wbsCode,
        duration: task.duration || this.calculateDuration(task.estimatedHours ? Number(task.estimatedHours) : null),
        earlyStart: task.earlyStart,
        earlyFinish: task.earlyFinish,
        lateStart: task.lateStart,
        lateFinish: task.lateFinish,
        totalFloat: task.float,
        freeFloat: task.freeFloat,
        isCriticalPath: task.isCriticalPath || false,
        predecessors,
        successors,
        constraintType: task.constraintType || "asap",
        constraintDate: task.constraintDate,
        estimatedHours: task.estimatedHours ? Number(task.estimatedHours) : null,
      };
    });
  }
}

export const schedulingService = new SchedulingService();
