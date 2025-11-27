import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Users } from "lucide-react";
import type { Conversation } from "@shared/schema";
import { useParticipants } from "./useParticipants";

interface ConversationHeaderProps {
  conversation: Conversation | null;
  onSettings?: () => void;
}

export function ConversationHeader({ conversation, onSettings }: ConversationHeaderProps) {
  const { data: participants } = useParticipants(conversation?.id || null);

  if (!conversation) {
    return (
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">Select a conversation</h2>
      </div>
    );
  }

  const getConversationName = () => {
    if (conversation.name) return conversation.name;
    if (conversation.type === "direct") return "Direct Message";
    if (conversation.type === "project") return "Project Chat";
    if (conversation.type === "task") return "Task Chat";
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
    <div className="border-b p-4 flex items-center justify-between bg-background">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src="" />
          <AvatarFallback>{getInitials(getConversationName())}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg font-semibold">{getConversationName()}</h2>
          {participants && participants.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{participants.length} participant{participants.length !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onSettings}>Settings</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

