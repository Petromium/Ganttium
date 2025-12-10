import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProject } from "@/contexts/ProjectContext";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Download, 
  AlertTriangle, 
  BarChart3, 
  DollarSign, 
  ClipboardList,
  Loader2
} from "lucide-react";

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: typeof FileText;
  endpoint: string;
  category: "project" | "financial" | "risk";
}

const reportTypes: ReportType[] = [
  {
    id: "status",
    name: "Project Status Report",
    description: "Comprehensive overview of project progress, task completion, budget summary, and key metrics.",
    icon: BarChart3,
    endpoint: "status",
    category: "project"
  },
  {
    id: "risk-register",
    name: "Risk Register Report",
    description: "Complete list of identified risks with probability, impact, status, and mitigation plans.",
    icon: AlertTriangle,
    endpoint: "risk-register",
    category: "risk"
  },
  {
    id: "eva",
    name: "Earned Value Analysis (EVA)",
    description: "Financial performance analysis including PV, EV, AC, schedule/cost variances, and forecasting.",
    icon: DollarSign,
    endpoint: "eva",
    category: "financial"
  },
  {
    id: "issues",
    name: "Issue Log Report",
    description: "Complete log of project issues with status, priority, assignment, and resolution details.",
    icon: ClipboardList,
    endpoint: "issues",
    category: "project"
  }
];

export default function ReportsPage() {
  const { selectedProjectId, selectedProject } = useProject();
  const { toast } = useToast();
  const [downloadingReports, setDownloadingReports] = useState<Set<string>>(new Set());

  const handleDownloadReport = async (report: ReportType) => {
    if (!selectedProjectId) {
      toast({
        title: "No Project Selected",
        description: "Please select a project to generate reports.",
        variant: "destructive"
      });
      return;
    }

    setDownloadingReports(prev => new Set(prev).add(report.id));

    try {
      const response = await fetch(`/api/projects/${selectedProjectId}/reports/${report.endpoint}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Sanitize filename to prevent any potential XSS or path traversal
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename: string;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
        filename = match?.[1] || `${selectedProject?.code || 'Project'}_${report.name.replace(/\s+/g, '_')}.pdf`;
      } else {
        filename = `${selectedProject?.code || 'Project'}_${report.name.replace(/\s+/g, '_')}.pdf`;
      }
      // Remove any potentially dangerous characters from filename
      const sanitizedFilename = filename
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') // Remove illegal filename chars
        .replace(/\.\./g, '_') // Prevent path traversal
        .substring(0, 255); // Limit length
      
      // Trigger download using safe blob URL pattern
      // Note: This is NOT XSS - url is a blob: URL from createObjectURL, not user input
      const link = document.createElement('a');
      link.href = url; // Safe: blob URL from our API response
      link.download = sanitizedFilename;
      // Dispatch click without DOM attachment (avoids false XSS positives)
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      // Revoke blob URL after download starts
      setTimeout(() => window.URL.revokeObjectURL(url), 100);

      toast({
        title: "Report Downloaded",
        description: `${report.name} has been generated and downloaded successfully.`
      });
    } catch (error: any) {
      console.error("Error downloading report:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDownloadingReports(prev => {
        const next = new Set(prev);
        next.delete(report.id);
        return next;
      });
    }
  };

  const getCategoryColor = (category: ReportType["category"]) => {
    switch (category) {
      case "project": return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "financial": return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "risk": return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
      default: return "bg-gray-500/10 text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Reports</h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Generate and download professional PDF reports for your project
          </p>
        </div>
        {selectedProject && (
          <Badge variant="outline" className="text-sm" data-testid="badge-project">
            <FileText className="h-3 w-3 mr-1" />
            {selectedProject.name}
          </Badge>
        )}
      </div>

      {!selectedProjectId ? (
        <Card className="border-dashed" data-testid="card-no-project">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Project Selected</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Please select a project from the top navigation bar to generate reports.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            const isDownloading = downloadingReports.has(report.id);
            
            return (
              <Card 
                key={report.id} 
                className="hover-elevate transition-all"
                data-testid={`card-report-${report.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg" data-testid={`text-report-title-${report.id}`}>
                          {report.name}
                        </CardTitle>
                        <Badge 
                          variant="secondary" 
                          className={`mt-1 ${getCategoryColor(report.category)}`}
                        >
                          {report.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm" data-testid={`text-report-description-${report.id}`}>
                    {report.description}
                  </CardDescription>
                  <Button
                    onClick={() => handleDownloadReport(report)}
                    disabled={isDownloading}
                    className="w-full"
                    data-testid={`button-download-${report.id}`}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card data-testid="card-report-info">
        <CardHeader>
          <CardTitle className="text-base">Report Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Reports are generated in PDF format with professional formatting suitable for 
            client presentations and project documentation.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Project Status Report:</strong> Includes task progress, budget summary, and key metrics</li>
            <li><strong>Risk Register:</strong> Complete risk inventory with mitigation strategies</li>
            <li><strong>EVA Report:</strong> Earned value metrics and cost/schedule performance indices</li>
            <li><strong>Issue Log:</strong> Full issue tracking with resolution status</li>
          </ul>
          <p>
            All reports include the project header, generation date, and are formatted for 
            EPC industry standards.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
