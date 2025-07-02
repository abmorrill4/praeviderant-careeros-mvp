import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, X, Edit, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FieldRenderer } from './FieldRenderer';
import type { VersionedEntity, EntityData } from '@/types/versioned-entities';

interface EditField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'array' | 'flexible-date';
  options?: string[];
  placeholder?: string;
  required?: boolean;
}

interface EnhancedInlineEditorProps<T extends VersionedEntity> {
  item: T;
  fields: EditField[];
  onSave: (updates: Partial<EntityData<T>>) => Promise<void>;
  onCancel: () => void;
  isVisible: boolean;
  className?: string;
}

export const EnhancedInlineEditor = <T extends VersionedEntity>({
  item,
  fields,
  onSave,
  onCancel,
  isVisible,
  className = ""
}: EnhancedInlineEditorProps<T>) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    fields.forEach(field => {
      initial[field.key] = (item as any)[field.key] || '';
    });
    return initial;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Focus first field when editor becomes visible
  useEffect(() => {
    if (isVisible && firstFieldRef.current) {
      firstFieldRef.current.focus();
    }
  }, [isVisible]);

  // Track unsaved changes
  useEffect(() => {
    const hasChanges = fields.some(field => {
      const originalValue = (item as any)[field.key] || '';
      const currentValue = formData[field.key] || '';
      return originalValue !== currentValue;
    });
    setHasUnsavedChanges(hasChanges);
  }, [formData, fields, item]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      if (field.required && (!formData[field.key] || formData[field.key] === '')) {
        newErrors[field.key] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Only include changed fields
      const updates: Partial<EntityData<T>> = {};
      fields.forEach(field => {
        const originalValue = (item as any)[field.key] || '';
        const currentValue = formData[field.key] || '';
        if (originalValue !== currentValue) {
          (updates as any)[field.key] = currentValue;
        }
      });

      if (Object.keys(updates).length === 0) {
        toast({
          title: "No Changes",
          description: "No changes were made to save.",
        });
        onCancel();
        return;
      }

      await onSave(updates);
      setHasUnsavedChanges(false);
      
      toast({
        title: "Saved Successfully",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save your changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  const updateField = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e as any);
    }
  };

  if (!isVisible) return null;

  return (
    <Card className={`border-2 border-primary/20 bg-background/95 backdrop-blur ${className}`}>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Edit className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Edit Item</span>
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-xs text-orange-600">
                Unsaved Changes
              </Badge>
            )}
          </div>

          <div className="grid gap-4">
            {fields.map((field, index) => (
              <div key={field.key} className="space-y-1">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-foreground">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </label>
                  {errors[field.key] && (
                    <div className="flex items-center gap-1 text-destructive">
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-xs">{errors[field.key]}</span>
                    </div>
                  )}
                </div>
                <FieldRenderer
                  field={field}
                  value={formData[field.key]}
                  onChange={(value) => updateField(field.key, value)}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-xs text-muted-foreground">
              Press Ctrl+Enter to save, Esc to cancel
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Button>
              <Button 
                type="submit" 
                size="sm" 
                disabled={isSubmitting || !hasUnsavedChanges}
                className="bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Save className="w-3 h-3 mr-1" />
                )}
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};