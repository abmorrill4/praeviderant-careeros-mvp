
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface TimelineCardFrameProps {
  id: string;
  title: string;
  badgeText?: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const TimelineCardFrame: React.FC<TimelineCardFrameProps> = ({
  id,
  title,
  badgeText,
  isExpanded,
  onToggle,
  children,
}) => {
  const { theme } = useTheme();

  return (
    <Card 
      className={`mb-6 cursor-pointer transition-all duration-300 neumorphic-panel light bg-career-panel-light ${isExpanded ? 'shadow-neumorphic-lg-light' : 'shadow-neumorphic-light hover:shadow-neumorphic-lg-light'}`}
      onClick={onToggle}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg text-career-text-light">
              {title}
            </CardTitle>
            {badgeText && (
              <Badge className="bg-career-gray-light text-career-text-muted-light">
                {badgeText}
              </Badge>
            )}
          </div>
          
          <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-career-text-muted-light" />
            ) : (
              <ChevronRight className="w-5 h-5 text-career-text-muted-light" />
            )}
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0 animate-accordion-down">
          <div onClick={(e) => e.stopPropagation()}>
            {children}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
