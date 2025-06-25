
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Folder, ChevronDown, ChevronRight, Eye, FileText, Calendar, Hash } from 'lucide-react';
import { ParsedResumeEntities } from '@/components/ParsedResumeEntities';
import { ResumeStream, ResumeVersion } from '@/hooks/useResumeStreams';

interface ResumeCollectionViewProps {
  streams: ResumeStream[];
  onStreamSelect?: (streamId: string) => void;
  selectedStreamId?: string;
}

export const ResumeCollectionView: React.FC<ResumeCollectionViewProps> = ({
  streams,
  onStreamSelect,
  selectedStreamId
}) => {
  const [expandedStreams, setExpandedStreams] = useState<Set<string>>(new Set());
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  const toggleStreamExpansion = (streamId: string) => {
    const newExpanded = new Set(expandedStreams);
    if (newExpanded.has(streamId)) {
      newExpanded.delete(streamId);
    } else {
      newExpanded.add(streamId);
    }
    setExpandedStreams(newExpanded);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  if (!streams || streams.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            Resume Collections
          </CardTitle>
          <CardDescription>
            Your uploaded resume collections will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No resume collections yet</p>
            <p className="text-sm">Upload your first resume to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Folder className="w-5 h-5" />
          Resume Collections
        </CardTitle>
        <CardDescription>
          Manage your organized resume collections and view extracted data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {streams.map((stream) => {
            const isExpanded = expandedStreams.has(stream.id);
            const isSelected = selectedStreamId === stream.id;
            
            return (
              <div key={stream.id} className={`border rounded-lg ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <div 
                      className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleStreamExpansion(stream.id)}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        <Folder className="w-5 h-5 text-primary" />
                        <div>
                          <h4 className="font-medium">{stream.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {stream.resume_versions?.length || 0} version(s)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {stream.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Hash className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    {stream.resume_versions && stream.resume_versions.length > 0 && (
                      <div className="border-t bg-muted/10">
                        {stream.resume_versions.map((version) => (
                          <div key={version.id} className="p-4 border-b last:border-b-0">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-sm">
                                    Version {version.version_number} • {version.file_name}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(version.created_at).toLocaleDateString()}
                                    </span>
                                    <span>{formatFileSize(version.file_size)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getStatusColor(version.processing_status)}`}
                                >
                                  {version.processing_status}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => 
                                    setSelectedVersionId(
                                      selectedVersionId === version.id ? null : version.id
                                    )
                                  }
                                  className="h-7 w-7 p-0"
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            
                            {selectedVersionId === version.id && (
                              <div className="mt-4 border-t pt-4">
                                <ParsedResumeEntities 
                                  versionId={version.id}
                                  processingStatus={version.processing_status}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
