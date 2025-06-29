
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { DebugDashboard } from '@/components/debug/DebugDashboard';

export default function DebugAnalysisPage() {
  const { versionId } = useParams<{ versionId?: string }>();
  const navigate = useNavigate();

  // Debug logging to see what we're receiving
  useEffect(() => {
    console.log('DebugAnalysisPage - URL Parameters:', {
      versionId,
      rawParams: useParams(),
      currentPath: window.location.pathname,
      timestamp: new Date().toISOString()
    });
  }, [versionId]);

  // Validate version ID format (should be a UUID)
  const isValidVersionId = (id?: string): boolean => {
    if (!id) return false;
    if (id === ':versionId' || id.startsWith(':')) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const validVersionId = isValidVersionId(versionId) ? versionId : undefined;

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

          {/* URL Debug Information */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-2">Debug Information</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <div>Raw versionId parameter: <code className="bg-blue-100 px-1 rounded">{versionId || 'undefined'}</code></div>
              <div>Current URL: <code className="bg-blue-100 px-1 rounded">{window.location.pathname}</code></div>
              <div>Is valid UUID: <code className="bg-blue-100 px-1 rounded">{isValidVersionId(versionId) ? 'Yes' : 'No'}</code></div>
            </div>
          </div>

          {/* Parameter validation error */}
          {versionId && !validVersionId && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Invalid version ID format: <code>{versionId}</code>
                <br />
                {versionId === ':versionId' && (
                  <span className="text-sm mt-1 block">
                    It looks like the URL parameter wasn't properly substituted. 
                    Please check that you're navigating to this page with a valid resume version ID.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* No version ID provided */}
          {!versionId && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No version ID provided. The debug analysis will show general system status only.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DebugDashboard versionId={validVersionId} />
      </div>
    </div>
  );
}
