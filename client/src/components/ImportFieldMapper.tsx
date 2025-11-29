import { useState, useCallback } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Upload, ArrowRight, Check, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ImportFieldMapperProps {
  onBack: () => void;
  onClose: () => void;
}

// Schema structure for auto-mapping
const ENTITY_SCHEMAS = {
  tasks: {
    name: "Task",
    fields: [
      { key: "wbsCode", label: "WBS Code", required: false },
      { key: "name", label: "Name", required: true },
      { key: "description", label: "Description", required: false },
      { key: "status", label: "Status", type: "enum", options: ["not-started", "in-progress", "review", "completed", "on-hold"] },
      { key: "priority", label: "Priority", type: "enum", options: ["low", "medium", "high", "critical"] },
      { key: "startDate", label: "Start Date", type: "date" },
      { key: "endDate", label: "End Date", type: "date" },
      { key: "progress", label: "Progress %", type: "number" },
      { key: "discipline", label: "Discipline", type: "enum", options: ["civil", "structural", "mechanical", "electrical", "piping", "instrumentation", "process", "hvac", "architectural", "general", "management", "legal", "drilling", "cementing", "logistics", "procurement", "hse", "quality", "safety"] },
      { key: "assignedTo", label: "Assigned To", type: "text" }
    ]
  },
  risks: {
    name: "Risk",
    fields: [
      { key: "code", label: "Code", required: false },
      { key: "title", label: "Title", required: true },
      { key: "description", label: "Description", required: false },
      { key: "status", label: "Status", type: "enum", options: ["identified", "assessed", "mitigating", "closed"] },
      { key: "impact", label: "Impact", type: "enum", options: ["low", "medium", "high", "critical"] },
      { key: "probability", label: "Probability (1-5)", type: "number" },
      { key: "category", label: "Category", type: "enum", options: ["technical", "external", "organizational", "project-management", "commercial", "hse", "quality", "schedule", "resource"] },
      { key: "mitigationPlan", label: "Mitigation Plan", required: false }
    ]
  },
  issues: {
    name: "Issue",
    fields: [
      { key: "code", label: "Code", required: false },
      { key: "title", label: "Title", required: true },
      { key: "description", label: "Description", required: false },
      { key: "status", label: "Status", type: "enum", options: ["open", "in-progress", "resolved", "closed"] },
      { key: "priority", label: "Priority", type: "enum", options: ["low", "medium", "high", "critical"] },
      { key: "assignedTo", label: "Assigned To", type: "text" },
      { key: "resolution", label: "Resolution", required: false }
    ]
  }
};

type MappingType = 'direct' | 'enum' | 'text';

interface FieldMapping {
  sourceField: string;
  targetField: string;
  mappingType: MappingType;
  enumMappings?: Record<string, string>;
  isMapped: boolean;
}

export function ImportFieldMapper({ onBack, onClose }: ImportFieldMapperProps) {
  const [file, setFile] = useState<File | null>(null);
  const [jsonData, setJsonData] = useState<any | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mappings, setMappings] = useState<Record<string, FieldMapping[]>>({});
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const { selectedOrgId } = useProject();
  const queryClient = useQueryClient();

  // Step 1: File Upload & Analysis
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setJsonData(json);
        generateInitialMappings(json);
        setStep(2);
      } catch (error) {
        toast({
          title: "Invalid JSON",
          description: "The file format is incorrect. Please upload a valid JSON file.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(uploadedFile);
  };

  // Auto-map fields based on names
  const generateInitialMappings = (data: any) => {
    const newMappings: Record<string, FieldMapping[]> = {};

    Object.keys(ENTITY_SCHEMAS).forEach(entityType => {
      if (data[entityType] && Array.isArray(data[entityType]) && data[entityType].length > 0) {
        const sampleItem = data[entityType][0];
        const sourceFields = Object.keys(sampleItem);
        const schemaFields = ENTITY_SCHEMAS[entityType as keyof typeof ENTITY_SCHEMAS].fields;

        newMappings[entityType] = sourceFields.map(sourceField => {
          // Fuzzy match logic
          const match = schemaFields.find(f => 
            f.key.toLowerCase() === sourceField.toLowerCase() ||
            f.label.toLowerCase() === sourceField.toLowerCase() ||
            (sourceField.toLowerCase().includes('assign') && f.key === 'assignedTo') ||
            (sourceField.toLowerCase().includes('engineer') && f.key === 'discipline')
          );

          return {
            sourceField,
            targetField: match ? match.key : "",
            mappingType: match?.type === 'enum' ? 'enum' : 'direct',
            isMapped: !!match,
            enumMappings: match?.type === 'enum' ? generateEnumMappings(data[entityType], sourceField, match.options || []) : undefined
          };
        });
      }
    });

    setMappings(newMappings);
  };

  // Helper to auto-map enum values
  const generateEnumMappings = (items: any[], sourceField: string, targetOptions: string[]) => {
    const uniqueValues = Array.from(new Set(items.map(i => i[sourceField]).filter(Boolean)));
    const mapping: Record<string, string> = {};
    
    uniqueValues.forEach((val: any) => {
      const strVal = String(val).toLowerCase();
      const match = targetOptions.find(opt => 
        opt.toLowerCase() === strVal || strVal.includes(opt.toLowerCase())
      );
      mapping[String(val)] = match || "other"; // Default to 'other' or leave empty if not found
    });
    
    return mapping;
  };

  const updateMapping = (entityType: string, index: number, updates: Partial<FieldMapping>) => {
    const updated = { ...mappings };
    updated[entityType][index] = { ...updated[entityType][index], ...updates };
    setMappings(updated);
  };

  const handleImport = async () => {
    if (!jsonData || !selectedOrgId) return;
    setIsImporting(true);

    try {
      // Create project first
      const projectData = jsonData.project || {
        name: "Imported Project",
        code: `IMP-${Date.now()}`,
        startDate: new Date().toISOString(),
        status: "planning"
      };

      // 1. Create Project
      const projectRes = await apiRequest("POST", "/api/projects", {
        ...projectData,
        organizationId: selectedOrgId,
        startDate: projectData.startDate ? new Date(projectData.startDate) : null,
        endDate: projectData.endDate ? new Date(projectData.endDate) : null,
      });
      const project = await projectRes.json();

      // 2. Import Data with Mappings
      const importRes = await apiRequest("POST", `/api/projects/${project.id}/import`, {
        ...jsonData,
        fieldMappings: mappings
      });

      const result = await importRes.json();

      if (result.success) {
        toast({ 
          title: "Import Successful", 
          description: `Imported ${result.imported.tasks} tasks, ${result.imported.risks} risks.` 
        });
        queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
        onClose();
      } else {
        toast({ 
          title: "Import Warning", 
          description: result.message, 
          variant: "default" 
        });
      }

    } catch (error: any) {
      toast({ 
        title: "Import Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Render Step 1: Upload
  if (step === 1) {
    return (
      <div className="space-y-6 py-4">
        <div className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center space-y-4 hover:bg-muted/50 transition-colors">
          <div className="p-4 bg-primary/10 rounded-full">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-medium">Upload JSON File</h3>
            <p className="text-sm text-muted-foreground mt-1">Drag and drop or click to select</p>
          </div>
          <Input 
            type="file" 
            accept=".json" 
            className="max-w-xs" 
            onChange={handleFileUpload} 
          />
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>Back</Button>
        </div>
      </div>
    );
  }

  // Render Step 2: Mapping
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="tasks" className="h-full flex flex-col">
          <TabsList>
            {Object.keys(mappings).map(entity => (
              <TabsTrigger key={entity} value={entity} className="capitalize">
                {entity} <Badge variant="secondary" className="ml-2">{mappings[entity].length}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.keys(mappings).map(entity => (
            <TabsContent key={entity} value={entity} className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-[400px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source Field (JSON)</TableHead>
                      <TableHead>Target Field (System)</TableHead>
                      <TableHead>Mapping Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappings[entity].map((mapping, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{mapping.sourceField}</TableCell>
                        <TableCell>
                          <Select 
                            value={mapping.targetField || "ignore_field"} 
                            onValueChange={(val) => updateMapping(entity, idx, { 
                              targetField: val === "ignore_field" ? "" : val, 
                              isMapped: val !== "ignore_field" 
                            })}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Ignore Field" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ignore_field">-- Ignore --</SelectItem>
                              {ENTITY_SCHEMAS[entity as keyof typeof ENTITY_SCHEMAS]?.fields.map(f => (
                                <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {mapping.isMapped && (
                            <Badge variant="outline" className="capitalize">
                              {mapping.mappingType}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {mapping.isMapped ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <span className="text-muted-foreground text-xs">Ignored</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={() => setStep(1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Re-upload
        </Button>
        <Button onClick={handleImport} disabled={isImporting}>
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              Confirm & Import
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
