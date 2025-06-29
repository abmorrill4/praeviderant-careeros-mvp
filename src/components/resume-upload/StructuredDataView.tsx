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
  Zap,
  CheckSquare,
  Sparkles,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useParsedResumeEntities } from '@/hooks/useResumeStreams';
import { parseResumeFieldValue, getFieldDisplayName, getSectionFromFieldName } from '@/utils/resumeDataParser';
import { useToast } from '@/hooks/use-toast';
import { DataStatistics } from './DataStatistics';
import { DataFieldEditor } from './DataFieldEditor';
import { BulkOperations } from './BulkOperations';
import { DetailedViewModal } from './DetailedViewModal';
import { useResumeEnrichments, useEnrichAllEntries, useEnrichSingleEntry, useEnrichmentStats } from '@/hooks/useEntryEnrichment';

interface StructuredDataViewProps {
  versionId: string;
  onProfileUpdated?: () => void;
}

interface CategoryConfig {
  title: string;
  icon: React.ReactNode;
  priority: number;
  color: string;
}

interface GroupedEntity {
  field_name: string;
  raw_value: string;
  confidence_score: number;
  source_type: string;
  parsedData: any;
  displayName: string;
  id: string;
  // Add enrichment data
  enrichment_data?: {
    insights?: string[];
    skills_identified?: string[];
    experience_level?: string;
    career_progression?: string;
    market_relevance?: string;
    recommendations?: string[];
    parsed_structure?: any;
  };
}

// Enhanced helper function to extract resume entry headers
const extractResumeEntryHeader = (parsedData: any, fieldName: string): { title: string; subtitle?: string; timeframe?: string; location?: string } => {
  if (!parsedData || !parsedData.value) {
    return { title: 'No data available' };
  }

  if (parsedData.type === 'object' && parsedData.value) {
    const obj = parsedData.value;
    
    // Work experience patterns
    if (fieldName.toLowerCase().includes('work') || fieldName.toLowerCase().includes('experience')) {
      const title = obj.title || obj.position || obj.role || obj.job_title || 'Position';
      const subtitle = obj.company || obj.employer || obj.organization || 'Company';
      const timeframe = obj.start_date && obj.end_date ? 
        `${obj.start_date} - ${obj.end_date}` : 
        obj.start_date ? `${obj.start_date} - Present` : 
        obj.duration || undefined;
      const location = obj.location;
      
      return { title, subtitle, timeframe, location };
    }
    
    // Education patterns
    if (fieldName.toLowerCase().includes('education')) {
      const title = obj.degree || obj.program || obj.field_of_study || 'Degree';
      const subtitle = obj.institution || obj.school || obj.university || 'Institution';
      const timeframe = obj.graduation_date || obj.end_date || 
        (obj.start_date && obj.end_date ? `${obj.start_date} - ${obj.end_date}` : undefined);
      const location = obj.location;
      
      return { title, subtitle, timeframe, location };
    }
    
    // Projects patterns
    if (fieldName.toLowerCase().includes('project')) {
      const title = obj.name || obj.title || obj.project_name || 'Project';
      const subtitle = obj.description ? obj.description.substring(0, 60) + '...' : 
        obj.company || obj.organization || undefined;
      const timeframe = obj.date || obj.duration || 
        (obj.start_date && obj.end_date ? `${obj.start_date} - ${obj.end_date}` : undefined);
      
      return { title, subtitle, timeframe };
    }
    
    // Certifications patterns
    if (fieldName.toLowerCase().includes('cert')) {
      const title = obj.name || obj.certification || obj.title || 'Certification';
      const subtitle = obj.issuer || obj.organization || obj.provider || 'Issuer';
      const timeframe = obj.issue_date || obj.date || 
        (obj.expiry_date ? `Expires: ${obj.expiry_date}` : undefined);
      
      return { title, subtitle, timeframe };
    }
    
    // Skills patterns
    if (fieldName.toLowerCase().includes('skill')) {
      const title = obj.name || obj.skill || obj.category || 'Skill';
      const subtitle = obj.level || obj.proficiency || obj.years_experience || undefined;
      
      return { title, subtitle };
    }
    
    // Generic object handling
    const meaningfulFields = ['name', 'title', 'position', 'degree', 'certification', 'skill', 'project'];
    const subtitleFields = ['company', 'institution', 'organization', 'issuer', 'employer', 'school'];
    
    let title = '';
    let subtitle = '';
    
    for (const field of meaningfulFields) {
      if (obj[field] && typeof obj[field] === 'string') {
        title = obj[field];
        break;
      }
    }
    
    for (const field of subtitleFields) {
      if (obj[field] && typeof obj[field] === 'string') {
        subtitle = obj[field];
        break;
      }
    }
    
    if (title) {
      const timeframe = obj.start_date || obj.date || obj.duration || undefined;
      return { title, subtitle: subtitle || undefined, timeframe };
    }
  }
  
  // Handle arrays
  if (parsedData.type === 'array' && Array.isArray(parsedData.value)) {
    const items = parsedData.value;
    if (items.length > 0) {
      const firstItem = items[0];
      if (typeof firstItem === 'string') {
        return { 
          title: firstItem, 
          subtitle: items.length > 1 ? `+${items.length - 1} more items` : undefined 
        };
      }
      if (typeof firstItem === 'object' && firstItem.name) {
        return { 
          title: firstItem.name,
          subtitle: items.length > 1 ? `+${items.length - 1} more items` : undefined 
        };
      }
    }
    return { title: `${items.length} items` };
  }
  
  // Handle simple text
  if (parsedData.type === 'text' || typeof parsedData.value === 'string') {
    const text = String(parsedData.value).trim();
    if (text && text !== 'No data') {
      return { title: text };
    }
  }
  
  return { title: parsedData.displayValue || 'Unknown data' };
};

export const StructuredDataView: React.FC<StructuredDataViewProps> = ({ 
  versionId, 
  onProfileUpdated 
}) => {
  const { data: entities, isLoading, error } = useParsedResumeEntities(versionId);
  const { data: enrichments } = useResumeEnrichments(versionId);
  const { data: enrichmentStats } = useEnrichmentStats(versionId);
  const { toast } = useToast();
  
  // Enrichment mutations
  const enrichAllMutation = useEnrichAllEntries();
  const enrichSingleMutation = useEnrichSingleEntry();
  
  // State management
  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(new Set());
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');
  const [customCategories, setCustomCategories] = useState<Record<string, string>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [detailedViewEntity, setDetailedViewEntity] = useState<GroupedEntity | null>(null);

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

  // Create a map of enrichments by entity ID
  const enrichmentMap = useMemo(() => {
    const map = new Map();
    enrichments?.forEach(enrichment => {
      map.set(enrichment.parsed_entity_id, enrichment);
    });
    return map;
  }, [enrichments]);

  // Process and organize entities with enrichment data
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
      
      // Get enrichment data for this entity
      const enrichment = enrichmentMap.get(entity.id);
      const enrichmentData = enrichment ? {
        insights: enrichment.insights || [],
        skills_identified: enrichment.skills_identified || [],
        experience_level: enrichment.experience_level,
        career_progression: enrichment.career_progression,
        market_relevance: enrichment.market_relevance,
        recommendations: enrichment.recommendations || [],
        parsed_structure: enrichment.parsed_structure
      } : undefined;
      
      grouped[finalSection].push({
        ...entity,
        parsedData,
        displayName: getFieldDisplayName(entity.field_name),
        id: `${entity.field_name}-${index}`,
        enrichment_data: enrichmentData
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
          const entryHeader = extractResumeEntryHeader(entity.parsedData, entity.field_name);
          return (
            entryHeader.title.toLowerCase().includes(searchLower) ||
            entryHeader.subtitle?.toLowerCase().includes(searchLower) ||
            entity.field_name.toLowerCase().includes(searchLower) ||
            JSON.stringify(entity.parsedData).toLowerCase().includes(searchLower)
          );
        }

        return true;
      });
    });

    return grouped;
  }, [entities, enrichmentMap, confidenceFilter, searchQuery, customCategories]);

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

  const handleSelectAllSection = (sectionKey: string) => {
    const sectionIds = organizedData[sectionKey]?.map(e => e.id) || [];
    const newSelected = new Set(selectedEntities);
    
    // Check if all items in this section are already selected
    const allSectionSelected = sectionIds.every(id => newSelected.has(id));
    
    if (allSectionSelected) {
      // Unselect all items in this section
      sectionIds.forEach(id => newSelected.delete(id));
    } else {
      // Select all items in this section
      sectionIds.forEach(id => newSelected.add(id));
    }
    
    setSelectedEntities(newSelected);
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

  const renderResumeEntryCard = (entity: GroupedEntity) => {
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

    const entryHeader = extractResumeEntryHeader(entity.parsedData, entity.field_name);
    const hasEnrichment = !!entity.enrichment_data;

    return (
      <div 
        key={entity.id} 
        className="p-4 border rounded-lg bg-white hover:shadow-md transition-all cursor-pointer group"
        onClick={() => setDetailedViewEntity(entity)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={selectedEntities.has(entity.id)}
                onCheckedChange={() => handleEntityToggle(entity.id)}
                className="mt-1"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {entryHeader.title}
                  </h4>
                  {entryHeader.subtitle && (
                    <p className="text-sm text-gray-600 mt-1">
                      {entryHeader.subtitle}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {entryHeader.timeframe && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{entryHeader.timeframe}</span>
                  </div>
                )}
                {entryHeader.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{entryHeader.location}</span>
                  </div>
                )}
                {hasEnrichment && (
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600">
                    AI Enhanced
                  </Badge>
                )}
              </div>

              {/* Show enrichment preview */}
              {entity.enrichment_data && (
                <div className="mt-2 pt-2 border-t">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-3 h-3 text-purple-500" />
                    <span className="text-xs font-medium text-purple-700">AI Insights</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {entity.enrichment_data.insights?.slice(0, 2).map((insight, i) => (
                      <div key={i} className="mb-1">• {insight}</div>
                    ))}
                    {entity.enrichment_data.insights && entity.enrichment_data.insights.length > 2 && (
                      <div className="text-purple-600">+{entity.enrichment_data.insights.length - 2} more insights</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-2">
            {!hasEnrichment && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEnrichSingle(entity.id.split('-')[0]); // Get original entity ID
                }}
                disabled={enrichSingleMutation.isPending}
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {enrichSingleMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setEditingField(entity.id);
              }}
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
          .map(entity => renderResumeEntryCard(entity))}
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
      {/* Statistics Overview with Enrichment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DataStatistics {...statistics} />
        {enrichmentStats && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                AI Enrichment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-purple-600">
                    {enrichmentStats.enriched_entities}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    of {enrichmentStats.total_entities}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {enrichmentStats.enrichment_percentage}% enriched
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${enrichmentStats.enrichment_percentage}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bulk Operations with Enrichment */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <BulkOperations
          selectedItems={selectedEntities}
          totalItems={statistics.totalFields}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          onBulkMerge={handleBulkMerge}
        />
        <div className="flex items-center gap-2 ml-auto">
          <Button
            onClick={handleEnrichAll}
            disabled={enrichAllMutation.isPending}
            className="flex items-center gap-2"
            variant="outline"
          >
            {enrichAllMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Enrich All Entries
          </Button>
          {enrichmentStats && enrichmentStats.enriched_entities > 0 && (
            <span className="text-sm text-muted-foreground">
              {enrichmentStats.enriched_entities} enriched
            </span>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Resume Data Fields
          </CardTitle>
          <CardDescription>
            Review and organize your extracted resume data by category. Click any entry to view details and AI insights.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search entries..."
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
              const sectionIds = sectionEntities.map(e => e.id);
              const selectedInSection = sectionIds.filter(id => selectedEntities.has(id)).length;
              const allSectionSelected = selectedInSection === sectionIds.length && sectionIds.length > 0;
              
              return (
                <div key={sectionKey} className="border rounded-lg overflow-hidden">
                  <div className={`p-4 ${config.color} border-b`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {config.icon}
                          <span className="font-medium">{config.title}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {sectionEntities.length} entr{sectionEntities.length !== 1 ? 'ies' : 'y'}
                        </Badge>
                        {selectedInSection > 0 && (
                          <Badge className="text-xs bg-blue-100 text-blue-800">
                            {selectedInSection} selected
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectAllSection(sectionKey)}
                          className="flex items-center gap-2"
                        >
                          <CheckSquare className="w-4 h-4" />
                          {allSectionSelected ? 'Unselect All' : 'Select All'}
                        </Button>
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

      {/* Detailed View Modal */}
      {detailedViewEntity && (
        <DetailedViewModal
          isOpen={true}
          onClose={() => setDetailedViewEntity(null)}
          entity={detailedViewEntity}
          title={extractResumeEntryHeader(detailedViewEntity.parsedData, detailedViewEntity.field_name).title}
          subtitle={extractResumeEntryHeader(detailedViewEntity.parsedData, detailedViewEntity.field_name).subtitle}
        />
      )}
    </div>
  );
};
