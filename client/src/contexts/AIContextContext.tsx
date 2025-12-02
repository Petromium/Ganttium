import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { useProject } from "./ProjectContext";

export interface AIContext {
  currentPage: string;
  selectedTaskId?: number;
  selectedRiskId?: number;
  selectedIssueId?: number;
  selectedResourceId?: number;
  selectedProjectId?: number;
  selectedItemIds?: number[];
  pageData?: any; // Additional page-specific data
}

interface AIContextContextType {
  context: AIContext;
  setSelectedTaskId: (id: number | undefined) => void;
  setSelectedRiskId: (id: number | undefined) => void;
  setSelectedIssueId: (id: number | undefined) => void;
  setSelectedResourceId: (id: number | undefined) => void;
  setSelectedItemIds: (ids: number[]) => void;
  setPageData: (data: any) => void;
  getContextDescription: () => string;
}

const AIContextContext = createContext<AIContextContextType | undefined>(undefined);

export function AIContextProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { selectedProjectId } = useProject();
  const [selectedTaskId, setSelectedTaskId] = useState<number | undefined>();
  const [selectedRiskId, setSelectedRiskId] = useState<number | undefined>();
  const [selectedIssueId, setSelectedIssueId] = useState<number | undefined>();
  const [selectedResourceId, setSelectedResourceId] = useState<number | undefined>();
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [pageData, setPageData] = useState<any>();

  // Determine current page from route
  const getCurrentPage = (): string => {
    if (location.startsWith("/wbs")) return "wbs";
    if (location.startsWith("/kanban")) return "kanban";
    if (location.startsWith("/risks")) return "risks";
    if (location.startsWith("/issues")) return "issues";
    if (location.startsWith("/resources")) return "resources";
    if (location.startsWith("/calendar")) return "calendar";
    if (location.startsWith("/stakeholders")) return "stakeholders";
    if (location.startsWith("/cost")) return "cost";
    if (location.startsWith("/documents")) return "documents";
    if (location.startsWith("/ai-assistant")) return "ai-assistant";
    return "dashboard";
  };

  const context: AIContext = {
    currentPage: getCurrentPage(),
    selectedTaskId,
    selectedRiskId,
    selectedIssueId,
    selectedResourceId,
    selectedProjectId: selectedProjectId || undefined,
    selectedItemIds,
    pageData,
  };

  const getContextDescription = (): string => {
    const parts: string[] = [];
    
    parts.push(`Current page: ${getCurrentPage()}`);
    
    if (selectedProjectId) {
      parts.push(`Project ID: ${selectedProjectId}`);
    }
    
    if (selectedTaskId) {
      parts.push(`Selected task ID: ${selectedTaskId}`);
    }
    
    if (selectedRiskId) {
      parts.push(`Selected risk ID: ${selectedRiskId}`);
    }
    
    if (selectedIssueId) {
      parts.push(`Selected issue ID: ${selectedIssueId}`);
    }
    
    if (selectedResourceId) {
      parts.push(`Selected resource ID: ${selectedResourceId}`);
    }
    
    if (selectedItemIds.length > 0) {
      parts.push(`Selected ${selectedItemIds.length} item(s): ${selectedItemIds.join(", ")}`);
    }
    
    return parts.join(" | ");
  };

  // Clear selections when page changes (except for multi-select)
  useEffect(() => {
    // Don't clear on navigation if we're just switching tabs
    const currentPage = getCurrentPage();
    // Keep selections when navigating within same section
  }, [location]);

  return (
    <AIContextContext.Provider
      value={{
        context,
        setSelectedTaskId,
        setSelectedRiskId,
        setSelectedIssueId,
        setSelectedResourceId,
        setSelectedItemIds,
        setPageData,
        getContextDescription,
      }}
    >
      {children}
    </AIContextContext.Provider>
  );
}

export function useAIContext() {
  const context = useContext(AIContextContext);
  if (!context) {
    throw new Error("useAIContext must be used within AIContextProvider");
  }
  return context;
}

