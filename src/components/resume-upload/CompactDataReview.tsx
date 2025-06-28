import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Building, 
  GraduationCap,
  Award,
  Code,
  Briefcase,
  User,
  Tag,
  ExternalLink,
  Edit3,
  Trash2
} from 'lucide-react';
import type { ParsedResumeEntity } from '@/hooks/useResumeStreams';
import { useCareerEnrichment, useCareerNarratives } from '@/hooks/useEnrichment';
import { InsightCard } from './InsightCard';

interface CompactDataReviewProps {
  versionId: string;
  entities: ParsedResumeEntity[];
  onEditEntity?: (entity: ParsedResumeEntity) => void;
  onDeleteEntity?: (entityId: string) => void;
  className?: string;
}

export const CompactDataReview: React.FC<CompactDataReviewProps> = ({
  versionId,
  entities,
  onEditEntity,
  onDeleteEntity,
  className
}) => {
  const { data: enrichment, isLoading: enrichmentLoading } = useCareerEnrichment(versionId);
  const { data: narratives = [] } = useCareerNarratives(versionId);

  const groupedEntities = entities.reduce((acc: { [key: string]: ParsedResumeEntity[] }, entity) => {
    const fieldName = entity.field_name;
    if (!acc[fieldName]) {
      acc[fieldName] = [];
    }
    acc[fieldName].push(entity);
    return acc;
  }, {});

  const renderEntityValue = (entity: ParsedResumeEntity) => {
    try {
      const parsedValue = JSON.parse(entity.raw_value);
      if (typeof parsedValue === 'object') {
        return JSON.stringify(parsedValue, null, 2);
      }
      return String(parsedValue);
    } catch (error) {
      return entity.raw_value;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* AI Career Insights */}
      <InsightCard
        versionId={versionId}
        enrichment={enrichment}
        narratives={narratives}
        isLoading={enrichmentLoading}
      />

      {/* Extracted Data Sections */}
      {Object.entries(groupedEntities).map(([fieldName, entityGroup]) => (
        <Card key={fieldName}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {fieldName}
            </CardTitle>
            <CardDescription>
              Extracted from your resume
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {entityGroup.map(entity => (
              <div key={entity.id} className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground break-words">
                    {renderEntityValue(entity)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {onEditEntity && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditEntity(entity)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  )}
                  {onDeleteEntity && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteEntity(entity.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
