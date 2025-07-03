
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useBulkEntryEnrichment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (versionId: string) => {
      if (!versionId || !user) {
        throw new Error('Version ID and user are required');
      }

      // Get all parsed entities for work experience and education
      const { data: entities, error: entitiesError } = await supabase
        .from('parsed_resume_entities')
        .select('*')
        .eq('resume_version_id', versionId)
        .in('field_name', [
          'work_experience_0', 'work_experience_1', 'work_experience_2', 'work_experience_3', 'work_experience_4',
          'education_0', 'education_1', 'education_2', 'education_3'
        ]);

      if (entitiesError) {
        console.error('Error fetching entities:', entitiesError);
        throw new Error(`Failed to fetch entities: ${entitiesError.message}`);
      }

      if (!entities || entities.length === 0) {
        console.log('No work or education entities found');
        return { enriched_count: 0, total_entities: 0 };
      }

      console.log(`Found ${entities.length} work/education entities to enrich`);

      // Check which entities already have enrichment
      const { data: existingEnrichments, error: enrichmentError } = await supabase
        .from('entry_enrichment')
        .select('parsed_entity_id')
        .eq('resume_version_id', versionId)
        .eq('user_id', user.id);

      if (enrichmentError) {
        console.error('Error checking existing enrichments:', enrichmentError);
        throw new Error(`Failed to check existing enrichments: ${enrichmentError.message}`);
      }

      const enrichedEntityIds = new Set(existingEnrichments?.map(e => e.parsed_entity_id) || []);
      const entitiesToEnrich = entities.filter(entity => !enrichedEntityIds.has(entity.id));

      console.log(`${entitiesToEnrich.length} entities need enrichment (${enrichedEntityIds.size} already enriched)`);

      if (entitiesToEnrich.length === 0) {
        return { 
          enriched_count: 0, 
          total_entities: entities.length,
          already_enriched: enrichedEntityIds.size 
        };
      }

      // Enrich entities in batches to avoid overwhelming the system
      const batchSize = 3;
      let totalEnriched = 0;

      for (let i = 0; i < entitiesToEnrich.length; i += batchSize) {
        const batch = entitiesToEnrich.slice(i, i + batchSize);
        
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(entitiesToEnrich.length / batchSize)}`);

        const batchPromises = batch.map(async (entity) => {
          try {
            console.log(`Enriching entity ${entity.id} (${entity.field_name})`);
            
            const { data, error } = await supabase.functions.invoke('enrich-single-entry', {
              body: { 
                parsed_entity_id: entity.id,
                force_refresh: false
              }
            });

            if (error) {
              console.error(`Failed to enrich entity ${entity.id}:`, error);
              return { success: false, entityId: entity.id, error: error.message };
            }

            if (!data?.success) {
              console.error(`Enrichment failed for entity ${entity.id}:`, data?.error);
              return { success: false, entityId: entity.id, error: data?.error };
            }

            console.log(`Successfully enriched entity ${entity.id}`);
            return { success: true, entityId: entity.id };
          } catch (error) {
            console.error(`Exception enriching entity ${entity.id}:`, error);
            return { success: false, entityId: entity.id, error: error.message };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        const batchSuccessCount = batchResults.filter(r => r.success).length;
        totalEnriched += batchSuccessCount;

        console.log(`Batch completed: ${batchSuccessCount}/${batch.length} successful`);

        // Small delay between batches to be respectful to the API
        if (i + batchSize < entitiesToEnrich.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return {
        enriched_count: totalEnriched,
        total_entities: entities.length,
        already_enriched: enrichedEntityIds.size,
        attempted: entitiesToEnrich.length
      };
    },
    onSuccess: (data, versionId) => {
      console.log('Bulk enrichment completed:', data);
      
      const message = data.enriched_count > 0 
        ? `Successfully enriched ${data.enriched_count} work/education entries`
        : `All ${data.total_entities} entries were already enriched`;

      toast({
        title: "Bulk Enrichment Complete",
        description: message,
      });
      
      // Invalidate related queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['entry-enrichments', versionId] });
      queryClient.invalidateQueries({ queryKey: ['entity-enrichment'] });
      queryClient.invalidateQueries({ queryKey: ['enrichment-stats', versionId] });
    },
    onError: (error) => {
      console.error('Bulk enrichment error:', error);
      
      toast({
        title: "Bulk Enrichment Failed",
        description: error instanceof Error ? error.message : 'Failed to enrich entries',
        variant: "destructive",
      });
    },
  });
}
