import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  FolderKanban,
  BarChart3,
  Calendar,
  Users,
  Shield,
  Brain,
  Zap,
  FileText,
  ChevronRight,
  PlayCircle,
  BookOpen,
  HelpCircle,
  Search,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface GuideSection {
  id: string;
  title: string;
  icon: any;
  description: string;
  content: Array<{
    title: string;
    description: string;
    steps?: string[];
    tips?: string[];
  }>;
}

const guideSections: GuideSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: PlayCircle,
    description: "Learn the basics of Ganttium",
    content: [
      {
        title: "Creating Your First Project",
        description: "Start managing your EPC projects in minutes",
        steps: [
          "Click the 'New Project' button in the top navigation",
          "Fill in project details: name, code, start date, and organization",
          "Select your project type (Engineering, Procurement, Construction, or Combined)",
          "Click 'Create Project' to get started",
        ],
      },
      {
        title: "Understanding the Dashboard",
        description: "Navigate your project workspace efficiently",
        steps: [
          "The sidebar provides quick access to all project views",
          "Use the top bar to switch between projects and organizations",
          "The main content area shows your selected view (WBS, Gantt, Kanban, etc.)",
          "Use the command palette (Ctrl/Cmd + K) for quick navigation",
        ],
      },
      {
        title: "Setting Up Your Organization",
        description: "Configure your organization settings",
        steps: [
          "Go to Settings → Organizations",
          "Add your organization details and logo",
          "Invite team members via email",
          "Configure terminology and labels to match your workflow",
        ],
      },
    ],
  },
  {
    id: "wbs",
    title: "Work Breakdown Structure",
    icon: FolderKanban,
    description: "Master the 5-level WBS system",
    content: [
      {
        title: "Creating a WBS",
        description: "Build hierarchical project structures",
        steps: [
          "Navigate to the WBS view",
          "Click 'Add Task' to create your first task",
          "Use drag-and-drop to organize tasks hierarchically",
          "Tasks automatically receive WBS codes (e.g., 1.1.2.3.1)",
          "Create up to 5 levels of hierarchy",
        ],
        tips: [
          "Start with high-level phases, then break down into detailed tasks",
          "Use consistent naming conventions across your organization",
          "Leverage templates for common project types",
        ],
      },
      {
        title: "Task Properties",
        description: "Configure task details and dependencies",
        steps: [
          "Click on any task to open the details panel",
          "Set start and end dates, duration, and effort",
          "Assign resources and set allocation percentages",
          "Add dependencies (Finish-to-Start, Start-to-Start, etc.)",
          "Set task status and progress percentage",
        ],
      },
      {
        title: "WBS Codes",
        description: "Understanding automatic code generation",
        steps: [
          "WBS codes are automatically generated based on hierarchy",
          "Format: Level1.Level2.Level3.Level4.Level5",
          "Codes update automatically when tasks are moved",
          "Use codes for reporting and cross-referencing",
        ],
      },
    ],
  },
  {
    id: "gantt",
    title: "Gantt Charts",
    icon: BarChart3,
    description: "Visualize and manage project timelines",
    content: [
      {
        title: "Reading the Gantt Chart",
        description: "Understand timeline visualization",
        steps: [
          "Tasks appear as horizontal bars on the timeline",
          "Bar length represents task duration",
          "Colors indicate task status (not started, in progress, completed)",
          "Dependencies are shown as connecting lines",
          "Critical path is highlighted automatically",
        ],
      },
      {
        title: "Editing in Gantt View",
        description: "Make changes directly on the timeline",
        steps: [
          "Drag task bars to change start dates",
          "Resize bars to adjust duration",
          "Click and drag dependency lines to change relationships",
          "Right-click tasks for context menu options",
        ],
      },
      {
        title: "Critical Path Analysis",
        description: "Identify project bottlenecks",
        steps: [
          "Critical path is automatically calculated",
          "Tasks on the critical path are highlighted",
          "Delays on critical path tasks affect project completion",
          "Use this to prioritize resource allocation",
        ],
      },
    ],
  },
  {
    id: "kanban",
    title: "Kanban Boards",
    icon: Calendar,
    description: "Agile workflow management",
    content: [
      {
        title: "Using Kanban View",
        description: "Manage tasks with visual workflow",
        steps: [
          "Navigate to Kanban view from the sidebar",
          "Tasks are organized in columns by status",
          "Drag tasks between columns to update status",
          "Customize columns to match your workflow",
        ],
      },
      {
        title: "Task Cards",
        description: "Quick task information at a glance",
        steps: [
          "Cards show task name, assignee, and due date",
          "Click cards to view full details",
          "Use filters to show specific tasks",
          "Bulk actions available for multiple selections",
        ],
      },
    ],
  },
  {
    id: "resources",
    title: "Resource Management",
    icon: Users,
    description: "Assign and track team members",
    content: [
      {
        title: "Assigning Resources",
        description: "Add team members to tasks",
        steps: [
          "Open task details panel",
          "Go to 'Resources' tab",
          "Click 'Add Resource' and select team member",
          "Set allocation percentage (0-100%)",
          "Specify effort hours if needed",
        ],
      },
      {
        title: "Resource Utilization",
        description: "Monitor team workload",
        steps: [
          "View resource utilization in Analytics → Resources",
          "See allocation across all projects",
          "Identify overallocated resources",
          "Balance workloads to prevent burnout",
        ],
      },
      {
        title: "Resource Groups",
        description: "Organize resources by role or department",
        steps: [
          "Go to Resources page",
          "Create resource groups (e.g., 'Engineering Team', 'Procurement')",
          "Assign resources to groups",
          "Use groups for filtering and reporting",
        ],
      },
    ],
  },
  {
    id: "risks-issues",
    title: "Risks & Issues",
    icon: Shield,
    description: "Track and mitigate project risks",
    content: [
      {
        title: "Creating Risk Logs",
        description: "Document potential project risks",
        steps: [
          "Navigate to Risks page",
          "Click 'New Risk'",
          "Fill in risk details: description, probability, impact",
          "Set risk level (automatically calculated)",
          "Assign owner and mitigation strategy",
        ],
      },
      {
        title: "Issue Management",
        description: "Track and resolve project issues",
        steps: [
          "Go to Issues page",
          "Create new issues as they arise",
          "Link issues to related tasks",
          "Set priority and assign owner",
          "Update status as issues are resolved",
        ],
      },
      {
        title: "Change Requests",
        description: "Manage project scope changes",
        steps: [
          "Navigate to Change Requests",
          "Document requested changes",
          "Assess impact on schedule and budget",
          "Approve or reject with comments",
          "Track all changes for audit purposes",
        ],
      },
    ],
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    icon: Brain,
    description: "Leverage AI for project insights",
    content: [
      {
        title: "Using the AI Assistant",
        description: "Get intelligent project assistance",
        steps: [
          "Click the AI Assistant icon in the sidebar",
          "Type your question or request",
          "AI understands your project context",
          "Get instant answers and suggestions",
        ],
        tips: [
          "Ask about project status, risks, or recommendations",
          "Request report generation",
          "Get help with task scheduling",
          "Ask for best practices",
        ],
      },
      {
        title: "AI Features",
        description: "What the AI can help with",
        steps: [
          "Generate project reports",
          "Suggest task dependencies",
          "Identify potential risks",
          "Optimize resource allocation",
          "Answer questions about your project",
        ],
      },
    ],
  },
  {
    id: "reports",
    title: "Reports & Analytics",
    icon: FileText,
    description: "Generate insights and reports",
    content: [
      {
        title: "Creating Reports",
        description: "Generate professional project reports",
        steps: [
          "Go to Reports page",
          "Select report type (Status, Risk Register, EV Analysis, etc.)",
          "Choose date range and filters",
          "Click 'Generate Report'",
          "Export as PDF or share via email",
        ],
      },
      {
        title: "Earned Value Analysis",
        description: "Track project performance metrics",
        steps: [
          "Navigate to Analytics → Earned Value",
          "View Planned Value (PV), Earned Value (EV), Actual Cost (AC)",
          "Monitor CPI and SPI indicators",
          "Identify cost and schedule variances",
        ],
      },
      {
        title: "Custom Dashboards",
        description: "Create personalized views",
        steps: [
          "Go to Dashboard → Custom Dashboards",
          "Click 'Create Dashboard'",
          "Add widgets (charts, tables, metrics)",
          "Arrange widgets by dragging",
          "Save and set as default if desired",
        ],
      },
    ],
  },
];

export default function UserGuidePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("getting-started");

  const filteredSections = guideSections.filter((section) =>
    section.content.some((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const activeSection = guideSections.find((s) => s.id === activeTab) || guideSections[0];

  return (
    <div className="min-h-screen bg-background p-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">User Guide</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Learn how to use Ganttium to manage your EPC projects effectively
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search the guide..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 w-full">
            {guideSections.map((section) => {
              const Icon = section.icon;
              return (
                <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{section.title}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = activeSection.icon;
                    return <Icon className="h-6 w-6 text-primary" />;
                  })()}
                  <div>
                    <CardTitle>{activeSection.title}</CardTitle>
                    <CardDescription>{activeSection.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {activeSection.content.map((item, index) => (
                  <div key={index} className="border-l-4 border-primary pl-4 space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    {item.steps && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Steps:</h4>
                        <ol className="space-y-2">
                          {item.steps.map((step, stepIndex) => (
                            <li key={stepIndex} className="flex items-start gap-2 text-sm">
                              <Badge variant="outline" className="mt-0.5">
                                {stepIndex + 1}
                              </Badge>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {item.tips && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <HelpCircle className="h-4 w-4" />
                          Tips:
                        </h4>
                        <ul className="space-y-1">
                          {item.tips.map((tip, tipIndex) => (
                            <li key={tipIndex} className="flex items-start gap-2 text-sm">
                              <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-2">
                  <a
                    href="/bug-report"
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      <span>Report a Bug</span>
                    </div>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href="/settings"
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      <span>Settings</span>
                    </div>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

