import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { VersionedEntity } from '@/types/versioned-entities';

interface ParsedEntity {
  id: string;
  field_name: string;
  raw_value: string;
  resume_version_id: string;
}

interface EnrichmentMapping {
  [profileEntityId: string]: string; // Maps profile entity ID to parsed entity ID
}

/**
 * Hook to map profile entities to their corresponding parsed entities with enrichment data
 * This creates a mapping between user profile data and AI enrichment data from resume uploads
 */
export function useProfileEnrichmentMapping<T extends VersionedEntity>(
  profileEntities: T[],
  entityType: string
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile-enrichment-mapping', user?.id, entityType, profileEntities.map(e => e.logical_entity_id)],
    queryFn: async (): Promise<EnrichmentMapping> => {
      if (!user || !profileEntities.length) return {};

      try {
        // Get all parsed entities from resume uploads for this user
        const { data: parsedEntities, error } = await supabase
          .from('parsed_resume_entities')
          .select(`
            id,
            field_name,
            raw_value,
            resume_version_id,
            resume_versions!inner(
              stream_id,
              resume_streams!inner(
                user_id
              )
            )
          `)
          .eq('resume_versions.resume_streams.user_id', user.id);

        if (error) {
          console.error('Error fetching parsed entities:', error);
          return {};
        }

        if (!parsedEntities?.length) return {};

        // Create mapping based on entity type and matching logic
        const mapping: EnrichmentMapping = {};

        for (const profileEntity of profileEntities) {
          // Find the best matching parsed entity
          const matchingParsedEntity = findMatchingParsedEntity(
            profileEntity, 
            parsedEntities,
            entityType
          );

          if (matchingParsedEntity) {
            mapping[profileEntity.logical_entity_id] = matchingParsedEntity.id;
          }
        }

        return mapping;
      } catch (error) {
        console.error('Failed to create enrichment mapping:', error);
        return {};
      }
    },
    enabled: !!user && profileEntities.length > 0,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Find the best matching parsed entity for a profile entity
 */
function findMatchingParsedEntity(
  profileEntity: VersionedEntity,
  parsedEntities: any[],
  entityType: string
): ParsedEntity | null {
  // Filter parsed entities by type
  const relevantEntities = parsedEntities.filter(pe => {
    const fieldName = pe.field_name?.toLowerCase();
    
    switch (entityType) {
      case 'work_experience':
        return fieldName?.includes('experience') || fieldName?.includes('work') || fieldName?.includes('job');
      case 'education':
        return fieldName?.includes('education') || fieldName?.includes('school') || fieldName?.includes('degree');
      case 'skill':
        return fieldName?.includes('skill') || fieldName?.includes('technology') || fieldName?.includes('competenc');
      case 'project':
        return fieldName?.includes('project') || fieldName?.includes('portfolio');
      case 'certification':
        return fieldName?.includes('certification') || fieldName?.includes('certificate') || fieldName?.includes('license');
      default:
        return true;
    }
  });

  if (!relevantEntities.length) return null;

  // Try to match by name/title similarity
  for (const parsedEntity of relevantEntities) {
    if (isEntityMatch(profileEntity, parsedEntity, entityType)) {
      return parsedEntity;
    }
  }

  // If no exact match, return the most recent relevant entity
  return relevantEntities[0] || null;
}

/**
 * Check if a profile entity matches a parsed entity
 */
function isEntityMatch(profileEntity: VersionedEntity, parsedEntity: any, entityType: string): boolean {
  try {
    const rawValue = JSON.parse(parsedEntity.raw_value || '{}');
    
    switch (entityType) {
      case 'work_experience':
        const workEntity = profileEntity as any;
        return (
          similarText(workEntity.title || '', rawValue.title || rawValue.position || '') ||
          similarText(workEntity.company || '', rawValue.company || rawValue.organization || '')
        );
        
      case 'education':
        const eduEntity = profileEntity as any;
        return (
          similarText(eduEntity.degree || '', rawValue.degree || rawValue.certification || '') ||
          similarText(eduEntity.institution || '', rawValue.institution || rawValue.school || '')
        );
        
      case 'skill':
        const skillEntity = profileEntity as any;
        return similarText(skillEntity.name || '', rawValue.name || rawValue.skill || '');
        
      case 'project':
        const projectEntity = profileEntity as any;
        return similarText(projectEntity.name || '', rawValue.name || rawValue.title || '');
        
      case 'certification':
        const certEntity = profileEntity as any;
        return (
          similarText(certEntity.name || '', rawValue.name || rawValue.certification || '') ||
          similarText(certEntity.issuing_organization || '', rawValue.issuer || rawValue.organization || '')
        );
        
      default:
        return false;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Simple text similarity check
 */
function similarText(text1: string, text2: string): boolean {
  if (!text1 || !text2) return false;
  
  const t1 = text1.toLowerCase().trim();
  const t2 = text2.toLowerCase().trim();
  
  // Exact match
  if (t1 === t2) return true;
  
  // Contains match
  if (t1.includes(t2) || t2.includes(t1)) return true;
  
  // Word overlap
  const words1 = t1.split(/\s+/);
  const words2 = t2.split(/\s+/);
  const commonWords = words1.filter(w => words2.includes(w) && w.length > 2);
  
  return commonWords.length >= Math.min(words1.length, words2.length) * 0.5;
}