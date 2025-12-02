import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

function FloatingAIButtonContent() {
  const [minimized, setMinimized] = useState(false);
  const [, setLocation] = useLocation();

  const handleClick = () => {
    // Always navigate to AI Assistant page
    setLocation("/ai-assistant");
    setMinimized(false);
  };

  // Minimized state - show as chat bubble
  if (minimized) {
    return (
      <Button
        onClick={handleClick}
        className={cn(
          "fixed bottom-6 right-6 z-50 rounded-full h-14 w-14 shadow-lg",
          "bg-primary hover:bg-primary/90",
          "transition-all duration-200"
        )}
        size="icon"
        title="Open AI Assistant"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  // Default state - show as button with label
  return (
    <Button
      onClick={handleClick}
      className={cn(
        "fixed bottom-6 right-6 z-50 rounded-full shadow-lg",
        "bg-primary hover:bg-primary/90",
        "px-4 py-2 h-auto",
        "transition-all duration-200",
        "flex items-center gap-2"
      )}
      title="Open AI Assistant"
    >
      <Bot className="h-5 w-5" />
      <span className="hidden sm:inline">AI Assistant</span>
    </Button>
  );
}

export function FloatingAIButton() {
  return <FloatingAIButtonContent />;
}

