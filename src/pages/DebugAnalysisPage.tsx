
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertTriangle, Info } from 'lucide-react';
import { DebugDashboard } from '@/components/debug/DebugDashboard';

export default function DebugAnalysisPage() {
  const params = useParams<{ versionId?: string }>();
  const navigate = useNavigate();

  // Extract version ID and validate it
  const rawVersionId = params.versionId;
  
  // Debug logging to see what we're receiving
  useEffect(() => {
    console.log('DebugAnalysisPage - URL Parameters:', {
      rawVersionId,
      allParams: params,
      currentPath: window.location.pathname,
      search: window.location.search,
      timestamp: new Date().toISOString()
    });
  }, [rawVersionId, params]);

  // Validate version ID format (should be a UUID)
  const isValidVersionId = (id?: string): boolean => {
    if (!id) return false;
    // Check for parameter placeholder patterns
    if (id === ':versionId' || id.startsWith(':') || id === 'undefined' || id === 'null') {
      return false;
    }
    // Check UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const validVersionId = isValidVersionId(rawVersionId) ? rawVersionId : undefined;
  const hasParameterPlaceholder = rawVersionId === ':versionId' || (rawVersionId && rawVersionId.startsWith(':'));

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
              <div>Raw versionId parameter: <code className="bg-blue-100 px-1 rounded">{rawVersionId || 'undefined'}</code></div>
              <div>Current URL: <code className="bg-blue-100 px-1 rounded">{window.location.pathname}</code></div>
              <div>Is valid UUID: <code className="bg-blue-100 px-1 rounded">{isValidVersionId(rawVersionId) ? 'Yes' : 'No'}</code></div>
              <div>Has placeholder: <code className="bg-blue-100 px-1 rounded">{hasParameterPlaceholder ? 'Yes' : 'No'}</code></div>
            </div>
          </div>

          {/* Parameter placeholder error */}
          {hasParameterPlaceholder && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>
                    <strong>Routing Issue Detected:</strong> The URL parameter wasn't properly substituted.
                  </p>
                  <p className="text-sm">
                    Current parameter: <code className="bg-red-100 px-1 rounded">{rawVersionId}</code>
                  </p>
                  <p className="text-sm">
                    This usually means you're navigating to this page without a valid resume version ID in the URL.
                    The correct URL format should be: <code className="bg-red-100 px-1 rounded">/debug/[uuid]</code>
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Invalid version ID error */}
          {rawVersionId && !hasParameterPlaceholder && !validVersionId && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Invalid version ID format: <code>{rawVersionId}</code>
                <br />
                <span className="text-sm mt-1 block">
                  Version ID must be a valid UUID format.
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* No version ID provided */}
          {!rawVersionId && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                No version ID provided. The debug dashboard will show general system status only.
                To debug a specific resume, navigate to this page with a valid version ID in the URL.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Only render DebugDashboard if we don't have critical routing issues */}
        {!hasParameterPlaceholder && (
          <DebugDashboard versionId={validVersionId} />
        )}

        {/* Show routing help if we have parameter placeholder issues */}
        {hasParameterPlaceholder && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium mb-4">How to Access Debug Analysis</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p>To debug a specific resume version, you need to navigate to this page with a valid version ID:</p>
              <div className="bg-gray-100 p-3 rounded font-mono text-xs">
                /debug/[version-uuid]
              </div>
              <p>You can find version IDs in:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>The Profile Management page - each resume has a version ID</li>
                <li>The Resume Upload page - after processing completes</li>
                <li>The browser URL when viewing resume details</li>
              </ul>
              <div className="mt-4">
                <Button 
                  onClick={() => navigate('/profile-management')} 
                  variant="outline"
                >
                  Go to Profile Management
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
