
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useEnrichmentStatus } from '@/hooks/useEnrichmentStatus';
import { EnrichmentProgress } from '@/components/resume-upload/EnrichmentProgress';
import { SmartEnrichmentTrigger } from '@/components/resume-upload/SmartEnrichmentTrigger';

export default function ProcessingPage() {
  const { enrichmentId } = useParams<{ enrichmentId: string }>();
  const navigate = useNavigate();
  
  const { data: status, isLoading, error } = useEnrichmentStatus(enrichmentId);

  // FIXED: Enhanced redirect logic when processing is complete
  useEffect(() => {
    if (status?.isComplete && status?.hasEntities) {
      console.log('ProcessingPage: Analysis complete, redirecting to results page...', {
        isComplete: status.isComplete,
        hasEntities: status.hasEntities,
        hasEnrichment: status.hasEnrichment,
        hasNarratives: status.hasNarratives,
        versionId: status.versionId
      });
      
      // Redirect to the parsed resume entities page where user can review and merge data
      const redirectTimer = setTimeout(() => {
        console.log('ProcessingPage: Redirecting to results page for data review...');
        navigate(`/profile-management?section=data&version=${status.versionId}&tab=review`);
      }, 1500);

      return () => clearTimeout(redirectTimer);
    }
  }, [status?.isComplete, status?.hasEntities, status?.versionId, navigate]);

  // Handle missing enrichmentId
  if (!enrichmentId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Invalid Processing Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The processing link you followed is invalid or malformed.
            </p>
            <Button onClick={() => navigate('/profile-management')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Profile Management
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading processing status...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle error states
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Processing Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We encountered an error while loading your processing status.
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Retry
              </Button>
              <Button 
                onClick={() => navigate('/profile-management')}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle case where enrichment record not found
  if (!status) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-5 h-5" />
              Processing Not Found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The processing session you're looking for could not be found. It may have expired or been removed.
            </p>
            <Button onClick={() => navigate('/profile-management')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Profile Management
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle failed processing
  if (status.processingStage === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Processing Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Unfortunately, we encountered an error while processing your resume. This can happen due to various reasons such as file format issues or temporary service disruptions.
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm text-red-800">
                <strong>What you can do:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Try uploading your resume again</li>
                  <li>Ensure your resume is in PDF, Word, or text format</li>
                  <li>Check that your file is under 50MB</li>
                  <li>Contact support if the problem persists</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => navigate('/profile-management')}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Try Another Upload
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.open('mailto:support@praeviderant.com', '_blank')}
                className="flex-1"
              >
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show processing in progress or completion
  const isComplete = status.isComplete && status.hasEntities;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Include the SmartEnrichmentTrigger to handle AI processing */}
      <SmartEnrichmentTrigger versionId={enrichmentId} />
      
      <div className="max-w-4xl mx-auto p-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/profile-management')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile Management
          </Button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isComplete ? 'Analysis Complete!' : 'AI Resume Analysis'}
            </h1>
            <p className="text-muted-foreground">
              {isComplete 
                ? 'Your resume has been successfully analyzed. Redirecting to review your results...'
                : 'Please wait while we analyze your resume and generate personalized career insights.'
              }
            </p>
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-6">
          <EnrichmentProgress status={status} />
          
          {/* Completion Actions */}
          {isComplete && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Analysis Complete!
                </h3>
                <p className="text-green-700 mb-6">
                  Your resume has been successfully analyzed and structured. You can now review the extracted data and add it to your profile.
                </p>
                
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={() => navigate(`/profile-management?section=data&version=${status.versionId}&tab=review`)}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Review Results & Add to Profile
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/profile-management')}
                    size="lg"
                  >
                    Upload Another Resume
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Help Section */}
        {!isComplete && (
          <Card className="mt-8 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <h4 className="font-medium text-blue-800 mb-2">What's happening?</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Our AI is carefully analyzing your resume structure and content</p>
                <p>• We're extracting your skills, experience, and achievements</p>
                <p>• Generating personalized career insights and recommendations</p>
                <p>• This process typically takes 30-60 seconds to complete</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
```

Now I need to update the ProfileManagementPage to properly handle the URL parameters and show the results page:

<lov-write file_path="src/pages/ProfileManagementPage.tsx">
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileLayout } from '@/components/layout/ProfileLayout';
import { Upload, Database, Settings, User } from 'lucide-react';
import { ResumeUpload } from '@/components/resume-upload/ResumeUpload';
import { DataManagementTab } from '@/components/profile-management/DataManagementTab';
import { ParsedResumeEntities } from '@/components/ParsedResumeEntities';
import type { TimelineSection } from '@/pages/ProfileTimelinePage';

export type ManagementSection = 'profile' | 'uploads' | 'data' | 'admin';

const ProfileManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<TimelineSection>('overview');
  const [activeManagementSection, setActiveManagementSection] = useState<ManagementSection>('profile');

  // Get URL parameters
  const urlSection = searchParams.get('section');
  const urlVersion = searchParams.get('version');
  const urlTab = searchParams.get('tab');

  // Set active section based on URL parameters
  useEffect(() => {
    if (urlSection === 'data' && urlVersion) {
      setActiveManagementSection('data');
    }
  }, [urlSection, urlVersion]);

  const handleNavigateToAdmin = () => {
    window.open('/entity-graph-admin', '_blank');
  };

  // If we have a version to review, show the ParsedResumeEntities component
  const showResumeReview = urlSection === 'data' && urlVersion && urlTab === 'review';

  return (
    <ProfileLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      <div className="h-full flex flex-col">
        <div className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-gray-dark' : 'bg-career-panel-light border-career-gray-light'} border-b p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
              {showResumeReview ? 'Resume Analysis Results' : 'Profile Management'}
            </h1>
          </div>
          <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} mb-4`}>
            {showResumeReview 
              ? 'Review your extracted resume data and add it to your profile'
              : 'Manage your profile data, upload resumes, and access advanced tools'
            }
          </p>
          
          {!showResumeReview && (
            <Tabs value={activeManagementSection} onValueChange={(value) => setActiveManagementSection(value as ManagementSection)}>
              <TabsList className={`grid w-full grid-cols-4 ${theme === 'dark' ? 'bg-career-gray-dark' : 'bg-career-gray-light'}`}>
                <TabsTrigger value="profile">Profile Info</TabsTrigger>
                <TabsTrigger value="uploads">Resume Upload</TabsTrigger>
                <TabsTrigger value="data">Data Management</TabsTrigger>
                <TabsTrigger value="admin">Admin Tools</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {showResumeReview ? (
            <ParsedResumeEntities 
              versionId={urlVersion} 
              processingStatus="completed"
              onProfileUpdated={() => {
                // Optionally redirect back to profile after update
                console.log('Profile updated successfully');
              }}
            />
          ) : (
            <Tabs value={activeManagementSection} onValueChange={(value) => setActiveManagementSection(value as ManagementSection)}>
              <TabsContent value="profile" className="mt-0">
                <Card className={`${theme === 'dark' ? 'neumorphic-panel dark bg-career-panel-dark' : 'neumorphic-panel light bg-career-panel-light'}`}>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                      <User className="w-5 h-5" />
                      Profile Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                          <span className="font-medium">Email:</span> {user?.email}
                        </p>
                        <p className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                          <span className="font-medium">User ID:</span> {user?.id}
                        </p>
                        <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                          Manage your profile settings and account preferences here.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="uploads" className="mt-0">
                <ResumeUpload />
              </TabsContent>

              <TabsContent value="data" className="mt-0">
                <DataManagementTab />
              </TabsContent>

              <TabsContent value="admin" className="mt-0">
                <Card
                  className={`${theme === 'dark' ? 'neumorphic-panel dark bg-career-panel-dark hover:shadow-neumorphic-hover-dark' : 'neumorphic-panel light bg-career-panel-light hover:shadow-neumorphic-hover-light'} transition-all duration-200 cursor-pointer`}
                  onClick={handleNavigateToAdmin}
                >
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                      <Settings className="w-5 h-5 text-career-accent" />
                      Admin Tools
                    </CardTitle>
                    <CardDescription className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                      Advanced tools for managing your profile entities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className={`w-full ${theme === 'dark' ? 'border-career-gray-dark hover:bg-career-gray-dark' : 'border-career-gray-light hover:bg-career-gray-light'}`}
                    >
                      Open Admin Tools
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </ProfileLayout>
  );
};

export default ProfileManagementPage;
```
