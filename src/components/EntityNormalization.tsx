
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Link as LinkIcon, Plus, RefreshCw, Target, AlertCircle } from 'lucide-react';
import { 
  useNormalizedEntities, 
  useResumeEntityLinks, 
  useNormalizationJobs,
  useNormalizeEntities,
  useManualEntityLink,
  useCreateNormalizedEntity
} from '@/hooks/useNormalization';
import { useParsedResumeEntities } from '@/hooks/useResumeStreams';

interface EntityNormalizationProps {
  versionId: string;
}

export const EntityNormalization: React.FC<EntityNormalizationProps> = ({ versionId }) => {
  const [selectedEntityType, setSelectedEntityType] = useState<string>('');
  const [newEntityName, setNewEntityName] = useState('');
  const [linkingMode, setLinkingMode] = useState(false);

  // Data hooks
  const { data: parsedEntities } = useParsedResumeEntities(versionId);
  const { data: normalizedEntities } = useNormalizedEntities(selectedEntityType || undefined);
  const { data: entityLinks, refetch: refetchLinks } = useResumeEntityLinks(versionId);
  const { data: jobs } = useNormalizationJobs(versionId);

  // Mutation hooks
  const normalizeEntitiesMutation = useNormalizeEntities();
  const manualLinkMutation = useManualEntityLink();
  const createEntityMutation = useCreateNormalizedEntity();

  // Group parsed entities by field type
  const groupedParsedEntities = React.useMemo(() => {
    if (!parsedEntities) return {};
    
    return parsedEntities.reduce((acc, entity) => {
      const section = entity.field_name.split('.')[0];
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(entity);
      return acc;
    }, {} as Record<string, typeof parsedEntities>);
  }, [parsedEntities]);

  // Get entity types from parsed entities
  const entityTypes = React.useMemo(() => {
    return Object.keys(groupedParsedEntities);
  }, [groupedParsedEntities]);

  // Check if entity is already linked
  const isEntityLinked = (parsedEntityId: string) => {
    return entityLinks?.some(link => link.parsed_entity_id === parsedEntityId);
  };

  // Get link for entity
  const getEntityLink = (parsedEntityId: string) => {
    return entityLinks?.find(link => link.parsed_entity_id === parsedEntityId);
  };

  // Get normalized entity by ID
  const getNormalizedEntity = (normalizedEntityId: string) => {
    return normalizedEntities?.find(entity => entity.id === normalizedEntityId);
  };

  const handleNormalizeAll = () => {
    normalizeEntitiesMutation.mutate({ versionId });
  };

  const handleNormalizeByType = (entityType: string) => {
    normalizeEntitiesMutation.mutate({ versionId, entityType });
  };

  const handleManualLink = (parsedEntityId: string, normalizedEntityId: string) => {
    manualLinkMutation.mutate({ parsedEntityId, normalizedEntityId });
  };

  const handleCreateEntity = () => {
    if (!newEntityName || !selectedEntityType) return;
    
    createEntityMutation.mutate({
      entityType: selectedEntityType,
      canonicalName: newEntityName,
      aliases: [newEntityName.toLowerCase()]
    });
    
    setNewEntityName('');
  };

  const getMatchBadgeColor = (matchMethod: string, matchScore: number) => {
    if (matchMethod === 'manual') return 'bg-blue-100 text-blue-800';
    if (matchScore >= 0.9) return 'bg-green-100 text-green-800';
    if (matchScore >= 0.8) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const latestJob = jobs?.[0];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Entity Normalization
          </CardTitle>
          <CardDescription>
            Normalize and link resume entities to the canonical knowledge graph
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Job Status */}
          {latestJob && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Latest Normalization Job</span>
                <Badge variant={latestJob.status === 'completed' ? 'default' : 'secondary'}>
                  {latestJob.status}
                </Badge>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total:</span> {latestJob.total_entities}
                </div>
                <div>
                  <span className="text-muted-foreground">Matched:</span> {latestJob.matched_entities}
                </div>
                <div>
                  <span className="text-muted-foreground">Orphaned:</span> {latestJob.orphaned_entities}
                </div>
                <div>
                  <span className="text-muted-foreground">Processed:</span> {latestJob.processed_entities}
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={handleNormalizeAll}
              disabled={normalizeEntitiesMutation.isPending}
            >
              {normalizeEntitiesMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Target className="w-4 h-4 mr-2" />
              )}
              Normalize All Entities
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => refetchLinks()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Links
            </Button>
          </div>

          {/* Entity Type Filter */}
          <div className="flex gap-2">
            <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {entityTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedEntityType && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleNormalizeByType(selectedEntityType)}
              >
                Normalize {selectedEntityType}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create New Normalized Entity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Normalized Entity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tool">Tool</SelectItem>
                <SelectItem value="skill">Skill</SelectItem>
                <SelectItem value="employer">Employer</SelectItem>
                <SelectItem value="certification">Certification</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              placeholder="Entity name"
              value={newEntityName}
              onChange={(e) => setNewEntityName(e.target.value)}
              className="flex-1"
            />
            
            <Button 
              onClick={handleCreateEntity}
              disabled={!newEntityName || !selectedEntityType || createEntityMutation.isPending}
            >
              {createEntityMutation.isPending ? (
                <Loader2 className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Parsed Entities with Links */}
      <Card>
        <CardHeader>
          <CardTitle>Entity Links</CardTitle>
          <CardDescription>
            Parsed entities and their normalization links
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(groupedParsedEntities).map(([section, entities]) => (
            <div key={section}>
              <h3 className="font-medium mb-3 capitalize">
                {section.replace(/_/g, ' ')} ({entities.length})
              </h3>
              <div className="space-y-2">
                {entities.map((entity) => {
                  const link = getEntityLink(entity.id);
                  const normalizedEntity = link ? getNormalizedEntity(link.normalized_entity_id) : null;
                  const isLinked = isEntityLinked(entity.id);

                  return (
                    <div 
                      key={entity.id} 
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {entity.raw_value}
                          </span>
                          {isLinked && (
                            <Badge 
                              variant="secondary" 
                              className={getMatchBadgeColor(link!.match_method, link!.match_score)}
                            >
                              <LinkIcon className="w-3 h-3 mr-1" />
                              {link!.match_method} ({Math.round(link!.match_score * 100)}%)
                            </Badge>
                          )}
                          {link?.review_required && (
                            <Badge variant="outline" className="border-orange-200 text-orange-800">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Review
                            </Badge>
                          )}
                        </div>
                        {normalizedEntity && (
                          <p className="text-sm text-muted-foreground">
                            → {normalizedEntity.canonical_name}
                            {normalizedEntity.aliases.length > 0 && (
                              <span className="ml-2">
                                (aliases: {normalizedEntity.aliases.join(', ')})
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Separator className="mt-4" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
