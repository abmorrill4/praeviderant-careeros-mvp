
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, AlertTriangle, Upload } from 'lucide-react';
import { DebugDashboard } from '@/components/debug/DebugDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function DebugAnalysisPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [versionId, setVersionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'auth' | 'no-data' | 'database' | 'unknown'>('unknown');

  useEffect(() => {
    const fetchLatestResumeVersion = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      // Check authentication first
      if (!user) {
        console.log('DebugAnalysisPage: User not authenticated');
        setError('Please log in to access the debug dashboard');
        setErrorType('auth');
        setLoading(false);
        return;
      }

      try {
        console.log('DebugAnalysisPage: Fetching latest resume version for user:', user.id);
        
        // Get the most recent resume version
        const { data, error: queryError } = await supabase
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

        if (queryError) {
          console.error('DebugAnalysisPage: Database error fetching resume version:', queryError);
          setError(`Database error: ${queryError.message}`);
          setErrorType('database');
        } else if (data) {
          console.log('DebugAnalysisPage: Found resume version:', data);
          setVersionId(data.id);
          setError(null);
          setErrorType('unknown');
        } else {
          console.log('DebugAnalysisPage: No resume versions found for user');
          setError('No resumes found for analysis');
          setErrorType('no-data');
        }
      } catch (err) {
        console.error('DebugAnalysisPage: Unexpected error:', err);
        setError('An unexpected error occurred while loading resume data');
        setErrorType('unknown');
      } finally {
        setLoading(false);
      }
    };

    fetchLatestResumeVersion();
  }, [user, authLoading]);

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading while fetching data
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
            <Alert variant={errorType === 'auth' ? 'destructive' : 'default'} className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error}
                {errorType === 'no-data' && (
                  <div className="mt-3 flex gap-2">
                    <Button 
                      onClick={() => navigate('/resume-upload')} 
                      variant="outline"
                      size="sm"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Resume
                    </Button>
                    <Button 
                      onClick={() => navigate('/profile-management')} 
                      variant="outline"
                      size="sm"
                    >
                      Go to Profile
                    </Button>
                  </div>
                )}
                {errorType === 'auth' && (
                  <div className="mt-3">
                    <Button 
                      onClick={() => navigate('/auth')} 
                      variant="outline"
                      size="sm"
                    >
                      Sign In
                    </Button>
                  </div>
                )}
                {errorType === 'database' && (
                  <div className="mt-3">
                    <Button 
                      onClick={() => window.location.reload()} 
                      variant="outline"
                      size="sm"
                    >
                      Retry
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Only show debug dashboard if we have a valid version ID and user */}
        {versionId && user && (
          <DebugDashboard versionId={versionId} />
        )}

        {/* Fallback message when no data but authenticated */}
        {!versionId && user && !error && (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Resume Data Found</h3>
            <p className="text-gray-600 mb-6">
              Upload a resume to start analyzing your career data and access debugging tools.
            </p>
            <Button onClick={() => navigate('/resume-upload')}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Your First Resume
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
