import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Lightbulb, 
  TrendingUp, 
  Target, 
  Clock,
  ChevronRight,
  X,
  MessageCircle,
  FileText,
  Settings
} from 'lucide-react';

interface GuidanceItem {
  id: string;
  type: 'tip' | 'next-step' | 'optimization' | 'warning';
  title: string;
  description: string;
  action?: {
    label: string;
    path?: string;
    onClick?: () => void;
  };
  priority: 'high' | 'medium' | 'low';
  phase: 'build' | 'optimize' | 'apply';
}

const guidanceData: Record<string, GuidanceItem[]> = {
  '/profile-timeline': [
    {
      id: 'complete-profile',
      type: 'next-step',
      title: 'Complete Your Profile Foundation',
      description: 'Add more work experience and education details to strengthen your profile.',
      action: {
        label: 'Continue Building',
        path: '/profile-timeline?section=experience'
      },
      priority: 'high',
      phase: 'build'
    },
    {
      id: 'ai-interview-tip',
      type: 'tip',
      title: 'Unlock Deeper Insights',
      description: 'Complete an AI interview to extract nuanced career stories and achievements.',
      action: {
        label: 'Start Interview',
        path: '/interview'
      },
      priority: 'medium',
      phase: 'build'
    }
  ],
  '/interview': [
    {
      id: 'interview-prep',
      type: 'tip',
      title: 'Interview Preparation',
      description: 'Speak naturally about your experiences. The AI will extract key insights automatically.',
      priority: 'medium',
      phase: 'build'
    },
    {
      id: 'profile-integration',
      type: 'next-step',
      title: 'Integration Ready',
      description: 'Your interview responses will automatically enhance your profile timeline.',
      priority: 'low',
      phase: 'build'
    }
  ],
  '/profile-optimization': [
    {
      id: 'optimization-ready',
      type: 'optimization',
      title: 'Profile Optimization Available',
      description: 'Your profile has enough data for AI-powered optimization suggestions.',
      action: {
        label: 'Start Optimizing',
      },
      priority: 'high',
      phase: 'optimize'
    },
    {
      id: 'skill-analysis',
      type: 'tip',
      title: 'Skill Gap Analysis',
      description: 'Identify missing skills and get recommendations for career advancement.',
      priority: 'medium',
      phase: 'optimize'
    }
  ],
  '/application-toolkit': [
    {
      id: 'ready-to-apply',
      type: 'next-step',
      title: 'Application Tools Ready',
      description: 'Your optimized profile can now generate tailored resumes and cover letters.',
      priority: 'high',
      phase: 'apply'
    },
    {
      id: 'job-matching',
      type: 'optimization',
      title: 'Smart Job Matching',
      description: 'Upload job descriptions to get perfectly tailored application materials.',
      priority: 'medium',
      phase: 'apply'
    }
  ]
};

const typeConfig = {
  tip: {
    icon: Lightbulb,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  'next-step': {
    icon: ChevronRight,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  optimization: {
    icon: TrendingUp,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  warning: {
    icon: Target,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
};

const priorityConfig = {
  high: { color: 'bg-red-500', label: 'High Priority' },
  medium: { color: 'bg-yellow-500', label: 'Medium Priority' },
  low: { color: 'bg-green-500', label: 'Low Priority' }
};

export const SmartGuidance: React.FC = () => {
  const location = useLocation();
  const [dismissedItems, setDismissedItems] = useState<string[]>([]);
  
  const currentGuidance = guidanceData[location.pathname] || [];
  const visibleGuidance = currentGuidance.filter(item => !dismissedItems.includes(item.id));

  const dismissItem = (id: string) => {
    setDismissedItems(prev => [...prev, id]);
  };

  if (visibleGuidance.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 mb-4">
        <Lightbulb className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Smart Guidance</h3>
      </div>

      {visibleGuidance.map((item) => {
        const config = typeConfig[item.type];
        const priorityConf = priorityConfig[item.priority];
        const Icon = config.icon;

        return (
          <Card 
            key={item.id}
            className={`${config.bgColor} ${config.borderColor} border transition-all duration-200 hover:shadow-sm`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`p-1.5 rounded-lg bg-white/80`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <CardTitle className="text-sm font-medium text-foreground">
                        {item.title}
                      </CardTitle>
                      <div className={`w-2 h-2 rounded-full ${priorityConf.color}`} />
                    </div>
                    <CardDescription className="text-xs text-muted-foreground">
                      {item.description}
                    </CardDescription>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissItem(item.id)}
                  className="h-6 w-6 p-0 hover:bg-white/60"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>

            {item.action && (
              <CardContent className="pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/80 hover:bg-white border-white/50"
                  onClick={() => {
                    if (item.action?.path) {
                      window.location.href = item.action.path;
                    } else if (item.action?.onClick) {
                      item.action.onClick();
                    }
                  }}
                >
                  {item.action.label}
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Target className="w-4 h-4 text-primary" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" className="flex items-center space-x-1">
              <MessageCircle className="w-3 h-3" />
              <span className="text-xs">Interview</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center space-x-1">
              <FileText className="w-3 h-3" />
              <span className="text-xs">Generate</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center space-x-1">
              <Settings className="w-3 h-3" />
              <span className="text-xs">Optimize</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartGuidance;