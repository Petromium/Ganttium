import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Message, InsertMessage } from "@shared/schema";

export function useMessages(conversationId: number | null, limit: number = 50) {
  return useInfiniteQuery({
    queryKey: ["/api/chat/conversations", conversationId, "messages"],
    queryFn: async ({ pageParam = 0 }) => {
      if (!conversationId) return { messages: [], nextOffset: null };
      const response = await apiRequest(
        "GET",
        `/api/chat/conversations/${conversationId}/messages?limit=${limit}&offset=${pageParam}`
      );
      const messages = (await response.json()) as Message[];
      return {
        messages,
        nextOffset: messages.length === limit ? pageParam + limit : null,
      };
    },
    enabled: !!conversationId,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
  });
}

export function useCreateMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ conversationId, data }: { conversationId: number; data: InsertMessage }) => {
      const response = await apiRequest(
        "POST",
        `/api/chat/conversations/${conversationId}/messages`,
        data
      );
      return (await response.json()) as Message;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/chat/conversations", variables.conversationId, "messages"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
    },
  });
}

export function useUpdateMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertMessage> }) => {
      const response = await apiRequest("PATCH", `/api/chat/messages/${id}`, data);
      return (await response.json()) as Message;
    },
    onSuccess: (message) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/chat/conversations", message.conversationId, "messages"],
      });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/chat/messages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (messageId: number) => {
      await apiRequest("POST", `/api/chat/messages/${messageId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/unread-count"] });
    },
  });
}

