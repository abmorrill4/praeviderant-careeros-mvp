
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  User, 
  Briefcase, 
  GraduationCap, 
  Code, 
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useParsedResumeEntities } from '@/hooks/useResumeStreams';
import { parseResumeFieldValue, getFieldDisplayName, getSectionFromFieldName } from '@/utils/resumeDataParser';

interface CompactDataReviewProps {
  versionId: string;
  onProfileUpdated?: () => void;
}

interface GroupedEntity {
  field_name: string;
  raw_value: string;
  confidence_score: number;
  source_type: string;
}

export const CompactDataReview: React.FC<CompactDataReviewProps> = ({ 
  versionId, 
  onProfileUpdated 
}) => {
  const { data: entities, isLoading, error } = useParsedResumeEntities(versionId);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['personal_info']));
  const [showAllFields, setShowAllFields] = useState(false);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Extracted Data Review
          </CardTitle>
          <CardDescription>Loading extracted data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error || !entities) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="w-5 h-5" />
            Data Extraction Error
          </CardTitle>
          <CardDescription>Unable to load extracted data</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Group entities by section
  const groupedData: Record<string, GroupedEntity[]> = {};
  entities.forEach(entity => {
    const section = getSectionFromFieldName(entity.field_name);
    if (!groupedData[section]) {
      groupedData[section] = [];
    }
    groupedData[section].push(entity);
  });

  // Section configurations with priorities
  const sectionConfigs: Record<string, { title: string; icon: React.ReactNode; priority: number }> = {
    personal_info: { title: 'Personal Info', icon: <User className="w-4 h-4" />, priority: 1 },
    work_experience: { title: 'Experience', icon: <Briefcase className="w-4 h-4" />, priority: 2 },
    education: { title: 'Education', icon: <GraduationCap className="w-4 h-4" />, priority: 3 },
    skills: { title: 'Skills', icon: <Code className="w-4 h-4" />, priority: 4 },
    certifications: { title: 'Certifications', icon: <CheckCircle className="w-4 h-4" />, priority: 5 },
    general: { title: 'Other', icon: <FileText className="w-4 h-4" />, priority: 6 }
  };

  const sortedSections = Object.entries(groupedData).sort(([a], [b]) => {
    const priorityA = sectionConfigs[a]?.priority || 999;
    const priorityB = sectionConfigs[b]?.priority || 999;
    return priorityA - priorityB;
  });

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.8) return <Badge variant="default" className="text-xs">High</Badge>;
    if (score >= 0.6) return <Badge variant="secondary" className="text-xs">Medium</Badge>;
    return <Badge variant="outline" className="text-xs">Low</Badge>;
  };

  const renderCompactField = (entity: GroupedEntity) => {
    const displayName = getFieldDisplayName(entity.field_name);
    const parsedData = parseResumeFieldValue(entity.raw_value);
    
    return (
      <div key={entity.field_name} className="flex items-start justify-between py-2 border-b border-muted last:border-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">{displayName}</span>
            {getConfidenceBadge(entity.confidence_score)}
          </div>
          <div className="text-sm text-muted-foreground line-clamp-2">
            {typeof parsedData === 'string' ? parsedData : JSON.stringify(parsedData)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Data Review ({entities.length} fields)
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllFields(!showAllFields)}
            className="flex items-center gap-2"
          >
            {showAllFields ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAllFields ? 'Compact View' : 'Detailed View'}
          </Button>
        </div>
        <CardDescription>
          Review extracted data and expand sections as needed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedSections.map(([sectionKey, sectionEntities]) => {
            const config = sectionConfigs[sectionKey] || { 
              title: sectionKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
              icon: <FileText className="w-4 h-4" />,
              priority: 999
            };
            
            const isExpanded = expandedSections.has(sectionKey);
            const highConfidenceCount = sectionEntities.filter(e => e.confidence_score >= 0.8).length;
            
            return (
              <div key={sectionKey} className="border rounded-lg">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleSection(sectionKey)}
                >
                  <div className="flex items-center gap-2">
                    {config.icon}
                    <span className="font-medium">{config.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {sectionEntities.length} field{sectionEntities.length !== 1 ? 's' : ''}
                    </Badge>
                    {highConfidenceCount > 0 && (
                      <Badge variant="default" className="text-xs">
                        {highConfidenceCount} high confidence
                      </Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    {isExpanded ? 'Collapse' : 'Expand'}
                  </Button>
                </div>
                
                {isExpanded && (
                  <div className="px-4 pb-4 border-t">
                    <div className="mt-4 space-y-1">
                      {sectionEntities
                        .sort((a, b) => b.confidence_score - a.confidence_score)
                        .slice(0, showAllFields ? undefined : 5)
                        .map(renderCompactField)}
                      
                      {!showAllFields && sectionEntities.length > 5 && (
                        <div className="pt-2 text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowAllFields(true)}
                          >
                            Show {sectionEntities.length - 5} more fields...
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
