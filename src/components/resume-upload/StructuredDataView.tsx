import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Edit,
  GitMerge,
  Calendar,
  MapPin,
  Building
} from 'lucide-react';
import { useParsedResumeEntities } from '@/hooks/useResumeStreams';
import { parseResumeFieldValue, getFieldDisplayName, getSectionFromFieldName } from '@/utils/resumeDataParser';
import { DataRenderer, ConfidenceBadge } from './DataRenderers';
import { MergeDecisionView } from './MergeDecisionView';

interface StructuredDataViewProps {
  versionId: string;
  onProfileUpdated?: () => void;
}

interface StructuredEntity {
  field_name: string;
  raw_value: string;
  confidence_score: number;
  source_type: string;
}

// Helper function to parse and format data for better display
const parseEntityData = (rawValue: string) => {
  try {
    return JSON.parse(rawValue);
  } catch {
    return { value: rawValue };
  }
};

// Helper function to sort chronologically (most recent first)
const sortChronologically = (items: any[]) => {
  return items.sort((a, b) => {
    const aDate = a.end_date || a.start_date || '0000';
    const bDate = b.end_date || b.start_date || '0000';
    return bDate.localeCompare(aDate);
  });
};

// Component to display work experience
const WorkExperienceCard: React.FC<{ data: any; confidence: number }> = ({ data, confidence }) => (
  <div className="p-4 border rounded-lg bg-white">
    <div className="flex justify-between items-start mb-3">
      <div>
        <h4 className="font-semibold text-lg">{data.title || 'Position'}</h4>
        <div className="flex items-center gap-2 text-gray-600 mt-1">
          <Building className="w-4 h-4" />
          <span>{data.company || 'Company'}</span>
        </div>
      </div>
      <ConfidenceBadge score={confidence} />
    </div>
    
    {(data.start_date || data.end_date) && (
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <Calendar className="w-4 h-4" />
        <span>
          {data.start_date || 'Start'} - {data.end_date || 'Present'}
        </span>
      </div>
    )}
    
    {data.description && (
      <div className="mt-3">
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {data.description}
        </p>
      </div>
    )}
  </div>
);

// Component to display education
const EducationCard: React.FC<{ data: any; confidence: number }> = ({ data, confidence }) => (
  <div className="p-4 border rounded-lg bg-white">
    <div className="flex justify-between items-start mb-3">
      <div>
        <h4 className="font-semibold text-lg">{data.degree || 'Degree'}</h4>
        <div className="flex items-center gap-2 text-gray-600 mt-1">
          <GraduationCap className="w-4 h-4" />
          <span>{data.institution || 'Institution'}</span>
        </div>
      </div>
      <ConfidenceBadge score={confidence} />
    </div>
    
    {data.field_of_study && (
      <p className="text-sm text-gray-600 mb-2">Field: {data.field_of_study}</p>
    )}
    
    {(data.start_date || data.end_date) && (
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <Calendar className="w-4 h-4" />
        <span>
          {data.start_date || 'Start'} - {data.end_date || 'Present'}
        </span>
      </div>
    )}
    
    {data.gpa && (
      <p className="text-sm text-gray-600">GPA: {data.gpa}</p>
    )}
  </div>
);

// Component to display skills
const SkillCard: React.FC<{ data: any; confidence: number }> = ({ data, confidence }) => (
  <div className="p-3 border rounded-lg bg-white flex justify-between items-center">
    <div>
      <h4 className="font-medium">{data.name || 'Skill'}</h4>
      <div className="flex gap-2 mt-1">
        {data.category && (
          <Badge variant="secondary" className="text-xs">{data.category}</Badge>
        )}
        {data.proficiency_level && (
          <Badge variant="outline" className="text-xs">{data.proficiency_level}</Badge>
        )}
      </div>
    </div>
    <ConfidenceBadge score={confidence} />
  </div>
);

export const StructuredDataView: React.FC<StructuredDataViewProps> = ({ 
  versionId, 
  onProfileUpdated 
}) => {
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

  // Group and organize entities by type
  const organizedData = {
    personal: [] as any[],
    experience: [] as any[],
    education: [] as any[],
    skills: [] as any[],
    other: [] as any[]
  };

  entities.forEach(entity => {
    const parsedData = parseEntityData(entity.raw_value);
    const section = getSectionFromFieldName(entity.field_name);
    
    const entityWithData = {
      ...entity,
      parsedData,
      displayName: getFieldDisplayName(entity.field_name)
    };

    switch (section) {
      case 'personal_info':
      case 'contact':
        organizedData.personal.push(entityWithData);
        break;
      case 'work_experience':
        organizedData.experience.push(entityWithData);
        break;
      case 'education':
        organizedData.education.push(entityWithData);
        break;
      case 'skills':
        organizedData.skills.push(entityWithData);
        break;
      default:
        organizedData.other.push(entityWithData);
    }
  });

  // Sort experience and education chronologically (most recent first)
  organizedData.experience = sortChronologically(
    organizedData.experience.map(e => ({ ...e, ...e.parsedData }))
  );
  organizedData.education = sortChronologically(
    organizedData.education.map(e => ({ ...e, ...e.parsedData }))
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Resume Analysis Results
          </CardTitle>
          <CardDescription>
            Review extracted data and merge with your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="formatted" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="formatted" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Formatted View
              </TabsTrigger>
              <TabsTrigger value="merge" className="flex items-center gap-2">
                <GitMerge className="w-4 h-4" />
                Review & Merge
              </TabsTrigger>
              <TabsTrigger value="raw" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Raw Data
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="formatted" className="mt-6">
              <div className="space-y-8">
                {/* Personal Information */}
                {organizedData.personal.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {organizedData.personal.map((item, index) => (
                        <div key={index} className="p-3 border rounded-lg bg-white">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-sm text-gray-600">{item.displayName}</p>
                              <p className="text-lg">{item.parsedData.displayValue || item.parsedData.value}</p>
                            </div>
                            <ConfidenceBadge score={item.confidence_score} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Work Experience */}
                {organizedData.experience.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      Work Experience
                    </h3>
                    <div className="space-y-4">
                      {organizedData.experience.map((item, index) => (
                        <WorkExperienceCard
                          key={index}
                          data={item.parsedData}
                          confidence={item.confidence_score}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {organizedData.education.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      Education
                    </h3>
                    <div className="space-y-4">
                      {organizedData.education.map((item, index) => (
                        <EducationCard
                          key={index}
                          data={item.parsedData}
                          confidence={item.confidence_score}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {organizedData.skills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      Skills
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {organizedData.skills.map((item, index) => (
                        <SkillCard
                          key={index}
                          data={item.parsedData}
                          confidence={item.confidence_score}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Information */}
                {organizedData.other.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Additional Information
                    </h3>
                    <div className="space-y-3">
                      {organizedData.other.map((item, index) => (
                        <div key={index} className="p-3 border rounded-lg bg-white">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-600 mb-1">
                                {item.displayName}
                              </p>
                              <DataRenderer 
                                fieldName={item.field_name}
                                parsedData={item.parsedData}
                                confidence={item.confidence_score}
                              />
                            </div>
                            <ConfidenceBadge score={item.confidence_score} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="merge" className="mt-6">
              <MergeDecisionView versionId={versionId} onProfileUpdated={onProfileUpdated} />
            </TabsContent>
            
            <TabsContent value="raw" className="mt-6">
              <div className="space-y-6">
                <div className="text-sm text-muted-foreground">
                  {entities.length} data points extracted - showing raw parsed data
                </div>
                <div className="space-y-4">
                  {entities.map((entity, index) => {
                    const parsedData = parseResumeFieldValue(entity.raw_value);
                    const displayName = getFieldDisplayName(entity.field_name);

                    return (
                      <div key={index} className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-sm">{displayName}</span>
                          <div className="flex items-center gap-2">
                            <ConfidenceBadge score={entity.confidence_score} />
                            <Badge variant="outline" className="text-xs">
                              {entity.source_type}
                            </Badge>
                          </div>
                        </div>
                        
                        <DataRenderer 
                          fieldName={entity.field_name}
                          parsedData={parsedData}
                          confidence={entity.confidence_score}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
