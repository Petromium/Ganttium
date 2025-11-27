import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useUnreadCount(conversationId?: number | null) {
  return useQuery({
    queryKey: ["/api/chat/unread-count", conversationId],
    queryFn: async () => {
      const url = conversationId
        ? `/api/chat/unread-count?conversationId=${conversationId}`
        : "/api/chat/unread-count";
      const response = await apiRequest("GET", url);
      const data = await response.json();
      
      if (conversationId) {
        return { [conversationId]: data.count } as Record<number, number>;
      }
      
      // For all conversations, we'd need to fetch each one
      // For now, return the total count
      return { total: data.count } as Record<string, number>;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

