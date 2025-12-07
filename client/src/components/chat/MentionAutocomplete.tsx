import { useState, useEffect, useRef } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useProject } from "@/contexts/ProjectContext";
import { User, FileText, AlertTriangle, AlertCircle, Hash } from "lucide-react";
import type { User as UserType } from "@shared/schema";
import type { Task, Risk, Issue } from "@shared/schema";

interface MentionItem {
  id: string | number;
  type: "user" | "task" | "risk" | "issue" | "project";
  name: string;
  avatar?: string;
  description?: string;
}

interface MentionAutocompleteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  position: { top: number; left: number };
  onSelect: (item: MentionItem) => void;
}

export function MentionAutocomplete({
  open,
  onOpenChange,
  query,
  position,
  onSelect,
}: MentionAutocompleteProps) {
  const { selectedProjectId } = useProject();
  const [searchQuery, setSearchQuery] = useState(query);

  // Fetch users
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    enabled: open && selectedProjectId !== null,
  });

  // Fetch tasks
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: selectedProjectId ? [`/api/projects/${selectedProjectId}/tasks`] : ["__disabled__"],
    enabled: open && selectedProjectId !== null,
  });

  // Fetch risks
  const { data: risks = [] } = useQuery<Risk[]>({
    queryKey: selectedProjectId ? [`/api/projects/${selectedProjectId}/risks`] : ["__disabled__"],
    enabled: open && selectedProjectId !== null,
  });

  // Fetch issues
  const { data: issues = [] } = useQuery<Issue[]>({
    queryKey: selectedProjectId ? [`/api/projects/${selectedProjectId}/issues`] : ["__disabled__"],
    enabled: open && selectedProjectId !== null,
  });

  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  // Filter items based on search query
  const filteredUsers = users.filter(user => {
    const name = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "";
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }).slice(0, 5);

  const filteredTasks = tasks.filter(task =>
    task.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.wbsCode?.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  const filteredRisks = risks.filter(risk =>
    risk.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    risk.code?.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  const filteredIssues = issues.filter(issue =>
    issue.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    issue.code?.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  const allItems: MentionItem[] = [
    ...filteredUsers.map(u => ({
      id: u.id,
      type: "user" as const,
      name: (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.email) || "Unknown",
      avatar: u.profileImageUrl || undefined,
      description: u.email,
    })),
    ...filteredTasks.map(t => ({
      id: t.id,
      type: "task" as const,
      name: t.name || `Task ${t.wbsCode}`,
      description: t.wbsCode || undefined,
    })),
    ...filteredRisks.map(r => ({
      id: r.id,
      type: "risk" as const,
      name: r.title || r.code || "Unknown Risk",
      description: r.code,
    })),
    ...filteredIssues.map(i => ({
      id: i.id,
      type: "issue" as const,
      name: i.title || i.code || "Unknown Issue",
      description: i.code,
    })),
  ];

  const getIcon = (type: MentionItem["type"]) => {
    switch (type) {
      case "user": return <User className="h-4 w-4" />;
      case "task": return <FileText className="h-4 w-4" />;
      case "risk": return <AlertTriangle className="h-4 w-4" />;
      case "issue": return <AlertCircle className="h-4 w-4" />;
      case "project": return <Hash className="h-4 w-4" />;
    }
  };

  const getLabel = (type: MentionItem["type"]) => {
    switch (type) {
      case "user": return "People";
      case "task": return "Tasks";
      case "risk": return "Risks";
      case "issue": return "Issues";
      case "project": return "Projects";
    }
  };

  // Group items by type
  const groupedItems = allItems.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, MentionItem[]>);

  return (
    <Popover open={open && allItems.length > 0} onOpenChange={onOpenChange}>
      <PopoverContent
        className="w-[300px] p-0"
        style={{ position: "fixed", top: `${position.top}px`, left: `${position.left}px` }}
      >
        <Command>
          <CommandInput
            placeholder="Search..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {Object.entries(groupedItems).map(([type, items]) => (
              <CommandGroup key={type} heading={getLabel(type as MentionItem["type"])}>
                {items.map((item) => (
                  <CommandItem
                    key={`${item.type}-${item.id}`}
                    onSelect={() => {
                      onSelect(item);
                      onOpenChange(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    {getIcon(item.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

