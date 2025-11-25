import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, Pin, Calendar, Users, FileText, 
  BarChart3, AlertTriangle, CheckSquare
} from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";

interface CadenceItem {
  id: string;
  title: string;
  schedule: string;
  icon: React.ReactNode;
  isPinned?: boolean;
  nextDate?: string;
}

const DEFAULT_CADENCES: CadenceItem[] = [
  {
    id: "daily-standup",
    title: "Daily Standup",
    schedule: "Weekdays 9:00 AM",
    icon: <Users className="h-4 w-4" />,
    isPinned: true,
  },
  {
    id: "weekly-review",
    title: "Weekly Progress Review",
    schedule: "Fridays 2:00 PM",
    icon: <BarChart3 className="h-4 w-4" />,
    isPinned: true,
  },
  {
    id: "risk-review",
    title: "Risk Review Meeting",
    schedule: "Bi-weekly Tuesdays",
    icon: <AlertTriangle className="h-4 w-4" />,
    isPinned: false,
  },
  {
    id: "monthly-report",
    title: "Monthly Status Report",
    schedule: "Last Friday of month",
    icon: <FileText className="h-4 w-4" />,
    isPinned: false,
  },
];

interface ReviewItem {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  type: "approval" | "review" | "sign-off";
}

const PENDING_REVIEWS: ReviewItem[] = [
  {
    id: "review-1",
    title: "Engineering Drawing Package",
    owner: "John Smith",
    dueDate: "Tomorrow",
    type: "approval",
  },
  {
    id: "review-2",
    title: "Procurement Schedule",
    owner: "Sarah Johnson",
    dueDate: "Dec 2",
    type: "review",
  },
  {
    id: "review-3",
    title: "HSE Plan Update",
    owner: "Mike Chen",
    dueDate: "Dec 5",
    type: "sign-off",
  },
];

export function CadencePlaybook() {
  const { selectedProject } = useProject();

  const pinnedCadences = DEFAULT_CADENCES.filter(c => c.isPinned);
  const otherCadences = DEFAULT_CADENCES.filter(c => !c.isPinned);

  return (
    <Card data-testid="widget-cadence-playbook">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Cadence Playbook
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-6 text-xs">
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {pinnedCadences.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Pin className="h-3 w-3" />
              Pinned Routines
            </p>
            {pinnedCadences.map((cadence) => (
              <div
                key={cadence.id}
                className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                data-testid={`cadence-item-${cadence.id}`}
              >
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  {cadence.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{cadence.title}</p>
                  <p className="text-xs text-muted-foreground">{cadence.schedule}</p>
                </div>
                <Pin className="h-3 w-3 text-primary shrink-0" />
              </div>
            ))}
          </div>
        )}

        {otherCadences.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Other Routines</p>
            {otherCadences.map((cadence) => (
              <div
                key={cadence.id}
                className="flex items-center gap-2 py-1.5 border-b last:border-0"
                data-testid={`cadence-item-${cadence.id}`}
              >
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                  {cadence.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{cadence.title}</p>
                  <p className="text-xs text-muted-foreground">{cadence.schedule}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ReviewsWidget() {
  return (
    <Card data-testid="widget-reviews">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <CheckSquare className="h-4 w-4" />
          Next Approvals on Deck
        </CardTitle>
      </CardHeader>
      <CardContent>
        {PENDING_REVIEWS.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No pending approvals
          </p>
        ) : (
          <div className="space-y-2">
            {PENDING_REVIEWS.map((review) => (
              <div
                key={review.id}
                className="flex items-start gap-2 py-1.5 border-b last:border-0"
                data-testid={`review-item-${review.id}`}
              >
                <div className="h-6 w-6 rounded bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <CheckSquare className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{review.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {review.owner} · Due {review.dueDate}
                  </p>
                </div>
                <Badge 
                  variant={review.type === "approval" ? "default" : "secondary"} 
                  className="text-xs shrink-0 capitalize"
                >
                  {review.type}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
