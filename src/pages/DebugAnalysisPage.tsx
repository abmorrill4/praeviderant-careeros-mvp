
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { DebugDashboard } from '@/components/debug/DebugDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function DebugAnalysisPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [versionId, setVersionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestResumeVersion = async () => {
      if (!user) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching latest resume version for user:', user.id);
        
        // Get the most recent resume version
        const { data, error } = await supabase
          .from('resume_versions')
          .select(`
            id,
            version_number,
            file_name,
            processing_status,
            created_at,
            resume_streams!inner(user_id)
          `)
          .eq('resume_streams.user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching resume version:', error);
          setError(`Failed to fetch resume: ${error.message}`);
        } else if (data) {
          console.log('Found resume version:', data);
          setVersionId(data.id);
        } else {
          console.log('No resume versions found');
          setError('No resumes found. Please upload a resume first.');
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLatestResumeVersion();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading resume data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/profile-management')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile Management
          </Button>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error}
                {error.includes('No resumes found') && (
                  <div className="mt-2">
                    <Button 
                      onClick={() => navigate('/resume-upload')} 
                      variant="outline"
                      size="sm"
                    >
                      Upload Resume
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {versionId && <DebugDashboard versionId={versionId} />}
      </div>
    </div>
  );
}
