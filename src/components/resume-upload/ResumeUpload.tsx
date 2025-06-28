
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileText, Upload, Loader2, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ResumeDropzone } from './ResumeDropzone';
import { UploadProgress } from './UploadProgress';
import { ParsedResumeEntities } from '../ParsedResumeEntities';
import { InsightCard } from './InsightCard';
import { useEnrichmentStatus } from '@/hooks/useEnrichmentStatus';
import { Progress } from '@/components/ui/progress';

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

  // Get comprehensive processing status for the completed version
  const { data: processingStatus, isLoading: statusLoading } = useEnrichmentStatus(uploadState.completedVersionId || undefined);

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

    console.log('Starting enhanced upload process...');
    
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

  // ULTRA CONSERVATIVE: Only show results when everything is definitively complete
  const hasCompletedVersionId = !!uploadState.completedVersionId;
  const hasProcessingFailed = processingStatus?.processingStage === 'failed';
  
  // Much stricter completion check - ALL conditions must be true
  const isDefinitivelyComplete = processingStatus && 
    processingStatus.processingProgress === 100 && 
    processingStatus.isComplete === true && 
    processingStatus.processingStatus === 'completed' &&
    processingStatus.hasEntities === true &&
    processingStatus.hasEnrichment === true &&
    processingStatus.hasNarratives === true;
  
  const showUploadingState = uploadState.isUploading || uploadState.error;
  const showWaitingForProcessing = hasCompletedVersionId && !isDefinitivelyComplete && !hasProcessingFailed;
  const showProcessingResults = hasCompletedVersionId && isDefinitivelyComplete && !statusLoading;
  const showProcessingError = hasCompletedVersionId && hasProcessingFailed;

  console.log('ResumeUpload: ULTRA CONSERVATIVE Display Logic', {
    hasCompletedVersionId,
    statusLoading,
    processingStatus: processingStatus ? {
      progress: processingStatus.processingProgress,
      isComplete: processingStatus.isComplete,
      processingStatus: processingStatus.processingStatus,
      hasEntities: processingStatus.hasEntities,
      hasEnrichment: processingStatus.hasEnrichment,
      hasNarratives: processingStatus.hasNarratives,
      stage: processingStatus.currentStage
    } : null,
    isDefinitivelyComplete,
    hasProcessingFailed,
    showUploadingState,
    showWaitingForProcessing,
    showProcessingResults,
    showProcessingError,
    timestamp: new Date().toISOString()
  });

  const getProcessingMessage = () => {
    if (statusLoading) return 'Loading processing status...';
    if (!processingStatus) return 'Initializing analysis...';
    
    const progress = processingStatus.processingProgress || 0;
    switch (processingStatus.currentStage) {
      case 'upload':
        return 'File uploaded, preparing for analysis...';
      case 'parse':
        return 'Extracting resume data and structure...';
      case 'enrich':
        return 'Analyzing career patterns and generating insights...';
      case 'complete':
        return 'Analysis complete!';
      default:
        return `Processing (${progress}%)...`;
    }
  };

  const getStageIcon = (stage: string, isActive: boolean, isComplete: boolean, hasFailed: boolean) => {
    if (hasFailed) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (isComplete) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (isActive) return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

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

          {showUploadingState && (
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

      {/* Enhanced AI Processing Status Card - STAY HERE UNTIL 100% COMPLETE */}
      {showWaitingForProcessing && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              AI Analysis in Progress
            </CardTitle>
            <CardDescription>
              Your resume has been uploaded successfully. AI analysis is running...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing Progress</span>
                <span>{processingStatus?.processingProgress || 0}%</span>
              </div>
              <Progress value={processingStatus?.processingProgress || 0} className="w-full" />
            </div>

            {/* Current Status Message */}
            <div className="flex items-center justify-center py-4">
              <div className="text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                <p className="text-sm text-muted-foreground">
                  {getProcessingMessage()}
                </p>
              </div>
            </div>

            {/* Processing Stages */}
            <div className="grid grid-cols-4 gap-4 pt-4 border-t">
              {['upload', 'parse', 'enrich', 'complete'].map((stage, index) => {
                const isActive = processingStatus?.currentStage === stage;
                const isComplete = processingStatus && (
                  (stage === 'upload' && processingStatus.processingProgress >= 25) ||
                  (stage === 'parse' && processingStatus.processingProgress >= 50) ||
                  (stage === 'enrich' && processingStatus.processingProgress >= 75) ||
                  (stage === 'complete' && processingStatus.processingProgress >= 100)
                );
                const hasFailed = processingStatus?.processingStage === 'failed';
                
                return (
                  <div key={stage} className="flex flex-col items-center space-y-1">
                    {getStageIcon(stage, isActive, isComplete, hasFailed)}
                    <span className="text-xs text-center capitalize">{stage}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={resetUpload}>
                Upload Another Resume
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Error State */}
      {showProcessingError && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              Processing Failed
            </CardTitle>
            <CardDescription>
              We encountered an error while analyzing your resume.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Progress reached: {processingStatus?.processingProgress || 0}%
              </p>
              <p className="text-sm text-muted-foreground">
                Failed at stage: {processingStatus?.currentStage}
              </p>
            </div>
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" onClick={resetUpload}>
                Try Another Resume
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results - ONLY show when EVERYTHING is definitively complete */}
      {showProcessingResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Resume Analysis Complete
            </h3>
            <Button variant="outline" onClick={resetUpload}>
              Upload Another Resume
            </Button>
          </div>
          
          <div className="p-3 bg-green-100 rounded-lg text-sm text-green-800 border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <strong>Analysis Complete:</strong> All processing stages finished successfully at {processingStatus?.processingProgress}% completion.
            </div>
          </div>
          
          {/* AI Career Insights */}
          <InsightCard versionId={uploadState.completedVersionId} />
          
          {/* Resume Data Analysis */}
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
