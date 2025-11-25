import { useState, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Upload, X, File as FileIcon, Loader2 } from "lucide-react";

interface FileUploadInfo {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  onGetUploadParameters: (file: { name: string; type: string; size: number }) => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (files: Array<{ name: string; type: string; size: number; uploadURL: string }>) => void;
  buttonClassName?: string;
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  children: ReactNode;
  disabled?: boolean;
  title?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function ObjectUploader({
  maxNumberOfFiles = 5,
  maxFileSize = 52428800, // 50MB default
  allowedFileTypes,
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  buttonVariant = "default",
  buttonSize = "default",
  children,
  disabled = false,
  title = "Upload Files",
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [files, setFiles] = useState<FileUploadInfo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    const newFiles: FileUploadInfo[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      if (files.length + newFiles.length >= maxNumberOfFiles) {
        break;
      }
      
      if (file.size > maxFileSize) {
        continue;
      }
      
      if (allowedFileTypes && !allowedFileTypes.some(type => 
        file.type.startsWith(type.replace('/*', '')) || file.type === type
      )) {
        continue;
      }
      
      newFiles.push({
        file,
        progress: 0,
        status: 'pending'
      });
    }
    
    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length, maxNumberOfFiles, maxFileSize, allowedFileTypes]);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const uploadFiles = async () => {
    if (files.length === 0 || isUploading) return;
    
    setIsUploading(true);
    const completedFiles: Array<{ name: string; type: string; size: number; uploadURL: string }> = [];
    
    for (let i = 0; i < files.length; i++) {
      const fileInfo = files[i];
      if (fileInfo.status !== 'pending') continue;
      
      try {
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'uploading' as const, progress: 0 } : f
        ));
        
        const { url } = await onGetUploadParameters({
          name: fileInfo.file.name,
          type: fileInfo.file.type,
          size: fileInfo.file.size
        });
        
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setFiles(prev => prev.map((f, idx) => 
                idx === i ? { ...f, progress } : f
              ));
            }
          });
          
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          });
          
          xhr.addEventListener('error', () => reject(new Error('Upload failed')));
          xhr.open('PUT', url);
          xhr.setRequestHeader('Content-Type', fileInfo.file.type);
          xhr.send(fileInfo.file);
        });
        
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'complete' as const, progress: 100 } : f
        ));
        
        completedFiles.push({
          name: fileInfo.file.name,
          type: fileInfo.file.type,
          size: fileInfo.file.size,
          uploadURL: url
        });
      } catch (error) {
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'error' as const, error: (error as Error).message } : f
        ));
      }
    }
    
    setIsUploading(false);
    
    if (completedFiles.length > 0) {
      onComplete?.(completedFiles);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setShowModal(false);
      setFiles([]);
    }
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const completedCount = files.filter(f => f.status === 'complete').length;

  return (
    <>
      <Button 
        onClick={() => setShowModal(true)} 
        className={buttonClassName}
        variant={buttonVariant}
        size={buttonSize}
        disabled={disabled}
        data-testid="button-upload-file"
      >
        {children}
      </Button>

      <Dialog open={showModal} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            data-testid="dropzone"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple={maxNumberOfFiles > 1}
              accept={allowedFileTypes?.join(',')}
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
              data-testid="input-file"
            />
            <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag and drop files here, or{' '}
              <button
                type="button"
                className="text-primary underline hover:no-underline"
                onClick={() => fileInputRef.current?.click()}
              >
                browse
              </button>
            </p>
            <p className="text-xs text-muted-foreground">
              Max {maxNumberOfFiles} files, up to {formatFileSize(maxFileSize)} each
            </p>
          </div>
          
          {files.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((fileInfo, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-2 rounded-md bg-muted/50"
                  data-testid={`file-item-${index}`}
                >
                  <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{fileInfo.file.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(fileInfo.file.size)}
                      </p>
                      {fileInfo.status === 'uploading' && (
                        <Progress value={fileInfo.progress} className="h-1 w-20" />
                      )}
                      {fileInfo.status === 'complete' && (
                        <span className="text-xs text-green-600">Complete</span>
                      )}
                      {fileInfo.status === 'error' && (
                        <span className="text-xs text-red-600">Failed</span>
                      )}
                    </div>
                  </div>
                  {fileInfo.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFile(index)}
                      data-testid={`button-remove-file-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  {fileInfo.status === 'uploading' && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button 
              onClick={uploadFiles} 
              disabled={pendingCount === 0 || isUploading}
              data-testid="button-start-upload"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                `Upload ${pendingCount} file${pendingCount !== 1 ? 's' : ''}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
