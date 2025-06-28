
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';

interface DataStatisticsProps {
  totalFields: number;
  highConfidenceFields: number;
  mediumConfidenceFields: number;
  lowConfidenceFields: number;
  categorizedFields: Record<string, number>;
}

export const DataStatistics: React.FC<DataStatisticsProps> = ({
  totalFields,
  highConfidenceFields,
  mediumConfidenceFields,
  lowConfidenceFields,
  categorizedFields
}) => {
  const confidenceRate = totalFields > 0 ? Math.round((highConfidenceFields / totalFields) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{totalFields}</p>
              <p className="text-xs text-muted-foreground">Total Fields</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{confidenceRate}%</p>
              <p className="text-xs text-muted-foreground">Confidence Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{highConfidenceFields}</p>
              <p className="text-xs text-muted-foreground">High Confidence</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{mediumConfidenceFields + lowConfidenceFields}</p>
              <p className="text-xs text-muted-foreground">Needs Review</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
