import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Send, Paperclip, Image as ImageIcon, X } from "lucide-react";
import { FileUploadHandler } from "./FileUploadHandler";
import { useCreateMessage } from "@/hooks/useMessages";
import { useChat } from "@/hooks/useChat";
import type { InsertMessage } from "@shared/schema";
import { RichTextEditor } from "./RichTextEditor";
import { MentionAutocomplete } from "./MentionAutocomplete";
import { EmojiPicker } from "./EmojiPicker";
import { SlashCommands } from "./SlashCommands";
import { useProject } from "@/contexts/ProjectContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface EnhancedChatInputProps {
  conversationId: number;
  onTyping?: (isTyping: boolean) => void;
  replyToMessageId?: number | null;
  onReplyCancel?: () => void;
}

export function EnhancedChatInput({
  conversationId,
  onTyping,
  replyToMessageId,
  onReplyCancel,
}: EnhancedChatInputProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showMentionAutocomplete, setShowMentionAutocomplete] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 });
  const [mentions, setMentions] = useState<Array<{ type: string; id: string | number; name: string }>>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const createMessage = useCreateMessage();
  const { sendTypingIndicator } = useChat({ conversationId });
  const { selectedProjectId } = useProject();
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Parse mentions from message content
  const parseMentions = useCallback((text: string) => {
    const mentionRegex = /@(\w+)/g;
    const mentions: Array<{ type: string; id: string | number; name: string }> = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // This is simplified - in real implementation, you'd match against actual users/tasks
      mentions.push({
        type: "user", // Would be determined by autocomplete
        id: match[1],
        name: match[1],
      });
    }

    return mentions;
  }, []);

  const handleInputChange = (value: string) => {
    setMessage(value);

    // Check for @mention trigger
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBefore = value.substring(0, cursorPos);
    const lastAt = textBefore.lastIndexOf("@");
    
    if (lastAt !== -1) {
      const textAfterAt = textBefore.substring(lastAt + 1);
      const isMentionContext = lastAt === 0 || /\s/.test(textBefore[lastAt - 1]);
      
      if (isMentionContext && !/\s/.test(textAfterAt)) {
        setMentionQuery(textAfterAt);
        setShowMentionAutocomplete(true);
        
        // Calculate position for autocomplete
        if (textareaRef.current) {
          const rect = textareaRef.current.getBoundingClientRect();
          setMentionPosition({
            top: rect.top - 300,
            left: rect.left,
          });
        }
      } else {
        setShowMentionAutocomplete(false);
      }
    } else {
      setShowMentionAutocomplete(false);
    }

    // Check for slash command trigger
    const lastSlash = textBefore.lastIndexOf("/");
    if (lastSlash !== -1) {
      const textAfterSlash = textBefore.substring(lastSlash + 1);
      const isCommandContext = lastSlash === 0 || /\s|\n/.test(textBefore[lastSlash - 1]);
      
      if (isCommandContext && !/\s/.test(textAfterSlash)) {
        setSlashQuery(textAfterSlash);
        setShowSlashCommands(true);
        
        // Calculate position for slash commands
        if (textareaRef.current) {
          const rect = textareaRef.current.getBoundingClientRect();
          setSlashPosition({
            top: rect.top - 300,
            left: rect.left,
          });
        }
      } else {
        setShowSlashCommands(false);
      }
    } else {
      setShowSlashCommands(false);
    }

    // Typing indicator
    if (value.length > 0 && !isTyping) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(false);
    }, 1000);
  };

  const handleMentionSelect = (item: { type: string; id: string | number; name: string }) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBefore = message.substring(0, cursorPos);
    const lastAt = textBefore.lastIndexOf("@");
    
    if (lastAt !== -1) {
      const textAfter = message.substring(cursorPos);
      const newMessage = textBefore.substring(0, lastAt) + `@${item.name} ` + textAfter;
      setMessage(newMessage);
      setMentions([...mentions, item]);
      setShowMentionAutocomplete(false);
      
      // Restore cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = lastAt + item.name.length + 2; // +2 for "@" and " "
          textareaRef.current.setSelectionRange(newPos, newPos);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBefore = message.substring(0, cursorPos);
    const textAfter = message.substring(cursorPos);
    setMessage(textBefore + emoji + textAfter);
    
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = cursorPos + emoji.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleSend = async () => {
    if (!message.trim() || createMessage.isPending) return;

    const parsedMentions = parseMentions(message);

    const messageData = {
      conversationId,
      message: message.trim(),
      // attachments: { replyToMessageId, mentions: parsedMentions },
    };

    try {
      await createMessage.mutateAsync({
        conversationId,
        data: messageData as any,
      });
      setMessage("");
      setIsTyping(false);
      sendTypingIndicator(false);
      setMentions([]);
      onReplyCancel?.();
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!showMentionAutocomplete && !showSlashCommands) {
        handleSend();
      }
    }
    
    if (e.key === "Escape") {
      setShowMentionAutocomplete(false);
      setShowSlashCommands(false);
    }
  };

  const handleSlashCommandSelect = (cmd: { command: string; description: string }) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBefore = message.substring(0, cursorPos);
    const lastSlash = textBefore.lastIndexOf("/");
    const textAfter = message.substring(cursorPos);
    
    if (lastSlash !== -1) {
      let newMessage = textBefore.substring(0, lastSlash) + cmd.command + " " + textAfter;
      
      // Handle special commands
      if (cmd.command === "/task" || cmd.command === "/risk" || cmd.command === "/issue") {
        // These will be handled by opening modals
        toast({
          title: "Coming Soon",
          description: `${cmd.description} - Modal will open in next update`,
        });
        newMessage = textBefore.substring(0, lastSlash) + textAfter; // Remove slash command
      } else if (cmd.command === "/help") {
        toast({
          title: "Available Commands",
          description: "/task, /risk, /issue, /assign, /status, /help",
        });
        newMessage = textBefore.substring(0, lastSlash) + textAfter;
      }
      
      setMessage(newMessage);
      setShowSlashCommands(false);
      
      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = lastSlash + cmd.command.length + 1;
          textareaRef.current.setSelectionRange(newPos, newPos);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  const [showFileUpload, setShowFileUpload] = useState(false);

  const handleFileUpload = () => {
    setShowFileUpload(true);
  };

  const handleImageUpload = () => {
    // Trigger file input with image filter
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileSelect({ files: [file] } as any);
      }
    };
    input.click();
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`,
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("conversationId", conversationId.toString());

      const response = await fetch("/api/chat/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();

      // Create a message with the file
      const messageData = {
        conversationId,
        message: file.name,
        attachments: {
          type: file.type.startsWith("image/") ? "image" : "file",
          fileName: file.name,
          filePath: data.filePath,
          fileSize: file.size,
          mimeType: file.type,
        }
      };

      await createMessage.mutateAsync({
        conversationId,
        data: messageData as any,
      });

      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully`,
      });
    } catch (error) {
      console.error("Failed to upload file:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="border-t p-4 bg-background">
      {/* Reply indicator */}
      {replyToMessageId && (
        <div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-4 w-0.5 bg-primary" />
            <span className="text-sm text-muted-foreground">Replying to message</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onReplyCancel}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleFileUpload}
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleImageUpload}
            title="Attach image"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <EmojiPicker onSelect={handleEmojiSelect} />
        </div>
        
        <div className="flex-1 relative">
          <RichTextEditor
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (use @ to mention, / for commands)"
            disabled={createMessage.isPending}
            onMention={(q) => {
              setMentionQuery(q);
              setShowMentionAutocomplete(true);
            }}
            onSlashCommand={() => {
              // Handled in handleInputChange
            }}
          />
          
          {/* Mention Autocomplete */}
          {showMentionAutocomplete && (
            <MentionAutocomplete
              open={showMentionAutocomplete}
              onOpenChange={setShowMentionAutocomplete}
              query={mentionQuery}
              position={mentionPosition}
              onSelect={handleMentionSelect}
            />
          )}
          
          {/* Slash Commands */}
          {showSlashCommands && (
            <SlashCommands
              open={showSlashCommands}
              onOpenChange={setShowSlashCommands}
              query={slashQuery}
              position={slashPosition}
              onSelect={handleSlashCommandSelect}
              projectId={selectedProjectId}
            />
          )}
        </div>
        
        <Button
          onClick={handleSend}
          disabled={!message.trim() || createMessage.isPending}
          size="icon"
          className="h-8 w-8"
          title="Send (Ctrl+Enter)"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <div>
          {showSlashCommands && (
            <span>Type a command: /task, /risk, /issue, /assign, /status, /help</span>
          )}
        </div>
        <div className="flex gap-2">
          <span>Ctrl+Enter to send</span>
          <span>Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
}

