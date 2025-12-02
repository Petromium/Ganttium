import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  children?: React.ReactNode;
}

const EMOJI_CATEGORIES = {
  "Reactions": ["👍", "❤️", "✅", "🎉", "👏", "🔥", "💯", "🚀"],
  "Common": ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳"],
  "Gestures": ["👋", "🤚", "🖐", "✋", "🖖", "👌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏"],
  "Objects": ["📎", "📌", "📍", "📊", "📈", "📉", "📋", "📝", "📄", "📃", "📑", "📜", "📰", "🗞️", "📓", "📔", "📒", "📕", "📗", "📘", "📙", "📚", "📖", "🔖", "🏷️"],
};

export function EmojiPicker({ onSelect, children }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
            <Smile className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <ScrollArea className="h-[300px]">
          <div className="p-2">
            {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
              <div key={category} className="mb-4">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2">{category}</h4>
                <div className="grid grid-cols-8 gap-1">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleSelect(emoji)}
                      className="text-xl hover:bg-muted rounded p-1 transition-colors"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

