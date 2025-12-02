import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { ResourceTimeEntry, InsertResourceTimeEntry } from "@shared/schema";

interface TimeEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: number;
  entry?: ResourceTimeEntry;
}

export function TimeEntryModal({ open, onOpenChange, assignmentId, entry }: TimeEntryModalProps) {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(entry?.date ? new Date(entry.date) : new Date());
  const [hoursWorked, setHoursWorked] = useState<string>(entry?.hoursWorked || "");
  const [notes, setNotes] = useState<string>(entry?.notes || "");

  const createMutation = useMutation({
    mutationFn: async (data: InsertResourceTimeEntry) => {
      return await apiRequest<ResourceTimeEntry>("POST", "/api/time-entries", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/assignments/${assignmentId}/time-entries`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks`] }); // Refresh assignments
      toast({
        title: "Time Entry Created",
        description: "Time entry has been recorded successfully.",
      });
      onOpenChange(false);
      // Reset form
      setDate(new Date());
      setHoursWorked("");
      setNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertResourceTimeEntry>) => {
      return await apiRequest<ResourceTimeEntry>("PATCH", `/api/time-entries/${entry!.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/assignments/${assignmentId}/time-entries`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks`] });
      toast({
        title: "Time Entry Updated",
        description: "Time entry has been updated successfully.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!date) {
      toast({
        title: "Date Required",
        description: "Please select a date for this time entry.",
        variant: "destructive",
      });
      return;
    }

    const hours = parseFloat(hoursWorked);
    if (isNaN(hours) || hours <= 0) {
      toast({
        title: "Invalid Hours",
        description: "Please enter a valid number of hours greater than 0.",
        variant: "destructive",
      });
      return;
    }

    const data: InsertResourceTimeEntry = {
      resourceAssignmentId: assignmentId,
      date: date.toISOString(),
      hoursWorked: hours.toString(),
      notes: notes.trim() || undefined,
    };

    if (entry) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entry ? "Edit Time Entry" : "Add Time Entry"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours">Hours Worked</Label>
            <Input
              id="hours"
              type="number"
              step="0.25"
              min="0"
              value={hoursWorked}
              onChange={(e) => setHoursWorked(e.target.value)}
              placeholder="8.0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this work..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? "Saving..." : entry ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

