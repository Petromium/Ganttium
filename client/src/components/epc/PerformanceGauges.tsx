import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Task, CostItem } from "@shared/schema";

interface PerformanceGaugesProps {
  tasks: Task[];
  costItems: CostItem[];
  className?: string;
}

interface EVAMetrics {
  bcwp: number; // Budgeted Cost of Work Performed (Earned Value)
  bcws: number; // Budgeted Cost of Work Scheduled (Planned Value)
  acwp: number; // Actual Cost of Work Performed
  bac: number;  // Budget at Completion
  spi: number;  // Schedule Performance Index
  cpi: number;  // Cost Performance Index
  sv: number;   // Schedule Variance
  cv: number;   // Cost Variance
  eac: number;  // Estimate at Completion
  etc: number;  // Estimate to Complete
  vac: number;  // Variance at Completion
}

interface EVADataQuality {
  hasValidData: boolean;
  hasCostData: boolean;
  hasBaselineDates: boolean;
  message: string;
}

function assessDataQuality(tasks: Task[], costItems: CostItem[]): EVADataQuality {
  const hasCostData = costItems.length > 0 && 
    costItems.some(c => Number(c.budgeted) > 0 || Number(c.actual) > 0);
  
  const hasBaselineDates = tasks.some(t => t.baselineStart && t.baselineFinish);
  const hasBaselineCosts = tasks.some(t => {
    const cost = Number(t.baselineCost);
    return !isNaN(cost) && cost > 0;
  });
  
  const hasValidData = hasCostData || hasBaselineCosts;
  
  let message = "";
  if (!hasValidData) {
    message = "Add baseline costs to tasks or cost items to enable EVA calculations";
  } else if (!hasBaselineDates) {
    message = "Add baseline dates to tasks for more accurate schedule performance";
  }
  
  return { hasValidData, hasCostData, hasBaselineDates, message };
}

function calculateEVAMetrics(tasks: Task[], costItems: CostItem[]): EVAMetrics {
  const costItemBac = costItems.reduce((sum, c) => {
    const val = Number(c.budgeted);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
  
  const taskBasedBac = tasks.reduce((sum, t) => {
    const val = Number(t.baselineCost);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
  
  const bac = costItemBac > 0 ? costItemBac : taskBasedBac;
  
  const costItemAcwp = costItems.reduce((sum, c) => {
    const val = Number(c.actual);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
  
  const taskActualCost = tasks.reduce((sum, t) => {
    const val = Number(t.actualCost);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
  
  const acwp = costItemAcwp > 0 ? costItemAcwp : taskActualCost;

  let bcws = 0;
  let bcwp = 0;

  const today = new Date();
  const taskCount = tasks.length || 1;
  const perTaskBacShare = bac / taskCount;

  tasks.forEach(task => {
    const rawBaseline = Number(task.baselineCost);
    const taskBaseline = isNaN(rawBaseline) || rawBaseline === 0 ? perTaskBacShare : rawBaseline;
    
    const rawEV = Number(task.earnedValue);
    const progress = typeof task.progress === 'number' ? task.progress : 0;
    const taskEV = isNaN(rawEV) || rawEV === 0 ? (taskBaseline * progress / 100) : rawEV;
    
    const taskStart = task.baselineStart ? new Date(task.baselineStart) : 
                     (task.startDate ? new Date(task.startDate) : null);
    const taskEnd = task.baselineFinish ? new Date(task.baselineFinish) : 
                   (task.endDate ? new Date(task.endDate) : null);

    if (taskStart && taskEnd && !isNaN(taskStart.getTime()) && !isNaN(taskEnd.getTime())) {
      const duration = taskEnd.getTime() - taskStart.getTime();
      if (duration > 0) {
        const elapsed = Math.max(0, Math.min(duration, today.getTime() - taskStart.getTime()));
        const plannedFraction = elapsed / duration;
        bcws += taskBaseline * plannedFraction;
      }
    }

    bcwp += taskEV;
  });

  if (bcws === 0 && bac > 0 && tasks.length > 0) {
    const totalProgress = tasks.reduce((sum, t) => sum + (typeof t.progress === 'number' ? t.progress : 0), 0);
    const overallProgress = totalProgress / tasks.length;
    bcws = bac * (overallProgress / 100);
  }

  const spi = bcws > 0 ? bcwp / bcws : (bcwp > 0 ? 1 : (bac > 0 ? 1 : 0));
  const cpi = acwp > 0 ? bcwp / acwp : (bcwp > 0 ? 1 : (bac > 0 ? 1 : 0));
  const sv = bcwp - bcws;
  const cv = bcwp - acwp;
  const eac = cpi > 0 ? bac / cpi : bac;
  const etc = Math.max(0, eac - acwp);
  const vac = bac - eac;

  return {
    bcwp: isNaN(bcwp) ? 0 : bcwp,
    bcws: isNaN(bcws) ? 0 : bcws,
    acwp: isNaN(acwp) ? 0 : acwp,
    bac: isNaN(bac) ? 0 : bac,
    spi: isNaN(spi) ? 0 : Math.round(spi * 100) / 100,
    cpi: isNaN(cpi) ? 0 : Math.round(cpi * 100) / 100,
    sv: isNaN(sv) ? 0 : Math.round(sv),
    cv: isNaN(cv) ? 0 : Math.round(cv),
    eac: isNaN(eac) ? 0 : Math.round(eac),
    etc: isNaN(etc) ? 0 : Math.round(etc),
    vac: isNaN(vac) ? 0 : Math.round(vac),
  };
}

function getPerformanceColor(value: number): { bg: string; text: string; label: string } {
  if (value >= 0.95) {
    return { bg: "bg-emerald-500", text: "text-emerald-500", label: "On Track" };
  }
  if (value >= 0.85) {
    return { bg: "bg-amber-500", text: "text-amber-500", label: "At Risk" };
  }
  return { bg: "bg-red-500", text: "text-red-500", label: "Critical" };
}

function GaugeIndicator({ value, label, description }: { value: number; label: string; description: string }) {
  const color = getPerformanceColor(value);
  const clampedValue = Math.min(1.5, Math.max(0.5, value));
  const normalizedValue = (clampedValue - 0.5) / 1.0;
  const angle = -90 + (normalizedValue * 180);
  
  const size = 140;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2 - 4;
  const center = size / 2;
  
  const createArc = (startAngle: number, endAngle: number) => {
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const needleLength = radius - 10;
  const needleAngle = (angle) * (Math.PI / 180);
  const needleX = center + needleLength * Math.cos(needleAngle);
  const needleY = center + needleLength * Math.sin(needleAngle);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size / 2 + 8 }}>
        <svg width={size} height={size / 2 + 8} viewBox={`0 0 ${size} ${size / 2 + 8}`}>
          <path
            d={createArc(-90, -27)}
            fill="none"
            stroke="#ef4444"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <path
            d={createArc(-27, 9)}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
          />
          <path
            d={createArc(9, 90)}
            fill="none"
            stroke="#10b981"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          <line
            x1={center}
            y1={center}
            x2={needleX}
            y2={needleY}
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            className="text-foreground transition-all duration-500"
          />
          <circle cx={center} cy={center} r={8} className="fill-foreground" />
          <circle cx={center} cy={center} r={4} className="fill-background" />
        </svg>
      </div>
      
      <div className="text-center mt-1">
        <div className={cn("text-3xl font-bold tabular-nums", color.text)}>{value.toFixed(2)}</div>
        <div className="text-base font-semibold mt-1">{label}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
        <div className={cn(
          "inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-medium",
          color.bg, "text-white"
        )}>
          <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
          {color.label}
        </div>
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export function PerformanceGauges({ tasks, costItems, className }: PerformanceGaugesProps) {
  const metrics = calculateEVAMetrics(tasks, costItems);
  const dataQuality = assessDataQuality(tasks, costItems);

  if (!dataQuality.hasValidData && tasks.length === 0 && costItems.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Earned Value Analysis (EVA)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground text-center">
            Add tasks and cost items to enable EVA calculations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Earned Value Analysis (EVA)</CardTitle>
        <p className="text-sm text-muted-foreground">Schedule & Cost Performance Indicators</p>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid grid-cols-2 gap-8 mb-6 mt-2">
          <GaugeIndicator 
            value={metrics.spi} 
            label="SPI" 
            description="Schedule Performance"
          />
          <GaugeIndicator 
            value={metrics.cpi} 
            label="CPI" 
            description="Cost Performance"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold">{formatCurrency(metrics.bcwp)}</div>
            <div className="text-xs text-muted-foreground">Earned Value (EV)</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{formatCurrency(metrics.bcws)}</div>
            <div className="text-xs text-muted-foreground">Planned Value (PV)</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{formatCurrency(metrics.acwp)}</div>
            <div className="text-xs text-muted-foreground">Actual Cost (AC)</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{formatCurrency(metrics.bac)}</div>
            <div className="text-xs text-muted-foreground">Budget (BAC)</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t mt-4">
          <div className="text-center">
            <div className={cn("text-lg font-semibold", metrics.sv >= 0 ? "text-emerald-500" : "text-red-500")}>
              {metrics.sv >= 0 ? "+" : ""}{formatCurrency(metrics.sv)}
            </div>
            <div className="text-xs text-muted-foreground">Schedule Variance</div>
          </div>
          <div className="text-center">
            <div className={cn("text-lg font-semibold", metrics.cv >= 0 ? "text-emerald-500" : "text-red-500")}>
              {metrics.cv >= 0 ? "+" : ""}{formatCurrency(metrics.cv)}
            </div>
            <div className="text-xs text-muted-foreground">Cost Variance</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{formatCurrency(metrics.eac)}</div>
            <div className="text-xs text-muted-foreground">Est. at Completion</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
