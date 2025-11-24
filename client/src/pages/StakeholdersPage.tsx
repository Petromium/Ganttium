import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const mockStakeholders = [
  { id: "1", name: "John Davidson", role: "Project Sponsor", email: "j.davidson@acme.com", phone: "+1-555-0101", org: "ACME Corp", type: "Internal" },
  { id: "2", name: "Sarah Mitchell", role: "Project Manager", email: "s.mitchell@acme.com", phone: "+1-555-0102", org: "ACME Corp", type: "Internal" },
  { id: "3", name: "Robert Johnson", role: "Lead Engineer", email: "r.johnson@acme.com", phone: "+1-555-0103", org: "ACME Corp", type: "Internal" },
  { id: "4", name: "Emily Chen", role: "Safety Officer", email: "e.chen@acme.com", phone: "+1-555-0104", org: "ACME Corp", type: "Internal" },
  { id: "5", name: "Michael Torres", role: "Client Representative", email: "m.torres@client.com", phone: "+1-555-0201", org: "Client Org", type: "External" },
  { id: "6", name: "Amanda Price", role: "Procurement Specialist", email: "a.price@vendor.com", phone: "+1-555-0301", org: "Vendor Co", type: "External" },
];

export default function StakeholdersPage() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Stakeholders</h1>
          <p className="text-muted-foreground">Project team and external contacts</p>
        </div>
        <Button data-testid="button-add-stakeholder">Add Stakeholder</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search stakeholders..."
          className="pl-9"
          data-testid="input-search-stakeholders"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {mockStakeholders.map((stakeholder) => (
          <Card
            key={stakeholder.id}
            className="hover-elevate cursor-pointer transition-shadow"
            data-testid={`card-stakeholder-${stakeholder.id}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-sm">
                    {stakeholder.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-semibold">{stakeholder.name}</h3>
                    <p className="text-sm text-muted-foreground">{stakeholder.role}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={stakeholder.type === "Internal" ? "default" : "secondary"}>
                      {stakeholder.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{stakeholder.org}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <a href={`mailto:${stakeholder.email}`} className="hover:text-foreground">
                        {stakeholder.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <a href={`tel:${stakeholder.phone}`} className="hover:text-foreground">
                        {stakeholder.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
