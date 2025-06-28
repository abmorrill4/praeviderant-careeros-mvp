import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Upload, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ResumeDropzone } from '@/components/resume-upload/ResumeDropzone';
import { UploadProgress } from '@/components/resume-upload/UploadProgress';
import { ParsedResumeEntities } from '@/components/ParsedResumeEntities';

interface ResumeUploadModalProps {
  children?: React.ReactNode;
}

interface UploadState {
  file: File | null;
  isUploading: boolean;
  uploadProgress: number;
  currentStage: string;
  error: string | null;
  completedVersionId: string | null;
}

export const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({ children }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    isUploading: false,
    uploadProgress: 0,
    currentStage: 'upload',
    error: null,
    completedVersionId: null
  });

  const handleFileSelect = (file: File) => {
    setUploadState(prev => ({ 
      ...prev, 
      file, 
      error: null,
      completedVersionId: null
    }));
  };

  const handleClearFile = () => {
    setUploadState(prev => ({ 
      ...prev, 
      file: null, 
      error: null,
      completedVersionId: null
    }));
  };

  const handleUpload = async () => {
    if (!uploadState.file) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting simplified upload process...');
    
    setUploadState(prev => ({ 
      ...prev, 
      isUploading: true,
      uploadProgress: 10,
      currentStage: 'upload',
      error: null,
      completedVersionId: null
    }));

    try {
      setUploadState(prev => ({ ...prev, uploadProgress: 30 }));

      const formData = new FormData();
      formData.append('file', uploadState.file);
      formData.append('streamName', 'Resume Upload');

      const { data, error } = await supabase.functions.invoke('resume-upload-v2', {
        body: formData,
      });

      if (error) {
        throw error;
      }

      console.log('Upload result:', data);

      if (data.success) {
        setUploadState(prev => ({ 
          ...prev,
          uploadProgress: 100,
          currentStage: 'complete',
          isUploading: false,
          completedVersionId: data.versionId || null
        }));

        toast({
          title: "Upload Successful",
          description: data.isDuplicate 
            ? "File already exists in your collection" 
            : "Resume uploaded and processing started",
        });
      } else {
        throw new Error(data.message || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadState(prev => ({ 
        ...prev, 
        isUploading: false,
        uploadProgress: 0,
        error: error instanceof Error ? error.message : 'Upload failed'
      }));

      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Failed to upload resume',
        variant: "destructive",
      });
    }
  };

  const resetUpload = () => {
    setUploadState({
      file: null,
      isUploading: false,
      uploadProgress: 0,
      currentStage: 'upload',
      error: null,
      completedVersionId: null
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button 
            variant="outline" 
            size="sm"
            className={`${
              theme === 'dark' 
                ? 'border-career-gray-dark hover:bg-career-gray-dark text-career-text-dark' 
                : 'border-career-gray-light hover:bg-career-gray-light text-career-text-light'
            }`}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Resume
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        className={`max-w-4xl max-h-[90vh] overflow-y-auto ${
          theme === 'dark' 
            ? 'bg-career-panel-dark border-career-gray-dark' 
            : 'bg-career-panel-light border-career-gray-light'
        }`}
      >
        <div className="space-y-6">
          <ResumeDropzone
            onFileSelect={handleFileSelect}
            isUploading={uploadState.isUploading}
            selectedFile={uploadState.file}
            onClearFile={handleClearFile}
          />

          {uploadState.file && !uploadState.completedVersionId && (
            <>
              <Separator />
              
              <div className="flex gap-3">
                <Button
                  onClick={handleUpload}
                  disabled={uploadState.isUploading}
                  className="flex-1"
                  size="lg"
                >
                  {uploadState.isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload & Analyze Resume
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={resetUpload}
                  disabled={uploadState.isUploading}
                  size="lg"
                >
                  Clear
                </Button>
              </div>
            </>
          )}

          {(uploadState.isUploading || uploadState.error) && (
            <UploadProgress
              isUploading={uploadState.isUploading}
              currentStage={uploadState.currentStage}
              fileName={uploadState.file?.name}
              progress={uploadState.uploadProgress}
              error={uploadState.error}
            />
          )}

          {uploadState.completedVersionId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Resume Analysis Results</h3>
                <Button variant="outline" onClick={resetUpload}>
                  Upload Another Resume
                </Button>
              </div>
              <ParsedResumeEntities
                versionId={uploadState.completedVersionId}
                processingStatus="completed"
                onProfileUpdated={() => {
                  toast({
                    title: "Profile Updated",
                    description: "Your profile has been updated with the resume data",
                  });
                }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
