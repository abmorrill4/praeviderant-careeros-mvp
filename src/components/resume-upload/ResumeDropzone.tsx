
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ResumeDropzoneProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  selectedFile?: File | null;
  onClearFile?: () => void;
}

export const ResumeDropzone: React.FC<ResumeDropzoneProps> = ({
  onFileSelect,
  isUploading = false,
  selectedFile,
  onClearFile
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const validateFile = useCallback((file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported File Type",
        description: "Please upload a PDF, Word document, or text file",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 50MB",
        variant: "destructive",
      });
      return false;
    }

    return true;
  }, [toast]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upload resumes",
        variant: "destructive",
      });
      return;
    }

    if (acceptedFiles.length === 0) {
      return;
    }

    const file = acceptedFiles[0];
    if (validateFile(file)) {
      onFileSelect(file);
    }
  }, [user, toast, validateFile, onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple: false,
    disabled: isUploading
  });

  if (selectedFile) {
    return (
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
          <FileText className="w-8 h-8 text-primary" />
          <div className="flex-1">
            <p className="font-medium">{selectedFile.name}</p>
            <p className="text-sm text-muted-foreground">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          {onClearFile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFile}
              disabled={isUploading}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
          isDragActive
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/10'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
        <h3 className="text-lg font-medium mb-2">
          {isDragActive ? 'Drop your resume here' : 'Upload Resume'}
        </h3>
        <p className="text-muted-foreground mb-4">
          {isDragActive 
            ? 'Release to upload your resume'
            : 'Drag and drop your resume file here, or click to browse'
          }
        </p>
        <div className="flex justify-center gap-2 flex-wrap mb-4">
          <Badge variant="secondary">PDF</Badge>
          <Badge variant="secondary">DOC</Badge>
          <Badge variant="secondary">DOCX</Badge>
          <Badge variant="secondary">TXT</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Maximum file size: 50MB
        </p>
      </div>

      {fileRejections.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Upload Error</span>
          </div>
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="mt-2 text-sm text-red-600">
              <p className="font-medium">{file.name}</p>
              {errors.map(error => (
                <p key={error.code} className="text-xs">• {error.message}</p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
