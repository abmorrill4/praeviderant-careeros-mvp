
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingData } from '@/components/onboarding/types';

export const useOnboarding = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const completeOnboarding = async (data: OnboardingData) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    try {
      // Update the user's profile to mark onboarding as completed
      const { error } = await supabase
        .from('profiles')
        .update({ 
          onboarding_completed: true,
          onboarding_data: data
        })
        .eq('id', user.id);

      if (error) throw error;

      console.log('Onboarding completed successfully:', data);
      return true;
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    completeOnboarding,
    loading
  };
};
