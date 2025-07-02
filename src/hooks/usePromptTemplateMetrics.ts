import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PromptTemplateMetrics {
  totalPrompts: number;
  activePrompts: number;
  categoriesCount: number;
  loading: boolean;
  error: string | null;
}

export const usePromptTemplateMetrics = () => {
  const [metrics, setMetrics] = useState<PromptTemplateMetrics>({
    totalPrompts: 0,
    activePrompts: 0,
    categoriesCount: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setMetrics(prev => ({ ...prev, loading: true, error: null }));

        const { data: promptsData, error: promptsError } = await supabase
          .from('prompt_templates')
          .select('id, category, is_active');

        if (promptsError) throw promptsError;

        const totalPrompts = promptsData?.length || 0;
        const activePrompts = promptsData?.filter(prompt => prompt.is_active).length || 0;
        
        // Get unique categories
        const categories = new Set(promptsData?.map(prompt => prompt.category) || []);
        const categoriesCount = categories.size;

        setMetrics({
          totalPrompts,
          activePrompts,
          categoriesCount,
          loading: false,
          error: null,
        });

      } catch (error) {
        console.error('Error fetching prompt template metrics:', error);
        setMetrics(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch metrics'
        }));
      }
    };

    fetchMetrics();
  }, []);

  return metrics;
};