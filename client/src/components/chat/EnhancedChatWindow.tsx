import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EnhancedMessageBubble } from "./EnhancedMessageBubble";
import { EnhancedChatInput } from "./EnhancedChatInput";
import { ConversationHeader } from "./ConversationHeader";
import { ChatQuickSwitcher } from "./ChatQuickSwitcher";
import { useMessages } from "@/hooks/useMessages";
import { useChat } from "@/hooks/useChat";
import type { Conversation, Message } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface EnhancedChatWindowProps {
  conversation: Conversation | null;
  onEditMessage?: (message: Message) => void;
  onDeleteMessage?: (message: Message) => void;
}

export function EnhancedChatWindow({
  conversation,
  onEditMessage,
  onDeleteMessage,
}: EnhancedChatWindowProps) {
  const { data: messagesData, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(
    conversation?.id || null
  );
  const [replyToMessageId, setReplyToMessageId] = useState<number | null>(null);
  const [quickSwitcherOpen, setQuickSwitcherOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K for quick switcher
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setQuickSwitcherOpen(true);
      }
      // Escape to close quick switcher
      if (e.key === "Escape" && quickSwitcherOpen) {
        setQuickSwitcherOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quickSwitcherOpen]);

  // Real-time message updates
  useChat({
    conversationId: conversation?.id || null,
    onMessage: (message) => {
      // Messages are automatically invalidated via WebSocket
    },
  });

  // Fetch reactions for all messages
  const allMessages = messagesData?.pages.flatMap((page) => page.messages) || [];
  const messageIds = allMessages.map(m => m.id);

  const { data: reactionsMap } = useQuery({
    queryKey: [`/api/chat/messages/reactions`, messageIds],
    queryFn: async () => {
      // Fetch reactions for all messages
      const reactions = await Promise.all(
        messageIds.map(async (id) => {
          try {
            const response = await apiRequest("GET", `/api/chat/messages/${id}/reactions`);
            const data = await response.json();
            return { messageId: id, reactions: data };
          } catch {
            return { messageId: id, reactions: [] };
          }
        })
      );
      
      const map = new Map<number, any[]>();
      reactions.forEach(({ messageId, reactions }) => {
        map.set(messageId, reactions);
      });
      return map;
    },
    enabled: messageIds.length > 0,
  });

  // Fetch thread counts
  const { data: threadCounts } = useQuery({
    queryKey: [`/api/chat/conversations/${conversation?.id}/threads`],
    queryFn: async () => {
      if (!conversation) return new Map();
      
      // Count replies per message
      const counts = new Map<number, number>();
      allMessages.forEach(msg => {
        if (msg.replyToMessageId) {
          counts.set(msg.replyToMessageId, (counts.get(msg.replyToMessageId) || 0) + 1);
        }
      });
      return counts;
    },
    enabled: !!conversation && allMessages.length > 0,
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messagesData]);

  const handleReply = (message: Message) => {
    setReplyToMessageId(message.id);
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/50">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Select a conversation to start chatting</p>
          <p className="text-sm mt-2">Choose a conversation from the sidebar or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <ConversationHeader conversation={conversation} />
      <ScrollArea ref={scrollAreaRef} className="flex-1">
        <div className="p-4 space-y-4">
          {hasNextPage && (
            <div className="flex justify-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {isFetchingNextPage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Load older messages"
                )}
              </button>
            </div>
          )}
          {allMessages.map((message, index) => {
            const prevMessage = index > 0 ? allMessages[index - 1] : null;
            const showAvatar =
              !prevMessage || prevMessage.userId !== message.userId ||
              new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 300000; // 5 minutes

            const reactions = reactionsMap?.get(message.id) || [];
            const threadCount = threadCounts?.get(message.id) || 0;
            const showThreadIndicator = threadCount > 0;

            return (
              <EnhancedMessageBubble
                key={message.id}
                message={message}
                showAvatar={showAvatar}
                reactions={reactions}
                threadCount={threadCount}
                showThreadIndicator={showThreadIndicator}
                onEdit={onEditMessage}
                onDelete={onDeleteMessage}
                onReply={handleReply}
              />
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <EnhancedChatInput
        conversationId={conversation.id}
        replyToMessageId={replyToMessageId}
        onReplyCancel={() => setReplyToMessageId(null)}
      />
    </div>
  );
}

