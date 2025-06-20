
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { Check, Edit, Calendar, MapPin, Building, GraduationCap, Award, Code, Trophy } from 'lucide-react';
import { InlineEditForm } from './InlineEditForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { VersionedEntity, EntityData, EntityType } from '@/types/versioned-entities';

interface EditField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'array';
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

  const isPendingAIExtraction = (item: VersionedEntity) => 
    item.source === 'AI_EXTRACTION' && !item.is_active;

  const handleEditClick = (item: T) => {
    setEditingItemId(`${item.logical_entity_id}-${item.version}`);
  };

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

  const handleEditSave = async (item: T, updates: Record<string, any>) => {
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
      // Type assertion here since we know the updates come from our form fields
      // which are designed to match the entity structure
      onEdit(item, updates as Partial<EntityData<T>>);
      setEditingItemId(null);
    } catch (error) {
      console.error('Error in handleEditSave:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditCancel = () => {
    setEditingItemId(null);
  };

  return (
    <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center gap-2 text-lg ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
          {icon}
          {title}
          <Badge variant="secondary" className="ml-auto">
            {items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
            No {title.toLowerCase()} added yet
          </p>
        ) : (
          items.map((item) => {
            const itemKey = `${item.logical_entity_id}-${item.version}`;
            const isEditing = editingItemId === itemKey;
            
            return (
              <div
                key={itemKey}
                className={`p-3 rounded-lg border transition-all ${
                  isPendingAIExtraction(item)
                    ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                    : theme === 'dark'
                    ? 'border-career-text-dark/10 bg-career-background-dark/50'
                    : 'border-career-text-light/10 bg-career-background-light/50'
                }`}
              >
                {isEditing ? (
                  <InlineEditForm
                    item={item}
                    fields={editFields}
                    onSave={(updates) => handleEditSave(item, updates)}
                    onCancel={handleEditCancel}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {renderItem(item)}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant={item.is_active ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {item.is_active ? 'Active' : 'Pending'}
                        </Badge>
                        {item.source && (
                          <Badge variant="outline" className="text-xs">
                            {item.source}
                          </Badge>
                        )}
                        {item.source_confidence && (
                          <Badge variant="outline" className="text-xs">
                            {Math.round(item.source_confidence * 100)}% confidence
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 flex-shrink-0">
                      {isPendingAIExtraction(item) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAccept(item)}
                          className="text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Accept
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(item)}
                        className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
