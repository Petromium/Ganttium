import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, Clock, Video, FileCheck, Target, 
  AlertTriangle, Package, Palmtree 
} from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { format, isToday, isTomorrow, isThisWeek, addDays } from "date-fns";
import type { Task, ProjectEvent } from "@shared/schema";

interface EventItem {
  id: string;
  title: string;
  date: Date;
  type: "meeting" | "review" | "deadline" | "deliverable" | "milestone" | "shutdown" | "holiday" | "other";
}

const EVENT_COLORS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  meeting: { 
    bg: "bg-blue-100 dark:bg-blue-900/30", 
    text: "text-blue-700 dark:text-blue-300",
    icon: <Video className="h-3 w-3" />
  },
  review: { 
    bg: "bg-purple-100 dark:bg-purple-900/30", 
    text: "text-purple-700 dark:text-purple-300",
    icon: <FileCheck className="h-3 w-3" />
  },
  deadline: { 
    bg: "bg-red-100 dark:bg-red-900/30", 
    text: "text-red-700 dark:text-red-300",
    icon: <AlertTriangle className="h-3 w-3" />
  },
  deliverable: { 
    bg: "bg-green-100 dark:bg-green-900/30", 
    text: "text-green-700 dark:text-green-300",
    icon: <Package className="h-3 w-3" />
  },
  milestone: { 
    bg: "bg-amber-100 dark:bg-amber-900/30", 
    text: "text-amber-700 dark:text-amber-300",
    icon: <Target className="h-3 w-3" />
  },
  shutdown: { 
    bg: "bg-gray-100 dark:bg-gray-800", 
    text: "text-gray-700 dark:text-gray-300",
    icon: <AlertTriangle className="h-3 w-3" />
  },
  holiday: { 
    bg: "bg-teal-100 dark:bg-teal-900/30", 
    text: "text-teal-700 dark:text-teal-300",
    icon: <Palmtree className="h-3 w-3" />
  },
  other: { 
    bg: "bg-muted", 
    text: "text-muted-foreground",
    icon: <Calendar className="h-3 w-3" />
  },
};

function formatEventDate(date: Date): string {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  if (isThisWeek(date)) return format(date, "EEEE");
  return format(date, "MMM d");
}

export function EventLegend() {
  return (
    <Card data-testid="widget-event-legend">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Legend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(EVENT_COLORS).map(([type, config]) => (
            <div key={type} className="flex items-center gap-2">
              <div className={`h-5 w-5 rounded flex items-center justify-center ${config.bg}`}>
                <span className={config.text}>{config.icon}</span>
              </div>
              <span className="text-xs capitalize">{type}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function UpcomingEvents() {
  const { selectedProjectId } = useProject();

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/projects", selectedProjectId, "tasks"],
    enabled: !!selectedProjectId,
    refetchInterval: 15 * 60 * 1000,
  });

  const { data: projectEvents = [], isLoading: eventsLoading } = useQuery<ProjectEvent[]>({
    queryKey: ["/api/projects", selectedProjectId, "events"],
    enabled: !!selectedProjectId,
    refetchInterval: 15 * 60 * 1000,
  });

  const isLoading = tasksLoading || eventsLoading;

  if (isLoading) {
    return (
      <Card data-testid="widget-upcoming-events">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2 py-1.5">
              <Skeleton className="h-6 w-6 rounded" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  const twoWeeksFromNow = addDays(now, 14);

  const taskEvents: EventItem[] = tasks
    .filter(t => t.endDate && new Date(t.endDate) >= now && new Date(t.endDate) <= twoWeeksFromNow)
    .filter(t => t.status !== "completed")
    .map(t => ({
      id: `task-${t.id}`,
      title: t.name,
      date: new Date(t.endDate!),
      type: t.isMilestone ? "milestone" : "deadline" as const,
    }));

  const calendarEvents: EventItem[] = projectEvents
    .filter(e => new Date(e.startDate) >= now && new Date(e.startDate) <= twoWeeksFromNow)
    .map(e => ({
      id: `event-${e.id}`,
      title: e.title,
      date: new Date(e.startDate),
      type: (e.eventType as EventItem["type"]) || "other",
    }));

  const allEvents = [...taskEvents, ...calendarEvents]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 6);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <Card data-testid="widget-upcoming-events">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming Events
          </CardTitle>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timezone.split("/").pop()?.replace("_", " ")}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {allEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No upcoming events in the next 2 weeks
          </p>
        ) : (
          <div className="space-y-2">
            {allEvents.map((event) => {
              const config = EVENT_COLORS[event.type] || EVENT_COLORS.other;
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-2 py-1.5 border-b last:border-0"
                  data-testid={`event-item-${event.id}`}
                >
                  <div className={`h-6 w-6 rounded flex items-center justify-center shrink-0 ${config.bg}`}>
                    <span className={config.text}>{config.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatEventDate(event.date)} · {format(event.date, "h:mm a")}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0 capitalize">
                    {event.type}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
