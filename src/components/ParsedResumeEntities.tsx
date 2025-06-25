
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, CheckCircle, XCircle, Clock, Sparkles, Database } from 'lucide-react';
import { StructuredDataView } from './resume-upload/StructuredDataView';
import { EnrichedResumeView } from './resume-upload/EnrichedResumeView';

interface ParsedResumeEntitiesProps {
  versionId: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
}

export const ParsedResumeEntities: React.FC<ParsedResumeEntitiesProps> = ({
  versionId,
  processingStatus
}) => {
  const [activeTab, setActiveTab] = useState('structured');

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
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-muted-foreground">
                Please wait while we analyze your resume...
              </p>
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
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Please try uploading your resume again or contact support if the issue persists.
            </p>
            <Button variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Resume Analysis
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          {getStatusIcon()}
          {getStatusText()} • Complete analysis of your resume data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="structured" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Extracted Data
            </TabsTrigger>
            <TabsTrigger value="enriched" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Career Insights
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="structured" className="mt-6">
            <StructuredDataView versionId={versionId} />
          </TabsContent>
          
          <TabsContent value="enriched" className="mt-6">
            <EnrichedResumeView versionId={versionId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
