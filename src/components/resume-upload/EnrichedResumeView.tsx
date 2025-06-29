import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Building, GraduationCap, Code, Award, Briefcase, Eye, Search, Filter, Sparkles, Brain } from 'lucide-react';
import { DetailedViewModal } from './DetailedViewModal';
import { EnrichAllButton } from './EnrichAllButton';
import { BulkEnrichmentButton } from './BulkEnrichmentButton';
import { EnrichmentStats } from './EnrichmentStats';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ParsedResumeEntity {
  id: string;
  entity_id: string;
  field_name: string;
  raw_value: string;
  confidence_score: number;
  source_type: string;
  resume_version_id: string;
}

interface EnrichedResumeViewProps {
  versionId: string;
  onClose: () => void;
}

export const EnrichedResumeView: React.FC<EnrichedResumeViewProps> = ({
  versionId,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [entityForModal, setEntityForModal] = useState<ParsedResumeEntity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  const { data: entities, isLoading, error } = useQuery({
    queryKey: ['parsed-resume-entities', versionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parsed_resume_entities')
        .select('*')
        .eq('resume_version_id', versionId)
        .order('confidence_score', { ascending: false });

      if (error) {
        console.error('Error fetching parsed resume entities:', error);
        throw error;
      }

      return data as ParsedResumeEntity[];
    },
  });

  const filteredEntities = useMemo(() => {
    if (!entities) return [];

    return filter
      ? entities.filter(entity => entity.field_name.toLowerCase().includes(filter.toLowerCase()))
      : entities;
  }, [entities, filter]);

  const handleEntityClick = (entity: ParsedResumeEntity) => {
    setSelectedEntityId(entity.id);
    setEntityForModal(entity);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEntityForModal(null);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading resume data...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error.message}</div>;
  }

  if (!entities || entities.length === 0) {
    return <div className="text-center py-8">No entities found for this resume.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with bulk actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            ← Back to Upload
          </Button>
          <h2 className="text-xl font-semibold">Resume Analysis</h2>
        </div>
        <div className="flex items-center gap-3">
          <BulkEnrichmentButton 
            versionId={versionId}
            onComplete={() => {
              // Refresh data after bulk enrichment
              queryClient.invalidateQueries({ queryKey: ['parsed-resume-entities', versionId] });
              queryClient.invalidateQueries({ queryKey: ['entry-enrichments', versionId] });
            }}
          />
          <EnrichAllButton versionId={versionId} />
        </div>
      </div>

      {/* Enrichment Stats */}
      <EnrichmentStats versionId={versionId} />

      {/* Filters and sorting */}
      <div className="flex items-center justify-between">
        <Select onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Field" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Fields</SelectItem>
            {[...new Set(entities.map(entity => entity.field_name))].map(fieldName => (
              <SelectItem key={fieldName} value={fieldName}>{fieldName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">
          {filteredEntities.length} entities found
        </div>
      </div>

      <Separator />

      {/* Data Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEntities.map((entity) => (
          <Card
            key={entity.id}
            className={`cursor-pointer ${selectedEntityId === entity.id ? 'border-2 border-blue-500' : ''}`}
            onClick={() => handleEntityClick(entity)}
          >
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                {entity.field_name.includes('work_experience') && <Building className="w-4 h-4 text-blue-500" />}
                {entity.field_name.includes('education') && <GraduationCap className="w-4 h-4 text-blue-500" />}
                {entity.field_name.includes('skill') && <Code className="w-4 h-4 text-blue-500" />}
                {entity.field_name.includes('award') && <Award className="w-4 h-4 text-blue-500" />}
                {entity.field_name.includes('project') && <Briefcase className="w-4 h-4 text-blue-500" />}
                {entity.field_name.includes('certification') && <Award className="w-4 h-4 text-blue-500" />}
                {entity.field_name}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground flex items-center gap-1">
                <Eye className="w-3 h-3" />
                View details & AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground truncate">
                {entity.raw_value}
              </div>
              <Separator className="my-2" />
              <div className="flex items-center justify-between">
                <Badge variant="secondary">
                  {entity.source_type}
                </Badge>
                <Badge variant="outline">
                  {Math.round(entity.confidence_score * 100)}% confidence
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed View Modal */}
      {entityForModal && (
        <DetailedViewModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          entity={entityForModal}
          title={entityForModal.field_name}
          subtitle={`Source: ${entityForModal.source_type}`}
        />
      )}
    </div>
  );
};
