import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Archive, ArchiveRestore, Bell, BellOff, Star, MoreVertical } from "lucide-react";
import { useConversations } from "@/hooks/useConversations";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Conversation } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ChatSidebarProps {
  selectedConversationId: number | null;
  onSelectConversation: (conversation: Conversation | null) => void;
  onCreateConversation: () => void;
}

export function ChatSidebar({
  selectedConversationId,
  onSelectConversation,
  onCreateConversation,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const { data: conversations = [], isLoading } = useConversations();
  const { toast } = useToast();
  
  // Get unread counts for all conversations
  const { data: unreadCounts } = useQuery({
    queryKey: ["/api/chat/unread-count"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/chat/unread-count");
      const data = await response.json();
      return data.count || 0; // Total unread count
    },
    refetchInterval: 30000,
  });

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.name?.toLowerCase().includes(query) ||
      conv.description?.toLowerCase().includes(query)
    );
  });

  const getConversationName = (conv: Conversation) => {
    if (conv.name) return conv.name;
    if (conv.type === "direct") return "Direct Message";
    if (conv.type === "project") return "Project Chat";
    if (conv.type === "task") return "Task Chat";
    return "Group Chat";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="w-80 border-r bg-background flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Conversations</h2>
          <Button size="icon" variant="ghost" onClick={onCreateConversation} title="New conversation">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const isSelected = conversation.id === selectedConversationId;
              // TODO: Fetch individual unread count per conversation
              const unreadCount = 0;

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" />
                      <AvatarFallback>
                        {getInitials(getConversationName(conversation))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">{getConversationName(conversation)}</p>
                        {unreadCount > 0 && (
                          <Badge variant="secondary" className="shrink-0">
                            {unreadCount}
                          </Badge>
                        )}
                      </div>
                      {conversation.description && (
                        <p className={`text-sm truncate ${
                          isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                        }`}>
                          {conversation.description}
                        </p>
                      )}
                      <p className={`text-xs mt-1 ${
                        isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}>
                        {format(new Date(conversation.updatedAt), "MMM d, HH:mm")}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

