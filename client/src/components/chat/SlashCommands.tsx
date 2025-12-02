import { useState, useEffect } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { FileText, AlertTriangle, AlertCircle, UserPlus, Hash, HelpCircle } from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";

interface SlashCommand {
  command: string;
  description: string;
  icon: React.ReactNode;
  category: "create" | "assign" | "other";
}

const SLASH_COMMANDS: SlashCommand[] = [
  {
    command: "/task",
    description: "Create a new task",
    icon: <FileText className="h-4 w-4" />,
    category: "create",
  },
  {
    command: "/risk",
    description: "Create a new risk",
    icon: <AlertTriangle className="h-4 w-4" />,
    category: "create",
  },
  {
    command: "/issue",
    description: "Create a new issue",
    icon: <AlertCircle className="h-4 w-4" />,
    category: "create",
  },
  {
    command: "/assign",
    description: "Assign user to task",
    icon: <UserPlus className="h-4 w-4" />,
    category: "assign",
  },
  {
    command: "/status",
    description: "Update task status",
    icon: <Hash className="h-4 w-4" />,
    category: "other",
  },
  {
    command: "/help",
    description: "Show available commands",
    icon: <HelpCircle className="h-4 w-4" />,
    category: "other",
  },
];

interface SlashCommandsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  position: { top: number; left: number };
  onSelect: (command: SlashCommand) => void;
  projectId?: number | null;
}

export function SlashCommands({
  open,
  onOpenChange,
  query,
  position,
  onSelect,
  projectId,
}: SlashCommandsProps) {
  const [searchQuery, setSearchQuery] = useState(query);

  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  const filteredCommands = SLASH_COMMANDS.filter((cmd) =>
    cmd.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, SlashCommand[]>);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "create":
        return "Create";
      case "assign":
        return "Assign";
      case "other":
        return "Other";
      default:
        return "Commands";
    }
  };

  return (
    <Popover open={open && filteredCommands.length > 0} onOpenChange={onOpenChange}>
      <PopoverContent
        className="w-[300px] p-0"
        style={{ position: "fixed", top: `${position.top}px`, left: `${position.left}px` }}
      >
        <Command>
          <CommandInput
            placeholder="Search commands..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No commands found.</CommandEmpty>
            {Object.entries(groupedCommands).map(([category, commands]) => (
              <CommandGroup key={category} heading={getCategoryLabel(category)}>
                {commands.map((cmd) => (
                  <CommandItem
                    key={cmd.command}
                    onSelect={() => {
                      onSelect(cmd);
                      onOpenChange(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    {cmd.icon}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{cmd.command}</p>
                      <p className="text-xs text-muted-foreground">{cmd.description}</p>
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
