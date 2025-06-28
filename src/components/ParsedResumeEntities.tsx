
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Loader2, CheckCircle, XCircle, Clock, RefreshCw, GitMerge, Eye, Sparkles, BarChart3 } from 'lucide-react';
import { StructuredDataView } from './resume-upload/StructuredDataView';
import { MergeDecisionView } from './resume-upload/MergeDecisionView';
import { PreservedContextMerge } from './resume-upload/PreservedContextMerge';

interface ParsedResumeEntitiesProps {
  versionId: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  onProfileUpdated?: () => void;
}

export const ParsedResumeEntities: React.FC<ParsedResumeEntitiesProps> = ({
  versionId,
  processingStatus,
  onProfileUpdated
}) => {
  const [forceRefresh, setForceRefresh] = useState(0);

  const getStatusIcon = () => {
    switch (processingStatus) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (processingStatus) {
      case 'pending':
        return 'Processing queued';
      case 'processing':
        return 'Extracting data...';
      case 'completed':
        return 'Processing complete';
      case 'failed':
        return 'Processing failed';
      default:
        return 'Unknown status';
    }
  };

  const handleRefresh = () => {
    setForceRefresh(prev => prev + 1);
  };

  if (processingStatus === 'pending' || processingStatus === 'processing') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Resume Analysis
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            {getStatusIcon()}
            {getStatusText()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
              <p className="text-muted-foreground">
                Please wait while we analyze your resume...
              </p>
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Check Status
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (processingStatus === 'failed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Processing Failed
          </CardTitle>
          <CardDescription>
            We encountered an error while processing your resume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground mb-4">
              Please try uploading your resume again or contact support if the issue persists.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={handleRefresh}>
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" key={forceRefresh}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Resume Data Analysis
          </CardTitle>
          <CardDescription>
            Comprehensive review and organization of your extracted resume data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="structured" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="structured" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Review & Organize
              </TabsTrigger>
              <TabsTrigger value="merge" className="flex items-center gap-2">
                <GitMerge className="w-4 h-4" />
                Quick Merge
              </TabsTrigger>
              <TabsTrigger value="context" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Context Preserve
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="structured" className="mt-6">
              <StructuredDataView versionId={versionId} onProfileUpdated={onProfileUpdated} />
            </TabsContent>
            
            <TabsContent value="merge" className="mt-6">
              <MergeDecisionView versionId={versionId} onProfileUpdated={onProfileUpdated} />
            </TabsContent>
            
            <TabsContent value="context" className="mt-6">
              <PreservedContextMerge versionId={versionId} onProfileUpdated={onProfileUpdated} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
