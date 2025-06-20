
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

export const TeamTab: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
        Team Management
      </h2>
      <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
        <CardContent className="p-8 text-center">
          <Users className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`} />
          <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
            Team Features Coming Soon
          </h3>
          <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
            Collaborate with your team on career development
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
