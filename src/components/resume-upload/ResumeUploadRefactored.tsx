
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileText, Upload, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useResumeUpload, useResumeStreams } from '@/hooks/useResumeStreams';
import { useToast } from '@/hooks/use-toast';
import { ResumeDropzone } from './ResumeDropzone';
import { StreamConfiguration } from './StreamConfiguration';
import { UploadProgress } from './UploadProgress';
import { ResumeCollectionView } from './ResumeCollectionView';
import { ParsedResumeEntities } from '../ParsedResumeEntities';

interface UploadState {
  file: File | null;
  streamName: string;
  tags: string[];
  tagInput: string;
  isUploading: boolean;
  uploadProgress: number;
  currentStage: string;
  error: string | null;
  completedVersionId: string | null;
  uploadResult: any | null;
}

export const ResumeUploadRefactored: React.FC = () => {
  const { user } = useAuth();
  const { data: streams, isLoading: streamsLoading } = useResumeStreams();
  const uploadMutation = useResumeUpload();
  const { toast } = useToast();
  
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    streamName: 'Default Resume',
    tags: [],
    tagInput: '',
    isUploading: false,
    uploadProgress: 0,
    currentStage: 'upload',
    error: null,
    completedVersionId: null,
    uploadResult: null
  });

  const handleFileSelect = (file: File) => {
    setUploadState(prev => ({ 
      ...prev, 
      file, 
      error: null,
      completedVersionId: null,
      uploadResult: null
    }));
  };

  const handleClearFile = () => {
    setUploadState(prev => ({ 
      ...prev, 
      file: null, 
      error: null,
      completedVersionId: null,
      uploadResult: null
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

    console.log('Starting upload process...');
    
    setUploadState(prev => ({ 
      ...prev, 
      isUploading: true,
      uploadProgress: 10,
      currentStage: 'upload',
      error: null,
      completedVersionId: null,
      uploadResult: null
    }));

    try {
      // Simulate progress during upload
      setUploadState(prev => ({ ...prev, uploadProgress: 30 }));

      const result = await uploadMutation.mutateAsync({
        file: uploadState.file,
        streamName: uploadState.streamName,
        tags: uploadState.tags
      });

      console.log('Upload result:', result);

      if (result.success) {
        setUploadState(prev => ({ 
          ...prev,
          uploadProgress: 100,
          currentStage: 'complete',
          isUploading: false,
          completedVersionId: result.version || null,
          uploadResult: result
        }));

        toast({
          title: "Upload Successful",
          description: result.isDuplicate 
            ? "File already exists in your collection" 
            : "Resume uploaded and processing started",
        });
      } else {
        throw new Error(result.message || 'Upload failed');
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
      streamName: 'Default Resume',
      tags: [],
      tagInput: '',
      isUploading: false,
      uploadProgress: 0,
      currentStage: 'upload',
      error: null,
      completedVersionId: null,
      uploadResult: null
    });
  };

  if (streamsLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Resume Upload & Analysis
          </CardTitle>
          <CardDescription>
            Upload your resume for AI-powered data extraction and organization. Create collections to manage different versions.
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
              
              <StreamConfiguration
                streamName={uploadState.streamName}
                onStreamNameChange={(name) => setUploadState(prev => ({ ...prev, streamName: name }))}
                tags={uploadState.tags}
                onTagsChange={(tags) => setUploadState(prev => ({ ...prev, tags }))}
                tagInput={uploadState.tagInput}
                onTagInputChange={(input) => setUploadState(prev => ({ ...prev, tagInput: input }))}
                disabled={uploadState.isUploading}
              />

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

      <ResumeCollectionView streams={streams || []} />
    </div>
  );
};
