import { useState, useEffect } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { EnhancedChatWindow } from "@/components/chat/EnhancedChatWindow";
import { ChatQuickSwitcher } from "@/components/chat/ChatQuickSwitcher";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateConversation } from "@/hooks/useConversations";
import { useUpdateMessage, useDeleteMessage } from "@/hooks/useMessages";
import type { Conversation, Message } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export default function ChatPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);
  const [conversationType, setConversationType] = useState<"direct" | "group" | "project" | "task">("direct");
  const [conversationName, setConversationName] = useState("");
  const [conversationDescription, setConversationDescription] = useState("");
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  
  const createConversation = useCreateConversation();
  const updateMessage = useUpdateMessage();
  const deleteMessage = useDeleteMessage();
  const { user } = useAuth();

  // Keyboard shortcut: Cmd/Ctrl+K for quick switcher
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowQuickSwitcher(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCreateConversation = async () => {
    if (!user) return;

    try {
      const newConversation = await createConversation.mutateAsync({
        type: conversationType,
        name: conversationType !== "direct" ? conversationName : undefined,
        description: conversationDescription || undefined,
        participantIds: participantIds.length > 0 ? participantIds : undefined,
      });

      setSelectedConversation(newConversation);
      setShowCreateDialog(false);
      setConversationName("");
      setConversationDescription("");
      setParticipantIds([]);
      setConversationType("direct");
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const handleEditMessage = async (message: Message) => {
    // TODO: Implement edit message dialog
    console.log("Edit message:", message);
  };

  const handleDeleteMessage = async (message: Message) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteMessage.mutateAsync(message.id);
      } catch (error) {
        console.error("Failed to delete message:", error);
      }
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <ChatSidebar
            selectedConversationId={selectedConversation?.id || null}
            onSelectConversation={setSelectedConversation}
            onCreateConversation={() => setShowCreateDialog(true)}
          />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={75} minSize={60}>
          <EnhancedChatWindow
            conversation={selectedConversation}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Conversation</DialogTitle>
            <DialogDescription>
              Start a new conversation with your team members.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={conversationType}
                onValueChange={(value) =>
                  setConversationType(value as "direct" | "group" | "project" | "task")
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct Message</SelectItem>
                  <SelectItem value="group">Group Chat</SelectItem>
                  <SelectItem value="project">Project Chat</SelectItem>
                  <SelectItem value="task">Task Chat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {conversationType !== "direct" && (
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={conversationName}
                  onChange={(e) => setConversationName(e.target.value)}
                  placeholder="Enter conversation name"
                />
              </div>
            )}
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={conversationDescription}
                onChange={(e) => setConversationDescription(e.target.value)}
                placeholder="Enter description"
                rows={3}
              />
            </div>
            {/* TODO: Add participant selection */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateConversation}
              disabled={createConversation.isPending || (conversationType !== "direct" && !conversationName)}
            >
              {createConversation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ChatQuickSwitcher
        open={showQuickSwitcher}
        onOpenChange={setShowQuickSwitcher}
        onSelectConversation={setSelectedConversation}
      />
    </div>
  );
}

