import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Organization, Project, Program } from "@shared/schema";

interface ProjectContextType {
  selectedOrgId: number | null;
  selectedProgramId: number | null;
  selectedProjectId: number | null;
  setSelectedOrgId: (id: number | null) => void;
  setSelectedProgramId: (id: number | null) => void;
  setSelectedProjectId: (id: number | null) => void;
  organizations: Organization[];
  programs: Program[];
  projects: Project[];
  selectedOrg: Organization | null;
  selectedProgram: Program | null;
  selectedProject: Project | null;
  terminology: {
    topLevel: string;
    program: string;
  };
  isLoadingOrgs: boolean;
  isLoadingPrograms: boolean;
  isLoadingProjects: boolean;
  orgsError: Error | null;
  programsError: Error | null;
  projectsError: Error | null;
  refetchOrgs: () => void;
  refetchPrograms: () => void;
  refetchProjects: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Fetch organizations
  const {
    data: organizations = [],
    isLoading: isLoadingOrgs,
    error: orgsError,
    refetch: refetchOrgs
  } = useQuery<Organization[]>({
    queryKey: [`/api/organizations`],
    retry: 1,
  });

  // Fetch programs for selected organization
  const {
    data: programs = [],
    isLoading: isLoadingPrograms,
    error: programsError,
    refetch: refetchPrograms
  } = useQuery<Program[]>({
    queryKey: [`/api/organizations/${selectedOrgId}/programs`],
    enabled: !!selectedOrgId,
    retry: 1,
  });

  // Fetch projects for selected organization (filtered by program if selected)
  const {
    data: allProjects = [],
    isLoading: isLoadingProjects,
    error: projectsError,
    refetch: refetchProjects
  } = useQuery<Project[]>({
    queryKey: [`/api/organizations/${selectedOrgId}/projects`],
    enabled: !!selectedOrgId,
    retry: 1,
  });

  // Filter projects by selected program
  const projects = useMemo(() => {
    if (!selectedProgramId) return allProjects;
    return allProjects.filter(p => p.programId === selectedProgramId);
  }, [allProjects, selectedProgramId]);

  // Calculate terminology from selected organization
  const terminology = useMemo(() => {
    const org = organizations.find(o => o.id === selectedOrgId);
    if (!org) return { topLevel: "Organization", program: "Program" };
    
    const topLevel = org.topLevelEntityLabel === "custom"
      ? org.topLevelEntityLabelCustom || "Organization"
      : org.topLevelEntityLabel || "Organization";
      
    const program = org.programEntityLabel === "custom"
      ? org.programEntityLabelCustom || "Program"
      : org.programEntityLabel || "Program";
      
    return { topLevel, program };
  }, [organizations, selectedOrgId]);

  // Auto-select first organization when loaded
  useEffect(() => {
    if (organizations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organizations[0].id);
    }
  }, [organizations, selectedOrgId]);

  // Clear program selection when organization changes
  useEffect(() => {
    setSelectedProgramId(null);
    setSelectedProjectId(null);
  }, [selectedOrgId]);

  // Auto-select first project when projects change (but not when program changes)
  // Also handle case where selectedProjectId is invalid after filtering
  useEffect(() => {
    if (projects.length === 0) {
      setSelectedProjectId(null);
    } else {
      // Check if current selectedProjectId is valid in the filtered list
      const isValidProject = selectedProjectId && projects.some(p => p.id === selectedProjectId);
      if (!isValidProject) {
        // Selected project is not in the filtered list, select the first one
        setSelectedProjectId(projects[0].id);
      }
    }
  }, [projects, selectedProjectId]);

  const selectedOrg = organizations.find(o => o.id === selectedOrgId) || null;
  const selectedProgram = programs.find(p => p.id === selectedProgramId) || null;
  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  return (
    <ProjectContext.Provider value={{
      selectedOrgId,
      selectedProgramId,
      selectedProjectId,
      setSelectedOrgId,
      setSelectedProgramId,
      setSelectedProjectId,
      organizations,
      programs,
      projects,
      selectedOrg,
      selectedProgram,
      selectedProject,
      terminology,
      isLoadingOrgs,
      isLoadingPrograms,
      isLoadingProjects,
      orgsError: orgsError as Error | null,
      programsError: programsError as Error | null,
      projectsError: projectsError as Error | null,
      refetchOrgs,
      refetchPrograms,
      refetchProjects,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
