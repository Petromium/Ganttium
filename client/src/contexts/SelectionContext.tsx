import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from "react";
import { useLocation } from "wouter";

type SelectionContextType = {
  // Projects
  selectedProjects: any[];
  setSelectedProjects: (items: any[]) => void;
  
  // Contacts
  selectedContacts: any[];
  setSelectedContacts: (items: any[]) => void;
  
  // Stakeholders
  selectedStakeholders: any[];
  setSelectedStakeholders: (items: any[]) => void;
  
  // Resources
  selectedResources: any[];
  setSelectedResources: (items: any[]) => void;
  
  // Programs
  selectedPrograms: any[];
  setSelectedPrograms: (items: any[]) => void;
  
  // Issues
  selectedIssues: any[];
  setSelectedIssues: (items: any[]) => void;
  
  // Risks
  selectedRisks: any[];
  setSelectedRisks: (items: any[]) => void;
  
  // Generic clear function
  clearAllSelections: () => void;
  
  // Get current page selections
  getCurrentSelections: () => {
    items: any[];
    type: string;
    clearFn: () => void;
  } | null;
};

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedProjects, setSelectedProjects] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
  const [selectedStakeholders, setSelectedStakeholders] = useState<any[]>([]);
  const [selectedResources, setSelectedResources] = useState<any[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<any[]>([]);
  const [selectedIssues, setSelectedIssues] = useState<any[]>([]);
  const [selectedRisks, setSelectedRisks] = useState<any[]>([]);
  const [location] = useLocation();

  // Use refs to access latest values without causing re-renders
  const selectionsRef = useRef({
    selectedProjects,
    selectedContacts,
    selectedStakeholders,
    selectedResources,
    selectedPrograms,
    selectedIssues,
    selectedRisks,
  });

  // Keep refs in sync with state
  useEffect(() => {
    selectionsRef.current = {
      selectedProjects,
      selectedContacts,
      selectedStakeholders,
      selectedResources,
      selectedPrograms,
      selectedIssues,
      selectedRisks,
    };
  }, [selectedProjects, selectedContacts, selectedStakeholders, selectedResources, selectedPrograms, selectedIssues, selectedRisks]);

  const clearAllSelections = useCallback(() => {
    setSelectedProjects([]);
    setSelectedContacts([]);
    setSelectedStakeholders([]);
    setSelectedResources([]);
    setSelectedPrograms([]);
    setSelectedIssues([]);
    setSelectedRisks([]);
  }, []);

  const getCurrentSelections = useCallback(() => {
    const current = selectionsRef.current;
    // Determine current page and return appropriate selections
    if (location.startsWith("/projects")) {
      return {
        items: current.selectedProjects,
        type: "projects",
        clearFn: () => setSelectedProjects([]),
      };
    }
    if (location.startsWith("/contacts")) {
      return {
        items: current.selectedContacts,
        type: "contacts",
        clearFn: () => setSelectedContacts([]),
      };
    }
    if (location.startsWith("/stakeholders")) {
      return {
        items: current.selectedStakeholders,
        type: "stakeholders",
        clearFn: () => setSelectedStakeholders([]),
      };
    }
    if (location.startsWith("/resources")) {
      return {
        items: current.selectedResources,
        type: "resources",
        clearFn: () => setSelectedResources([]),
      };
    }
    if (location.startsWith("/pmo/programs") || location.startsWith("/programs")) {
      return {
        items: current.selectedPrograms,
        type: "programs",
        clearFn: () => setSelectedPrograms([]),
      };
    }
    if (location.startsWith("/issues")) {
      return {
        items: current.selectedIssues,
        type: "issues",
        clearFn: () => setSelectedIssues([]),
      };
    }
    if (location.startsWith("/risks")) {
      return {
        items: current.selectedRisks,
        type: "risks",
        clearFn: () => setSelectedRisks([]),
      };
    }
    return null;
  }, [location]);

  return (
    <SelectionContext.Provider
      value={{
        selectedProjects,
        setSelectedProjects,
        selectedContacts,
        setSelectedContacts,
        selectedStakeholders,
        setSelectedStakeholders,
        selectedResources,
        setSelectedResources,
        selectedPrograms,
        setSelectedPrograms,
        selectedIssues,
        setSelectedIssues,
        selectedRisks,
        setSelectedRisks,
        clearAllSelections,
        getCurrentSelections,
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error("useSelection must be used within a SelectionProvider");
  }
  return context;
}


