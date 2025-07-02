import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLatestEntities } from '@/hooks/useVersionedEntities';

interface ProfileCompletenessData {
  complete: boolean;
  score: number;
  missing_fields: string[];
  message: string;
}

interface ProfileCompletenessState {
  data: ProfileCompletenessData | null;
  loading: boolean;
  error: string | null;
  // Extended interface to match existing usage
  isNewUser: boolean;
  completionPercentage: number;
  hasResumeData: boolean;
  hasExperience: boolean;
  hasEducation: boolean;
  hasSkills: boolean;
}

export const useProfileCompleteness = () => {
  const { user } = useAuth();
  const workExperience = useLatestEntities('work_experience');
  const education = useLatestEntities('education');
  const skills = useLatestEntities('skill');
  
  const [state, setState] = useState<ProfileCompletenessState>({
    data: null,
    loading: false,
    error: null,
    isNewUser: true,
    completionPercentage: 0,
    hasResumeData: false,
    hasExperience: false,
    hasEducation: false,
    hasSkills: false,
  });

  const checkCompleteness = useCallback(async () => {
    if (!user?.id) {
      setState(prev => ({ ...prev, data: null, loading: false, error: 'No user found' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase.rpc('check_profile_completeness', {
        p_user_id: user.id
      });

      if (error) throw error;

      const completenessData = data as unknown as ProfileCompletenessData;
      
      setState(prev => ({
        ...prev,
        data: completenessData,
        loading: false,
        error: null,
        completionPercentage: completenessData.score,
        isNewUser: completenessData.score < 40,
      }));
    } catch (error) {
      console.error('Error checking profile completeness:', error);
      setState(prev => ({
        ...prev,
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to check profile completeness'
      }));
    }
  }, [user?.id]);

  const updateProfile = useCallback(async (updates: { name?: string; avatar_url?: string }) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Recheck completeness after update
      await checkCompleteness();
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  }, [user?.id, checkCompleteness]);

  // Update entity-based completeness data
  useEffect(() => {
    setState(prev => ({
      ...prev,
      hasExperience: workExperience.data.length > 0,
      hasEducation: education.data.length > 0,
      hasSkills: skills.data.length > 0,
      hasResumeData: workExperience.data.length > 0 || education.data.length > 0 || skills.data.length > 0,
    }));
  }, [workExperience.data, education.data, skills.data]);

  // Check completeness when user changes
  useEffect(() => {
    if (user?.id) {
      checkCompleteness();
    }
  }, [user?.id, checkCompleteness]);

  return {
    ...state,
    checkCompleteness,
    updateProfile,
  };
};