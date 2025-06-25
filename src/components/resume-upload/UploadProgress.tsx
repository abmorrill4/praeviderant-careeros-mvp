
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, Loader2, Upload, FileText, Zap } from 'lucide-react';

interface UploadStage {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface UploadProgressProps {
  isUploading: boolean;
  currentStage?: string;
  fileName?: string;
  progress?: number;
  error?: string;
}

const UPLOAD_STAGES: UploadStage[] = [
  {
    key: 'upload',
    label: 'Uploading File',
    description: 'Securely transferring your resume',
    icon: <Upload className="w-4 h-4" />
  },
  {
    key: 'parse',
    label: 'Extracting Data',
    description: 'AI is analyzing your resume content',
    icon: <FileText className="w-4 h-4" />
  },
  {
    key: 'normalize',
    label: 'Structuring Information',
    description: 'Organizing extracted data',
    icon: <Zap className="w-4 h-4" />
  },
  {
    key: 'complete',
    label: 'Processing Complete',
    description: 'Your resume is ready for use',
    icon: <CheckCircle className="w-4 h-4" />
  }
];

export const UploadProgress: React.FC<UploadProgressProps> = ({
  isUploading,
  currentStage = 'upload',
  fileName,
  progress = 0,
  error
}) => {
  const getCurrentStageIndex = () => {
    return UPLOAD_STAGES.findIndex(stage => stage.key === currentStage);
  };

  const getStageStatus = (stageIndex: number) => {
    const currentIndex = getCurrentStageIndex();
    
    if (error) {
      return stageIndex <= currentIndex ? 'error' : 'pending';
    }
    
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return isUploading ? 'active' : 'completed';
    return 'pending';
  };

  const getStageIcon = (stage: UploadStage, status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'active':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'active':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-muted-foreground bg-muted/20 border-muted-foreground/20';
    }
  };

  if (!isUploading && !error) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className={`w-5 h-5 ${isUploading ? 'animate-spin' : ''}`} />
          {error ? 'Processing Failed' : 'Processing Resume'}
        </CardTitle>
        {fileName && (
          <CardDescription>
            {fileName} • {error ? 'An error occurred' : 'Please wait while we process your resume'}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {progress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="space-y-3">
          {UPLOAD_STAGES.map((stage, index) => {
            const status = getStageStatus(index);
            
            return (
              <div
                key={stage.key}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${getStageColor(status)}`}
              >
                {getStageIcon(stage, status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{stage.label}</span>
                    <Badge 
                      variant={status === 'completed' ? 'default' : status === 'active' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {status === 'completed' ? 'Complete' : 
                       status === 'active' ? 'Processing' : 
                       status === 'error' ? 'Failed' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-sm opacity-80 mt-1">{stage.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Processing Error</span>
            </div>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
