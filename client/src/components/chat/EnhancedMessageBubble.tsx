import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Reply, ThumbsUp, Heart, CheckCircle, PartyPopper } from "lucide-react";
import type { Message, MessageReaction } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { EmojiPicker } from "./EmojiPicker";
import { LinkPreview } from "./LinkPreview";
import { TaskCard, RiskCard, IssueCard, UserCard } from "./ContextCard";
import type { Task, Risk, Issue, User as UserType } from "@shared/schema";

interface EnhancedMessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  onReply?: (message: Message) => void;
  reactions?: Array<{ emoji: string; userId: string; count: number; userReacted: boolean }>;
  threadCount?: number;
  showThreadIndicator?: boolean;
}

export function EnhancedMessageBubble({
  message,
  showAvatar = true,
  onEdit,
  onDelete,
  onReply,
  reactions = [],
  threadCount = 0,
  showThreadIndicator = false,
}: EnhancedMessageBubbleProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isOwnMessage = message.userId === user?.id;

  // Fetch user data
  const { data: messageUser } = useQuery({
    queryKey: ["/api/users", message.userId],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/users/${message.userId}`);
        return await response.json();
      } catch {
        return { id: message.userId, name: "Unknown User", email: message.userId };
      }
    },
  });

  // Fetch reactions if not provided
  const { data: messageReactions = [] } = useQuery<MessageReaction[]>({
    queryKey: [`/api/chat/messages/${message.id}/reactions`],
    enabled: reactions.length === 0,
  });

  // Process reactions to show counts
  const reactionGroups = (reactions.length > 0 ? reactions : messageReactions).reduce((acc: Record<string, { emoji: string; count: number; userReacted: boolean }>, r: any) => {
    const emoji = typeof r === 'string' ? r : r.emoji;
    if (!acc[emoji]) {
      acc[emoji] = { emoji, count: 0, userReacted: false };
    }
    acc[emoji].count++;
    if (typeof r !== 'string' && r.userId === user?.id) {
      acc[emoji].userReacted = true;
    }
    return acc;
  }, {} as Record<string, { emoji: string; count: number; userReacted: boolean }>);

  const toggleReactionMutation = useMutation({
    mutationFn: async (emoji: string) => {
      return await apiRequest("POST", `/api/chat/messages/${message.id}/reactions`, { emoji });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/messages/${message.id}/reactions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/chat/conversations/${message.conversationId}/messages`] });
    },
  });

  const handleReaction = (emoji: string) => {
    toggleReactionMutation.mutate(emoji);
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return "U";
  };

  const quickReactions = ["👍", "❤️", "✅", "🎉"];

  return (
    <div className={cn("flex gap-2 group", isOwnMessage && "flex-row-reverse")}>
      {showAvatar && !isOwnMessage && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={messageUser?.avatar} />
          <AvatarFallback>{getInitials(messageUser?.name, messageUser?.email)}</AvatarFallback>
        </Avatar>
      )}
      <div className={cn("flex flex-col gap-1", isOwnMessage ? "items-end" : "items-start", "max-w-[70%]")}>
        {!isOwnMessage && (
          <span className="text-xs text-muted-foreground px-2">
            {messageUser?.name || messageUser?.email || message.userId}
          </span>
        )}
        <div
          className={cn(
            "rounded-lg px-3 py-2 relative",
            isOwnMessage
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          {/* Reply indicator */}
          {/* {message.replyToMessageId && (
            <div className={cn(
              "mb-2 pb-2 border-b text-xs opacity-70",
              isOwnMessage ? "border-primary-foreground/20" : "border-border"
            )}>
              Replying to message #{message.replyToMessageId}
            </div>
          )} */}

          {/* Message content */}
          {/* {message.type === "text" && ( */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="mb-1 ml-4 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-1 ml-4 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="mb-0.5">{children}</li>,
                  code: ({ className, children }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="bg-background/50 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                    ) : (
                      <code className="block bg-background/50 p-2 rounded text-xs font-mono overflow-x-auto mb-1">{children}</code>
                    );
                  },
                  pre: ({ children }) => <pre className="bg-background/50 p-2 rounded overflow-x-auto mb-1">{children}</pre>,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
                      {children}
                    </a>
                  ),
                }}
              >
                {message.message}
              </ReactMarkdown>
              
              {/* Show context cards for mentions */}
              {/* {message.mentions && typeof message.mentions === 'object' && Array.isArray(message.mentions) && (
                <div className="mt-2 space-y-2">
                  {message.mentions.map((mention: any, idx: number) => {
                    if (mention.type === "task" && mention.id) {
                      return <TaskCard key={`task-${mention.id}-${idx}`} task={{ id: Number(mention.id), name: mention.name || `Task ${mention.id}` } as Task} onClick={() => window.open(`/tasks/${mention.id}`, "_blank")} />;
                    }
                    if (mention.type === "risk" && mention.id) {
                      return <RiskCard key={`risk-${mention.id}-${idx}`} risk={{ id: Number(mention.id), title: mention.name || `Risk ${mention.id}` } as Risk} onClick={() => window.open(`/risks`, "_blank")} />;
                    }
                    if (mention.type === "issue" && mention.id) {
                      return <IssueCard key={`issue-${mention.id}-${idx}`} issue={{ id: Number(mention.id), title: mention.name || `Issue ${mention.id}` } as Issue} onClick={() => window.open(`/issues`, "_blank")} />;
                    }
                    if (mention.type === "user" && mention.id) {
                      return <UserCard key={`user-${mention.id}-${idx}`} user={{ id: String(mention.id), email: mention.name || "User" } as UserType} onClick={() => window.open(`/users/${mention.id}`, "_blank")} />;
                    }
                    return null;
                  })}
                </div>
              )} */}
            </div>
          {/* )} */}
          {/* {message.type === "file" && (
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

          {/* Reactions */}
          {Object.keys(reactionGroups).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.values(reactionGroups).map((reaction) => (
                <Button
                  key={reaction.emoji}
                  type="button"
                  variant={reaction.userReacted ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-6 px-2 text-xs",
                    reaction.userReacted && "bg-primary/20"
                  )}
                  onClick={() => handleReaction(reaction.emoji)}
                >
                  <span>{reaction.emoji}</span>
                  <span className="ml-1">{reaction.count}</span>
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Actions bar */}
        <div className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground px-2 opacity-0 group-hover:opacity-100 transition-opacity",
          isOwnMessage && "flex-row-reverse"
        )}>
          <span>{format(new Date(message.createdAt), "HH:mm")}</span>
          
          {/* Quick reactions */}
          <div className="flex gap-1">
            {quickReactions.map((emoji) => (
              <Button
                key={emoji}
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => handleReaction(emoji)}
                title={`React with ${emoji}`}
              >
                {emoji}
              </Button>
            ))}
            <EmojiPicker onSelect={handleReaction}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                title="Add reaction"
              >
                <span className="text-xs">😊</span>
              </Button>
            </EmojiPicker>
          </div>

          {/* Thread indicator */}
          {showThreadIndicator && threadCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => onReply?.(message)}
            >
              💬 {threadCount} {threadCount === 1 ? "reply" : "replies"}
            </Button>
          )}

          {/* Reply button */}
          {onReply && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => onReply(message)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}

          {/* More options */}
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0">
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
          <AvatarImage src={user?.profileImageUrl || undefined} />
          <AvatarFallback>{getInitials(user?.firstName ? `${user.firstName} ${user.lastName}` : undefined, user?.email)}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

