
import { supabase } from "@/integrations/supabase/client";
import type { VersionedEntity, EntityType, EntityData } from "@/types/versioned-entities";

// Generic function to get the latest version of all entities for a user
export async function getLatestEntities<T extends VersionedEntity>(
  tableName: EntityType,
  userId: string
): Promise<T[]> {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('logical_entity_id')
    .order('version', { ascending: false });

  if (error) throw error;

  // Get only the latest version of each entity
  const latestEntities = new Map<string, T>();
  data?.forEach((entity: any) => {
    const typedEntity = entity as T;
    const existing = latestEntities.get(typedEntity.logical_entity_id);
    if (!existing || typedEntity.version > existing.version) {
      latestEntities.set(typedEntity.logical_entity_id, typedEntity);
    }
  });

  return Array.from(latestEntities.values());
}

// Generic function to create a new entity
export async function createEntity<T extends VersionedEntity>(
  tableName: EntityType,
  entityData: EntityData<T>,
  source?: string,
  sourceConfidence?: number
): Promise<T> {
  const newEntity = {
    ...entityData,
    version: 1,
    is_active: true,
    source: source || 'manual',
    source_confidence: sourceConfidence || 1.0,
  };

  const { data, error } = await supabase
    .from(tableName)
    .insert([newEntity as any])
    .select()
    .single();

  if (error) throw error;
  return data as T;
}

// Generic function to update an entity (creates a new version)
export async function updateEntity<T extends VersionedEntity>(
  tableName: EntityType,
  logicalEntityId: string,
  updates: Partial<EntityData<T>>,
  source?: string,
  sourceConfidence?: number
): Promise<T> {
  // Get the current latest version
  const { data: currentEntity, error: fetchError } = await supabase
    .from(tableName)
    .select('*')
    .eq('logical_entity_id', logicalEntityId)
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (fetchError) throw fetchError;

  // Create new version with updates
  const newVersion = {
    ...currentEntity,
    ...updates,
    logical_entity_id: logicalEntityId,
    version: (currentEntity as any).version + 1,
    source: source || 'manual',
    source_confidence: sourceConfidence || 1.0,
  };

  // Remove the primary key fields that shouldn't be in the insert
  const { created_at, updated_at, ...insertData } = newVersion as any;

  const { data, error } = await supabase
    .from(tableName)
    .insert([insertData])
    .select()
    .single();

  if (error) throw error;
  return data as T;
}

// Generic function to soft delete an entity (mark as inactive)
export async function deleteEntity(
  tableName: EntityType,
  logicalEntityId: string,
  source?: string
): Promise<void> {
  // Get the current latest version
  const { data: currentEntity, error: fetchError } = await supabase
    .from(tableName)
    .select('*')
    .eq('logical_entity_id', logicalEntityId)
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (fetchError) throw fetchError;

  // Create new version marked as inactive
  const newVersion = {
    ...currentEntity,
    logical_entity_id: logicalEntityId,
    version: (currentEntity as any).version + 1,
    is_active: false,
    source: source || 'manual',
    source_confidence: 1.0,
  };

  // Remove the primary key fields that shouldn't be in the insert
  const { created_at, updated_at, ...insertData } = newVersion as any;

  const { error } = await supabase
    .from(tableName)
    .insert([insertData]);

  if (error) throw error;
}

// Function to get entity history
export async function getEntityHistory<T extends VersionedEntity>(
  tableName: EntityType,
  logicalEntityId: string
): Promise<T[]> {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('logical_entity_id', logicalEntityId)
    .order('version', { ascending: false });

  if (error) throw error;
  return (data as any[]).map(item => item as T);
}

// Function to get a specific version of an entity
export async function getEntityVersion<T extends VersionedEntity>(
  tableName: EntityType,
  logicalEntityId: string,
  version: number
): Promise<T | null> {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('logical_entity_id', logicalEntityId)
    .eq('version', version)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows found
    throw error;
  }
  return data as T;
}
