
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from 'lucide-react';

export const DataManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Manage your career data and profile information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Data management tools coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};
