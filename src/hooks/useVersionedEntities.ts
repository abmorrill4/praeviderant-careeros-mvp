
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getLatestEntities,
  createEntity,
  updateEntity,
  deleteEntity,
  getEntityHistory,
} from '@/utils/versioned-entities';
import type { VersionedEntity, EntityType, EntityData } from '@/types/versioned-entities';

// Hook to get latest entities of a specific type
export function useLatestEntities<T extends VersionedEntity>(tableName: EntityType) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['entities', tableName, user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log(`No user ID available for fetching ${tableName}`);
        return [];
      }
      
      console.log(`Fetching latest entities for ${tableName}, user: ${user.id}`);
      const result = await getLatestEntities<T>(tableName, user.id);
      console.log(`Fetched ${result.length} entities of type ${tableName}:`, result);
      return result;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Hook to create a new entity
export function useCreateEntity<T extends VersionedEntity>(tableName: EntityType) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ entityData, source, sourceConfidence }: {
      entityData: EntityData<T>;
      source?: string;
      sourceConfidence?: number;
    }) => createEntity<T>(tableName, entityData, source, sourceConfidence),
    onSuccess: () => {
      console.log(`Successfully created ${tableName} entity, invalidating queries`);
      queryClient.invalidateQueries({ queryKey: ['entities', tableName, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entities'] });
    },
  });
}

// Hook to update an entity
export function useUpdateEntity<T extends VersionedEntity>(tableName: EntityType) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ logicalEntityId, updates, source, sourceConfidence }: {
      logicalEntityId: string;
      updates: Partial<EntityData<T>>;
      source?: string;
      sourceConfidence?: number;
    }) => updateEntity<T>(tableName, logicalEntityId, updates, source, sourceConfidence),
    onSuccess: () => {
      console.log(`Successfully updated ${tableName} entity, invalidating queries`);
      queryClient.invalidateQueries({ queryKey: ['entities', tableName, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entities'] });
    },
  });
}

// Hook to delete an entity
export function useDeleteEntity(tableName: EntityType) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ logicalEntityId, source }: {
      logicalEntityId: string;
      source?: string;
    }) => deleteEntity(tableName, logicalEntityId, source),
    onSuccess: () => {
      console.log(`Successfully deleted ${tableName} entity, invalidating queries`);
      queryClient.invalidateQueries({ queryKey: ['entities', tableName, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entities'] });
    },
  });
}

// Hook to get entity history
export function useEntityHistory<T extends VersionedEntity>(
  tableName: EntityType,
  logicalEntityId?: string
) {
  return useQuery({
    queryKey: ['entity-history', tableName, logicalEntityId],
    queryFn: () => getEntityHistory<T>(tableName, logicalEntityId!),
    enabled: !!logicalEntityId,
  });
}
