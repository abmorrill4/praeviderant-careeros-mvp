
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  CheckCircle, 
  FileText, 
  Brain, 
  Sparkles,
  Clock,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { useEnrichmentStatus } from '@/hooks/useEnrichmentStatus';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const ProcessingPage: React.FC = () => {
  const { enrichment_id } = useParams<{ enrichment_id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: processingStatus, isLoading: statusLoading, error } = useEnrichmentStatus(enrichment_id);

  // Handle missing enrichment_id or user
  if (!enrichment_id) {
    navigate('/profile-management');
    return null;
  }

  if (!user) {
    navigate('/');
    return null;
  }

  // Handle API errors
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200 bg-red-50/50">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-700">Processing Error</CardTitle>
            <CardDescription>
              We encountered an error while checking the status of your resume analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Error: {error.message || 'Unable to load processing status'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => window.location.reload()} variant="outline">
                Retry
              </Button>
              <Button onClick={() => navigate('/profile-management')}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle loading state
  if (statusLoading || !processingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-muted-foreground">Loading processing status...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if processing failed
  const hasProcessingFailed = processingStatus.processingStage === 'failed';

  // Strict completion check - ALL conditions must be true
  const isDefinitivelyComplete = processingStatus.processingProgress === 100 && 
    processingStatus.isComplete === true && 
    processingStatus.processingStatus === 'completed' &&
    processingStatus.hasEntities === true &&
    processingStatus.hasEnrichment === true &&
    processingStatus.hasNarratives === true;

  const getProcessingMessage = () => {
    const progress = processingStatus.processingProgress || 0;
    switch (processingStatus.currentStage) {
      case 'upload':
        return 'File uploaded successfully, preparing for analysis...';
      case 'parse':
        return 'Extracting resume data and structure...';
      case 'enrich':
        return 'Analyzing career patterns and generating insights...';
      case 'complete':
        return 'Analysis complete! Your career insights are ready.';
      default:
        return `Processing your resume (${progress}%)...`;
    }
  };

  const getStageIcon = (stage: string, isActive: boolean, isComplete: boolean, hasFailed: boolean) => {
    if (hasFailed) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (isComplete) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (isActive) return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const stages = [
    {
      key: 'upload',
      label: 'Upload Complete',
      description: 'Resume file uploaded successfully',
      icon: FileText,
      isActive: processingStatus.currentStage === 'upload',
      isComplete: processingStatus.processingProgress >= 25
    },
    {
      key: 'parse',
      label: 'Data Extraction',
      description: 'Parsing resume content and structure',
      icon: FileText,
      isActive: processingStatus.currentStage === 'parse',
      isComplete: processingStatus.hasEntities
    },
    {
      key: 'enrich',
      label: 'AI Analysis',
      description: 'Analyzing career patterns and strengths',
      icon: Brain,
      isActive: processingStatus.currentStage === 'enrich',
      isComplete: processingStatus.hasEnrichment
    },
    {
      key: 'complete',
      label: 'Insights Generated',
      description: 'Creating personalized career narratives',
      icon: Sparkles,
      isActive: processingStatus.currentStage === 'complete',
      isComplete: processingStatus.hasNarratives && isDefinitivelyComplete
    }
  ];

  const handleViewResults = () => {
    navigate(`/profile-management?tab=resume-analysis&version=${enrichment_id}`);
  };

  const handleRetryUpload = () => {
    navigate('/profile-management');
  };

  // Failed state
  if (hasProcessingFailed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full border-red-200 bg-red-50/50">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-700">Processing Failed</CardTitle>
            <CardDescription>
              We encountered an error while analyzing your resume.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Progress reached: {processingStatus.processingProgress || 0}%
              </p>
              <p className="text-sm text-muted-foreground">
                Failed at stage: {processingStatus.currentStage}
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Button onClick={handleRetryUpload} variant="outline">
                Try Another Resume
              </Button>
              <Button onClick={() => navigate('/profile-management')}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Completed state
  if (isDefinitivelyComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full border-green-200 bg-green-50/50">
          <CardHeader className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-700">Analysis Complete!</CardTitle>
            <CardDescription>
              Your resume has been successfully analyzed and enriched with AI-powered insights.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Progress value={100} className="h-2" />
              <div className="text-center text-sm text-muted-foreground">
                Processing complete (100%)
              </div>
            </div>
            
            <div className="text-center py-4 space-y-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                All insights generated successfully
              </Badge>
              <p className="text-sm text-muted-foreground">
                Career analysis, skill mapping, and personalized narratives are ready for review.
              </p>
            </div>

            <div className="flex justify-center">
              <Button onClick={handleViewResults} size="lg" className="bg-green-600 hover:bg-green-700">
                <ArrowRight className="w-4 h-4 mr-2" />
                View Your Results
              </Button>
            </div>
            
            <div className="text-center">
              <Button variant="ghost" size="sm" onClick={handleRetryUpload}>
                Upload Another Resume
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Processing state
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-blue-200 bg-blue-50/50">
        <CardHeader className="text-center">
          <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <CardTitle className="text-blue-700">AI Analysis in Progress</CardTitle>
          <CardDescription>
            Please wait while we analyze your resume and generate personalized insights.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">{processingStatus.processingProgress || 0}%</span>
            </div>
            <Progress value={processingStatus.processingProgress || 0} className="h-2" />
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
          <div className="space-y-4">
            {stages.map((stage, index) => (
              <div key={stage.key} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getStageIcon(stage.key, stage.isActive, stage.isComplete, hasProcessingFailed)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm ${
                    stage.isComplete ? 'text-green-700' : 
                    stage.isActive ? 'text-blue-700' : 
                    'text-gray-500'
                  }`}>
                    {stage.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stage.description}
                  </div>
                  {stage.isActive && (
                    <div className="flex items-center gap-1 mt-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-blue-600">Processing...</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Status Footer */}
          <div className="pt-4 border-t border-blue-200">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Powered by OpenAI GPT-4o</span>
              <span>Typically completes in 30-60 seconds</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProcessingPage;
