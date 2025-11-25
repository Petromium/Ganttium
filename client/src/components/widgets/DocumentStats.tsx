import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, CheckCircle, Clock, AlertCircle, 
  FileCheck, FolderOpen, File
} from "lucide-react";
import { useDocumentsOptional } from "@/contexts/DocumentContext";

interface StatItemProps {
  label: string;
  value: number;
  icon?: React.ReactNode;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

function StatItem({ label, value, icon, badgeVariant }: StatItemProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <Badge variant={badgeVariant || "secondary"} className="tabular-nums">
        {value}
      </Badge>
    </div>
  );
}

export function DocumentStats() {
  const docContext = useDocumentsOptional();
  const documents = docContext?.documents || [];
  const isLoading = docContext?.isLoading ?? false;

  if (isLoading) {
    return (
      <Card data-testid="widget-document-stats">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Document Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-8" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const totalDocs = documents.length;
  const draftDocs = documents.filter(d => d.status === "draft");
  const ifaDocs = documents.filter(d => d.status === "ifa");
  const ifcDocs = documents.filter(d => d.status === "ifc");
  const asBuiltDocs = documents.filter(d => d.status === "as-built");
  const supersededDocs = documents.filter(d => d.status === "superseded");
  const withAttachments = documents.filter(d => d.filePath);

  const technicalDocs = documents.filter(d => 
    ["drawing", "specification", "datasheet", "calculation", "report"].includes(d.documentType || "")
  );
  const procedureDocs = documents.filter(d => 
    ["sop", "procedure", "work-instruction", "checklist"].includes(d.documentType || "")
  );
  const commercialDocs = documents.filter(d => 
    ["invoice", "rfp", "contract", "purchase-order", "quote", "warranty"].includes(d.documentType || "")
  );

  return (
    <Card data-testid="widget-document-stats">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Document Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-lg bg-primary/10 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold">{totalDocs}</p>
              <p className="text-xs text-muted-foreground">Total Documents</p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 flex items-center gap-2">
            <File className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xl font-bold">{ifcDocs.length}</p>
              <p className="text-xs text-muted-foreground">Issued for Construction</p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-xl font-bold">{ifaDocs.length}</p>
              <p className="text-xs text-muted-foreground">Pending Approval</p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-xl font-bold">{withAttachments.length}</p>
              <p className="text-xs text-muted-foreground">With Files</p>
            </div>
          </div>
        </div>

        <div className="border-t pt-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <FolderOpen className="h-3 w-3" />
            Status Breakdown
          </p>
          <StatItem
            label="Draft"
            value={draftDocs.length}
            icon={<Clock className="h-3.5 w-3.5 text-amber-500" />}
            badgeVariant="secondary"
          />
          <StatItem
            label="IFA (For Approval)"
            value={ifaDocs.length}
            icon={<AlertCircle className="h-3.5 w-3.5 text-blue-500" />}
            badgeVariant="outline"
          />
          <StatItem
            label="IFC (For Construction)"
            value={ifcDocs.length}
            icon={<CheckCircle className="h-3.5 w-3.5 text-green-500" />}
            badgeVariant="default"
          />
          <StatItem
            label="As-Built"
            value={asBuiltDocs.length}
            icon={<FileCheck className="h-3.5 w-3.5 text-emerald-600" />}
            badgeVariant="default"
          />
        </div>

        <div className="border-t pt-2 space-y-1">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Document Categories
          </p>
          <StatItem
            label="Technical"
            value={technicalDocs.length}
            icon={<div className="h-2.5 w-2.5 rounded-full bg-blue-500" />}
          />
          <StatItem
            label="Procedures"
            value={procedureDocs.length}
            icon={<div className="h-2.5 w-2.5 rounded-full bg-amber-500" />}
          />
          <StatItem
            label="Commercial"
            value={commercialDocs.length}
            icon={<div className="h-2.5 w-2.5 rounded-full bg-green-500" />}
          />
        </div>

        <div className="border-t pt-2 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Quick Stats</p>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded-md bg-muted/50">
              <p className="text-lg font-semibold">{withAttachments.length}</p>
              <p className="text-xs text-muted-foreground">With Files</p>
            </div>
            <div className="p-2 rounded-md bg-muted/50">
              <p className="text-lg font-semibold">{supersededDocs.length}</p>
              <p className="text-xs text-muted-foreground">Superseded</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
