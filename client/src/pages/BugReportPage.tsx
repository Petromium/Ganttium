import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, Upload, X, Bug, Sparkles, MessageSquare, HelpCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function BugReportPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"bug" | "feature-request" | "feedback" | "other">("bug");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [actualBehavior, setActualBehavior] = useState("");
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

  // Auto-capture browser/device info
  const [browserInfo] = useState(() => {
    if (typeof window === "undefined") return null;
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    };
  });

  const [deviceInfo] = useState(() => {
    if (typeof window === "undefined") return null;
    return {
      type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? "mobile" : "desktop",
      screenSize: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    };
  });

  // Submit bug report mutation
  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/bug-reports", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Report Submitted Successfully",
        description: `Your report (#${data.id}) has been received. You'll receive an email confirmation shortly.`,
      });
      // Reset form
      setTitle("");
      setDescription("");
      setCategory("bug");
      setSeverity("medium");
      setStepsToReproduce("");
      setExpectedBehavior("");
      setActualBehavior("");
      setScreenshots([]);
      
      // Redirect to user's reports after 2 seconds
      setTimeout(() => {
        setLocation("/bug-reports");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Submit Report",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Get user's existing reports
  const { data: userReports } = useQuery({
    queryKey: ["/api/bug-reports"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/bug-reports");
      return response.json();
    },
    enabled: !!user,
  });

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingScreenshot(true);
    try {
      // Convert to base64 for now (in production, upload to cloud storage)
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setScreenshots([...screenshots, base64]);
        setUploadingScreenshot(false);
      };
      reader.onerror = () => {
        toast({
          title: "Upload Failed",
          description: "Failed to process image.",
          variant: "destructive",
        });
        setUploadingScreenshot(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload screenshot.",
        variant: "destructive",
      });
      setUploadingScreenshot(false);
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(screenshots.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and description are required.",
        variant: "destructive",
      });
      return;
    }

    if (description.length < 50) {
      toast({
        title: "Description Too Short",
        description: "Please provide at least 50 characters in your description.",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      category,
      severity,
      stepsToReproduce: stepsToReproduce.trim() || undefined,
      expectedBehavior: expectedBehavior.trim() || undefined,
      actualBehavior: actualBehavior.trim() || undefined,
      screenshots: screenshots.length > 0 ? screenshots : undefined,
      browserInfo,
      deviceInfo,
    });
  };

  const categoryIcons = {
    bug: Bug,
    "feature-request": Sparkles,
    feedback: MessageSquare,
    other: HelpCircle,
  };

  const CategoryIcon = categoryIcons[category];

  return (
    <div className="min-h-screen bg-background p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Report a Bug or Provide Feedback</h1>
          <p className="text-muted-foreground">
            Your feedback helps us improve Ganttium. We take all reports seriously, regardless of your subscription tier.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Submit Your Report</CardTitle>
                <CardDescription>
                  Please provide as much detail as possible to help us understand and resolve your issue.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bug">
                          <div className="flex items-center gap-2">
                            <Bug className="h-4 w-4" />
                            Bug Report
                          </div>
                        </SelectItem>
                        <SelectItem value="feature-request">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Feature Request
                          </div>
                        </SelectItem>
                        <SelectItem value="feedback">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            General Feedback
                          </div>
                        </SelectItem>
                        <SelectItem value="other">
                          <div className="flex items-center gap-2">
                            <HelpCircle className="h-4 w-4" />
                            Other
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Brief summary of the issue"
                      minLength={10}
                      maxLength={255}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {title.length}/255 characters (minimum 10)
                    </p>
                  </div>

                  {/* Severity (only for bugs) */}
                  {category === "bug" && (
                    <div className="space-y-2">
                      <Label htmlFor="severity">Severity</Label>
                      <Select value={severity} onValueChange={(v: any) => setSeverity(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - Minor issue, workaround available</SelectItem>
                          <SelectItem value="medium">Medium - Issue affects functionality</SelectItem>
                          <SelectItem value="high">High - Significant impact on workflow</SelectItem>
                          <SelectItem value="critical">Critical - System unusable or data loss risk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the issue in detail..."
                      rows={6}
                      minLength={50}
                      maxLength={10000}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {description.length}/10,000 characters (minimum 50)
                    </p>
                  </div>

                  {/* Steps to Reproduce (for bugs) */}
                  {category === "bug" && (
                    <div className="space-y-2">
                      <Label htmlFor="steps">Steps to Reproduce</Label>
                      <Textarea
                        id="steps"
                        value={stepsToReproduce}
                        onChange={(e) => setStepsToReproduce(e.target.value)}
                        placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                        rows={4}
                      />
                    </div>
                  )}

                  {/* Expected vs Actual Behavior (for bugs) */}
                  {category === "bug" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="expected">Expected Behavior</Label>
                        <Textarea
                          id="expected"
                          value={expectedBehavior}
                          onChange={(e) => setExpectedBehavior(e.target.value)}
                          placeholder="What should happen?"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="actual">Actual Behavior</Label>
                        <Textarea
                          id="actual"
                          value={actualBehavior}
                          onChange={(e) => setActualBehavior(e.target.value)}
                          placeholder="What actually happens?"
                          rows={3}
                        />
                      </div>
                    </>
                  )}

                  {/* Screenshots */}
                  <div className="space-y-2">
                    <Label>Screenshots</Label>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotUpload}
                        disabled={uploadingScreenshot}
                        className="cursor-pointer"
                      />
                      {uploadingScreenshot && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing image...
                        </div>
                      )}
                      {screenshots.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {screenshots.map((screenshot, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={screenshot}
                                alt={`Screenshot ${index + 1}`}
                                className="w-full h-32 object-cover rounded border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeScreenshot(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload screenshots to help us understand the issue (max 5MB per image)
                    </p>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={submitMutation.isPending || !title.trim() || description.length < 50}
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CategoryIcon className="mr-2 h-4 w-4" />
                        Submit Report
                      </>
                    )}
                  </Button>

                  {submitMutation.isError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {submitMutation.error instanceof Error
                          ? submitMutation.error.message
                          : "Failed to submit report. Please try again."}
                      </AlertDescription>
                    </Alert>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What Happens Next?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-blue-100 p-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Review Process</p>
                    <p className="text-xs text-muted-foreground">
                      Our team reviews all reports within 2-3 business days
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-green-100 p-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Equal Treatment</p>
                    <p className="text-xs text-muted-foreground">
                      All reports are taken seriously, regardless of subscription tier
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-purple-100 p-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Notifications</p>
                    <p className="text-xs text-muted-foreground">
                      You'll receive email updates when your report is resolved
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User's Reports */}
            {userReports && userReports.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {userReports.slice(0, 5).map((report: any) => (
                      <div
                        key={report.id}
                        className="p-2 rounded border cursor-pointer hover:bg-muted"
                        onClick={() => setLocation(`/bug-reports/${report.id}`)}
                      >
                        <p className="text-sm font-medium truncate">{report.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            report.status === "resolved" ? "bg-green-100 text-green-700" :
                            report.status === "in-progress" ? "bg-blue-100 text-blue-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {report.status}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            #{report.id}
                          </span>
                        </div>
                      </div>
                    ))}
                      {userReports.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => setLocation("/bug-reports")}
                        >
                          View All Reports ({userReports.length})
                        </Button>
                      )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

