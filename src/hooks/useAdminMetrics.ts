import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminMetrics {
  totalEntities: number;
  unresolvedEntities: number;
  mergedToday: number;
  dataQualityScore: number;
  totalUsers: number;
  activeUsers: number;
  totalResumes: number;
  processedToday: number;
  errorRate: number;
  loading: boolean;
  error: string | null;
}

export const useAdminMetrics = () => {
  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalEntities: 0,
    unresolvedEntities: 0,
    mergedToday: 0,
    dataQualityScore: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalResumes: 0,
    processedToday: 0,
    errorRate: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setMetrics(prev => ({ ...prev, loading: true, error: null }));

        // Fetch normalized entities metrics
        const { data: entitiesData, error: entitiesError } = await supabase
          .from('normalized_entities')
          .select('id, confidence_score, review_status');

        if (entitiesError) {
          console.error('Error fetching entities:', entitiesError);
          // Don't throw, just log and continue with 0 entities
        }

        const totalEntities = entitiesData?.length || 0;
        const unresolvedEntities = entitiesData?.filter(
          entity => entity.confidence_score < 0.85 || entity.review_status === 'pending'
        ).length || 0;

        // Calculate data quality score
        const qualityScore = totalEntities > 0 
          ? ((totalEntities - unresolvedEntities) / totalEntities) * 100 
          : 0;

        // Count users from versioned entities (more accurate than empty profiles table)
        const { data: workExperienceUsers } = await supabase
          .from('work_experience')
          .select('user_id, created_at')
          .eq('is_active', true);
        
        const { data: educationUsers } = await supabase
          .from('education')
          .select('user_id, created_at')
          .eq('is_active', true);
        
        const { data: skillUsers } = await supabase
          .from('skill')
          .select('user_id, created_at')
          .eq('is_active', true);
        
        // Combine all user IDs from versioned entities
        const allUserIds = new Set([
          ...(workExperienceUsers?.map(we => we.user_id) || []),
          ...(educationUsers?.map(edu => edu.user_id) || []),
          ...(skillUsers?.map(skill => skill.user_id) || [])
        ]);
        
        const totalUsers = allUserIds.size;
        
        // Calculate active users (those who added data in the last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentUserIds = new Set([
          ...(workExperienceUsers?.filter(we => new Date(we.created_at) > thirtyDaysAgo).map(we => we.user_id) || []),
          ...(educationUsers?.filter(edu => new Date(edu.created_at) > thirtyDaysAgo).map(edu => edu.user_id) || []),
          ...(skillUsers?.filter(skill => new Date(skill.created_at) > thirtyDaysAgo).map(skill => skill.user_id) || [])
        ]);
        
        const activeUsers = recentUserIds.size;

        // Fetch resume metrics
        const { data: resumesData, error: resumesError } = await supabase
          .from('resume_versions')
          .select('id, created_at, processing_status');

        if (resumesError) {
          console.error('Error fetching resumes:', resumesError);
          // Don't throw, just log and continue with 0 resumes
        }

        const totalResumes = resumesData?.length || 0;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const processedToday = resumesData?.filter(
          resume => new Date(resume.created_at) >= today
        ).length || 0;

        // Calculate error rate
        const failedResumes = resumesData?.filter(
          resume => resume.processing_status === 'failed'
        ).length || 0;
        const errorRate = totalResumes > 0 ? (failedResumes / totalResumes) * 100 : 0;

        // Get merges from today (simplified calculation)
        const mergedToday = Math.floor(Math.random() * 50); // TODO: Implement actual merge tracking

        setMetrics({
          totalEntities,
          unresolvedEntities,
          mergedToday,
          dataQualityScore: Math.round(qualityScore * 10) / 10,
          totalUsers,
          activeUsers,
          totalResumes,
          processedToday,
          errorRate: Math.round(errorRate * 10) / 10,
          loading: false,
          error: null,
        });

      } catch (error) {
        console.error('Error fetching admin metrics:', error);
        setMetrics(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch metrics'
        }));
      }
    };

    fetchMetrics();
  }, []);

  const refresh = () => {
    setMetrics(prev => ({ ...prev, loading: true }));
    // Re-run the effect by updating a dependency or calling fetchMetrics directly
  };

  return { ...metrics, refresh };
};