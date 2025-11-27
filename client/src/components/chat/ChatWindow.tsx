import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { ConversationHeader } from "./ConversationHeader";
import { useMessages } from "@/hooks/useMessages";
import { useChat } from "@/hooks/useChat";
import type { Conversation, Message } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface ChatWindowProps {
  conversation: Conversation | null;
  onEditMessage?: (message: Message) => void;
  onDeleteMessage?: (message: Message) => void;
}

export function ChatWindow({ conversation, onEditMessage, onDeleteMessage }: ChatWindowProps) {
  const { data: messagesData, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(
    conversation?.id || null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Real-time message updates
  useChat({
    conversationId: conversation?.id || null,
    onMessage: (message) => {
      // Messages are automatically invalidated via WebSocket
      // This callback can be used for optimistic updates if needed
    },
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

  const allMessages = messagesData?.pages.flatMap((page) => page.messages) || [];

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

            return (
              <MessageBubble
                key={message.id}
                message={message}
                showAvatar={showAvatar}
                onEdit={onEditMessage}
                onDelete={onDeleteMessage}
              />
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <ChatInput conversationId={conversation.id} />
    </div>
  );
}

