import { TableRowCard } from "@/components/TableRowCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const mockIssues = [
  { id: "I-045", title: "Foundation Cracking Detected", severity: "High", status: "Open", reportedDate: "Dec 10", assignee: "Robert J." },
  { id: "I-046", title: "Incorrect Material Specification", severity: "Medium", status: "In Progress", reportedDate: "Dec 12", assignee: "Sarah M." },
  { id: "I-047", title: "Equipment Calibration Error", severity: "Medium", status: "In Progress", reportedDate: "Dec 13", assignee: "Emily C." },
  { id: "I-048", title: "Documentation Missing for Inspection", severity: "Low", status: "Resolved", reportedDate: "Dec 8", assignee: "John D." },
  { id: "I-049", title: "Safety Protocol Violation", severity: "Critical", status: "Open", reportedDate: "Dec 14", assignee: "Emily C." },
];

export default function IssuesPage() {
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case "Critical": return "destructive" as const;
      case "High": return "default" as const;
      case "Medium": return "secondary" as const;
      default: return "outline" as const;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Open": return "destructive" as const;
      case "In Progress": return "default" as const;
      case "Resolved": return "outline" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Issue Log</h1>
          <p className="text-muted-foreground">Track and resolve project issues</p>
        </div>
        <Button data-testid="button-add-issue">Report Issue</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search issues..."
          className="pl-9"
          data-testid="input-search-issues"
        />
      </div>

      <div className="space-y-2">
        {mockIssues.map((issue) => (
          <TableRowCard
            key={issue.id}
            id={issue.id}
            selected={selectedIssues.includes(issue.id)}
            onSelect={(selected) => {
              setSelectedIssues(prev =>
                selected ? [...prev, issue.id] : prev.filter(id => id !== issue.id)
              );
            }}
            onClick={() => console.log("Issue clicked:", issue.id)}
          >
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">{issue.id}</Badge>
                  <span className="font-medium">{issue.title}</span>
                </div>
              </div>
              <div className="col-span-2">
                <Badge variant={getSeverityVariant(issue.severity)}>{issue.severity}</Badge>
              </div>
              <div className="col-span-2">
                <Badge variant={getStatusVariant(issue.status)}>{issue.status}</Badge>
              </div>
              <div className="col-span-2 text-sm text-muted-foreground">
                {issue.reportedDate}
              </div>
              <div className="col-span-2 text-sm text-muted-foreground">
                {issue.assignee}
              </div>
            </div>
          </TableRowCard>
        ))}
      </div>
    </div>
  );
}
