
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Plus, TrendingUp, Calendar } from 'lucide-react';

interface GoalsSectionProps {
  focusedCard: string | null;
  onCardFocus: (cardId: string | null) => void;
}

export const GoalsSection: React.FC<GoalsSectionProps> = ({
  focusedCard,
  onCardFocus,
}) => {
  const { theme } = useTheme();

  const handleAction = (action: string) => {
    console.log(`Action: ${action}`);
  };

  // Placeholder goals data - in real implementation, this would come from a hook
  const placeholderGoals = [
    {
      id: '1',
      title: 'Senior Developer Role',
      category: 'Career',
      targetDate: '2024-12-31',
      progress: 65,
    },
    {
      id: '2', 
      title: 'Learn Machine Learning',
      category: 'Skills',
      targetDate: '2024-06-30',
      progress: 30,
    }
  ];

  return (
    <div className="space-y-6">
      {/* Goals Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className={`${theme === 'dark' ? 'neumorphic-panel dark bg-career-panel-dark' : 'neumorphic-panel light bg-career-panel-light'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
              Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              {placeholderGoals.length}
            </div>
          </CardContent>
        </Card>

        <Card className={`${theme === 'dark' ? 'neumorphic-panel dark bg-career-panel-dark' : 'neumorphic-panel light bg-career-panel-light'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
              Avg Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-career-accent`}>
              48%
            </div>
          </CardContent>
        </Card>

        <Card className={`${theme === 'dark' ? 'neumorphic-panel dark bg-career-panel-dark' : 'neumorphic-panel light bg-career-panel-light'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
              This Quarter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              1 goal
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Goal CTA */}
      <Card className={`${theme === 'dark' ? 'neumorphic-panel dark bg-career-panel-dark' : 'neumorphic-panel light bg-career-panel-light'} border-2 border-dashed ${theme === 'dark' ? 'border-career-gray-dark' : 'border-career-gray-light'}`}>
        <CardContent className="text-center py-8">
          <Target className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} opacity-50`} />
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
            Set Your Career Goals
          </h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} mb-4 max-w-md mx-auto`}>
            Define your professional objectives and track your progress towards achieving them.
          </p>
          <Button
            onClick={() => handleAction('Create First Goal')}
            className="bg-career-accent hover:bg-career-accent-dark text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Goal
          </Button>
        </CardContent>
      </Card>

      {/* Placeholder Goals (for demo) */}
      {placeholderGoals.map((goal) => (
        <Card 
          key={goal.id}
          className={`${theme === 'dark' ? 'neumorphic-panel dark bg-career-panel-dark' : 'neumorphic-panel light bg-career-panel-light'} cursor-pointer hover:shadow-lg transition-shadow`}
          onClick={() => handleAction(`View Goal: ${goal.title}`)}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className={`text-lg ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                {goal.title}
              </CardTitle>
              <div className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                {goal.progress}%
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                  Category: {goal.category}
                </span>
                <div className={`flex items-center gap-1 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                  <Calendar className="w-4 h-4" />
                  <span>{goal.targetDate}</span>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-career-accent h-2 rounded-full transition-all"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
