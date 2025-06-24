
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Users, Merge, Edit3, Trash2, Search, RefreshCw } from 'lucide-react';
import { useUnresolvedEntities, useSimilarEntities, useMergeEntities } from '@/hooks/useEntityGraph';
import type { UnresolvedEntity, SimilarEntity } from '@/types/entity-graph';

const EntityGraphAdminUI: React.FC = () => {
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<UnresolvedEntity | null>(null);

  const { 
    data: unresolvedEntities = [], 
    isLoading: loadingUnresolved, 
    refetch: refetchUnresolved 
  } = useUnresolvedEntities();

  const { 
    data: similarEntities = [], 
    isLoading: loadingSimilar 
  } = useSimilarEntities(selectedEntity?.id);

  const mergeEntitiesMutation = useMergeEntities();

  const filteredEntities = unresolvedEntities.filter(entity => {
    const matchesType = selectedEntityType === 'all' || entity.entity_type === selectedEntityType;
    const matchesSearch = searchTerm === '' || 
      entity.canonical_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entity.aliases.some(alias => alias.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const entityTypes = Array.from(new Set(unresolvedEntities.map(e => e.entity_type)));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'flagged': return 'bg-red-100 text-red-800';
      case 'approved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleMergeEntities = async (sourceId: string, targetId: string) => {
    await mergeEntitiesMutation.mutateAsync({
      sourceEntityId: sourceId,
      targetEntityId: targetId
    });
    refetchUnresolved();
    setSelectedEntity(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Entity Graph Administration</h1>
          <p className="text-muted-foreground">
            Moderate and manage unresolved entities across the system
          </p>
        </div>
        <Button onClick={() => refetchUnresolved()} disabled={loadingUnresolved}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loadingUnresolved ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Unresolved</CardDescription>
            <CardTitle className="text-2xl">{unresolvedEntities.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-2xl">
              {unresolvedEntities.filter(e => e.review_status === 'pending').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Flagged</CardDescription>
            <CardTitle className="text-2xl">
              {unresolvedEntities.filter(e => e.review_status === 'flagged').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Entity Types</CardDescription>
            <CardTitle className="text-2xl">{entityTypes.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search entities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {entityTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>References</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntities.map((entity) => (
                  <TableRow key={entity.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{entity.canonical_name}</div>
                        {entity.aliases.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Aliases: {entity.aliases.join(', ')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{entity.entity_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(entity.review_status)}>
                        {entity.review_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{entity.reference_count}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {entity.referencing_users?.length || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="text-sm">
                          {Math.round((entity.confidence_score || 0) * 100)}%
                        </div>
                        {(entity.confidence_score || 0) < 0.5 && (
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedEntity(entity)}
                            >
                              <Search className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Entity Details & Similar Matches</DialogTitle>
                              <DialogDescription>
                                Review and manage "{entity.canonical_name}"
                              </DialogDescription>
                            </DialogHeader>
                            <EntityDetailsDialog 
                              entity={entity}
                              similarEntities={similarEntities}
                              onMerge={handleMergeEntities}
                              isLoading={loadingSimilar || mergeEntitiesMutation.isPending}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button size="sm" variant="outline">
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

interface EntityDetailsDialogProps {
  entity: UnresolvedEntity;
  similarEntities: SimilarEntity[];
  onMerge: (sourceId: string, targetId: string) => void;
  isLoading: boolean;
}

const EntityDetailsDialog: React.FC<EntityDetailsDialogProps> = ({
  entity,
  similarEntities,
  onMerge,
  isLoading
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Entity Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Name:</span> {entity.canonical_name}
            </div>
            <div>
              <span className="font-medium">Type:</span> {entity.entity_type}
            </div>
            <div>
              <span className="font-medium">Aliases:</span> {entity.aliases.join(', ') || 'None'}
            </div>
            <div>
              <span className="font-medium">References:</span> {entity.reference_count}
            </div>
            <div>
              <span className="font-medium">Users:</span> {entity.referencing_users?.length || 0}
            </div>
            <div>
              <span className="font-medium">Confidence:</span> {Math.round((entity.confidence_score || 0) * 100)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Similar Entities</CardTitle>
            <CardDescription>
              Potential matches for merging or disambiguation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading similar entities...</div>
            ) : similarEntities.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No similar entities found
              </div>
            ) : (
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {similarEntities.map((similar) => (
                    <div
                      key={similar.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{similar.canonical_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Similarity: {Math.round((similar.similarity_score || 0) * 100)}%
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onMerge(entity.id, similar.id)}
                        disabled={isLoading}
                      >
                        <Merge className="w-4 h-4 mr-1" />
                        Merge
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EntityGraphAdminUI;
