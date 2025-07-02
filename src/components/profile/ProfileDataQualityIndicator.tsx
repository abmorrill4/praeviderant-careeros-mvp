import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import type { VersionedEntity } from '@/types/versioned-entities';

interface ProfileDataQualityIndicatorProps {
  item: VersionedEntity;
  className?: string;
}

export const ProfileDataQualityIndicator: React.FC<ProfileDataQualityIndicatorProps> = ({
  item,
  className = ""
}) => {
  const getQualityScore = (item: VersionedEntity): number => {
    let score = 0;
    const fields = Object.entries(item);
    let totalFields = 0;
    let filledFields = 0;

    fields.forEach(([key, value]) => {
      if (key.startsWith('logical_') || key === 'version' || key === 'created_at' || key === 'updated_at' || key === 'user_id') {
        return; // Skip metadata fields
      }
      totalFields++;
      if (value && value !== '' && value !== null) {
        filledFields++;
      }
    });

    score = totalFields > 0 ? (filledFields / totalFields) * 100 : 0;

    // Bonus points for high confidence
    if (item.source_confidence && item.source_confidence > 0.8) {
      score = Math.min(100, score + 10);
    }

    // Penalty for AI extracted items that aren't accepted
    if (item.source === 'AI_EXTRACTION' && !item.is_active) {
      score = Math.max(0, score - 20);
    }

    return Math.round(score);
  };

  const getQualityLevel = (score: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  };

  const getQualityColor = (level: string): string => {
    switch (level) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      default: return 'text-red-600';
    }
  };

  const getQualityIcon = (level: string) => {
    switch (level) {
      case 'excellent': return <CheckCircle className="w-3 h-3" />;
      case 'good': return <Zap className="w-3 h-3" />;
      case 'fair': return <Clock className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  const score = getQualityScore(item);
  const level = getQualityLevel(score);
  const isPending = item.source === 'AI_EXTRACTION' && !item.is_active;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1 ${getQualityColor(level)}`}>
          {getQualityIcon(level)}
          <span className="text-xs font-medium">
            Quality: {score}%
          </span>
        </div>
        
        {isPending && (
          <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
            Pending Review
          </Badge>
        )}
        
        {item.source_confidence && (
          <Badge variant="outline" className="text-xs">
            {Math.round(item.source_confidence * 100)}% AI Confidence
          </Badge>
        )}
      </div>
      
      <Progress 
        value={score} 
        className="h-1.5" 
        // Use design system colors
      />
      
      <div className="text-xs text-muted-foreground">
        {level === 'excellent' && "Complete and high-quality data"}
        {level === 'good' && "Good data with minor gaps"}
        {level === 'fair' && "Some information missing"}
        {level === 'poor' && "Needs significant improvement"}
      </div>
    </div>
  );
};