
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Edit,
  Save,
  X
} from 'lucide-react';

interface PreservedContextMergeProps {
  versionId: string;
  onProfileUpdated?: () => void;
}

interface EntityWithContext {
  id: string;
  field_name: string;
  raw_value: string;
  confidence_score: number;
  parsedData: any;
  preservedContext: string;
  userNotes?: string;
}

export const PreservedContextMerge: React.FC<PreservedContextMergeProps> = ({
  versionId,
  onProfileUpdated
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [entities, setEntities] = useState<EntityWithContext[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(new Set());

  // Enhanced merge function that preserves all context
  const handleMergeWithContext = async () => {
    if (!user || selectedEntities.size === 0) return;

    setIsProcessing(true);
    
    try {
      // Prepare entities with preserved context
      const entitiesToMerge = entities
        .filter(e => selectedEntities.has(e.id))
        .map(entity => ({
          ...entity,
          // Combine original parsed data with preserved context
          enhancedData: {
            ...entity.parsedData,
            original_context: entity.preservedContext,
            user_notes: entity.userNotes,
            extraction_confidence: entity.confidence_score,
            source_metadata: {
              resume_version_id: versionId,
              field_name: entity.field_name,
              extraction_date: new Date().toISOString()
            }
          }
        }));

      const { data, error } = await supabase.functions.invoke('apply-resume-data-to-profile', {
        body: {
          userId: user.id,
          entities: entitiesToMerge,
          preserveContext: true,
          mergeStrategy: 'enhance' // Strategy to add context rather than replace
        }
      });

      if (error) throw error;

      toast({
        title: "Profile Updated Successfully",
        description: `Merged ${selectedEntities.size} items with full context preservation`,
      });

      onProfileUpdated?.();
      
    } catch (error) {
      console.error('Error merging with context:', error);
      toast({
        title: "Merge Failed",
        description: "Failed to merge data while preserving context",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEntityToggle = (entityId: string) => {
    const newSelected = new Set(selectedEntities);
    if (newSelected.has(entityId)) {
      newSelected.delete(entityId);
    } else {
      newSelected.add(entityId);
    }
    setSelectedEntities(newSelected);
  };

  const handleContextEdit = (entityId: string, newContext: string) => {
    setEntities(prev => prev.map(e => 
      e.id === entityId 
        ? { ...e, userNotes: newContext }
        : e
    ));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Context-Preserved Merge
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Review and enhance your data before merging. All bullet points and context will be preserved.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {selectedEntities.size} of {entities.length} items selected
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedEntities(new Set(entities.map(e => e.id)))}
              >
                Select All
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedEntities(new Set())}
              >
                Clear All
              </Button>
            </div>
            
            <Button
              onClick={handleMergeWithContext}
              disabled={selectedEntities.size === 0 || isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? 'Merging...' : `Merge ${selectedEntities.size} Items`}
            </Button>
          </div>

          <div className="space-y-4">
            {entities.map((entity) => (
              <Card key={entity.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedEntities.has(entity.id)}
                      onChange={() => handleEntityToggle(entity.id)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{entity.field_name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(entity.confidence_score * 100)}% confidence
                          </Badge>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(editingId === entity.id ? null : entity.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Original Context Display */}
                      <div className="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                        <p className="text-xs font-medium text-gray-600 mb-1">PRESERVED CONTEXT</p>
                        <p className="text-sm whitespace-pre-wrap">{entity.preservedContext}</p>
                      </div>

                      {/* User Notes Section */}
                      {editingId === entity.id ? (
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-600">
                            ADD NOTES OR CONTEXT:
                          </label>
                          <Textarea
                            value={entity.userNotes || ''}
                            onChange={(e) => handleContextEdit(entity.id, e.target.value)}
                            placeholder="Add any additional context, notes, or clarifications..."
                            className="min-h-[80px]"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => setEditingId(null)}>
                              <Save className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setEditingId(null)}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : entity.userNotes && (
                        <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                          <p className="text-xs font-medium text-green-700 mb-1">YOUR NOTES</p>
                          <p className="text-sm">{entity.userNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
