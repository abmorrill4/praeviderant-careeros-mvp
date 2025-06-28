
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface EntityNormalizationTabProps {
  resumeVersionId?: string;
}

export const EntityNormalizationTab: React.FC<EntityNormalizationTabProps> = ({
  resumeVersionId
}) => {
  const [selectedStatus, setSelectedStatus] = React.useState('all');
  const [selectedEntity, setSelectedEntity] = React.useState('all');

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value || 'all');
  };

  const handleEntityChange = (value: string) => {
    setSelectedEntity(value || 'all');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Entity Normalization
          </CardTitle>
          <CardDescription>
            Review and normalize extracted resume entities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Filter by Status</label>
                <Select value={selectedStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Filter by Entity</label>
                <Select value={selectedEntity} onValueChange={handleEntityChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entities</SelectItem>
                    <SelectItem value="experience">Experience</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="skills">Skills</SelectItem>
                    <SelectItem value="contact">Contact Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {resumeVersionId ? (
              <div className="mt-6">
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading entity normalization data...</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a resume to view entity normalization</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
