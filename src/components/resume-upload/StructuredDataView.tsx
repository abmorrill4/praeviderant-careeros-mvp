
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
  Calendar,
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
  CheckCircle,
  AlertCircle,
  Edit
} from 'lucide-react';
import { useParsedResumeEntities } from '@/hooks/useResumeStreams';

interface StructuredDataViewProps {
  versionId: string;
}

interface StructuredEntity {
  field_name: string;
  raw_value: string;
  confidence_score: number;
  source_type: string;
}

interface StructuredSection {
  title: string;
  icon: React.ReactNode;
  items: StructuredEntity[];
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
    const section = entity.field_name.split('.')[0];
    if (!groupedData[section]) {
      groupedData[section] = [];
    }
    groupedData[section].push(entity);
  });

  // Define section configurations
  const sectionConfigs: Record<string, { title: string; icon: React.ReactNode }> = {
    personal_info: { title: 'Personal Information', icon: <User className="w-4 h-4" /> },
    contact: { title: 'Contact Details', icon: <Mail className="w-4 h-4" /> },
    work_experience: { title: 'Work Experience', icon: <Briefcase className="w-4 h-4" /> },
    education: { title: 'Education', icon: <GraduationCap className="w-4 h-4" /> },
    skills: { title: 'Skills', icon: <Code className="w-4 h-4" /> },
    certifications: { title: 'Certifications', icon: <Award className="w-4 h-4" /> },
    projects: { title: 'Projects', icon: <FileText className="w-4 h-4" /> },
  };

  const formatFieldName = (fieldName: string) => {
    return fieldName
      .split('.')
      .pop()
      ?.replace(/_/g, ' ')
      ?.replace(/\b\w/g, l => l.toUpperCase()) || fieldName;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceVariant = (score: number) => {
    if (score >= 0.8) return 'default';
    if (score >= 0.6) return 'secondary';
    return 'outline';
  };

  const renderFieldIcon = (fieldName: string) => {
    const field = fieldName.toLowerCase();
    if (field.includes('email')) return <Mail className="w-3 h-3" />;
    if (field.includes('phone')) return <Phone className="w-3 h-3" />;
    if (field.includes('address') || field.includes('location')) return <MapPin className="w-3 h-3" />;
    if (field.includes('website') || field.includes('url')) return <Globe className="w-3 h-3" />;
    if (field.includes('date')) return <Calendar className="w-3 h-3" />;
    if (field.includes('company') || field.includes('organization')) return <Building className="w-3 h-3" />;
    return <CheckCircle className="w-3 h-3" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Extracted Information
          </CardTitle>
          <CardDescription>
            Structured data extracted from your resume • {entities.length} data points
          </CardDescription>
        </CardHeader>
      </Card>

      {Object.entries(groupedData).map(([sectionKey, sectionEntities]) => {
        const config = sectionConfigs[sectionKey] || { 
          title: sectionKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
          icon: <FileText className="w-4 h-4" /> 
        };

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
                {sectionEntities.map((entity, index) => (
                  <div key={entity.field_name + index} className="flex items-start justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {renderFieldIcon(entity.field_name)}
                        <span className="font-medium text-sm">
                          {formatFieldName(entity.field_name)}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{entity.raw_value}</p>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={getConfidenceVariant(entity.confidence_score)}
                          className="text-xs"
                        >
                          {Math.round(entity.confidence_score * 100)}% confidence
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {entity.source_type}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-4">
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
