
import React from 'react';
import { Brain, User, Target, TrendingUp, Award } from 'lucide-react';

interface AIInsightsPanelProps {
  careerEnrichment?: {
    persona_type: string;
    role_archetype: string;
    leadership_score: number;
    technical_depth_score: number;
    scope_score: number;
    leadership_explanation?: string;
    technical_depth_explanation?: string;
    scope_explanation?: string;
    persona_explanation?: string;
    role_archetype_explanation?: string;
  };
  narratives: Array<{
    narrative_type: string;
    narrative_text: string;
    narrative_explanation?: string;
  }>;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  careerEnrichment,
  narratives
}) => {
  if (!careerEnrichment && narratives.length === 0) {
    return (
      <div className="neo-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-5 h-5 neo-text-accent" />
          <h3 className="text-lg font-semibold neo-text">AI Career Insights</h3>
        </div>
        <div className="text-center py-8">
          <Brain className="w-12 h-12 neo-text-muted mx-auto mb-4" />
          <p className="neo-text-muted">No AI insights available yet</p>
          <p className="text-sm neo-text-muted mt-2">
            Upload a resume to generate personalized career insights
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="neo-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-5 h-5 neo-text-accent" />
        <h3 className="text-lg font-semibold neo-text">AI Career Insights</h3>
      </div>

      <div className="space-y-6">
        {/* Career Archetype */}
        {careerEnrichment && (
          <div className="space-y-4">
            <div className="neo-card-subtle p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 neo-text-accent" />
                <span className="font-medium neo-text">Career Archetype</span>
              </div>
              <p className="text-sm neo-text font-medium mb-1">
                {careerEnrichment.role_archetype}
              </p>
              <p className="text-sm neo-text-muted">
                {careerEnrichment.persona_type}
              </p>
              {careerEnrichment.role_archetype_explanation && (
                <p className="text-xs neo-text-muted mt-2">
                  {careerEnrichment.role_archetype_explanation}
                </p>
              )}
            </div>

            {/* Skill Scores */}
            <div className="neo-card-subtle p-4">
              <h4 className="font-medium neo-text mb-3">Professional Profile</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm neo-text">Leadership</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full neo-gradient-accent"
                        style={{ width: `${(careerEnrichment.leadership_score / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium neo-text">
                      {careerEnrichment.leadership_score}/10
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm neo-text">Technical Depth</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full neo-gradient-accent"
                        style={{ width: `${(careerEnrichment.technical_depth_score / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium neo-text">
                      {careerEnrichment.technical_depth_score}/10
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm neo-text">Scope & Impact</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full neo-gradient-accent"
                        style={{ width: `${(careerEnrichment.scope_score / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium neo-text">
                      {careerEnrichment.scope_score}/10
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Career Narratives */}
        {narratives.length > 0 && (
          <div>
            <h4 className="font-medium neo-text mb-3">Career Narrative</h4>
            <div className="space-y-3">
              {narratives.slice(0, 2).map((narrative, index) => (
                <div key={index} className="neo-card-subtle p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 neo-text-accent" />
                    <span className="text-sm font-medium neo-text capitalize">
                      {narrative.narrative_type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm neo-text-muted">
                    {narrative.narrative_text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
