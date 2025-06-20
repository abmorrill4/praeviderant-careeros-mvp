
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { InlineEditForm } from './InlineEditForm';
import type { VersionedEntity, EntityData, EntityType } from '@/types/versioned-entities';

interface EditField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'array';
  options?: string[];
  placeholder?: string;
}

interface ProfileItemEditorProps<T extends VersionedEntity> {
  item: T;
  editFields: EditField[];
  title: string;
  onEdit: (item: T, updates: Partial<EntityData<T>>) => void;
  onCancel: () => void;
}

export const ProfileItemEditor = <T extends VersionedEntity>({
  item,
  editFields,
  title,
  onEdit,
  onCancel
}: ProfileItemEditorProps<T>) => {
  const getTableNameFromTitle = (title: string): EntityType => {
    const titleToTable: Record<string, EntityType> = {
      'Work Experience': 'work_experience',
      'Education': 'education',
      'Skills': 'skill',
      'Projects': 'project',
      'Certifications': 'certification'
    };
    return titleToTable[title] || 'work_experience';
  };

  const handleEditSave = async (updates: Record<string, any>) => {
    try {
      // Get the table name based on the section title
      const tableName = getTableNameFromTitle(title);
      
      // Refetch the latest version of the item to check for conflicts
      const { data: latestItem, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('logical_entity_id', item.logical_entity_id)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching latest item version:', error);
        toast({
          title: "Error",
          description: "Failed to verify item version. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Check for version conflict
      if (latestItem.version !== item.version) {
        toast({
          title: "Conflict Detected",
          description: "This item was updated by another process. Please cancel, and the list will refresh with the latest data.",
          variant: "destructive",
        });
        return;
      }

      // Versions match, proceed with the edit
      onEdit(item, updates as Partial<EntityData<T>>);
    } catch (error) {
      console.error('Error in handleEditSave:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <InlineEditForm
      item={item}
      fields={editFields}
      onSave={handleEditSave}
      onCancel={onCancel}
    />
  );
};
