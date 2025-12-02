import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, File, Image as ImageIcon, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface FileUploadHandlerProps {
  conversationId: number;
  onFileUploaded: (file: { path: string; name: string; size: number; mimeType: string }) => void;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
}

export function FileUploadHandler({
  conversationId,
  onFileUploaded,
  accept = "*/*",
  maxSize = 10 * 1024 * 1024, // 10MB default
  className,
}: FileUploadHandlerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file size
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("conversationId", conversationId.toString());

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      // Handle completion
      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          onFileUploaded({
            path: response.filePath,
            name: file.name,
            size: file.size,
            mimeType: file.type,
          });
          setUploading(false);
          setUploadProgress(0);
          toast({
            title: "File uploaded",
            description: `${file.name} has been uploaded successfully`,
          });
        } else {
          throw new Error("Upload failed");
        }
      });

      // Handle errors
      xhr.addEventListener("error", () => {
        setUploading(false);
        setUploadProgress(0);
        toast({
          title: "Upload failed",
          description: "Failed to upload file. Please try again.",
          variant: "destructive",
        });
      });

      xhr.open("POST", "/api/chat/files/upload");
      xhr.send(formData);
    } catch (error) {
      setUploading(false);
      setUploadProgress(0);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    }
  }, [conversationId, maxSize, onFileUploaded, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files);
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFileSelect]
  );

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-lg p-4 transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
        uploading && "opacity-50",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={uploading}
      />

      {uploading ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <File className="h-4 w-4" />
            <span>Uploading...</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">{Math.round(uploadProgress)}%</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-center">
          <File className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              {isDragging ? "Drop file here" : "Drag and drop a file here"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or{" "}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-primary hover:underline"
              >
                browse
              </button>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max size: {(maxSize / 1024 / 1024).toFixed(1)}MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

