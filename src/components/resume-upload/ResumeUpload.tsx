
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileText, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ResumeDropzone } from './ResumeDropzone';
import { UploadProgress } from './UploadProgress';
import { ParsedResumeEntities } from '../ParsedResumeEntities';
import { InsightCard } from './InsightCard';
import { useEnrichmentStatus } from '@/hooks/useEnrichmentStatus';

interface UploadState {
  file: File | null;
  isUploading: boolean;
  uploadProgress: number;
  currentStage: string;
  error: string | null;
  completedVersionId: string | null;
}

export const ResumeUpload: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    isUploading: false,
    uploadProgress: 0,
    currentStage: 'upload',
    error: null,
    completedVersionId: null
  });

  // Get enrichment status for the completed version
  const { data: enrichmentStatus } = useEnrichmentStatus(uploadState.completedVersionId || undefined);

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
      // Simulate progress during upload
      setUploadState(prev => ({ ...prev, uploadProgress: 30 }));

      const formData = new FormData();
      formData.append('file', uploadState.file);
      formData.append('streamName', 'Resume Upload'); // Use a simple default name

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
            ? "File already exists in your collection. AI analysis in progress..." 
            : "Resume uploaded successfully. AI analysis in progress...",
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

  // Determine if we should show the processing state or the results
  const showProcessing = uploadState.completedVersionId && (!enrichmentStatus || !enrichmentStatus.isComplete);
  const showResults = uploadState.completedVersionId && enrichmentStatus?.isComplete;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Upload Resume
          </CardTitle>
          <CardDescription>
            Upload your resume to automatically extract and organize your career data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
        </CardContent>
      </Card>

      {/* Show AI Processing Progress - This appears immediately after upload */}
      {showProcessing && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Processing Your Resume</h3>
            <Button variant="outline" onClick={resetUpload}>
              Upload Another Resume
            </Button>
          </div>
          
          {/* AI Career Insights - Shows progress until complete */}
          <InsightCard versionId={uploadState.completedVersionId} />
        </div>
      )}

      {/* Show Complete Results - Only appears when AI enrichment is fully complete */}
      {showResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Resume Analysis Complete</h3>
            <Button variant="outline" onClick={resetUpload}>
              Upload Another Resume
            </Button>
          </div>
          
          {/* AI Career Insights - Now shows completed insights */}
          <InsightCard versionId={uploadState.completedVersionId} />
          
          {/* Resume Data Analysis - Only shown when everything is complete */}
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
  );
};
