
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Building, ChevronDown, ChevronRight } from 'lucide-react';
import { useLatestEntities } from '@/hooks/useVersionedEntities';
import type { WorkExperience, Education } from '@/types/versioned-entities';

interface TimelineItem {
  id: string;
  title: string;
  organization: string;
  startDate: string;
  endDate?: string;
  description?: string;
  type: 'work' | 'education';
  isCurrent?: boolean;
}

export const InteractiveTimeline: React.FC = () => {
  const { data: workExperiences } = useLatestEntities<WorkExperience>('work_experience');
  const { data: education } = useLatestEntities<Education>('education');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Combine and sort timeline items
  const timelineItems: TimelineItem[] = [
    ...(workExperiences?.map(work => ({
      id: work.logical_entity_id,
      title: work.title,
      organization: work.company,
      startDate: work.start_date || '',
      endDate: work.end_date,
      description: work.description,
      type: 'work' as const,
      isCurrent: !work.end_date
    })) || []),
    ...(education?.map(edu => ({
      id: edu.logical_entity_id,
      title: edu.degree,
      organization: edu.institution,
      startDate: edu.start_date || '',
      endDate: edu.end_date,
      description: edu.description,
      type: 'education' as const,
      isCurrent: !edu.end_date
    })) || [])
  ].sort((a, b) => {
    // Sort by start date, most recent first
    if (!a.startDate && !b.startDate) return 0;
    if (!a.startDate) return 1;
    if (!b.startDate) return -1;
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  const toggleExpand = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  if (timelineItems.length === 0) {
    return (
      <Card className="bg-white shadow-lg border border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Career Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-600">
            <p>No timeline data available</p>
            <p className="text-sm mt-1">Add your work experience and education to see your career timeline</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-lg border border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          Interactive Career Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-blue-500"></div>
          
          <div className="space-y-6">
            {timelineItems.map((item, index) => {
              const isExpanded = expandedItems.has(item.id);
              
              return (
                <div key={item.id} className="relative animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  {/* Timeline dot */}
                  <div className={`absolute left-4 w-4 h-4 rounded-full border-2 ${
                    item.isCurrent 
                      ? 'bg-green-500 border-green-500 animate-pulse' 
                      : item.type === 'work' 
                        ? 'bg-purple-500 border-purple-500' 
                        : 'bg-blue-500 border-blue-500'
                  } z-10`}></div>
                  
                  {/* Timeline item */}
                  <div className="ml-12 group">
                    <div 
                      className="bg-slate-50 hover:bg-slate-100 rounded-lg p-4 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer"
                      onClick={() => toggleExpand(item.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={item.type === 'work' ? 'default' : 'secondary'} className="text-xs">
                              {item.type === 'work' ? 'Work' : 'Education'}
                            </Badge>
                            {item.isCurrent && (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                Current
                              </Badge>
                            )}
                          </div>
                          
                          <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                          
                          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                            <Building className="w-4 h-4" />
                            <span>{item.organization}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {item.startDate} - {item.endDate || 'Present'}
                            </span>
                          </div>
                        </div>
                        
                        <Button variant="ghost" size="sm" className="ml-4">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                      </div>
                      
                      {isExpanded && item.description && (
                        <div className="mt-4 pt-4 border-t border-slate-200 animate-accordion-down">
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
