
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Upload, Check, AlertCircle, Loader2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useResumeDataProcessor } from '@/hooks/useResumeDataProcessor';

interface UploadStatus {
  file: File | null;
  uploadProgress: number;
  parseProgress: number;
  status: 'idle' | 'uploading' | 'parsing' | 'completed' | 'error';
  error?: string;
  uploadId?: string;
}

export const ResumeUpload: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { processResumeData, isProcessing } = useResumeDataProcessor();
  
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    file: null,
    uploadProgress: 0,
    parseProgress: 0,
    status: 'idle'
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload your resume.",
        variant: "destructive",
      });
      return;
    }

    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, Word document, or text file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 50MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadStatus({
      file,
      uploadProgress: 0,
      parseProgress: 0,
      status: 'uploading'
    });

    try {
      // Upload file to Supabase Storage
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setUploadStatus(prev => ({ ...prev, uploadProgress: 100 }));

      // Create upload record
      const { data: uploadRecord, error: recordError } = await supabase
        .from('resume_uploads')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
          upload_status: 'completed',
          parsing_status: 'pending'
        })
        .select()
        .single();

      if (recordError) {
        throw new Error(`Failed to create upload record: ${recordError.message}`);
      }

      setUploadStatus(prev => ({ 
        ...prev, 
        status: 'parsing',
        uploadId: uploadRecord.id,
        parseProgress: 10
      }));

      // Parse the resume
      const { data: parseData, error: parseError } = await supabase.functions.invoke('parse-resume', {
        body: { uploadId: uploadRecord.id }
      });

      if (parseError) {
        throw new Error(`Parsing failed: ${parseError.message}`);
      }

      if (!parseData.success) {
        throw new Error(parseData.error || 'Parsing failed');
      }

      setUploadStatus(prev => ({ ...prev, parseProgress: 80 }));

      // Process the structured data into user profile
      if (parseData.structuredData) {
        await processResumeData(parseData.structuredData);
      }

      setUploadStatus(prev => ({ 
        ...prev, 
        status: 'completed',
        parseProgress: 100
      }));

      toast({
        title: "Resume uploaded successfully",
        description: "Your resume has been parsed and data extracted to your profile.",
      });

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(prev => ({ 
        ...prev, 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
      
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Failed to process resume',
        variant: "destructive",
      });
    }
  }, [user, toast, processResumeData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple: false,
    disabled: uploadStatus.status === 'uploading' || uploadStatus.status === 'parsing' || isProcessing
  });

  const resetUpload = () => {
    setUploadStatus({
      file: null,
      uploadProgress: 0,
      parseProgress: 0,
      status: 'idle'
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Upload Resume
          </CardTitle>
          <CardDescription>
            Upload your resume in PDF, Word, or text format for automatic analysis and data extraction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploadStatus.status === 'idle' && (
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
          )}

          {(uploadStatus.status === 'uploading' || uploadStatus.status === 'parsing') && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{uploadStatus.file?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {uploadStatus.status === 'uploading' ? 'Uploading...' : 'Analyzing resume...'}
                  </p>
                </div>
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Upload</span>
                  <span>{uploadStatus.uploadProgress}%</span>
                </div>
                <Progress value={uploadStatus.uploadProgress} />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Analysis</span>
                  <span>{uploadStatus.parseProgress}%</span>
                </div>
                <Progress value={uploadStatus.parseProgress} />
              </div>
            </div>
          )}

          {uploadStatus.status === 'completed' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Check className="w-8 h-8 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Resume processed successfully
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Data has been extracted and added to your profile for review
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Review extracted data in your profile
                  </span>
                </div>
                <Button onClick={resetUpload} variant="outline" size="sm">
                  Upload Another
                </Button>
              </div>
            </div>
          )}

          {uploadStatus.status === 'error' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-800 dark:text-red-200">
                    Upload failed
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                    {uploadStatus.error}
                  </p>
                </div>
              </div>
              
              <Button onClick={resetUpload} variant="outline" className="w-full">
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
