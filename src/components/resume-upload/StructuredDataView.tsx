
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Plus,
  Trash2,
  Trophy,
  BookOpen,
  Globe,
  Users,
  Heart,
  Star,
  Zap
} from 'lucide-react';
import { useParsedResumeEntities } from '@/hooks/useResumeStreams';
import { parseResumeFieldValue, getFieldDisplayName, getSectionFromFieldName } from '@/utils/resumeDataParser';
import { useToast } from '@/hooks/use-toast';
import { DataStatistics } from './DataStatistics';
import { DataFieldEditor } from './DataFieldEditor';
import { BulkOperations } from './BulkOperations';

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
  const [editingField, setEditingField] = useState<string | null>(null);

  // Enhanced section configurations with all resume sections
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
    projects: { 
      title: 'Projects', 
      icon: <Zap className="w-4 h-4" />, 
      priority: 6,
      color: 'bg-cyan-100 text-cyan-800'
    },
    certifications: { 
      title: 'Certifications', 
      icon: <Award className="w-4 h-4" />, 
      priority: 7,
      color: 'bg-yellow-100 text-yellow-800'
    },
    awards: { 
      title: 'Awards & Honors', 
      icon: <Trophy className="w-4 h-4" />, 
      priority: 8,
      color: 'bg-amber-100 text-amber-800'
    },
    publications: { 
      title: 'Publications', 
      icon: <BookOpen className="w-4 h-4" />, 
      priority: 9,
      color: 'bg-emerald-100 text-emerald-800'
    },
    volunteer_work: { 
      title: 'Volunteer Experience', 
      icon: <Heart className="w-4 h-4" />, 
      priority: 10,
      color: 'bg-rose-100 text-rose-800'
    },
    languages: { 
      title: 'Languages', 
      icon: <Globe className="w-4 h-4" />, 
      priority: 11,
      color: 'bg-teal-100 text-teal-800'
    },
    professional_associations: { 
      title: 'Professional Associations', 
      icon: <Users className="w-4 h-4" />, 
      priority: 12,
      color: 'bg-violet-100 text-violet-800'
    },
    references: { 
      title: 'References', 
      icon: <Star className="w-4 h-4" />, 
      priority: 13,
      color: 'bg-pink-100 text-pink-800'
    },
    general: { 
      title: 'Other Information', 
      icon: <FileText className="w-4 h-4" />, 
      priority: 14,
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

  // Calculate statistics
  const statistics = useMemo(() => {
    const allEntities = Object.values(organizedData).flat();
    return {
      totalFields: allEntities.length,
      highConfidenceFields: allEntities.filter(e => e.confidence_score >= 0.8).length,
      mediumConfidenceFields: allEntities.filter(e => e.confidence_score >= 0.6 && e.confidence_score < 0.8).length,
      lowConfidenceFields: allEntities.filter(e => e.confidence_score < 0.6).length,
      categorizedFields: Object.fromEntries(
        Object.entries(organizedData).map(([key, entities]) => [key, entities.length])
      )
    };
  }, [organizedData]);

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

  const handleFieldEdit = (fieldId: string, newData: any) => {
    // Update the field data logic would go here
    setEditingField(null);
    toast({
      title: "Field Updated",
      description: "Changes saved successfully",
    });
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.8) return <Badge className="bg-green-100 text-green-800 text-xs">High</Badge>;
    if (score >= 0.6) return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Medium</Badge>;
    return <Badge className="bg-red-100 text-red-800 text-xs">Low</Badge>;
  };

  const renderGenericCard = (entity: GroupedEntity) => {
    if (editingField === entity.id) {
      return (
        <DataFieldEditor
          key={entity.id}
          field={entity}
          onSave={handleFieldEdit}
          onCancel={() => setEditingField(null)}
        />
      );
    }

    return (
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingField(entity.id)}
              className="h-6 w-6 p-0"
            >
              <Edit className="w-3 h-3" />
            </Button>
            {getConfidenceBadge(entity.confidence_score)}
          </div>
        </div>
      </div>
    );
  };

  const renderSectionContent = (sectionKey: string, sectionEntities: GroupedEntity[]) => {
    return (
      <div className="space-y-3">
        {sectionEntities
          .sort((a, b) => b.confidence_score - a.confidence_score)
          .map(entity => renderGenericCard(entity))}
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

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <DataStatistics {...statistics} />

      {/* Bulk Operations */}
      <BulkOperations
        selectedItems={selectedEntities}
        totalItems={statistics.totalFields}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onBulkMerge={handleBulkMerge}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Resume Data Fields
          </CardTitle>
          <CardDescription>
            Review and organize your extracted resume data by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
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
