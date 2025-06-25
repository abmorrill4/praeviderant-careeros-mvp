
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Code, 
  User,
  Mail,
  CheckCircle,
  AlertCircle,
  Edit
} from 'lucide-react';
import { useParsedResumeEntities } from '@/hooks/useResumeStreams';
import { parseResumeFieldValue, getFieldDisplayName, getSectionFromFieldName } from '@/utils/resumeDataParser';
import { DataRenderer, ConfidenceBadge } from './DataRenderers';

interface StructuredDataViewProps {
  versionId: string;
}

interface StructuredEntity {
  field_name: string;
  raw_value: string;
  confidence_score: number;
  source_type: string;
}

export const StructuredDataView: React.FC<StructuredDataViewProps> = ({ versionId }) => {
  const { data: entities, isLoading, error } = useParsedResumeEntities(versionId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Extracted Information
          </CardTitle>
          <CardDescription>Loading structured data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error || !entities) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Data Extraction Error
          </CardTitle>
          <CardDescription>
            Unable to load structured data from this resume
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Group entities by section
  const groupedData: Record<string, StructuredEntity[]> = {};
  
  entities.forEach(entity => {
    const section = getSectionFromFieldName(entity.field_name);
    if (!groupedData[section]) {
      groupedData[section] = [];
    }
    groupedData[section].push(entity);
  });

  // Define section configurations
  const sectionConfigs: Record<string, { title: string; icon: React.ReactNode; priority: number }> = {
    personal_info: { title: 'Personal Information', icon: <User className="w-4 h-4" />, priority: 1 },
    contact: { title: 'Contact Details', icon: <Mail className="w-4 h-4" />, priority: 2 },
    work_experience: { title: 'Work Experience', icon: <Briefcase className="w-4 h-4" />, priority: 3 },
    education: { title: 'Education', icon: <GraduationCap className="w-4 h-4" />, priority: 4 },
    skills: { title: 'Skills', icon: <Code className="w-4 h-4" />, priority: 5 },
    certifications: { title: 'Certifications', icon: <Award className="w-4 h-4" />, priority: 6 },
    projects: { title: 'Projects', icon: <FileText className="w-4 h-4" />, priority: 7 },
    general: { title: 'Other Information', icon: <FileText className="w-4 h-4" />, priority: 8 }
  };

  // Sort sections by priority
  const sortedSections = Object.entries(groupedData).sort(([a], [b]) => {
    const priorityA = sectionConfigs[a]?.priority || 999;
    const priorityB = sectionConfigs[b]?.priority || 999;
    return priorityA - priorityB;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Extracted Information
          </CardTitle>
          <CardDescription>
            Structured data extracted from your resume • {entities.length} data points across {Object.keys(groupedData).length} sections
          </CardDescription>
        </CardHeader>
      </Card>

      {sortedSections.map(([sectionKey, sectionEntities]) => {
        const config = sectionConfigs[sectionKey] || { 
          title: sectionKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
          icon: <FileText className="w-4 h-4" />,
          priority: 999
        };

        // Sort entities within section by confidence score
        const sortedEntities = sectionEntities.sort((a, b) => b.confidence_score - a.confidence_score);

        return (
          <Card key={sectionKey}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {config.icon}
                {config.title}
              </CardTitle>
              <CardDescription>
                {sectionEntities.length} field{sectionEntities.length !== 1 ? 's' : ''} extracted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedEntities.map((entity, index) => {
                  const parsedData = parseResumeFieldValue(entity.raw_value);
                  const displayName = getFieldDisplayName(entity.field_name);

                  return (
                    <div key={entity.field_name + index} className="flex items-start justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {displayName}
                          </span>
                        </div>
                        
                        <DataRenderer 
                          fieldName={entity.field_name}
                          parsedData={parsedData}
                          confidence={entity.confidence_score}
                        />
                        
                        <div className="flex items-center gap-2">
                          <ConfidenceBadge score={entity.confidence_score} />
                          <Badge variant="outline" className="text-xs">
                            {entity.source_type}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="ml-4">
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
