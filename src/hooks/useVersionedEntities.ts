
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
    queryFn: () => getLatestEntities<T>(tableName, user!.id),
    enabled: !!user?.id,
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
      queryClient.invalidateQueries({ queryKey: ['entities', tableName, user?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['entities', tableName, user?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['entities', tableName, user?.id] });
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
