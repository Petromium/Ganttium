import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useProject } from "@/contexts/ProjectContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Loader2 } from "lucide-react";
import type { Organization } from "@shared/schema";

export function TerminologySettings() {
  const { selectedOrg, selectedOrgId, terminology } = useProject();
  const { toast } = useToast();
  
  const [topLevelLabel, setTopLevelLabel] = useState<string>(
    selectedOrg?.topLevelEntityLabel || "Organization"
  );
  const [topLevelCustom, setTopLevelCustom] = useState<string>(
    selectedOrg?.topLevelEntityLabelCustom || ""
  );
  const [programLabel, setProgramLabel] = useState<string>(
    selectedOrg?.programEntityLabel || "Program"
  );
  const [programCustom, setProgramCustom] = useState<string>(
    selectedOrg?.programEntityLabelCustom || ""
  );

  const updateTerminology = useMutation({
    mutationFn: async (data: {
      topLevelEntityLabel: string;
      topLevelEntityLabelCustom: string | null;
      programEntityLabel: string;
      programEntityLabelCustom: string | null;
    }) => {
      if (!selectedOrgId) throw new Error("No organization selected");
      const res = await apiRequest("PATCH", `/api/organizations/${selectedOrgId}/terminology`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Terminology updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update terminology", 
        variant: "destructive" 
      });
    },
  });

  const handleSave = () => {
    if (!selectedOrgId) {
      toast({ title: "Error", description: "No organization selected", variant: "destructive" });
      return;
    }

    updateTerminology.mutate({
      topLevelEntityLabel: topLevelLabel,
      topLevelEntityLabelCustom: topLevelLabel === "custom" ? topLevelCustom : null,
      programEntityLabel: programLabel,
      programEntityLabelCustom: programLabel === "custom" ? programCustom : null,
    });
  };

  if (!selectedOrg) {
    return (
      <Alert>
        <AlertDescription>Please select an organization to configure terminology.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customize Terminology</CardTitle>
        <CardDescription>
          Adjust labels to match your organization's structure and terminology. 
          Changes will be reflected throughout the application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Only organization owners can change terminology. These labels will be used 
            throughout the application to match your organization's naming conventions.
          </AlertDescription>
        </Alert>

        {/* Top Level Entity */}
        <div className="space-y-2">
          <Label htmlFor="top-level-label">Top-Level Entity Label</Label>
          <Select value={topLevelLabel} onValueChange={setTopLevelLabel}>
            <SelectTrigger id="top-level-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Organization">Organization</SelectItem>
              <SelectItem value="Portfolio">Portfolio</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {topLevelLabel === "custom" && (
            <div className="space-y-2">
              <Input
                placeholder="Enter custom label (e.g., 'Company', 'Division', 'Business Unit')"
                value={topLevelCustom}
                onChange={(e) => setTopLevelCustom(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                This label will replace "Organization" throughout the application
              </p>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Current value: <strong>{terminology.topLevel}</strong>
          </p>
        </div>

        {/* Program Entity */}
        <div className="space-y-2">
          <Label htmlFor="program-label">Program/Group Entity Label</Label>
          <Select value={programLabel} onValueChange={setProgramLabel}>
            <SelectTrigger id="program-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Program">Program</SelectItem>
              <SelectItem value="Group">Group</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {programLabel === "custom" && (
            <div className="space-y-2">
              <Input
                placeholder="Enter custom label (e.g., 'Department', 'Business Unit', 'Division')"
                value={programCustom}
                onChange={(e) => setProgramCustom(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                This label will replace "Program" throughout the application
              </p>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Current value: <strong>{terminology.program}</strong>
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              setTopLevelLabel(selectedOrg.topLevelEntityLabel || "Organization");
              setTopLevelCustom(selectedOrg.topLevelEntityLabelCustom || "");
              setProgramLabel(selectedOrg.programEntityLabel || "Program");
              setProgramCustom(selectedOrg.programEntityLabelCustom || "");
            }}
            disabled={updateTerminology.isPending}
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateTerminology.isPending || (topLevelLabel === "custom" && !topLevelCustom.trim()) || (programLabel === "custom" && !programCustom.trim())}
          >
            {updateTerminology.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

