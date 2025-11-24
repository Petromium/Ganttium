import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { GripVertical, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TableRowCardProps {
  id: string;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  onClick?: () => void;
  children: React.ReactNode;
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
}

export function TableRowCard({
  id,
  selected,
  onSelect,
  onClick,
  children,
  expandable,
  expanded,
  onToggleExpand,
  className,
}: TableRowCardProps) {
  return (
    <Card
      className={cn(
        "p-4 mb-2 cursor-pointer hover-elevate active-elevate-2 transition-shadow",
        className
      )}
      onClick={onClick}
      data-testid={`row-card-${id}`}
    >
      <div className="flex items-center gap-3">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" data-testid={`handle-${id}`} />
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          onClick={(e) => e.stopPropagation()}
          data-testid={`checkbox-${id}`}
        />
        {expandable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand?.();
            }}
            className="hover-elevate p-1 rounded"
            data-testid={`button-expand-${id}`}
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                expanded && "rotate-90"
              )}
            />
          </button>
        )}
        <div className="flex-1">{children}</div>
      </div>
    </Card>
  );
}
