
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

export const TeamTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-career-text">
        Team Management
      </h2>
      <Card className="bg-career-panel border-career-text/20">
        <CardContent className="p-8 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-career-text-muted" />
          <h3 className="text-xl font-semibold mb-2 text-career-text">
            Team Features Coming Soon
          </h3>
          <p className="text-career-text-muted">
            Collaborate with your team on career development
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
