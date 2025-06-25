
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export const ParsedResumeEntities: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Parsed Resume Entities
        </CardTitle>
        <CardDescription>
          Extracted entities from resume parsing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">No entities parsed yet.</p>
      </CardContent>
    </Card>
  );
};
