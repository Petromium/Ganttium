import * as React from "react";
import { X, Download, Trash2, Edit, Copy, MoreHorizontal, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useSelection } from "@/contexts/SelectionContext";
import { useSidebar } from "@/components/ui/sidebar";
import { useLocation } from "wouter";

interface BulkAction {
  label: string;
  action: string;
  icon?: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  color?: string;
}

// Page-specific bulk actions configuration
const getBulkActions = (type: string): BulkAction[] => {
  switch (type) {
    case "projects":
      return [
        {
          label: "Export Selected",
          action: "export",
          icon: <Download className="h-4 w-4" />,
          variant: "default",
        },
        {
          label: "Delete Selected",
          action: "delete",
          icon: <Trash2 className="h-4 w-4" />,
          variant: "destructive",
        },
      ];
    case "contacts":
      return [
        {
          label: "Assign to Project",
          action: "assign",
          icon: <Copy className="h-4 w-4" />,
          variant: "default",
        },
        {
          label: "Export Selected",
          action: "export",
          icon: <FileDown className="h-4 w-4" />,
          variant: "secondary",
        },
        {
          label: "Delete Selected",
          action: "delete",
          icon: <Trash2 className="h-4 w-4" />,
          variant: "destructive",
        },
      ];
    case "stakeholders":
      return [
        {
          label: "Export Selected",
          action: "export",
          icon: <Download className="h-4 w-4" />,
          variant: "default",
        },
        {
          label: "Delete Selected",
          action: "delete",
          icon: <Trash2 className="h-4 w-4" />,
          variant: "destructive",
        },
      ];
    case "resources":
      return [
        {
          label: "Add to Group",
          action: "add-to-group",
          icon: <Copy className="h-4 w-4" />,
          variant: "secondary",
        },
        {
          label: "Export Selected",
          action: "export",
          icon: <Download className="h-4 w-4" />,
          variant: "default",
        },
        {
          label: "Delete Selected",
          action: "delete",
          icon: <Trash2 className="h-4 w-4" />,
          variant: "destructive",
        },
      ];
    case "issues":
      return [
        {
          label: "Export Selected",
          action: "export",
          icon: <Download className="h-4 w-4" />,
          variant: "default",
        },
        {
          label: "Delete Selected",
          action: "delete",
          icon: <Trash2 className="h-4 w-4" />,
          variant: "destructive",
        },
      ];
    case "risks":
      return [
        {
          label: "Export Selected",
          action: "export",
          icon: <Download className="h-4 w-4" />,
          variant: "default",
        },
        {
          label: "Delete Selected",
          action: "delete",
          icon: <Trash2 className="h-4 w-4" />,
          variant: "destructive",
        },
      ];
    case "programs":
      return [
        {
          label: "Export Selected",
          action: "export",
          icon: <Download className="h-4 w-4" />,
          variant: "default",
        },
        {
          label: "Delete Selected",
          action: "delete",
          icon: <Trash2 className="h-4 w-4" />,
          variant: "destructive",
        },
      ];
    default:
      return [
        {
          label: "Export Selected",
          action: "export",
          icon: <Download className="h-4 w-4" />,
          variant: "default",
        },
        {
          label: "Delete Selected",
          action: "delete",
          icon: <Trash2 className="h-4 w-4" />,
          variant: "destructive",
        },
      ];
  }
};

// Global event emitter for bulk actions
const bulkActionListeners = new Map<string, (action: string, items: any[]) => void>();

export function registerBulkActionHandler(type: string, handler: (action: string, items: any[]) => void) {
  bulkActionListeners.set(type, handler);
  
  return () => {
    bulkActionListeners.delete(type);
  };
}

function triggerBulkAction(type: string, action: string, items: any[]) {
  const handler = bulkActionListeners.get(type);
  if (handler) {
    handler(action, items);
  }
}

export function BottomSelectionToolbar() {
  const { getCurrentSelections, selectedProjects, selectedContacts, selectedStakeholders, selectedResources, selectedPrograms, selectedIssues, selectedRisks } = useSelection();
  const { state: sidebarState, isMobile } = useSidebar();
  const [location] = useLocation();
  const [currentSelections, setCurrentSelections] = React.useState<{
    items: any[];
    type: string;
    clearFn: () => void;
  } | null>(null);

  // Update current selections when context changes (location or any selection state)
  React.useEffect(() => {
    const selections = getCurrentSelections();
    setCurrentSelections(selections);
  }, [getCurrentSelections, location, selectedProjects, selectedContacts, selectedStakeholders, selectedResources, selectedPrograms, selectedIssues, selectedRisks]);

  if (!currentSelections || currentSelections.items.length === 0) {
    return null;
  }

  const { items, type, clearFn } = currentSelections;
  const selectedCount = items.length;
  const bulkActions = getBulkActions(type);

  const handleBulkAction = (action: string) => {
    triggerBulkAction(type, action, items);
  };

  // Calculate left offset based on sidebar state
  // The sidebar uses "offcanvas" collapsible mode, so when collapsed it's hidden
  // When expanded, it takes up var(--sidebar-width)
  const getLeftOffset = () => {
    if (isMobile) return "0";
    if (sidebarState === "collapsed") return "0";
    return "var(--sidebar-width)";
  };

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "h-14 md:h-16",
        "border-t bg-background shadow-lg",
        "transition-all duration-200 ease-linear"
      )}
      style={{
        left: getLeftOffset(),
      }}
    >
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-foreground">
            <span className="font-semibold text-primary">{selectedCount}</span>{" "}
            {(() => {
              // Proper singularization function
              const singularize = (plural: string): string => {
                const singularMap: Record<string, string> = {
                  projects: "project",
                  contacts: "contact",
                  stakeholders: "stakeholder",
                  resources: "resource",
                  programs: "program",
                  issues: "issue",
                  risks: "risk",
                };
                return singularMap[plural] || plural.slice(0, -1);
              };
              const singular = singularize(type);
              return `${singular}${selectedCount !== 1 ? "s" : ""}`;
            })()} selected
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFn}
            className="h-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1.5" />
            Clear
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {bulkActions.slice(0, 2).map((action) => (
            <Button
              key={action.action}
              variant={action.variant || "outline"}
              size="sm"
              onClick={() => handleBulkAction(action.action)}
              className={cn(
                "h-9 px-4 font-medium transition-all",
                action.variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90",
                action.variant === "destructive" && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                action.variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </Button>
          ))}

          {bulkActions.length > 2 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-9 px-3"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {bulkActions.slice(2).map((action) => (
                  <DropdownMenuItem
                    key={action.action}
                    onClick={() => handleBulkAction(action.action)}
                    className={cn(
                      action.variant === "destructive" && "text-destructive focus:text-destructive"
                    )}
                  >
                    {action.icon}
                    <span className="ml-2">{action.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}

