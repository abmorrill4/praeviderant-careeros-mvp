
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Database, FileText, Merge, Search, Filter } from 'lucide-react';
import { useUnresolvedEntities, useSimilarEntities, useMergeEntities, useUpdateEntityStatus, useDeleteEntity } from '@/hooks/useEntityGraph';
import { PromptTemplateManager } from './PromptTemplateManager';
import type { UnresolvedEntity } from '@/types/entity-graph';

const EntityGraphAdminUI: React.FC = () => {
  const [selectedEntity, setSelectedEntity] = useState<UnresolvedEntity | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { data: unresolvedEntities, isLoading } = useUnresolvedEntities();
  const { data: similarEntities } = useSimilarEntities(selectedEntity?.id);
  const mergeMutation = useMergeEntities();
  const updateStatusMutation = useUpdateEntityStatus();
  const deleteEntityMutation = useDeleteEntity();

  // Filter entities based on search and filters
  const filteredEntities = unresolvedEntities?.filter(entity => {
    const matchesSearch = entity.canonical_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entity.aliases.some(alias => alias.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || entity.review_status === statusFilter;
    const matchesType = typeFilter === 'all' || entity.entity_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  const handleMergeEntities = async (sourceId: string, targetId: string) => {
    await mergeMutation.mutateAsync({ sourceEntityId: sourceId, targetEntityId: targetId });
    setSelectedEntity(null);
  };

  const handleUpdateStatus = async (entityId: string, status: 'approved' | 'pending' | 'flagged') => {
    await updateStatusMutation.mutateAsync({ entityId, status });
  };

  const handleDeleteEntity = async (entityId: string) => {
    await deleteEntityMutation.mutateAsync(entityId);
    if (selectedEntity?.id === entityId) {
      setSelectedEntity(null);
    }
  };

  // Get unique entity types for filter
  const entityTypes = [...new Set(unresolvedEntities?.map(e => e.entity_type) || [])];

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Entity Graph Administration</h1>
          <p className="text-muted-foreground">
            Manage normalized entities, resolve conflicts, and configure prompt templates
          </p>
        </div>
      </div>

      <Tabs defaultValue="entities" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="entities" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Entity Management
          </TabsTrigger>
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Prompt Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entities">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Filters and Entity List */}
            <div className="lg:col-span-2 space-y-4">
              {/* Filters */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Search</label>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search entities..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="flagged">Flagged</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Type</label>
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          {entityTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Entity List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Unresolved Entities ({filteredEntities.length})
                  </CardTitle>
                  <CardDescription>
                    Entities requiring review or normalization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredEntities.map((entity) => (
                      <div
                        key={entity.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedEntity?.id === entity.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedEntity(entity)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{entity.canonical_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {entity.entity_type} • {entity.reference_count} references
                            </p>
                            {entity.aliases.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {entity.aliases.slice(0, 3).map((alias, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {alias}
                                  </Badge>
                                ))}
                                {entity.aliases.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{entity.aliases.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                entity.review_status === 'approved' ? 'default' :
                                entity.review_status === 'flagged' ? 'destructive' : 'secondary'
                              }
                            >
                              {entity.review_status}
                            </Badge>
                            <Badge variant="outline">
                              {Math.round(entity.confidence_score * 100)}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {filteredEntities.length === 0 && (
                      <div className="text-center py-8">
                        <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No entities match your filters</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Entity Details */}
            <div className="space-y-4">
              {selectedEntity ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedEntity.canonical_name}</CardTitle>
                      <CardDescription>Entity Details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Type</label>
                        <p className="text-sm text-muted-foreground">{selectedEntity.entity_type}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">References</label>
                        <p className="text-sm text-muted-foreground">{selectedEntity.reference_count} occurrences</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Confidence</label>
                        <p className="text-sm text-muted-foreground">{Math.round(selectedEntity.confidence_score * 100)}%</p>
                      </div>

                      {selectedEntity.aliases.length > 0 && (
                        <div>
                          <label className="text-sm font-medium">Aliases</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedEntity.aliases.map((alias, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {alias}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(selectedEntity.id, 'approved')}
                          disabled={updateStatusMutation.isPending}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(selectedEntity.id, 'flagged')}
                          disabled={updateStatusMutation.isPending}
                        >
                          Flag
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteEntity(selectedEntity.id)}
                          disabled={deleteEntityMutation.isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {similarEntities && similarEntities.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Merge className="w-4 h-4" />
                          Similar Entities
                        </CardTitle>
                        <CardDescription>
                          Potential merge candidates
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {similarEntities.map((similar) => (
                            <div key={similar.id} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{similar.canonical_name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {Math.round(similar.similarity_score * 100)}% similarity
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleMergeEntities(selectedEntity.id, similar.id)}
                                  disabled={mergeMutation.isPending}
                                >
                                  Merge
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Select an entity to view details and similar entities
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="prompts">
          <PromptTemplateManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EntityGraphAdminUI;
