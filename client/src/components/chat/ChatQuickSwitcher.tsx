import { useState, useEffect, useRef } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useProject } from "@/contexts/ProjectContext";
import { useLocation } from "wouter";
import type { Conversation } from "@shared/schema";
import { MessageSquare, Hash, Users, FileText, AlertTriangle, AlertCircle, Plus } from "lucide-react";
import { useConversations } from "@/hooks/useConversations";

interface ChatQuickSwitcherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectConversation?: (conversation: Conversation) => void;
}

export function ChatQuickSwitcher({
  open,
  onOpenChange,
  onSelectConversation,
}: ChatQuickSwitcherProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { selectedProjectId } = useProject();
  const { data: conversations = [] } = useConversations();

  // Filter conversations based on search
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.name?.toLowerCase().includes(query)
    );
  });

  const handleSelect = (conversation: Conversation) => {
    if (onSelectConversation) {
      onSelectConversation(conversation);
    } else {
      setLocation(`/chat?conversation=${conversation.id}`);
    }
    onOpenChange(false);
    setSearchQuery("");
  };

  const getConversationIcon = (type: Conversation["type"]) => {
    switch (type) {
      case "direct":
        return <Users className="h-4 w-4" />;
      case "group":
        return <Users className="h-4 w-4" />;
      case "project":
        return <Hash className="h-4 w-4" />;
      case "task":
        return <FileText className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.name) return conv.name;
    if (conv.type === "direct") return "Direct Message";
    if (conv.type === "project") return "Project Chat";
    if (conv.type === "task") return "Task Chat";
    return "Group Chat";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-[600px]">
        <Command className="rounded-lg">
          <CommandInput
            placeholder="Search conversations, people, or type a command..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            {/* Quick Actions */}
            {searchQuery.startsWith("/") && (
              <CommandGroup heading="Commands">
                <CommandItem
                  onSelect={() => {
                    // Handle slash commands
                    if (searchQuery === "/task" || searchQuery.startsWith("/task ")) {
                      if (selectedProjectId) {
                        setLocation(`/wbs?action=create`);
                      }
                      onOpenChange(false);
                    } else if (searchQuery === "/risk" || searchQuery.startsWith("/risk ")) {
                      if (selectedProjectId) {
                        setLocation(`/risks?action=create`);
                      }
                      onOpenChange(false);
                    } else if (searchQuery === "/issue" || searchQuery.startsWith("/issue ")) {
                      if (selectedProjectId) {
                        setLocation(`/issues?action=create`);
                      }
                      onOpenChange(false);
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span>
                    {searchQuery === "/task" && "Create Task"}
                    {searchQuery === "/risk" && "Create Risk"}
                    {searchQuery === "/issue" && "Create Issue"}
                    {!["/task", "/risk", "/issue"].includes(searchQuery) && "Type /task, /risk, or /issue"}
                  </span>
                </CommandItem>
              </CommandGroup>
            )}

            {/* Conversations */}
            {filteredConversations.length > 0 && (
              <CommandGroup heading="Conversations">
                {filteredConversations.map((conv) => (
                  <CommandItem
                    key={conv.id}
                    onSelect={() => handleSelect(conv)}
                    className="flex items-center gap-2"
                  >
                    {getConversationIcon(conv.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{getConversationName(conv)}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Create New */}
            <CommandGroup heading="Quick Actions">
              <CommandItem
                onSelect={() => {
                  setLocation("/chat?action=create");
                  onOpenChange(false);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                <span>Create New Conversation</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
