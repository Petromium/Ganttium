import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: LucideIcon;
  className?: string;
}

export function MetricCard({ title, value, change, icon: Icon, className }: MetricCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <Card className={cn("hover-elevate", className)} data-testid={`card-metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-6 gap-1">
        <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground truncate">{title}</CardTitle>
        {Icon && <Icon className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />}
      </CardHeader>
      <CardContent className="p-3 md:p-6 pt-0">
        <div className="text-lg md:text-2xl font-bold" data-testid={`text-metric-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>{value}</div>
        {change !== undefined && (
          <p className={cn(
            "text-xs mt-1 hidden md:block",
            isPositive && "text-chart-3",
            isNegative && "text-destructive"
          )}>
            {isPositive && "+"}
            {change}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
