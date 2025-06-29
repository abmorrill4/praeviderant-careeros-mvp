
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EnhancedErrorLog {
  id: string;
  stage: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  metadata: any;
  created_at: string;
  version_id?: string;
  error_category?: string;
  resolution_status?: 'open' | 'investigating' | 'resolved';
}

export function useEnhancedErrorLogging(versionId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get enhanced error logs with categorization
  const { data: errorLogs, isLoading, refetch } = useQuery({
    queryKey: ['enhanced-error-logs', versionId, user?.id],
    queryFn: async (): Promise<EnhancedErrorLog[]> => {
      if (!user) return [];

      console.log('Fetching enhanced error logs...');
      
      let query = supabase
        .from('job_logs')
        .select('*')
        .in('level', ['error', 'warn'])
        .order('created_at', { ascending: false })
        .limit(100);

      const { data: logs, error } = await query;

      if (error) {
        console.error('Error fetching enhanced logs:', error);
        throw error;
      }

      // Enhance logs with categorization and analysis
      const enhancedLogs: EnhancedErrorLog[] = (logs || []).map(log => {
        const errorCategory = categorizeError(log.message);
        const resolutionStatus = determineResolutionStatus(log);

        return {
          ...log,
          level: log.level as 'error' | 'warn' | 'info' | 'debug', // Type assertion for compatibility
          error_category: errorCategory,
          resolution_status: resolutionStatus,
          version_id: typeof log.metadata === 'object' && log.metadata && 'version_id' in log.metadata 
            ? String(log.metadata.version_id) 
            : undefined
        };
      });

      console.log(`Enhanced ${enhancedLogs.length} error logs with categorization`);
      return enhancedLogs;
    },
    enabled: !!user,
    refetchInterval: 30000,
    staleTime: 1000 * 30, // Consider data stale after 30 seconds
  });

  // Log enhanced error with automatic categorization
  const logEnhancedError = useMutation({
    mutationFn: async ({ 
      stage, 
      level, 
      message, 
      metadata = {}, 
      versionId: logVersionId 
    }: {
      stage: string;
      level: 'error' | 'warn' | 'info' | 'debug';
      message: string;
      metadata?: any;
      versionId?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Create a temporary job for logging if none exists
      const { data: jobData } = await supabase
        .from('enrichment_jobs')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let jobId = jobData?.id;
      
      if (!jobId) {
        const { data: newJob } = await supabase
          .from('enrichment_jobs')
          .insert({
            user_id: user.id,
            resume_version_id: logVersionId || versionId,
            job_type: 'debug_logging',
            status: 'completed'
          })
          .select()
          .single();
        
        jobId = newJob?.id;
      }

      const enhancedMetadata = {
        ...metadata,
        version_id: logVersionId || versionId,
        user_id: user.id,
        timestamp: new Date().toISOString(),
        error_category: categorizeError(message),
        browser_info: {
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      };

      const { data, error } = await supabase
        .from('job_logs')
        .insert({
          job_id: jobId,
          stage,
          level,
          message,
          metadata: enhancedMetadata
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-error-logs'] });
    },
    onError: (error) => {
      toast({
        title: "Logging failed",
        description: "Unable to log error for monitoring",
        variant: "destructive",
      });
    },
  });

  // Analyze error patterns
  const analyzeErrorPatterns = () => {
    if (!errorLogs) return null;

    const patterns = {
      schemaErrors: errorLogs.filter(log => log.error_category === 'schema').length,
      apiErrors: errorLogs.filter(log => log.error_category === 'api').length,
      processingErrors: errorLogs.filter(log => log.error_category === 'processing').length,
      unknownErrors: errorLogs.filter(log => log.error_category === 'unknown').length,
      totalErrors: errorLogs.filter(log => log.level === 'error').length,
      totalWarnings: errorLogs.filter(log => log.level === 'warn').length,
      recentErrors: errorLogs.filter(log => {
        const logTime = new Date(log.created_at);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return logTime > oneHourAgo;
      }).length
    };

    return patterns;
  };

  return {
    errorLogs,
    isLoading,
    refetch,
    logEnhancedError,
    analyzeErrorPatterns,
    patterns: analyzeErrorPatterns()
  };
}

// Helper function to categorize errors
function categorizeError(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('table') || lowerMessage.includes('column') || 
      lowerMessage.includes('does not exist') || lowerMessage.includes('constraint')) {
    return 'schema';
  }
  
  if (lowerMessage.includes('api') || lowerMessage.includes('openai') || 
      lowerMessage.includes('timeout') || lowerMessage.includes('fetch')) {
    return 'api';
  }
  
  if (lowerMessage.includes('process') || lowerMessage.includes('parse') || 
      lowerMessage.includes('enrich') || lowerMessage.includes('generation')) {
    return 'processing';
  }
  
  if (lowerMessage.includes('auth') || lowerMessage.includes('permission') || 
      lowerMessage.includes('unauthorized')) {
    return 'auth';
  }
  
  return 'unknown';
}

// Helper function to determine resolution status
function determineResolutionStatus(log: any): 'open' | 'investigating' | 'resolved' {
  // This is a simplified implementation
  // In a real system, you'd track resolution status in the database
  const logAge = Date.now() - new Date(log.created_at).getTime();
  const oneHour = 60 * 60 * 1000;
  
  if (logAge < oneHour) {
    return 'open';
  } else if (log.level === 'error') {
    return 'investigating';
  } else {
    return 'resolved';
  }
}
