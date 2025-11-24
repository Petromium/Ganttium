import { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Organization, Project } from "@shared/schema";

interface ProjectContextType {
  selectedOrgId: number | null;
  selectedProjectId: number | null;
  setSelectedOrgId: (id: number | null) => void;
  setSelectedProjectId: (id: number | null) => void;
  organizations: Organization[];
  projects: Project[];
  selectedOrg: Organization | null;
  selectedProject: Project | null;
  isLoadingOrgs: boolean;
  isLoadingProjects: boolean;
  orgsError: Error | null;
  projectsError: Error | null;
  refetchOrgs: () => void;
  refetchProjects: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
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

  // Fetch projects for selected organization
  const {
    data: projects = [],
    isLoading: isLoadingProjects,
    error: projectsError,
    refetch: refetchProjects
  } = useQuery<Project[]>({
    queryKey: [`/api/organizations/${selectedOrgId}/projects`],
    enabled: !!selectedOrgId,
    retry: 1,
  });

  // Auto-select first organization when loaded
  useEffect(() => {
    if (organizations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organizations[0].id);
    }
  }, [organizations, selectedOrgId]);

  // Auto-select first project when organization changes
  useEffect(() => {
    if (projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    } else {
      setSelectedProjectId(null);
    }
  }, [projects]);

  const selectedOrg = organizations.find(o => o.id === selectedOrgId) || null;
  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  return (
    <ProjectContext.Provider value={{
      selectedOrgId,
      selectedProjectId,
      setSelectedOrgId,
      setSelectedProjectId,
      organizations,
      projects,
      selectedOrg,
      selectedProject,
      isLoadingOrgs,
      isLoadingProjects,
      orgsError: orgsError as Error | null,
      projectsError: projectsError as Error | null,
      refetchOrgs,
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
