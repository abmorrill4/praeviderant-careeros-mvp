
import React from 'react';
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
        <Card className="bg-white shadow-lg border border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {placeholderGoals.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Avg Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              48%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              This Quarter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              1 goal
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Goal CTA */}
      <Card className="bg-white shadow-lg border-2 border-dashed border-slate-300">
        <CardContent className="text-center py-8">
          <Target className="w-12 h-12 mx-auto mb-4 text-slate-400 opacity-50" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Set Your Career Goals
          </h3>
          <p className="text-sm text-slate-600 mb-4 max-w-md mx-auto">
            Define your professional objectives and track your progress towards achieving them.
          </p>
          <Button
            onClick={() => handleAction('Create First Goal')}
            className="bg-purple-600 hover:bg-purple-700 text-white"
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
          className="bg-white shadow-lg border border-slate-200 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => handleAction(`View Goal: ${goal.title}`)}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-slate-900">
                {goal.title}
              </CardTitle>
              <div className="text-sm text-slate-600">
                {goal.progress}%
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  Category: {goal.category}
                </span>
                <div className="flex items-center gap-1 text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span>{goal.targetDate}</span>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all"
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
