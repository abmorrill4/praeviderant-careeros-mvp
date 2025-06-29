
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Bug, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AnalyticsTab: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
        Analytics & Monitoring
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Debug Dashboard */}
        <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bug className={`w-8 h-8 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`} />
              <div>
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                  Debug Dashboard
                </h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                  Comprehensive debugging and monitoring tools
                </p>
              </div>
            </div>
            <p className={`mb-4 text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
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
        <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
          <CardContent className="p-6 text-center">
            <BarChart3 className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`} />
            <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              Usage Analytics
            </h3>
            <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
              Track your interview progress and resume performance metrics
            </p>
            <div className="mt-4">
              <span className={`text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 ${theme === 'dark' ? 'bg-blue-900 text-blue-300' : ''}`}>
                Coming Soon
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
