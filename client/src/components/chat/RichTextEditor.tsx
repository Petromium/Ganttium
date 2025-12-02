import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bold, Italic, Code, List, Link as LinkIcon, Smile, AtSign, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  onMention?: (query: string) => void;
  onSlashCommand?: (command: string) => void;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  onKeyDown,
  placeholder = "Type a message...",
  disabled = false,
  onMention,
  onSlashCommand,
  className,
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const insertText = useCallback((before: string, after: string = "") => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    // Restore cursor position
    setTimeout(() => {
      const newPosition = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  }, [value, onChange]);

  const handleFormat = (format: string) => {
    switch (format) {
      case "bold":
        insertText("**", "**");
        break;
      case "italic":
        insertText("*", "*");
        break;
      case "code":
        insertText("`", "`");
        break;
      case "codeBlock":
        insertText("```\n", "\n```");
        break;
      case "list":
        insertText("- ");
        break;
      case "orderedList":
        insertText("1. ");
        break;
      case "link":
        insertText("[", "](url)");
        break;
      case "mention":
        insertText("@");
        onMention?.("");
        break;
      case "hashtag":
        insertText("#");
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle @mention trigger
    if (e.key === "@" && !e.shiftKey) {
      const textarea = e.currentTarget;
      const position = textarea.selectionStart;
      const textBefore = value.substring(0, position);
      const lastChar = textBefore[textBefore.length - 1];
      
      // Only trigger if @ is at start or after whitespace
      if (position === 0 || /\s/.test(lastChar)) {
        onMention?.("");
      }
    }

    // Handle slash command trigger
    if (e.key === "/" && !e.shiftKey) {
      const textarea = e.currentTarget;
      const position = textarea.selectionStart;
      const textBefore = value.substring(0, position);
      const lastChar = textBefore[textBefore.length - 1];
      
      // Only trigger if / is at start or after whitespace/newline
      if (position === 0 || /\s|\n/.test(lastChar)) {
        onSlashCommand?.("");
      }
    }

    // Handle Tab for autocomplete
    if (e.key === "Tab" && !e.shiftKey) {
      // Let parent handle autocomplete
    }

    onKeyDown?.(e);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Toolbar */}
      {showToolbar && (
        <div className="absolute bottom-full left-0 mb-2 flex gap-1 p-1 bg-background border rounded-lg shadow-lg z-10">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleFormat("bold")}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleFormat("italic")}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleFormat("code")}
            title="Inline code"
          >
            <Code className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleFormat("list")}
            title="Bullet list"
          >
            <List className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleFormat("link")}
            title="Link"
          >
            <LinkIcon className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleFormat("mention")}
            title="Mention (@)"
          >
            <AtSign className="h-3 w-3" />
          </Button>
        </div>
      )}

      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setCursorPosition(e.target.selectionStart);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowToolbar(true)}
        onBlur={(e) => {
          // Don't hide toolbar if clicking on toolbar buttons
          if (!e.currentTarget.contains(document.activeElement)) {
            setTimeout(() => setShowToolbar(false), 200);
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-[60px] max-h-[200px] resize-none pr-10"
        rows={1}
      />
      
      {/* Formatting hint */}
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
        Markdown supported
      </div>
    </div>
  );
}

