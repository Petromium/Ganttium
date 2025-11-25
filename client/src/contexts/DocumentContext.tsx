import { createContext, useContext, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProject } from "@/contexts/ProjectContext";
import type { Document } from "@shared/schema";

interface DocumentContextType {
  documents: Document[];
  isLoading: boolean;
  selectedDocumentId: number | null;
  selectedDocument: Document | null;
  setSelectedDocumentId: (id: number | null) => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const { selectedProjectId } = useProject();
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/projects", selectedProjectId, "documents"],
    enabled: !!selectedProjectId,
    refetchInterval: 15 * 60 * 1000,
  });

  const selectedDocument = useMemo(() => {
    if (!selectedDocumentId) return null;
    return documents.find(d => d.id === selectedDocumentId) || null;
  }, [documents, selectedDocumentId]);

  const value: DocumentContextType = {
    documents,
    isLoading,
    selectedDocumentId,
    selectedDocument,
    setSelectedDocumentId,
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocuments() {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error("useDocuments must be used within a DocumentProvider");
  }
  return context;
}

export function useDocumentsOptional() {
  return useContext(DocumentContext);
}
