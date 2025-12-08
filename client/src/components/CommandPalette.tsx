import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useProject } from "@/contexts/ProjectContext";
import { useAIContext } from "@/contexts/AIContextContext";
import { useLocation } from "wouter";
import { Bot, Search, FileText, AlertTriangle, AlertCircle, User, Calendar, BarChart3, Plus } from "lucide-react";
import { useAIPrompt } from "@/contexts/AIPromptContext";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const { selectedProjectId } = useProject();
  const { context } = useAIContext();
  const { setExamplePrompt } = useAIPrompt();

  // Quick actions
  const quickActions = [
    {
      id: "ai-assistant",
      label: "Open AI Assistant",
      icon: Bot,
      action: () => {
        setLocation("/ai-assistant");
        onOpenChange(false);
      },
    },
    {
      id: "create-task",
      label: "Create New Task",
      icon: Plus,
      action: () => {
        // Navigate to WBS page - task creation handled there
        setLocation("/wbs");
        onOpenChange(false);
      },
    },
    {
      id: "create-risk",
      label: "Create New Risk",
      icon: AlertTriangle,
      action: () => {
        setLocation("/risks");
        onOpenChange(false);
      },
    },
    {
      id: "create-issue",
      label: "Create New Issue",
      icon: AlertCircle,
      action: () => {
        setLocation("/issues");
        onOpenChange(false);
      },
    },
  ];

  // Navigation commands
  const navigationCommands = [
    { id: "wbs", label: "WBS & Tasks", path: "/wbs", icon: FileText },
    { id: "kanban", label: "Kanban Board", path: "/kanban", icon: BarChart3 },
    { id: "risks", label: "Risks", path: "/risks", icon: AlertTriangle },
    { id: "issues", label: "Issues", path: "/issues", icon: AlertCircle },
    { id: "resources", label: "Resources", path: "/resources", icon: User },
    { id: "calendar", label: "Calendar", path: "/calendar", icon: Calendar },
    { id: "ai-assistant-nav", label: "AI Assistant", path: "/ai-assistant", icon: Bot },
  ];

  // AI prompts (context-aware)
  const getContextAwarePrompts = () => {
    const basePrompts = [
      {
        id: "ai-analyze-project",
        label: "Analyze project status",
        prompt: "Show me a summary of project status",
        icon: BarChart3,
      },
      {
        id: "ai-top-risks",
        label: "Show top 5 risks",
        prompt: "What are the top 5 risks in this project?",
        icon: AlertTriangle,
      },
      {
        id: "ai-behind-schedule",
        label: "Tasks behind schedule",
        prompt: "Which tasks are behind schedule?",
        icon: FileText,
      },
      {
        id: "ai-budget-variance",
        label: "Budget variance",
        prompt: "What's the current budget variance?",
        icon: BarChart3,
      },
    ];

    // Add context-specific prompts
    const contextPrompts = [];
    
    if (context.selectedTaskId) {
      contextPrompts.push({
        id: "ai-update-task",
        label: `Update task #${context.selectedTaskId}`,
        prompt: `Update task ${context.selectedTaskId}`,
        icon: FileText,
      });
      contextPrompts.push({
        id: "ai-task-details",
        label: `Show details for task #${context.selectedTaskId}`,
        prompt: `Tell me about task ${context.selectedTaskId}`,
        icon: FileText,
      });
    }

    if (context.selectedRiskId) {
      contextPrompts.push({
        id: "ai-update-risk",
        label: `Update risk #${context.selectedRiskId}`,
        prompt: `Update risk ${context.selectedRiskId}`,
        icon: AlertTriangle,
      });
    }

    if (context.selectedIssueId) {
      contextPrompts.push({
        id: "ai-update-issue",
        label: `Update issue #${context.selectedIssueId}`,
        prompt: `Update issue ${context.selectedIssueId}`,
        icon: AlertCircle,
      });
    }

    if (context.selectedItemIds && context.selectedItemIds.length > 0) {
      contextPrompts.push({
        id: "ai-bulk-update",
        label: `Bulk update ${context.selectedItemIds.length} items`,
        prompt: `Update these ${context.selectedItemIds.length} items`,
        icon: FileText,
      });
    }

    return [...contextPrompts, ...basePrompts];
  };

  const aiPrompts = getContextAwarePrompts();

  const filteredQuickActions = quickActions.filter(action =>
    action.label.toLowerCase().includes(search.toLowerCase())
  );

  const filteredNavigation = navigationCommands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAIPrompts = aiPrompts.filter(prompt =>
    prompt.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (action: () => void) => {
    action();
    setSearch("");
  };

  const handleAIPrompt = (prompt: string) => {
    setExamplePrompt(prompt);
    setLocation("/ai-assistant");
    onOpenChange(false);
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <Command className="rounded-lg border-none">
          <CommandInput
            placeholder="Type a command or search..."
            value={search}
            onValueChange={setSearch}
            className="h-12"
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            {/* AI Prompts */}
            {selectedProjectId && (
              <CommandGroup heading="AI Assistant">
                {filteredAIPrompts.map((prompt) => {
                  const Icon = prompt.icon;
                  return (
                    <CommandItem
                      key={prompt.id}
                      onSelect={() => handleAIPrompt(prompt.prompt)}
                      className="flex items-center gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{prompt.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {/* Quick Actions */}
            <CommandGroup heading="Quick Actions">
              {filteredQuickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <CommandItem
                    key={action.id}
                    onSelect={() => handleSelect(action.action)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{action.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {/* Navigation */}
            <CommandGroup heading="Navigation">
              {filteredNavigation.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <CommandItem
                    key={cmd.id}
                    onSelect={() => handleSelect(() => {
                      setLocation(cmd.path);
                      onOpenChange(false);
                    })}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{cmd.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

