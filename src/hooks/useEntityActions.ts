
import { useUpdateEntity } from '@/hooks/useVersionedEntities';
import { useToast } from '@/hooks/use-toast';
import type { VersionedEntity, EntityType, EntityData } from '@/types/versioned-entities';

export function useEntityActions<T extends VersionedEntity>(tableName: EntityType) {
  const updateEntity = useUpdateEntity<T>(tableName);
  const { toast } = useToast();

  const handleAccept = async (item: VersionedEntity) => {
    try {
      await updateEntity.mutateAsync({
        logicalEntityId: item.logical_entity_id,
        updates: { is_active: true } as Partial<EntityData<T>>,
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

  const handleEdit = (item: VersionedEntity) => {
    // TODO: Open edit modal/form
    toast({
      title: "Edit functionality",
      description: "Edit functionality will be implemented soon.",
    });
  };

  return { handleAccept, handleEdit };
}
