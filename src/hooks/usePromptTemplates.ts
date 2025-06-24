
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  PromptTemplate, 
  JobPromptUsage, 
  CreatePromptTemplateRequest, 
  UpdatePromptTemplateRequest,
  PromptCategory 
} from '@/types/prompt-templates';

// Hook to get all prompt templates
export function usePromptTemplates() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['prompt-templates'],
    queryFn: async (): Promise<PromptTemplate[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('prompt_templates')
        .select('*')
        .order('category', { ascending: true })
        .order('version', { ascending: false });

      if (error) {
        console.error('Error fetching prompt templates:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
  });
}

// Hook to get prompt templates by category
export function usePromptTemplatesByCategory(category?: PromptCategory) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['prompt-templates', category],
    queryFn: async (): Promise<PromptTemplate[]> => {
      if (!user || !category) return [];
      
      const { data, error } = await supabase
        .from('prompt_templates')
        .select('*')
        .eq('category', category)
        .order('version', { ascending: false });

      if (error) {
        console.error('Error fetching prompt templates by category:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user && !!category,
  });
}

// Hook to get active prompt template for a category
export function useActivePromptTemplate(category?: PromptCategory) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['active-prompt-template', category],
    queryFn: async (): Promise<PromptTemplate | null> => {
      if (!user || !category) return null;
      
      const { data, error } = await supabase
        .from('prompt_templates')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching active prompt template:', error);
        throw error;
      }

      return data;
    },
    enabled: !!user && !!category,
  });
}

// Hook to create a new prompt template
export function useCreatePromptTemplate() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (request: CreatePromptTemplateRequest) => {
      if (!user) throw new Error('User not authenticated');

      // Get the next version number for this category
      const { data: existingTemplates } = await supabase
        .from('prompt_templates')
        .select('version')
        .eq('category', request.category)
        .order('version', { ascending: false })
        .limit(1);

      const nextVersion = existingTemplates && existingTemplates.length > 0 
        ? existingTemplates[0].version + 1 
        : 1;

      const { data, error } = await supabase
        .from('prompt_templates')
        .insert({
          category: request.category,
          version: nextVersion,
          content: request.content,
          description: request.description,
          metadata: request.metadata || {},
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating prompt template:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Prompt Template Created",
        description: "New prompt template version has been created successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['prompt-templates'] });
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : 'Failed to create prompt template',
        variant: "destructive",
      });
    },
  });
}

// Hook to update a prompt template
export function useUpdatePromptTemplate() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string;
      updates: UpdatePromptTemplateRequest;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('prompt_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating prompt template:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Template Updated",
        description: "Prompt template has been updated successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['prompt-templates'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : 'Failed to update prompt template',
        variant: "destructive",
      });
    },
  });
}

// Hook to get job prompt usage
export function useJobPromptUsage(jobId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['job-prompt-usage', jobId],
    queryFn: async (): Promise<JobPromptUsage[]> => {
      if (!user || !jobId) return [];
      
      const { data, error } = await supabase
        .from('job_prompt_usage')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching job prompt usage:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user && !!jobId,
  });
}

// Hook to record prompt usage
export function useRecordPromptUsage() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      jobId,
      jobType,
      promptTemplateId,
      promptCategory,
      promptVersion
    }: {
      jobId: string;
      jobType: string;
      promptTemplateId: string;
      promptCategory: string;
      promptVersion: number;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('job_prompt_usage')
        .insert({
          job_id: jobId,
          job_type: jobType,
          prompt_template_id: promptTemplateId,
          prompt_category: promptCategory,
          prompt_version: promptVersion,
        })
        .select()
        .single();

      if (error) {
        console.error('Error recording prompt usage:', error);
        throw error;
      }

      return data;
    },
  });
}
