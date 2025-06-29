
import React from 'react';
import { Calendar, MapPin, Building, Star, Brain, Sparkles, TrendingUp, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEntityEnrichment } from '@/hooks/useEntryEnrichment';
import type { WorkExperience, Education, Skill, Project, Certification } from '@/types/versioned-entities';

interface EnhancedEntityProps<T> {
  item: T;
  entityId?: string; // ID to fetch enrichment data
}

export const EnhancedWorkExperienceRenderer: React.FC<EnhancedEntityProps<WorkExperience>> = ({ 
  item, 
  entityId 
}) => {
  const { data: enrichmentData } = useEntityEnrichment(entityId);

  return (
    <div className="space-y-3">
      {/* Basic Information */}
      <div>
        <h4 className="font-medium text-sm">{item.title}</h4>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <Building className="w-3 h-3" />
          <span>{item.company}</span>
          {item.start_date && (
            <>
              <Calendar className="w-3 h-3 ml-2" />
              <span>
                {item.start_date} - {item.end_date || 'Present'}
              </span>
            </>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {item.description}
          </p>
        )}
      </div>

      {/* AI Enrichment Data */}
      {enrichmentData && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1 text-purple-700">
              <Brain className="w-3 h-3" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Experience Level */}
            {enrichmentData.experience_level && (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-blue-500" />
                <span className="text-xs">
                  <strong>Level:</strong> {enrichmentData.experience_level}
                </span>
              </div>
            )}

            {/* Skills Identified */}
            {enrichmentData.skills_identified && enrichmentData.skills_identified.length > 0 && (
              <div>
                <div className="text-xs font-medium mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-green-500" />
                  Skills Detected:
                </div>
                <div className="flex flex-wrap gap-1">
                  {enrichmentData.skills_identified.slice(0, 4).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                      {skill}
                    </Badge>
                  ))}
                  {enrichmentData.skills_identified.length > 4 && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      +{enrichmentData.skills_identified.length - 4}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Top Insight */}
            {enrichmentData.insights && enrichmentData.insights.length > 0 && (
              <div className="text-xs text-muted-foreground italic">
                "{enrichmentData.insights[0]}"
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export const EnhancedEducationRenderer: React.FC<EnhancedEntityProps<Education>> = ({ 
  item, 
  entityId 
}) => {
  const { data: enrichmentData } = useEntityEnrichment(entityId);

  return (
    <div className="space-y-3">
      {/* Basic Information */}
      <div>
        <h4 className="font-medium text-sm">{item.degree}</h4>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <Building className="w-3 h-3" />
          <span>{item.institution}</span>
          {item.start_date && (
            <>
              <Calendar className="w-3 h-3 ml-2" />
              <span>
                {item.start_date} - {item.end_date || 'Present'}
              </span>
            </>
          )}
        </div>
        {item.field_of_study && (
          <p className="text-xs text-muted-foreground mt-1">
            Field: {item.field_of_study}
          </p>
        )}
        {item.gpa && (
          <p className="text-xs text-muted-foreground">
            GPA: {item.gpa}
          </p>
        )}
      </div>

      {/* AI Enrichment Data */}
      {enrichmentData && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="pt-3 space-y-2">
            {/* Market Relevance */}
            {enrichmentData.market_relevance && (
              <div className="text-xs">
                <strong className="flex items-center gap-1">
                  <Award className="w-3 h-3 text-green-500" />
                  Market Relevance:
                </strong>
                <span className="text-muted-foreground ml-4">{enrichmentData.market_relevance}</span>
              </div>
            )}

            {/* Top Recommendation */}
            {enrichmentData.recommendations && enrichmentData.recommendations.length > 0 && (
              <div className="text-xs text-muted-foreground italic">
                💡 {enrichmentData.recommendations[0]}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export const EnhancedSkillRenderer: React.FC<EnhancedEntityProps<Skill>> = ({ 
  item, 
  entityId 
}) => {
  const { data: enrichmentData } = useEntityEnrichment(entityId);

  // Handle cases where the skill name might be JSON or malformed data
  const getSkillName = (skill: Skill): string => {
    if (!skill.name) return 'Unknown Skill';
    
    if (skill.name.startsWith('{') || skill.name.startsWith('[')) {
      try {
        const parsed = JSON.parse(skill.name);
        if (parsed.name) return parsed.name;
        if (typeof parsed === 'string') return parsed;
        return 'Unknown Skill';
      } catch {
        return skill.name;
      }
    }
    
    return skill.name;
  };

  const getSkillCategory = (skill: Skill): string | undefined => {
    if (skill.category) return skill.category;
    
    if (skill.name && (skill.name.startsWith('{') || skill.name.startsWith('['))) {
      try {
        const parsed = JSON.parse(skill.name);
        if (parsed.category) return parsed.category;
      } catch {
        // Ignore parsing errors
      }
    }
    
    return undefined;
  };

  const getSkillProficiency = (skill: Skill): string | undefined => {
    if (skill.proficiency_level) return skill.proficiency_level;
    
    if (skill.name && (skill.name.startsWith('{') || skill.name.startsWith('['))) {
      try {
        const parsed = JSON.parse(skill.name);
        if (parsed.proficiency_level) return parsed.proficiency_level;
      } catch {
        // Ignore parsing errors
      }
    }
    
    return undefined;
  };

  const skillName = getSkillName(item);
  const skillCategory = getSkillCategory(item);
  const skillProficiency = getSkillProficiency(item);

  return (
    <div className="space-y-3">
      {/* Basic Information */}
      <div>
        <h4 className="font-medium text-sm">{skillName}</h4>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          {skillCategory && (
            <span className="bg-muted px-2 py-1 rounded">{skillCategory}</span>
          )}
          {skillProficiency && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              <span>{skillProficiency}</span>
            </div>
          )}
          {item.years_of_experience && (
            <span>{item.years_of_experience} years</span>
          )}
        </div>
      </div>

      {/* AI Enrichment Data */}
      {enrichmentData && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="pt-3 space-y-2">
            {/* Market Relevance */}
            {enrichmentData.market_relevance && (
              <div className="text-xs">
                <strong>Market Demand:</strong> {enrichmentData.market_relevance}
              </div>
            )}

            {/* Career Progression */}
            {enrichmentData.career_progression && (
              <div className="text-xs text-muted-foreground">
                🚀 {enrichmentData.career_progression}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export const EnhancedProjectRenderer: React.FC<EnhancedEntityProps<Project>> = ({ 
  item, 
  entityId 
}) => {
  const { data: enrichmentData } = useEntityEnrichment(entityId);

  return (
    <div className="space-y-3">
      {/* Basic Information */}
      <div>
        <h4 className="font-medium text-sm">{item.name}</h4>
        {item.start_date && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <Calendar className="w-3 h-3" />
            <span>
              {item.start_date} - {item.end_date || 'Ongoing'}
            </span>
          </div>
        )}
        {item.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {item.description}
          </p>
        )}
        {item.technologies_used && item.technologies_used.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.technologies_used.slice(0, 3).map((tech, index) => (
              <span key={index} className="bg-muted px-2 py-1 rounded text-xs">
                {tech}
              </span>
            ))}
            {item.technologies_used.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{item.technologies_used.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* AI Enrichment Data */}
      {enrichmentData && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent className="pt-3 space-y-2">
            {/* Experience Level */}
            {enrichmentData.experience_level && (
              <div className="text-xs">
                <strong>Complexity:</strong> {enrichmentData.experience_level}
              </div>
            )}

            {/* Top Insight */}
            {enrichmentData.insights && enrichmentData.insights.length > 0 && (
              <div className="text-xs text-muted-foreground italic">
                ✨ {enrichmentData.insights[0]}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export const EnhancedCertificationRenderer: React.FC<EnhancedEntityProps<Certification>> = ({ 
  item, 
  entityId 
}) => {
  const { data: enrichmentData } = useEntityEnrichment(entityId);

  return (
    <div className="space-y-3">
      {/* Basic Information */}
      <div>
        <h4 className="font-medium text-sm">{item.name}</h4>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <Building className="w-3 h-3" />
          <span>{item.issuing_organization}</span>
          {item.issue_date && (
            <>
              <Calendar className="w-3 h-3 ml-2" />
              <span>
                Issued: {item.issue_date}
                {item.expiration_date && ` - Expires: ${item.expiration_date}`}
              </span>
            </>
          )}
        </div>
        {item.credential_id && (
          <p className="text-xs text-muted-foreground mt-1">
            ID: {item.credential_id}
          </p>
        )}
      </div>

      {/* AI Enrichment Data */}
      {enrichmentData && (
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
          <CardContent className="pt-3 space-y-2">
            {/* Market Relevance */}
            {enrichmentData.market_relevance && (
              <div className="text-xs">
                <strong>Industry Value:</strong> {enrichmentData.market_relevance}
              </div>
            )}

            {/* Top Recommendation */}
            {enrichmentData.recommendations && enrichmentData.recommendations.length > 0 && (
              <div className="text-xs text-muted-foreground italic">
                📈 {enrichmentData.recommendations[0]}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
