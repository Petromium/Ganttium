import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const daysInMonth = 30;
const startDay = 2;
const today = 15;

const mockEvents = [
  { day: 5, title: "Kick-off Meeting", color: "bg-chart-1" },
  { day: 5, title: "Site Survey", color: "bg-chart-2" },
  { day: 12, title: "Design Review", color: "bg-chart-3" },
  { day: 15, title: "Milestone: Foundation", color: "bg-chart-4" },
  { day: 18, title: "Procurement Deadline", color: "bg-destructive" },
  { day: 22, title: "Safety Inspection", color: "bg-chart-1" },
  { day: 28, title: "Progress Report", color: "bg-chart-2" },
];

export default function CalendarPage() {
  const weeks = Math.ceil((daysInMonth + startDay) / 7);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Calendar</h1>
          <p className="text-muted-foreground">Project timeline and milestones</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" data-testid="button-prev-month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-4 font-semibold">December 2024</div>
          <Button variant="outline" size="icon" data-testid="button-next-month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly View</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="bg-muted p-3 text-center text-sm font-semibold"
              >
                {day}
              </div>
            ))}

            {Array.from({ length: weeks * 7 }).map((_, index) => {
              const dayNumber = index - startDay + 1;
              const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth;
              const isToday = dayNumber === today;
              const dayEvents = mockEvents.filter(e => e.day === dayNumber);

              return (
                <div
                  key={index}
                  className={cn(
                    "bg-background p-2 min-h-24 hover-elevate",
                    isToday && "ring-2 ring-primary",
                    !isValidDay && "bg-muted/30"
                  )}
                  data-testid={isValidDay ? `calendar-day-${dayNumber}` : undefined}
                >
                  {isValidDay && (
                    <>
                      <div
                        className={cn(
                          "text-sm font-semibold mb-2",
                          isToday && "text-primary"
                        )}
                      >
                        {dayNumber}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.map((event, i) => (
                          <div
                            key={i}
                            className={cn(
                              "text-xs px-1 py-0.5 rounded text-white truncate",
                              event.color
                            )}
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockEvents
              .filter(e => e.day >= today)
              .sort((a, b) => a.day - b.day)
              .map((event, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover-elevate">
                  <div className={cn("w-1 h-12 rounded", event.color)} />
                  <div className="flex-1">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      December {event.day}, 2024
                    </p>
                  </div>
                  <Badge variant="outline">
                    {event.day === today ? "Today" : `${event.day - today} days`}
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
