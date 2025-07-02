
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { useLatestEntities } from '@/hooks/useVersionedEntities';
import { processCareerMilestones, calculateCareerStats } from '@/utils/careerUtils';
import type { WorkExperience } from '@/types/versioned-entities';

export const CareerProgressionChart: React.FC = () => {
  const { data: workExperiences } = useLatestEntities<WorkExperience>('work_experience');

  // Process work experiences into career milestones
  const careerMilestones = processCareerMilestones(workExperiences || []);
  const stats = calculateCareerStats(careerMilestones);

  if (careerMilestones.length === 0) {
    return (
      <Card className="bg-white shadow-lg border border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Career Progression
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-600">
            <p>No career progression data available</p>
            <p className="text-sm mt-1">Add work experience to see your career growth</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-lg border border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Career Progression Chart
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Career Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600 mb-1">
                {Math.round(stats.totalExperience / 12)}y {stats.totalExperience % 12}m
              </div>
              <div className="text-xs text-blue-700">Total Experience</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600 mb-1">
                {careerMilestones.length}
              </div>
              <div className="text-xs text-green-700">Positions</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-xl font-bold text-purple-600 mb-1">
                Level {stats.currentLevel}
              </div>
              <div className="text-xs text-purple-700">Current Level</div>
            </div>
          </div>

          {/* Progression Chart */}
          <div className="relative bg-slate-50 rounded-lg p-4 overflow-x-auto">
            <div className="flex items-end justify-between min-w-full" style={{ minWidth: `${careerMilestones.length * 120}px` }}>
              {careerMilestones.map((milestone, index) => {
                const height = (milestone.level / stats.maxLevel) * 120;
                const isLatest = index === careerMilestones.length - 1;
                
                return (
                  <div key={milestone.id} className="flex flex-col items-center group relative">
                    {/* Bar */}
                    <div 
                      className={`w-12 rounded-t-md transition-all duration-1000 ease-out ${
                        isLatest ? 'bg-green-500' : 'bg-purple-500'
                      } hover:opacity-80 mb-2 animate-scale-in`}
                      style={{ 
                        height: `${height}px`,
                        animationDelay: `${index * 200}ms`
                      }}
                    />
                    
                    {/* Level indicator */}
                    <Badge 
                      variant={isLatest ? "default" : "secondary"} 
                      className="text-xs mb-2"
                    >
                      L{milestone.level}
                    </Badge>
                    
                    {/* Company and duration */}
                    <div className="text-center min-w-0 max-w-20">
                      <div className="text-xs font-medium text-slate-900 truncate mb-1">
                        {milestone.company}
                      </div>
                      <div className="text-xs text-slate-500">
                        {Math.round(milestone.duration / 12)}y {milestone.duration % 12}m
                      </div>
                    </div>
                    
                    {/* Hover tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs rounded-lg p-2 pointer-events-none z-10 whitespace-nowrap">
                      <div className="font-medium">{milestone.title}</div>
                      <div className="text-slate-300">{milestone.company}</div>
                      <div className="text-slate-400">
                        {new Date(milestone.startDate).getFullYear()} - {milestone.endDate ? new Date(milestone.endDate).getFullYear() : 'Present'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-slate-500 pr-2">
              {Array.from({ length: stats.maxLevel }, (_, i) => (
                <div key={i} className="text-right">
                  L{stats.maxLevel - i}
                </div>
              ))}
            </div>
          </div>

          {/* Growth Insights */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-slate-900 mb-2">Career Growth Insights</h3>
                <div className="space-y-1 text-sm text-slate-700">
                  <div>• Career span: {Math.round(stats.careerSpan / 12)} years {stats.careerSpan % 12} months</div>
                  <div>• Average position duration: {stats.averagePositionDuration} months</div>
                  <div>• Career progression: {stats.careerProgression}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
