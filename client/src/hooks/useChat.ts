import { useEffect, useCallback, useRef } from "react";
import { useWebSocket } from "./useWebSocket";
import { queryClient } from "@/lib/queryClient";
import type { Message } from "@shared/schema";

interface UseChatOptions {
  conversationId: number | null;
  onMessage?: (message: Message) => void;
  onTyping?: (userId: string, isTyping: boolean) => void;
}

export function useChat({ conversationId, onMessage, onTyping }: UseChatOptions) {
  const conversationIdRef = useRef<number | null>(null);

  // Use existing WebSocket connection
  const { isConnected, joinConversation, leaveConversation, sendTypingIndicator: wsSendTyping } = useWebSocket({
    autoInvalidateQueries: false,
    onMessage: (message) => {
      if (message.type === "chat-message" && message.payload) {
        onMessage?.(message.payload as Message);
        // Invalidate messages query to refresh the list
        if (conversationId) {
          queryClient.invalidateQueries({
            queryKey: ["/api/chat/conversations", conversationId, "messages"],
          });
        }
      } else if (message.type === "typing-indicator" && message.payload) {
        onTyping?.(message.payload.userId, message.payload.isTyping);
      }
    },
  });

  useEffect(() => {
    if (!isConnected || !conversationId) return;

    if (conversationIdRef.current !== conversationId) {
      // Leave old conversation if switching
      if (conversationIdRef.current) {
        leaveConversation();
      }
      // Join new conversation
      joinConversation(conversationId);
      conversationIdRef.current = conversationId;
    }

    return () => {
      if (conversationIdRef.current) {
        leaveConversation();
        conversationIdRef.current = null;
      }
    };
  }, [isConnected, conversationId, joinConversation, leaveConversation]);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (conversationId) {
      wsSendTyping(conversationId, isTyping);
    }
  }, [conversationId, wsSendTyping]);

  return {
    sendTypingIndicator,
  };
}

