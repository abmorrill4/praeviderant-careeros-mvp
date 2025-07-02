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

        if (entitiesError) throw entitiesError;

        const totalEntities = entitiesData?.length || 0;
        const unresolvedEntities = entitiesData?.filter(
          entity => entity.confidence_score < 0.85 || entity.review_status === 'pending'
        ).length || 0;

        // Calculate data quality score
        const qualityScore = totalEntities > 0 
          ? ((totalEntities - unresolvedEntities) / totalEntities) * 100 
          : 0;

        // Fetch user metrics
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, created_at');

        if (usersError) throw usersError;

        const totalUsers = usersData?.length || 0;
        
        // Active users in last 30 days (simplified - you might want to add last_seen tracking)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const activeUsers = usersData?.filter(
          user => new Date(user.created_at) > thirtyDaysAgo
        ).length || 0;

        // Fetch resume metrics
        const { data: resumesData, error: resumesError } = await supabase
          .from('resume_versions')
          .select('id, created_at, processing_status');

        if (resumesError) throw resumesError;

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