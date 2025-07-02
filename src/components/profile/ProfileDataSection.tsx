
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { EnhancedProfileItemDisplay } from './EnhancedProfileItemDisplay';
import { EnhancedInlineEditor } from './EnhancedInlineEditor';
import { useProfileEnrichmentMapping } from '@/hooks/useProfileEnrichmentMapping';
import type { VersionedEntity, EntityData } from '@/types/versioned-entities';

interface EditField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'array' | 'flexible-date';
  options?: string[];
  placeholder?: string;
}

interface ProfileDataSectionProps<T extends VersionedEntity> {
  title: string;
  icon: React.ReactNode;
  items: T[];
  editFields: EditField[];
  onAccept: (item: VersionedEntity) => void;
  onEdit: (item: T, updates: Partial<EntityData<T>>) => void;
  renderItem: (item: T) => React.ReactNode;
  entityType: string; // Add entity type for enrichment mapping
}

export const ProfileDataSection = <T extends VersionedEntity>({
  title,
  icon,
  items,
  editFields,
  onAccept,
  onEdit,
  renderItem,
  entityType
}: ProfileDataSectionProps<T>) => {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  
  // Get enrichment mapping for all items
  const { data: enrichmentMapping = {} } = useProfileEnrichmentMapping(items, entityType);

  const handleEditClick = (item: T) => {
    setEditingItemId(`${item.logical_entity_id}-${item.version}`);
  };

  const handleEditSave = async (updates: Partial<EntityData<T>>) => {
    const currentItem = items.find(item => 
      editingItemId === `${item.logical_entity_id}-${item.version}`
    );
    if (currentItem) {
      await onEdit(currentItem, updates);
      setEditingItemId(null);
    }
  };

  const handleEditCancel = () => {
    setEditingItemId(null);
  };

  return (
    <TooltipProvider>
      <Card className="bg-career-panel-light border-career-text-light/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-career-text-light">
            {icon}
            {title}
            <Badge variant="secondary" className="ml-auto">
              {items.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-career-text-muted-light">
              No {title.toLowerCase()} added yet
            </p>
          ) : (
            items.map((item) => {
              const itemKey = `${item.logical_entity_id}-${item.version}`;
              const isEditing = editingItemId === itemKey;
              
              return (
                <div key={itemKey}>
                  {isEditing ? (
                    <EnhancedInlineEditor
                      item={item}
                      fields={editFields}
                      onSave={handleEditSave}
                      onCancel={handleEditCancel}
                      isVisible={true}
                    />
                  ) : (
                    <EnhancedProfileItemDisplay
                      item={item}
                      onAccept={onAccept}
                      onEdit={handleEditClick}
                      renderItem={renderItem}
                      enrichmentEntityId={enrichmentMapping[item.logical_entity_id]}
                    />
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
