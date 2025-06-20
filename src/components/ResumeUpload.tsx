
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ResumeUpload {
  id: string;
  file_name: string;
  file_size: number;
  upload_status: string;
  parsing_status: string;
  structured_data?: any;
  error_message?: string;
  created_at: string;
}

export const ResumeUpload = () => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [recentUploads, setRecentUploads] = useState<ResumeUpload[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a PDF or Word document (.pdf, .docx, .doc)';
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
      return 'File size must be less than 10MB';
    }
    
    return null;
  };

  const uploadFile = async (file: File) => {
    if (!user) return;

    const validation = validateFile(file);
    if (validation) {
      toast.error(validation);
      return;
    }

    setUploading(true);
    
    try {
      // Create file path with user ID folder
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Record upload in database
      const { data: recordData, error: recordError } = await supabase
        .from('resume_uploads')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type
        })
        .select()
        .single();

      if (recordError) throw recordError;

      toast.success('Resume uploaded successfully!');
      
      // Start parsing process
      await parseResume(recordData.id);
      
      // Refresh uploads list
      await fetchRecentUploads();

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload resume: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const parseResume = async (uploadId: string) => {
    setParsing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('parse-resume', {
        body: { uploadId }
      });

      if (error) throw error;
      
      toast.success('Resume parsed successfully!');
      await fetchRecentUploads();
      
    } catch (error: any) {
      console.error('Parsing error:', error);
      toast.error('Failed to parse resume: ' + error.message);
    } finally {
      setParsing(false);
    }
  };

  const fetchRecentUploads = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('resume_uploads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentUploads(data || []);
    } catch (error: any) {
      console.error('Error fetching uploads:', error);
    }
  };

  React.useEffect(() => {
    if (user) {
      fetchRecentUploads();
    }
  }, [user]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const getStatusIcon = (uploadStatus: string, parsingStatus: string) => {
    if (uploadStatus === 'failed' || parsingStatus === 'failed') {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (parsingStatus === 'processing') {
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    if (parsingStatus === 'completed') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resume Upload & Analysis</CardTitle>
          <CardDescription>
            Upload your resume (PDF or Word document) to extract and analyze your career data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleChange}
              disabled={uploading || parsing}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="space-y-4">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium">
                  {uploading ? 'Uploading...' : 'Drop your resume here or click to browse'}
                </p>
                <p className="text-sm text-gray-500">
                  Supports PDF and Word documents (max 10MB)
                </p>
              </div>
              {(uploading || parsing) && (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">
                    {uploading ? 'Uploading file...' : 'Parsing resume...'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>What happens next:</strong> After uploading, we'll automatically parse your resume 
              to extract work experience, education, skills, and other career data to enhance your CareerOS profile.
            </AlertDescription>
          </Alert>

          {/* Recent Uploads */}
          {recentUploads.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Recent Uploads</h3>
              <div className="space-y-2">
                {recentUploads.map((upload) => (
                  <div
                    key={upload.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(upload.upload_status, upload.parsing_status)}
                      <div>
                        <p className="font-medium">{upload.file_name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(upload.file_size)} • {' '}
                          {new Date(upload.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium capitalize">
                        {upload.parsing_status === 'completed' ? 'Parsed' : upload.parsing_status}
                      </p>
                      {upload.error_message && (
                        <p className="text-xs text-red-500">{upload.error_message}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
