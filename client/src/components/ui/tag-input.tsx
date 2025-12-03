import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useProject } from "@/contexts/ProjectContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { X, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tag } from "@shared/schema";

interface TagInputProps {
  entityType: string;
  entityId: number;
  value?: Tag[];
  onChange?: (tags: Tag[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TagInput({
  entityType,
  entityId,
  value = [],
  onChange,
  placeholder = "Add tags...",
  disabled = false,
  className,
}: TagInputProps) {
  const { selectedOrgId } = useProject();
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch current tags for entity
  const { data: currentTags = [] } = useQuery<Tag[]>({
    queryKey: [`/api/tags/entity/${entityType}/${entityId}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tags/entity/${entityType}/${entityId}`);
      return response.json();
    },
    enabled: !!entityId && !!selectedOrgId,
  });

  // Sync value with currentTags
  useEffect(() => {
    if (onChange && currentTags.length > 0 && value.length === 0) {
      onChange(currentTags);
    }
  }, [currentTags, onChange, value.length]);

  // Search tags for autocomplete
  const { data: suggestions = [] } = useQuery<Tag[]>({
    queryKey: [`/api/organizations/${selectedOrgId}/tags/search`, inputValue],
    queryFn: async () => {
      if (!inputValue || inputValue.length < 1) return [];
      const response = await apiRequest("GET", `/api/organizations/${selectedOrgId}/tags/search?q=${encodeURIComponent(inputValue)}&limit=10`);
      return response.json();
    },
    enabled: !!selectedOrgId && !!inputValue && inputValue.length >= 1,
  });

  // Filter out already selected tags
  const availableSuggestions = suggestions.filter(
    tag => !value.some(selectedTag => selectedTag.id === tag.id)
  );

  const assignTagMutation = useMutation({
    mutationFn: async (tagId: number) => {
      const response = await apiRequest("POST", `/api/tags/${tagId}/assign`, {
        entityType,
        entityId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tags/entity/${entityType}/${entityId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${selectedOrgId}/tags`] });
      setInputValue("");
      setOpen(false);
    },
  });

  const unassignTagMutation = useMutation({
    mutationFn: async (tagId: number) => {
      await apiRequest("DELETE", `/api/tags/${tagId}/assign/${entityType}/${entityId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tags/entity/${entityType}/${entityId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${selectedOrgId}/tags`] });
    },
  });

  const createAndAssignTagMutation = useMutation({
    mutationFn: async (tagName: string) => {
      // Create tag
      const createResponse = await apiRequest("POST", `/api/organizations/${selectedOrgId}/tags`, {
        name: tagName,
      });
      const newTag = await createResponse.json();
      
      // Assign it
      await apiRequest("POST", `/api/tags/${newTag.id}/assign`, {
        entityType,
        entityId,
      });
      
      return newTag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tags/entity/${entityType}/${entityId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${selectedOrgId}/tags`] });
      setInputValue("");
      setOpen(false);
    },
  });

  const handleSelectTag = (tag: Tag) => {
    assignTagMutation.mutate(tag.id);
    if (onChange) {
      onChange([...value, tag]);
    }
  };

  const handleRemoveTag = (tagId: number) => {
    unassignTagMutation.mutate(tagId);
    if (onChange) {
      onChange(value.filter(tag => tag.id !== tagId));
    }
  };

  const handleCreateTag = () => {
    if (inputValue.trim() && !value.some(tag => tag.name.toLowerCase() === inputValue.trim().toLowerCase())) {
      createAndAssignTagMutation.mutate(inputValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      // Check if suggestion exists
      const exactMatch = availableSuggestions.find(
        tag => tag.name.toLowerCase() === inputValue.trim().toLowerCase()
      );
      if (exactMatch) {
        handleSelectTag(exactMatch);
      } else {
        handleCreateTag();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md">
        {value.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="flex items-center gap-1"
            style={tag.color ? { borderColor: tag.color, backgroundColor: `${tag.color}20` } : undefined}
          >
            {tag.color && (
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
            )}
            {tag.name}
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        {!disabled && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground"
                onClick={() => inputRef.current?.focus()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add tag
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput
                  ref={inputRef}
                  placeholder="Search or create tag..."
                  value={inputValue}
                  onValueChange={setInputValue}
                  onKeyDown={handleKeyDown}
                />
                <CommandList>
                  <CommandEmpty>
                    {inputValue.trim() ? (
                      <div className="p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={handleCreateTag}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create "{inputValue.trim()}"
                        </Button>
                      </div>
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        Start typing to search or create a tag
                      </div>
                    )}
                  </CommandEmpty>
                  {availableSuggestions.length > 0 && (
                    <CommandGroup heading="Suggestions">
                      {availableSuggestions.map((tag) => (
                        <CommandItem
                          key={tag.id}
                          onSelect={() => handleSelectTag(tag)}
                          className="flex items-center gap-2"
                        >
                          {tag.color && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                          )}
                          <span>{tag.name}</span>
                          {tag.category && (
                            <Badge variant="outline" className="ml-auto text-xs">
                              {tag.category}
                            </Badge>
                          )}
                          <Check className={cn("ml-auto h-4 w-4", value.some(t => t.id === tag.id) ? "opacity-100" : "opacity-0")} />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {inputValue.trim() && !availableSuggestions.some(tag => tag.name.toLowerCase() === inputValue.trim().toLowerCase()) && (
                    <CommandGroup>
                      <CommandItem
                        onSelect={handleCreateTag}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create "{inputValue.trim()}"</span>
                      </CommandItem>
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>
      {value.length === 0 && !disabled && (
        <p className="text-xs text-muted-foreground">{placeholder}</p>
      )}
    </div>
  );
}

