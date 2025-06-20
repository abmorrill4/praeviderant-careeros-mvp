
import { useUpdateEntity } from '@/hooks/useVersionedEntities';
import { useToast } from '@/hooks/use-toast';
import type { VersionedEntity, EntityType } from '@/types/versioned-entities';

export function useEntityActions<T extends VersionedEntity>(tableName: EntityType) {
  const updateEntity = useUpdateEntity<T>(tableName);
  const { toast } = useToast();

  const handleAccept = async (item: VersionedEntity) => {
    try {
      await updateEntity.mutateAsync({
        logicalEntityId: item.logical_entity_id,
        updates: { is_active: true } as any,
        source: 'user_acceptance'
      });
      
      toast({
        title: "Item accepted",
        description: "The item has been added to your profile.",
      });
    } catch (error) {
      console.error('Error accepting item:', error);
      toast({
        title: "Error",
        description: "Failed to accept the item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (item: VersionedEntity, updates: Record<string, any>) => {
    try {
      await updateEntity.mutateAsync({
        logicalEntityId: item.logical_entity_id,
        updates,
        source: 'USER_MANUAL'
      });
      
      toast({
        title: "Item updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: "Error",
        description: "Failed to save your changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  return { handleAccept, handleEdit };
}
