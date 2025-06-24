
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ResumeStream {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  tags: string[];
  auto_tagged: boolean;
  created_at: string;
  updated_at: string;
  resume_versions?: ResumeVersion[];
}

export interface ResumeVersion {
  id: string;
  stream_id: string;
  version_number: number;
  file_hash: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  upload_metadata: any;
  resume_metadata: any;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface UploadResponse {
  success: boolean;
  isDuplicate: boolean;
  message: string;
  stream?: ResumeStream;
  version?: ResumeVersion;
  existingVersion?: ResumeVersion;
}

// Hook to get user's resume streams
export function useResumeStreams() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['resume-streams', user?.id],
    queryFn: async (): Promise<ResumeStream[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase.functions.invoke('resume-stream-operations', {
        body: { operation: 'get_user_resume_streams' }
      });

      if (error) {
        console.error('Error fetching resume streams:', error);
        throw error;
      }

      return (data || []) as ResumeStream[];
    },
    enabled: !!user?.id,
  });
}

// Hook to get versions for a specific stream
export function useResumeVersions(streamId?: string) {
  return useQuery({
    queryKey: ['resume-versions', streamId],
    queryFn: async (): Promise<ResumeVersion[]> => {
      if (!streamId) return [];
      
      const { data, error } = await supabase.functions.invoke('resume-stream-operations', {
        body: { operation: 'get_stream_versions', stream_id: streamId }
      });

      if (error) {
        console.error('Error fetching resume versions:', error);
        throw error;
      }

      return (data || []) as ResumeVersion[];
    },
    enabled: !!streamId,
  });
}

// Hook to upload a new resume
export function useResumeUpload() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      file,
      streamName = 'Default Resume',
      tags = []
    }: {
      file: File;
      streamName?: string;
      tags?: string[];
    }): Promise<UploadResponse> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('streamName', streamName);
      formData.append('tags', JSON.stringify(tags));

      const { data, error } = await supabase.functions.invoke('resume-upload-v2', {
        body: formData,
      });

      if (error) {
        console.error('Resume upload error:', error);
        throw error;
      }

      return data as UploadResponse;
    },
    onSuccess: (data) => {
      if (data.isDuplicate) {
        toast({
          title: "Duplicate Resume Detected",
          description: "This resume has already been uploaded to your account.",
          variant: "default",
        });
      } else {
        toast({
          title: "Resume Uploaded Successfully",
          description: `Added as version ${data.version?.version_number} to ${data.stream?.name}`,
        });
      }
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['resume-streams', user?.id] });
    },
    onError: (error) => {
      console.error('Upload mutation error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Failed to upload resume',
        variant: "destructive",
      });
    },
  });
}

// Hook to create a new resume stream
export function useCreateResumeStream() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      tags = []
    }: {
      name: string;
      description?: string;
      tags?: string[];
    }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('resume-stream-operations', {
        body: {
          operation: 'create_resume_stream',
          name,
          description,
          tags
        }
      });

      if (error) {
        console.error('Error creating resume stream:', error);
        throw error;
      }

      return data as ResumeStream;
    },
    onSuccess: () => {
      toast({
        title: "Stream Created",
        description: "New resume stream created successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['resume-streams', user?.id] });
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : 'Failed to create resume stream',
        variant: "destructive",
      });
    },
  });
}

// Hook to update a resume stream
export function useUpdateResumeStream() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      streamId,
      updates
    }: {
      streamId: string;
      updates: Partial<Pick<ResumeStream, 'name' | 'description' | 'tags'>>;
    }) => {
      const { data, error } = await supabase.functions.invoke('resume-stream-operations', {
        body: {
          operation: 'update_resume_stream',
          stream_id: streamId,
          ...updates
        }
      });

      if (error) {
        console.error('Error updating resume stream:', error);
        throw error;
      }

      return data as ResumeStream;
    },
    onSuccess: () => {
      toast({
        title: "Stream Updated",
        description: "Resume stream updated successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['resume-streams', user?.id] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : 'Failed to update resume stream',
        variant: "destructive",
      });
    },
  });
}
