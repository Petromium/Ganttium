import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Participant } from "@shared/schema";

export function useParticipants(conversationId: number | null) {
  return useQuery({
    queryKey: ["/api/chat/conversations", conversationId, "participants"],
    queryFn: async () => {
      if (!conversationId) return [];
      const response = await apiRequest(
        "GET",
        `/api/chat/conversations/${conversationId}/participants`
      );
      return (await response.json()) as Participant[];
    },
    enabled: !!conversationId,
  });
}

