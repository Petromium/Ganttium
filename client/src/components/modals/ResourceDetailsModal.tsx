import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Wrench, Package, DollarSign, Calendar, Clock, 
  Award, Briefcase, FileText, AlertCircle, CheckCircle2,
  Building, Phone, Mail, ExternalLink, Star
} from "lucide-react";
import { format } from "date-fns";
import type { Resource, ResourceAssignment, Task } from "@shared/schema";

interface ResourceDetailsModalProps {
  resource: Resource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RESOURCE_TYPE_ICONS: Record<string, typeof User> = {
  human: User,
  equipment: Wrench,
  material: Package,
};

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  human: "Human Resource",
  equipment: "Equipment",
  material: "Material",
};

const DISCIPLINE_LABELS: Record<string, string> = {
  civil: "Civil",
  structural: "Structural",
  mechanical: "Mechanical",
  electrical: "Electrical",
  piping: "Piping",
  instrumentation: "Instrumentation",
  process: "Process",
  hvac: "HVAC",
  architectural: "Architectural",
  general: "General",
};

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  "full-time": "Full-Time Employee",
  "part-time": "Part-Time Employee",
  "contract": "Contractor",
  "temporary": "Temporary",
  "rental": "Rental",
  "purchase": "Purchase",
  "lease": "Lease",
};

const AVAILABILITY_STATUS_COLORS: Record<string, string> = {
  available: "bg-green-500",
  partially_available: "bg-amber-500",
  unavailable: "bg-red-500",
  on_leave: "bg-blue-500",
};

const AVAILABILITY_STATUS_LABELS: Record<string, string> = {
  available: "Available",
  partially_available: "Partially Available",
  unavailable: "Unavailable",
  on_leave: "On Leave",
};

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export function ResourceDetailsModal({ resource, open, onOpenChange }: ResourceDetailsModalProps) {
  const { data: assignments = [] } = useQuery<ResourceAssignment[]>({
    queryKey: ["/api/resources", resource?.id, "assignments"],
    enabled: !!resource?.id && open,
  });

  if (!resource) return null;

  const TypeIcon = RESOURCE_TYPE_ICONS[resource.type] || User;
  const typeLabel = RESOURCE_TYPE_LABELS[resource.type] || resource.type;
  const disciplineLabel = DISCIPLINE_LABELS[resource.discipline || "general"] || resource.discipline;
  const contractTypeLabel = CONTRACT_TYPE_LABELS[resource.contractType || ""] || resource.contractType;

  const workingDays = (resource.workingDays as string[] | null) || ["monday", "tuesday", "wednesday", "thursday", "friday"];
  const pricingModels = resource.pricingModels as Array<{
    name: string;
    rateType: string;
    rate: number;
    unitType: string;
    currency: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    isDefault?: boolean;
  }> | null;
  const calendarExceptions = resource.calendarExceptions as Array<{
    date: string;
    type: string;
    note?: string;
  }> | null;
  const skills = (resource.skillsArray as string[] | null) || (resource.skills?.split(",").map(s => s.trim()) || []);
  const certifications = (resource.certifications as string[] | null) || [];

  const formatRate = (rate: string | number | null, rateType: string | null, unitType: string | null) => {
    if (!rate) return "N/A";
    const amount = typeof rate === "string" ? parseFloat(rate) : rate;
    const suffix = rateType === "per-hour" ? "/hr" : rateType === "per-use" ? "/use" : `/${unitType || "unit"}`;
    return `$${amount.toFixed(2)}${suffix}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[85vh]" 
        data-testid="modal-resource-details"
        aria-describedby="resource-details-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <TypeIcon className="h-5 w-5" />
            </div>
            <div>
              <span>{resource.name}</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{typeLabel}</Badge>
                <Badge variant="outline">{disciplineLabel}</Badge>
                {resource.availabilityStatus && (
                  <Badge className={`${AVAILABILITY_STATUS_COLORS[resource.availabilityStatus]} text-white`}>
                    {AVAILABILITY_STATUS_LABELS[resource.availabilityStatus] || resource.availabilityStatus}
                  </Badge>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <p id="resource-details-description" className="sr-only">
          Detailed information about {resource.name} resource
        </p>

        <ScrollArea className="h-[60vh]">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="pricing" data-testid="tab-pricing">Pricing</TabsTrigger>
              <TabsTrigger value="calendar" data-testid="tab-calendar">Calendar</TabsTrigger>
              <TabsTrigger value="assignments" data-testid="tab-assignments">Assignments</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="text-sm font-medium">{typeLabel}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Discipline</p>
                      <p className="text-sm font-medium">{disciplineLabel}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Availability</p>
                      <div className="flex items-center gap-2">
                        <Progress value={resource.availability} className="flex-1 h-2" />
                        <span className="text-sm font-mono">{resource.availability}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="text-sm font-medium">{AVAILABILITY_STATUS_LABELS[resource.availabilityStatus || "available"] || "Available"}</p>
                    </div>
                  </div>

                  {resource.description && (
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground">Description</p>
                      <p className="text-sm">{resource.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {(skills.length > 0 || certifications.length > 0) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Skills & Certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {skills.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {skills.filter(Boolean).map((skill, i) => (
                            <Badge key={i} variant="secondary">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {certifications.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Certifications</p>
                        <div className="flex flex-wrap gap-1.5">
                          {certifications.filter(Boolean).map((cert, i) => (
                            <Badge key={i} variant="outline" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {(resource.contractType || resource.vendorName) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Contract Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      {resource.contractType && (
                        <div>
                          <p className="text-xs text-muted-foreground">Contract Type</p>
                          <p className="text-sm font-medium">{contractTypeLabel}</p>
                        </div>
                      )}
                      {resource.contractReference && (
                        <div>
                          <p className="text-xs text-muted-foreground">Reference</p>
                          <p className="text-sm font-medium font-mono">{resource.contractReference}</p>
                        </div>
                      )}
                    </div>

                    {resource.vendorName && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Vendor</p>
                        <div className="flex items-center gap-3">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{resource.vendorName}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          {resource.vendorContactEmail && (
                            <div className="flex items-center gap-1.5 text-sm">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              <a href={`mailto:${resource.vendorContactEmail}`} className="text-primary hover:underline">
                                {resource.vendorContactEmail}
                              </a>
                            </div>
                          )}
                          {resource.vendorContactPhone && (
                            <div className="flex items-center gap-1.5 text-sm">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              {resource.vendorContactPhone}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {(resource.contractStartDate || resource.contractEndDate) && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Contract Period</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {resource.contractStartDate 
                              ? format(new Date(resource.contractStartDate), "MMM d, yyyy") 
                              : "N/A"
                            }
                            {" — "}
                            {resource.contractEndDate 
                              ? format(new Date(resource.contractEndDate), "MMM d, yyyy") 
                              : "Ongoing"
                            }
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Efficiency Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">{resource.efficiencyRating || "1.0"}</p>
                      <p className="text-xs text-muted-foreground">Efficiency</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">{resource.productivityFactor || "1.0"}</p>
                      <p className="text-xs text-muted-foreground">Productivity</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">{resource.qualityScore || "—"}</p>
                      <p className="text-xs text-muted-foreground">Quality Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {resource.notes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{resource.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="pricing" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Primary Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-3xl font-bold">
                      {formatRate(resource.rate, resource.rateType, resource.unitType)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{resource.currency}</p>
                  </div>
                </CardContent>
              </Card>

              {pricingModels && pricingModels.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Additional Pricing Models
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pricingModels.map((model, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-3 rounded-lg border"
                          data-testid={`pricing-model-${index}`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{model.name}</p>
                              {model.isDefault && <Badge variant="secondary">Default</Badge>}
                            </div>
                            {(model.effectiveFrom || model.effectiveTo) && (
                              <p className="text-xs text-muted-foreground">
                                {model.effectiveFrom && format(new Date(model.effectiveFrom), "MMM d, yyyy")}
                                {model.effectiveFrom && model.effectiveTo && " — "}
                                {model.effectiveTo && format(new Date(model.effectiveTo), "MMM d, yyyy")}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-semibold">
                              ${model.rate.toFixed(2)}
                              {model.rateType === "per-hour" && "/hr"}
                              {model.rateType === "per-use" && "/use"}
                              {model.rateType === "per-unit" && `/${model.unitType}`}
                            </p>
                            <p className="text-xs text-muted-foreground">{model.currency}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="calendar" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Working Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Max Hours/Day</p>
                      <p className="text-sm font-medium">{resource.maxHoursPerDay || 8} hours</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Max Hours/Week</p>
                      <p className="text-sm font-medium">{resource.maxHoursPerWeek || 40} hours</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Working Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <div
                        key={day}
                        className={`flex-1 text-center p-2 rounded-md text-xs font-medium capitalize ${
                          workingDays.includes(day)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {day.slice(0, 3)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {calendarExceptions && calendarExceptions.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Calendar Exceptions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {calendarExceptions.map((exception, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-2 rounded-md border"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {exception.type}
                            </Badge>
                            <span className="text-sm">
                              {format(new Date(exception.date), "MMM d, yyyy")}
                            </span>
                          </div>
                          {exception.note && (
                            <span className="text-xs text-muted-foreground">{exception.note}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="assignments" className="mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Project Assignments ({assignments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {assignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No active assignments
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {assignments.map((assignment) => (
                        <div 
                          key={assignment.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                          data-testid={`assignment-${assignment.id}`}
                        >
                          <div>
                            <p className="font-medium">Task #{assignment.taskId}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary">{assignment.allocation}% allocated</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
