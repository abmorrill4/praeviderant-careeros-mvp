
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Clock, Target, Award, BarChart3 } from 'lucide-react';

interface AnalyticsSectionProps {
  focusedCard: string | null;
  onCardFocus: (cardId: string | null) => void;
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  focusedCard,
  onCardFocus,
}) => {
  const { theme } = useTheme();

  // Mock data - in a real app, this would come from your analytics service
  const analyticsData = {
    profileViews: 156,
    profileCompleteness: 75,
    skillsCount: 12,
    experienceYears: 5,
    goalsCompleted: 3,
    totalGoals: 5,
    recentActivity: [
      { action: 'Updated skills section', date: '2 days ago' },
      { action: 'Added new work experience', date: '1 week ago' },
      { action: 'Completed career assessment', date: '2 weeks ago' },
    ],
  };

  const statsCards = [
    {
      title: 'Profile Views',
      value: analyticsData.profileViews,
      icon: Users,
      description: 'Total profile views this month',
      trend: '+12%',
    },
    {
      title: 'Profile Completeness',
      value: `${analyticsData.profileCompleteness}%`,
      icon: Target,
      description: 'Your profile completion score',
      trend: '+5%',
    },
    {
      title: 'Skills Tracked',
      value: analyticsData.skillsCount,
      icon: Award,
      description: 'Total skills in your profile',
      trend: '+2',
    },
    {
      title: 'Experience',
      value: `${analyticsData.experienceYears} years`,
      icon: Clock,
      description: 'Total professional experience',
      trend: 'Stable',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
          Career Analytics
        </h2>
        <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
          Track your career progress and profile performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className={`${theme === 'dark' ? 'neumorphic-panel dark bg-career-panel-dark' : 'neumorphic-panel light bg-career-panel-light'}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                      {stat.title}
                    </p>
                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                      {stat.value}
                    </p>
                  </div>
                  <Icon className={`w-8 h-8 ${theme === 'dark' ? 'text-career-accent' : 'text-career-accent'}`} />
                </div>
                <div className="mt-4">
                  <p className={`text-xs ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    {stat.description}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {stat.trend}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Progress Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Completeness */}
        <Card className={`${theme === 'dark' ? 'neumorphic-panel dark bg-career-panel-dark' : 'neumorphic-panel light bg-career-panel-light'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              <BarChart3 className="w-5 h-5" />
              Profile Completion
            </CardTitle>
            <CardDescription>
              Complete your profile to increase visibility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{analyticsData.profileCompleteness}%</span>
              </div>
              <Progress value={analyticsData.profileCompleteness} className="h-2" />
              
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Experience Section</span>
                  <Badge variant="secondary">Complete</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Skills Section</span>
                  <Badge variant="secondary">Complete</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Education Section</span>
                  <Badge variant="outline">In Progress</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Goals Section</span>
                  <Badge variant="outline">Pending</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals Progress */}
        <Card className={`${theme === 'dark' ? 'neumorphic-panel dark bg-career-panel-dark' : 'neumorphic-panel light bg-career-panel-light'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              <Target className="w-5 h-5" />
              Career Goals
            </CardTitle>
            <CardDescription>
              Track your career development goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Goals Completed</span>
                <span>{analyticsData.goalsCompleted} of {analyticsData.totalGoals}</span>
              </div>
              <Progress value={(analyticsData.goalsCompleted / analyticsData.totalGoals) * 100} className="h-2" />
              
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Learn React</span>
                  <Badge variant="secondary">Complete</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Get AWS Certification</span>
                  <Badge variant="secondary">Complete</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Leadership Training</span>
                  <Badge variant="outline">In Progress</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Public Speaking</span>
                  <Badge variant="outline">Pending</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className={`${theme === 'dark' ? 'neumorphic-panel dark bg-career-panel-dark' : 'neumorphic-panel light bg-career-panel-light'}`}>
        <CardHeader>
          <CardTitle className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
            Recent Activity
          </CardTitle>
          <CardDescription>
            Your latest profile updates and actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-career-accent' : 'bg-career-accent'}`} />
                <div className="flex-1">
                  <p className={`text-sm ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                    {activity.action}
                  </p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    {activity.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
