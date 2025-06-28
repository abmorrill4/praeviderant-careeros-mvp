
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface ResumeUploadModalProps {
  children?: React.ReactNode;
}

interface UploadState {
  file: File | null;
  isUploading: boolean;
  uploadProgress: number;
  currentStage: string;
  error: string | null;
}

export const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({ children }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    isUploading: false,
    uploadProgress: 0,
    currentStage: 'upload',
    error: null
  });

  const handleFileSelect = (file: File) => {
    setUploadState(prev => ({ 
      ...prev, 
      file, 
      error: null
    }));
  };

  const handleClearFile = () => {
    setUploadState(prev => ({ 
      ...prev, 
      file: null, 
      error: null
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

    console.log('Starting modal upload and redirecting to processing page...');
    
    setUploadState(prev => ({ 
      ...prev, 
      isUploading: true,
      uploadProgress: 10,
      currentStage: 'upload',
      error: null
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

      console.log('Modal upload result:', data);

      if (data.success) {
        setUploadState(prev => ({ 
          ...prev,
          uploadProgress: 100,
          currentStage: 'complete',
          isUploading: false
        }));

        toast({
          title: "Upload Successful",
          description: data.isDuplicate 
            ? "File already exists in your collection. Redirecting to processing..." 
            : "Resume uploaded successfully. Redirecting to processing...",
        });

        // Close modal and redirect to processing page
        setOpen(false);
        
        if (data.versionId) {
          setTimeout(() => {
            navigate(`/processing/${data.versionId}`);
          }, 500); // Small delay to allow modal to close
        } else {
          console.error('No versionId returned from upload');
          throw new Error('Upload completed but no processing ID was returned');
        }
      } else {
        throw new Error(data.message || 'Upload failed');
      }

    } catch (error) {
      console.error('Modal upload error:', error);
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
      error: null
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

          {uploadState.file && (
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
