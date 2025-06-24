
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Upload, Check, AlertCircle, Loader2, Plus, X, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useResumeUpload, useResumeStreams } from '@/hooks/useResumeStreams';
import { ParsedResumeEntities } from '@/components/ParsedResumeEntities';
import { useToast } from '@/hooks/use-toast';

interface UploadState {
  file: File | null;
  streamName: string;
  tags: string[];
  tagInput: string;
  uploading: boolean;
}

export const ResumeUploadV2: React.FC = () => {
  const { user } = useAuth();
  const { data: streams, isLoading: streamsLoading } = useResumeStreams();
  const uploadMutation = useResumeUpload();
  const { toast } = useToast();
  
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    streamName: 'Default Resume',
    tags: [],
    tagInput: '',
    uploading: false
  });

  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upload resumes",
        variant: "destructive",
      });
      return;
    }

    if (acceptedFiles.length === 0) {
      toast({
        title: "No File Selected",
        description: "Please select a valid file to upload",
        variant: "destructive",
      });
      return;
    }

    const file = acceptedFiles[0];
    console.log('File selected:', file.name, file.type, file.size);
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type);
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF, Word document, or text file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      console.error('File too large:', file.size);
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 50MB",
        variant: "destructive",
      });
      return;
    }

    setUploadState(prev => ({ ...prev, file }));
  }, [user, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple: false,
    disabled: uploadState.uploading
  });

  const handleAddTag = () => {
    if (uploadState.tagInput.trim() && !uploadState.tags.includes(uploadState.tagInput.trim())) {
      setUploadState(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: ''
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setUploadState(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
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
    console.log('File:', uploadState.file.name);
    console.log('Stream:', uploadState.streamName);
    console.log('Tags:', uploadState.tags);
    
    setUploadState(prev => ({ ...prev, uploading: true }));

    try {
      const result = await uploadMutation.mutateAsync({
        file: uploadState.file,
        streamName: uploadState.streamName,
        tags: uploadState.tags
      });

      console.log('Upload result:', result);

      if (result.success) {
        // Reset form on success
        setUploadState({
          file: null,
          streamName: 'Default Resume',
          tags: [],
          tagInput: '',
          uploading: false
        });
      } else {
        setUploadState(prev => ({ ...prev, uploading: false }));
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadState(prev => ({ ...prev, uploading: false }));
      
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
      uploading: false
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
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Upload Resume (Version 2.0)
          </CardTitle>
          <CardDescription>
            Upload your resume with advanced versioning, duplicate detection, and AI-powered data extraction.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!uploadState.file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">
                {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
              </h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop your resume file here, or click to browse
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                <Badge variant="secondary">PDF</Badge>
                <Badge variant="secondary">DOC</Badge>
                <Badge variant="secondary">DOCX</Badge>
                <Badge variant="secondary">TXT</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Maximum file size: 50MB
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <FileText className="w-8 h-8 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{uploadState.file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadState.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetUpload}
                  disabled={uploadState.uploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="streamName">Resume Stream Name</Label>
                  <Input
                    id="streamName"
                    value={uploadState.streamName}
                    onChange={(e) => setUploadState(prev => ({ ...prev, streamName: e.target.value }))}
                    placeholder="e.g., Software Engineer Resume"
                    disabled={uploadState.uploading}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Group related resume versions together
                  </p>
                </div>

                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      id="tags"
                      value={uploadState.tagInput}
                      onChange={(e) => setUploadState(prev => ({ ...prev, tagInput: e.target.value }))}
                      placeholder="Add a tag"
                      disabled={uploadState.uploading}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddTag}
                      disabled={!uploadState.tagInput.trim() || uploadState.uploading}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {uploadState.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {uploadState.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 hover:bg-transparent"
                            onClick={() => handleRemoveTag(tag)}
                            disabled={uploadState.uploading}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={uploadState.uploading}
                  className="flex-1"
                >
                  {uploadState.uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Resume
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={resetUpload}
                  disabled={uploadState.uploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Display existing streams */}
      {streams && streams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Resume Streams</CardTitle>
            <CardDescription>
              Manage your organized resume collections and view extracted data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {streams.map((stream) => (
                <div key={stream.id}>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{stream.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {stream.resume_versions?.length || 0} version(s)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {stream.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Show versions with parsed data */}
                  {stream.resume_versions && stream.resume_versions.length > 0 && (
                    <div className="ml-4 mt-2 space-y-2">
                      {stream.resume_versions.map((version) => (
                        <div key={version.id} className="border-l-2 border-muted pl-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                Version {version.version_number} - {version.file_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Status: {version.processing_status}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => 
                                setSelectedVersionId(
                                  selectedVersionId === version.id ? null : version.id
                                )
                              }
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          {selectedVersionId === version.id && (
                            <div className="mt-4">
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
