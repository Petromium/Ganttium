import { TableRowCard } from "@/components/TableRowCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const mockRisks = [
  { id: "R-001", title: "Material Delivery Delays", probability: "High", impact: "High", status: "Active", owner: "John D." },
  { id: "R-002", title: "Weather-Related Construction Delays", probability: "Medium", impact: "High", status: "Active", owner: "Sarah M." },
  { id: "R-003", title: "Budget Overrun on Procurement", probability: "Medium", impact: "Medium", status: "Monitoring", owner: "Robert J." },
  { id: "R-004", title: "Regulatory Approval Delays", probability: "Low", impact: "High", status: "Mitigated", owner: "Emily C." },
  { id: "R-005", title: "Equipment Failure During Testing", probability: "Low", impact: "Medium", status: "Monitoring", owner: "Michael T." },
];

export default function RisksPage() {
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);

  const getRiskLevel = (probability: string, impact: string) => {
    if ((probability === "High" && impact === "High") || (probability === "High" && impact === "Medium")) {
      return { level: "Critical", variant: "destructive" as const };
    }
    if (probability === "Medium" && impact === "High") {
      return { level: "High", variant: "default" as const };
    }
    if (probability === "Medium" && impact === "Medium") {
      return { level: "Medium", variant: "secondary" as const };
    }
    return { level: "Low", variant: "outline" as const };
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Risk Management</h1>
          <p className="text-muted-foreground">Track and mitigate project risks</p>
        </div>
        <Button data-testid="button-add-risk">Add Risk</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search risks..."
          className="pl-9"
          data-testid="input-search-risks"
        />
      </div>

      <div className="space-y-2">
        {mockRisks.map((risk) => {
          const riskLevel = getRiskLevel(risk.probability, risk.impact);

          return (
            <TableRowCard
              key={risk.id}
              id={risk.id}
              selected={selectedRisks.includes(risk.id)}
              onSelect={(selected) => {
                setSelectedRisks(prev =>
                  selected ? [...prev, risk.id] : prev.filter(id => id !== risk.id)
                );
              }}
              onClick={() => console.log("Risk clicked:", risk.id)}
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">{risk.id}</Badge>
                    <span className="font-medium">{risk.title}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <Badge variant={riskLevel.variant}>{riskLevel.level}</Badge>
                </div>
                <div className="col-span-2">
                  <span className="text-sm">{risk.probability} / {risk.impact}</span>
                </div>
                <div className="col-span-2">
                  <Badge variant={risk.status === "Active" ? "default" : "secondary"}>
                    {risk.status}
                  </Badge>
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {risk.owner}
                </div>
              </div>
            </TableRowCard>
          );
        })}
      </div>
    </div>
  );
}
