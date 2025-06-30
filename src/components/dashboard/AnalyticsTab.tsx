
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Bug, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AnalyticsTab: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-career-text">
        Analytics & Monitoring
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Debug Dashboard */}
        <Card className="bg-career-panel border-career-text/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bug className="w-8 h-8 text-career-text" />
              <div>
                <h3 className="text-xl font-semibold text-career-text">
                  Debug Dashboard
                </h3>
                <p className="text-sm text-career-text-muted">
                  Comprehensive debugging and monitoring tools
                </p>
              </div>
            </div>
            <p className="mb-4 text-sm text-career-text-muted">
              Access detailed system monitoring, error analysis, performance metrics, and processing analytics for your resume pipeline.
            </p>
            <Button 
              onClick={() => navigate('/debug')}
              className="w-full"
              variant="outline"
            >
              <Activity className="w-4 h-4 mr-2" />
              Open Debug Dashboard
            </Button>
          </CardContent>
        </Card>

        {/* Coming Soon */}
        <Card className="bg-career-panel border-career-text/20">
          <CardContent className="p-6 text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-career-text-muted" />
            <h3 className="text-xl font-semibold mb-2 text-career-text">
              Usage Analytics
            </h3>
            <p className="text-career-text-muted">
              Track your interview progress and resume performance metrics
            </p>
            <div className="mt-4">
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                Coming Soon
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
