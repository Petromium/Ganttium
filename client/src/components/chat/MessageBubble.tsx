import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import type { Message } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
}

export function MessageBubble({ message, showAvatar = true, onEdit, onDelete }: MessageBubbleProps) {
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/auth/user");
      return await response.json();
    },
  });
  const isOwnMessage = message.userId === user?.id;

  const getInitials = (userId: string) => {
    // This would ideally come from user data, but for now use first char of userId
    return userId.charAt(0).toUpperCase();
  };

  return (
    <div className={`flex gap-2 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
      {showAvatar && !isOwnMessage && (
        <Avatar className="h-8 w-8">
          <AvatarImage src="" />
          <AvatarFallback>{getInitials(message.userId)}</AvatarFallback>
        </Avatar>
      )}
      <div className={`flex flex-col gap-1 ${isOwnMessage ? "items-end" : "items-start"} max-w-[70%]`}>
        {!isOwnMessage && (
          <span className="text-xs text-muted-foreground px-2">
            {message.userId} {/* Would show user name here */}
          </span>
        )}
        <div
          className={`rounded-lg px-3 py-2 ${
            isOwnMessage
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
          {/* {message.type === "text" && <p className="text-sm whitespace-pre-wrap">{message.content}</p>}
          {message.type === "file" && (
            <div className="flex items-center gap-2">
              <span className="text-sm">📎 {message.fileName || "File"}</span>
              {message.fileSize && (
                <span className="text-xs opacity-70">
                  {(message.fileSize / 1024).toFixed(1)} KB
                </span>
              )}
            </div>
          )}
          {message.type === "image" && (
            <img
              src={message.filePath || ""}
              alt={message.fileName || "Image"}
              className="max-w-full max-h-64 rounded"
            />
          )} */}
        </div>
        <div className={`flex items-center gap-2 text-xs text-muted-foreground px-2 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
          <span>{format(new Date(message.createdAt), "HH:mm")}</span>
          {isOwnMessage && (onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwnMessage ? "end" : "start"}>
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(message)}>Edit</DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(message)}
                    className="text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      {showAvatar && isOwnMessage && (
        <Avatar className="h-8 w-8">
          <AvatarImage src="" />
          <AvatarFallback>{getInitials(message.userId)}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

