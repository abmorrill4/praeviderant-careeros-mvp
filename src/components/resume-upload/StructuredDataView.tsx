
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileText, 
  User, 
  Briefcase, 
  GraduationCap, 
  Code, 
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Sparkles,
  Filter,
  Search,
  Edit,
  Save,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building,
  Award,
  Settings,
  Plus
} from 'lucide-react';
import { useParsedResumeEntities } from '@/hooks/useResumeStreams';
import { parseResumeFieldValue, getFieldDisplayName, getSectionFromFieldName } from '@/utils/resumeDataParser';
import { ConfidenceBadge } from './DataRenderers';
import { useToast } from '@/hooks/use-toast';

interface StructuredDataViewProps {
  versionId: string;
  onProfileUpdated?: () => void;
}

interface GroupedEntity {
  field_name: string;
  raw_value: string;
  confidence_score: number;
  source_type: string;
  parsedData: any;
  displayName: string;
  id: string;
}

interface CategoryConfig {
  title: string;
  icon: React.ReactNode;
  priority: number;
  color: string;
}

export const StructuredDataView: React.FC<StructuredDataViewProps> = ({ 
  versionId, 
  onProfileUpdated 
}) => {
  const { data: entities, isLoading, error } = useParsedResumeEntities(versionId);
  const { toast } = useToast();
  
  // State management
  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(new Set());
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');
  const [customCategories, setCustomCategories] = useState<Record<string, string>>({});

  // Enhanced section configurations
  const sectionConfigs: Record<string, CategoryConfig> = {
    personal_info: { 
      title: 'Personal Information', 
      icon: <User className="w-4 h-4" />, 
      priority: 1,
      color: 'bg-blue-100 text-blue-800'
    },
    contact: { 
      title: 'Contact Details', 
      icon: <Phone className="w-4 h-4" />, 
      priority: 2,
      color: 'bg-green-100 text-green-800'
    },
    work_experience: { 
      title: 'Work Experience', 
      icon: <Briefcase className="w-4 h-4" />, 
      priority: 3,
      color: 'bg-purple-100 text-purple-800'
    },
    education: { 
      title: 'Education', 
      icon: <GraduationCap className="w-4 h-4" />, 
      priority: 4,
      color: 'bg-orange-100 text-orange-800'
    },
    skills: { 
      title: 'Skills', 
      icon: <Code className="w-4 h-4" />, 
      priority: 5,
      color: 'bg-indigo-100 text-indigo-800'
    },
    certifications: { 
      title: 'Certifications', 
      icon: <Award className="w-4 h-4" />, 
      priority: 6,
      color: 'bg-yellow-100 text-yellow-800'
    },
    general: { 
      title: 'Other Information', 
      icon: <FileText className="w-4 h-4" />, 
      priority: 7,
      color: 'bg-gray-100 text-gray-800'
    }
  };

  // Process and organize entities
  const organizedData = useMemo(() => {
    if (!entities) return {};

    const grouped: Record<string, GroupedEntity[]> = {};
    
    entities.forEach((entity, index) => {
      const parsedData = parseResumeFieldValue(entity.raw_value);
      const section = getSectionFromFieldName(entity.field_name);
      const finalSection = customCategories[entity.field_name] || section;
      
      if (!grouped[finalSection]) {
        grouped[finalSection] = [];
      }
      
      grouped[finalSection].push({
        ...entity,
        parsedData,
        displayName: getFieldDisplayName(entity.field_name),
        id: `${entity.field_name}-${index}`
      });
    });

    // Apply filters
    Object.keys(grouped).forEach(section => {
      grouped[section] = grouped[section].filter(entity => {
        // Confidence filter
        if (confidenceFilter !== 'all') {
          const score = entity.confidence_score;
          if (confidenceFilter === 'high' && score < 0.8) return false;
          if (confidenceFilter === 'medium' && (score < 0.6 || score >= 0.8)) return false;
          if (confidenceFilter === 'low' && score >= 0.6) return false;
        }

        // Search filter
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          return (
            entity.displayName.toLowerCase().includes(searchLower) ||
            entity.field_name.toLowerCase().includes(searchLower) ||
            JSON.stringify(entity.parsedData).toLowerCase().includes(searchLower)
          );
        }

        return true;
      });
    });

    return grouped;
  }, [entities, confidenceFilter, searchQuery, customCategories]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Loading Resume Analysis
          </CardTitle>
          <CardDescription>Processing extracted data...</CardDescription>
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

  const handleEntityToggle = (entityId: string) => {
    const newSelected = new Set(selectedEntities);
    if (newSelected.has(entityId)) {
      newSelected.delete(entityId);
    } else {
      newSelected.add(entityId);
    }
    setSelectedEntities(newSelected);
  };

  const handleSelectAll = () => {
    const allIds = Object.values(organizedData).flat().map(e => e.id);
    setSelectedEntities(new Set(allIds));
  };

  const handleClearSelection = () => {
    setSelectedEntities(new Set());
  };

  const handleBulkMerge = async () => {
    if (selectedEntities.size === 0) return;
    
    toast({
      title: "Merging Selected Items",
      description: `Processing ${selectedEntities.size} selected items...`,
    });
    
    // Implement bulk merge logic here
    onProfileUpdated?.();
  };

  const handleCategoryChange = (entityId: string, newCategory: string) => {
    const entity = Object.values(organizedData).flat().find(e => e.id === entityId);
    if (entity) {
      setCustomCategories(prev => ({
        ...prev,
        [entity.field_name]: newCategory
      }));
    }
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.8) return <Badge className="bg-green-100 text-green-800 text-xs">High</Badge>;
    if (score >= 0.6) return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Medium</Badge>;
    return <Badge className="bg-red-100 text-red-800 text-xs">Low</Badge>;
  };

  const renderPersonalInfoCard = (entity: GroupedEntity) => (
    <div key={entity.id} className="p-4 border rounded-lg bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <Checkbox
              checked={selectedEntities.has(entity.id)}
              onCheckedChange={() => handleEntityToggle(entity.id)}
            />
            <div className="flex items-center gap-2">
              {entity.field_name.includes('email') && <Mail className="w-4 h-4 text-gray-500" />}
              {entity.field_name.includes('phone') && <Phone className="w-4 h-4 text-gray-500" />}
              {entity.field_name.includes('address') && <MapPin className="w-4 h-4 text-gray-500" />}
              <span className="font-medium text-sm">{entity.displayName}</span>
            </div>
          </div>
          <p className="text-lg font-semibold text-gray-900 ml-7">
            {typeof entity.parsedData === 'object' ? entity.parsedData.displayValue || entity.parsedData.value : entity.parsedData}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getConfidenceBadge(entity.confidence_score)}
        </div>
      </div>
    </div>
  );

  const renderWorkExperienceCard = (entity: GroupedEntity) => {
    const data = typeof entity.parsedData === 'object' ? entity.parsedData : { value: entity.parsedData };
    
    return (
      <div key={entity.id} className="p-4 border rounded-lg bg-white hover:shadow-sm transition-shadow">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={selectedEntities.has(entity.id)}
            onCheckedChange={() => handleEntityToggle(entity.id)}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-lg">{data.title || data.position || 'Position'}</h4>
                <div className="flex items-center gap-2 text-gray-600 mt-1">
                  <Building className="w-4 h-4" />
                  <span>{data.company || 'Company'}</span>
                </div>
              </div>
              {getConfidenceBadge(entity.confidence_score)}
            </div>
            
            {(data.start_date || data.end_date) && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                <Calendar className="w-4 h-4" />
                <span>{data.start_date || 'Start'} - {data.end_date || 'Present'}</span>
              </div>
            )}
            
            {data.description && (
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                {data.description}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSkillCard = (entity: GroupedEntity) => {
    const data = typeof entity.parsedData === 'object' ? entity.parsedData : { name: entity.parsedData };
    
    return (
      <div key={entity.id} className="p-3 border rounded-lg bg-white hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedEntities.has(entity.id)}
              onCheckedChange={() => handleEntityToggle(entity.id)}
            />
            <div>
              <h4 className="font-medium">{data.name || data.skill || entity.displayName}</h4>
              <div className="flex gap-2 mt-1">
                {data.category && (
                  <Badge variant="secondary" className="text-xs">{data.category}</Badge>
                )}
                {data.proficiency_level && (
                  <Badge variant="outline" className="text-xs">{data.proficiency_level}</Badge>
                )}
              </div>
            </div>
          </div>
          {getConfidenceBadge(entity.confidence_score)}
        </div>
      </div>
    );
  };

  const renderGenericCard = (entity: GroupedEntity) => (
    <div key={entity.id} className="p-3 border rounded-lg bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <Checkbox
            checked={selectedEntities.has(entity.id)}
            onCheckedChange={() => handleEntityToggle(entity.id)}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{entity.displayName}</span>
              <Select
                value={customCategories[entity.field_name] || getSectionFromFieldName(entity.field_name)}
                onValueChange={(value) => handleCategoryChange(entity.id, value)}
              >
                <SelectTrigger className="w-auto h-6 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(sectionConfigs).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground line-clamp-2">
              {typeof entity.parsedData === 'string' 
                ? entity.parsedData 
                : entity.parsedData.displayValue || JSON.stringify(entity.parsedData)
              }
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-2">
          {getConfidenceBadge(entity.confidence_score)}
        </div>
      </div>
    </div>
  );

  const renderSectionContent = (sectionKey: string, sectionEntities: GroupedEntity[]) => {
    const renderEntity = (entity: GroupedEntity) => {
      switch (sectionKey) {
        case 'personal_info':
        case 'contact':
          return renderPersonalInfoCard(entity);
        case 'work_experience':
          return renderWorkExperienceCard(entity);
        case 'skills':
          return renderSkillCard(entity);
        default:
          return renderGenericCard(entity);
      }
    };

    return (
      <div className="space-y-3">
        {sectionEntities
          .sort((a, b) => b.confidence_score - a.confidence_score)
          .map(renderEntity)}
      </div>
    );
  };

  const sortedSections = Object.entries(organizedData)
    .filter(([, entities]) => entities.length > 0)
    .sort(([a], [b]) => {
      const priorityA = sectionConfigs[a]?.priority || 999;
      const priorityB = sectionConfigs[b]?.priority || 999;
      return priorityA - priorityB;
    });

  const totalEntities = Object.values(organizedData).reduce((sum, entities) => sum + entities.length, 0);
  const highConfidenceCount = Object.values(organizedData)
    .flat()
    .filter(e => e.confidence_score >= 0.8).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Resume Data Analysis
          </CardTitle>
          <CardDescription>
            {totalEntities} fields extracted • {highConfidenceCount} high confidence
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Controls */}
          <div className="space-y-4 mb-6">
            {/* Filter and Search Row */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search fields..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
              </div>
              
              <Select value={confidenceFilter} onValueChange={(value: any) => setConfidenceFilter(value)}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Confidence</SelectItem>
                  <SelectItem value="high">High (80%+)</SelectItem>
                  <SelectItem value="medium">Medium (60-80%)</SelectItem>
                  <SelectItem value="low">Low (&lt;60%)</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'compact' ? 'detailed' : 'compact')}
                className="flex items-center gap-2"
              >
                {viewMode === 'compact' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {viewMode === 'compact' ? 'Detailed' : 'Compact'} View
              </Button>
            </div>

            {/* Selection Controls */}
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedEntities.size} of {totalEntities} selected
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClearSelection}>
                    Clear All
                  </Button>
                </div>
              </div>
              
              <Button
                onClick={handleBulkMerge}
                disabled={selectedEntities.size === 0}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Merge Selected ({selectedEntities.size})
              </Button>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-6">
            {sortedSections.map(([sectionKey, sectionEntities]) => {
              const config = sectionConfigs[sectionKey] || sectionConfigs.general;
              
              return (
                <div key={sectionKey} className="border rounded-lg overflow-hidden">
                  <div className={`p-4 ${config.color} border-b`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {config.icon}
                        <span className="font-medium">{config.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {sectionEntities.length} field{sectionEntities.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-xs">
                          {sectionEntities.filter(e => e.confidence_score >= 0.8).length} high confidence
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    {renderSectionContent(sectionKey, sectionEntities)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
