import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TableRowCardProps {
  id: string;
  selected?: boolean;
  onSelect?: (selected: boolean, shiftKey?: boolean) => void;
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
  const pointerEventRef = useRef<{ shiftKey: boolean } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerEventRef.current = { shiftKey: e.shiftKey };
  };

  const handleCheckboxChange = (checked: boolean | "indeterminate") => {
    if (typeof checked === "boolean") {
      const shiftKey = pointerEventRef.current?.shiftKey;
      pointerEventRef.current = null;
      onSelect?.(checked, shiftKey);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card
      className={cn(
        "p-1.5 sm:p-3 md:p-4 mb-2 cursor-pointer hover-elevate active-elevate-2 transition-shadow",
        className
      )}
      onClick={onClick}
      data-testid={`row-card-${id}`}
    >
      <div className="flex items-center gap-1 sm:gap-3">
        <Checkbox
          checked={selected}
          onPointerDown={handlePointerDown}
          onCheckedChange={handleCheckboxChange}
          onClick={handleCheckboxClick}
          className="h-1.5 w-1.5 sm:h-4 sm:w-4 shrink-0"
          data-testid={`checkbox-${id}`}
        />
        {expandable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand?.();
            }}
            className="hover-elevate p-0 sm:p-1 rounded shrink-0"
            data-testid={`button-expand-${id}`}
          >
            <ChevronRight
              className={cn(
                "h-1.5 w-1.5 sm:h-4 sm:w-4 text-muted-foreground transition-transform",
                expanded && "rotate-90"
              )}
            />
          </button>
        )}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </Card>
  );
}
