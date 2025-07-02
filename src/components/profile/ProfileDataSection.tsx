
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useTheme } from '@/contexts/ThemeContext';
import { ProfileItemDisplay } from './ProfileItemDisplay';
import { ProfileItemEditor } from './ProfileItemEditor';
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
}

export const ProfileDataSection = <T extends VersionedEntity>({
  title,
  icon,
  items,
  editFields,
  onAccept,
  onEdit,
  renderItem
}: ProfileDataSectionProps<T>) => {
  const { theme } = useTheme();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const handleEditClick = (item: T) => {
    setEditingItemId(`${item.logical_entity_id}-${item.version}`);
  };

  const handleEditSave = (item: T, updates: Partial<EntityData<T>>) => {
    onEdit(item, updates);
    setEditingItemId(null);
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
                    <ProfileItemEditor
                      item={item}
                      editFields={editFields}
                      title={title}
                      onEdit={handleEditSave}
                      onCancel={handleEditCancel}
                    />
                  ) : (
                    <ProfileItemDisplay
                      item={item}
                      onAccept={onAccept}
                      onEdit={handleEditClick}
                      renderItem={renderItem}
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
