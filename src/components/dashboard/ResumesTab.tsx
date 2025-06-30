
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { PDFResumeGenerator } from '@/components/PDFResumeGenerator';

interface ResumesTabProps {
  onNavigateToInterview: () => void;
}

export const ResumesTab: React.FC<ResumesTabProps> = ({ onNavigateToInterview }) => {
  const { user } = useAuth();
  const [resumeData, setResumeData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestResume = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('resume_uploads')
        .select('structured_data')
        .eq('user_id', user.id)
        .eq('parsing_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data?.structured_data) {
        setResumeData(data.structured_data);
      }

      setLoading(false);
    };

    fetchLatestResume();
  }, [user]);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-career-text">
        My Resumes
      </h2>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : resumeData ? (
        <PDFResumeGenerator resumeData={resumeData} className="max-w-xl mx-auto" />
      ) : (
        <Card className="bg-career-panel border-career-text/20">
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-career-text-muted" />
            <h3 className="text-xl font-semibold mb-2 text-career-text">
              No resumes yet
            </h3>
            <p className="text-career-text-muted mb-4">
              Complete an AI interview to generate your first resume
            </p>
            <Button
              onClick={onNavigateToInterview}
              className="bg-career-accent hover:bg-career-accent-dark text-white"
            >
              Start Interview
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
