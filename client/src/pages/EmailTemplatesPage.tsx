import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useProject } from "@/contexts/ProjectContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Plus, Pencil, Trash2, Eye, Send, Copy, AlertCircle, Check, X, Code } from "lucide-react";
import type { EmailTemplate } from "@shared/schema";

const templateTypes = [
  { value: "task-assigned", label: "Task Assigned" },
  { value: "task-due-reminder", label: "Task Due Reminder" },
  { value: "risk-identified", label: "Risk Identified" },
  { value: "issue-reported", label: "Issue Reported" },
  { value: "change-request-submitted", label: "Change Request Submitted" },
  { value: "change-request-approved", label: "Change Request Approved" },
  { value: "change-request-rejected", label: "Change Request Rejected" },
  { value: "project-update", label: "Project Update" },
  { value: "milestone-reached", label: "Milestone Reached" },
  { value: "custom", label: "Custom Template" },
];

export default function EmailTemplatesPage() {
  const { selectedOrg: selectedOrganization, selectedOrgId } = useProject();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSendTestOpen, setIsSendTestOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [previewContent, setPreviewContent] = useState<{ subject: string; body: string } | null>(null);

  const [formData, setFormData] = useState({
    type: "custom" as string,
    name: "",
    subject: "",
    body: "",
    isActive: true,
  });

  const [testEmail, setTestEmail] = useState("");
  const [testPlaceholders, setTestPlaceholders] = useState<Record<string, string>>({});

  const { data: templates, isLoading } = useQuery<EmailTemplate[]>({
    queryKey: [`/api/organizations/${selectedOrgId}/email-templates`],
    enabled: !!selectedOrgId,
  });

  const { data: defaultTemplates } = useQuery<Array<{ type: string; subject: string; body: string }>>({
    queryKey: ["/api/email-templates/defaults"],
  });

  const { data: placeholders } = useQuery<{ type: string; placeholders: string[] }>({
    queryKey: [`/api/email-templates/placeholders/${formData.type}`],
    enabled: !!formData.type,
  });

  const { data: emailUsage } = useQuery<{ month: string; emailsSent: number; emailLimit: number }>({
    queryKey: [`/api/organizations/${selectedOrgId}/email-usage`],
    enabled: !!selectedOrgId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", `/api/organizations/${selectedOrgId}/email-templates`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${selectedOrgId}/email-templates`] });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: "Template created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create template", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof formData> }) => {
      const res = await apiRequest("PATCH", `/api/organizations/${selectedOrgId}/email-templates/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${selectedOrgId}/email-templates`] });
      setIsEditOpen(false);
      setSelectedTemplate(null);
      resetForm();
      toast({ title: "Template updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update template", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/organizations/${selectedOrgId}/email-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${selectedOrgId}/email-templates`] });
      toast({ title: "Template deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete template", description: error.message, variant: "destructive" });
    },
  });

  const sendTestMutation = useMutation({
    mutationFn: async ({ id, toEmail, placeholders }: { id: number; toEmail: string; placeholders: Record<string, string> }) => {
      const res = await apiRequest("POST", `/api/organizations/${selectedOrgId}/email-templates/${id}/send-test`, { toEmail, placeholders });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${selectedOrgId}/email-usage`] });
      setIsSendTestOpen(false);
      setSelectedTemplate(null);
      setTestEmail("");
      setTestPlaceholders({});
      toast({ title: data.success ? "Test email sent" : "Email queued", description: data.message });
    },
    onError: (error: any) => {
      toast({ title: "Failed to send test email", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ type: "custom", name: "", subject: "", body: "", isActive: true });
  };

  const loadDefaultTemplate = (type: string) => {
    const defaultTemplate = defaultTemplates?.find(t => t.type === type);
    if (defaultTemplate) {
      setFormData(prev => ({
        ...prev,
        subject: defaultTemplate.subject,
        body: defaultTemplate.body,
      }));
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      type: template.type,
      name: template.name,
      subject: template.subject,
      body: template.body,
      isActive: template.isActive,
    });
    setIsEditOpen(true);
  };

  const handlePreview = async (template: EmailTemplate) => {
    setSelectedTemplate(template);
    const samplePlaceholders: Record<string, string> = {};
    const availablePlaceholders = placeholders?.placeholders || [];
    availablePlaceholders.forEach(p => {
      samplePlaceholders[p] = `[${p.replace(/_/g, ' ').toUpperCase()}]`;
    });
    
    try {
      const response = await apiRequest(
        "POST",
        `/api/organizations/${selectedOrgId}/email-templates/${template.id}/preview`,
        { placeholders: samplePlaceholders }
      );
      const content = await response.json();
      setPreviewContent(content as { subject: string; body: string });
      setIsPreviewOpen(true);
    } catch (error) {
      toast({ title: "Failed to preview template", variant: "destructive" });
    }
  };

  const handleSendTest = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsSendTestOpen(true);
  };

  const getTypeLabel = (type: string) => {
    return templateTypes.find(t => t.value === type)?.label || type;
  };

  if (!selectedOrganization) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8" data-testid="no-org-message">
        <Mail className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Organization Selected</h2>
        <p className="text-muted-foreground text-center">
          Please select an organization to manage email templates.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 p-6 border-b">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Email Templates</h1>
            <p className="text-muted-foreground">
              Customize notification emails sent from the platform
            </p>
          </div>
          <div className="flex items-center gap-4">
            {emailUsage && (
              <div className="text-sm text-muted-foreground" data-testid="text-email-usage">
                <span className="font-medium">{emailUsage.emailsSent}</span> / {emailUsage.emailLimit} emails this month
              </div>
            )}
            <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-template">
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : templates?.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Mail className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Templates Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create custom email templates for notifications
                </p>
                <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-template">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates?.map(template => (
                <Card key={template.id} className="flex flex-col" data-testid={`card-template-${template.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate" data-testid={`text-template-name-${template.id}`}>
                          {template.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {getTypeLabel(template.type)}
                          </Badge>
                          {template.isActive ? (
                            <Badge variant="outline" className="text-xs text-green-600">
                              <Check className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              <X className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Subject:</p>
                    <p className="text-sm truncate mb-3" data-testid={`text-template-subject-${template.id}`}>
                      {template.subject}
                    </p>
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2 border-t pt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePreview(template)}
                      data-testid={`button-preview-${template.id}`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(template)}
                      data-testid={`button-edit-${template.id}`}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleSendTest(template)}
                      data-testid={`button-send-test-${template.id}`}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this template?")) {
                          deleteMutation.mutate(template.id);
                        }
                      }}
                      data-testid={`button-delete-${template.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Email Template</DialogTitle>
            <DialogDescription>
              Create a custom email template for notifications
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="placeholders">Placeholders</TabsTrigger>
            </TabsList>
            <TabsContent value="editor" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, type: value }));
                    }}
                  >
                    <SelectTrigger data-testid="select-template-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {templateTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Task Assignment Notification"
                    data-testid="input-template-name"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                    data-testid="switch-template-active"
                  />
                  <Label>Active</Label>
                </div>
                {formData.type !== "custom" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => loadDefaultTemplate(formData.type)}
                    data-testid="button-load-default"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Load Default Template
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <Label>Subject Line</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="[{{project_name}}] Notification Subject"
                  data-testid="input-template-subject"
                />
              </div>
              <div className="space-y-2">
                <Label>Email Body (HTML)</Label>
                <Textarea
                  value={formData.body}
                  onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Enter HTML email content with {{placeholders}}..."
                  className="min-h-[300px] font-mono text-sm"
                  data-testid="textarea-template-body"
                />
              </div>
            </TabsContent>
            <TabsContent value="placeholders" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Available Placeholders</CardTitle>
                  <CardDescription>
                    Use these in your template with double curly braces: {"{{placeholder_name}}"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {placeholders?.placeholders.map(p => (
                      <Badge 
                        key={p} 
                        variant="secondary" 
                        className="cursor-pointer hover-elevate"
                        onClick={() => {
                          navigator.clipboard.writeText(`{{${p}}}`);
                          toast({ title: "Copied to clipboard" });
                        }}
                      >
                        <Code className="h-3 w-3 mr-1" />
                        {p}
                      </Badge>
                    ))}
                    {(!placeholders?.placeholders || placeholders.placeholders.length === 0) && (
                      <p className="text-muted-foreground text-sm">
                        No predefined placeholders for this template type. You can use any custom placeholders.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} data-testid="button-cancel-create">
              Cancel
            </Button>
            <Button 
              onClick={() => createMutation.mutate(formData)}
              disabled={createMutation.isPending || !formData.name || !formData.subject}
              data-testid="button-save-template"
            >
              {createMutation.isPending ? "Creating..." : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              Modify the template settings and content
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Type</Label>
                <Select value={formData.type} disabled>
                  <SelectTrigger data-testid="select-edit-template-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templateTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  data-testid="input-edit-template-name"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                data-testid="switch-edit-template-active"
              />
              <Label>Active</Label>
            </div>
            <div className="space-y-2">
              <Label>Subject Line</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                data-testid="input-edit-template-subject"
              />
            </div>
            <div className="space-y-2">
              <Label>Email Body (HTML)</Label>
              <Textarea
                value={formData.body}
                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                className="min-h-[300px] font-mono text-sm"
                data-testid="textarea-edit-template-body"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button 
              onClick={() => selectedTemplate && updateMutation.mutate({ id: selectedTemplate.id, data: formData })}
              disabled={updateMutation.isPending}
              data-testid="button-update-template"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview how your email will look
            </DialogDescription>
          </DialogHeader>
          {previewContent && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Subject</Label>
                <p className="font-medium" data-testid="text-preview-subject">{previewContent.subject}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Body</Label>
                <div 
                  className="border rounded-lg p-4 bg-white dark:bg-background"
                  dangerouslySetInnerHTML={{ __html: previewContent.body }}
                  data-testid="preview-body"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)} data-testid="button-close-preview">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSendTestOpen} onOpenChange={setIsSendTestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email to verify your template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Recipient Email</Label>
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                data-testid="input-test-email"
              />
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Test emails will use sample placeholder values</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendTestOpen(false)} data-testid="button-cancel-test">
              Cancel
            </Button>
            <Button 
              onClick={() => selectedTemplate && sendTestMutation.mutate({ 
                id: selectedTemplate.id, 
                toEmail: testEmail,
                placeholders: testPlaceholders 
              })}
              disabled={sendTestMutation.isPending || !testEmail}
              data-testid="button-send-test-email"
            >
              {sendTestMutation.isPending ? "Sending..." : "Send Test Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
