
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CleanNavigation } from '@/components/navigation/CleanNavigation';
import { BreadcrumbNavigation } from '@/components/navigation/BreadcrumbNavigation';
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
    <CleanNavigation>
      <BreadcrumbNavigation />
      <div className="h-full flex flex-col">
        <div className="bg-white border-b p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {showResumeReview ? 'Resume Analysis Results' : 'Profile Management'}
            </h1>
          </div>
          <p className="text-gray-600 mb-4">
            {showResumeReview 
              ? 'Review your extracted resume data and add it to your profile'
              : 'Manage your profile data, upload resumes, and access advanced tools'
            }
          </p>
          
          {!showResumeReview && (
            <Tabs value={activeManagementSection} onValueChange={(value) => setActiveManagementSection(value as ManagementSection)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile Info</TabsTrigger>
                <TabsTrigger value="uploads">Resume Upload</TabsTrigger>
                <TabsTrigger value="data">Data Management</TabsTrigger>
                <TabsTrigger value="admin">Admin Tools</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
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
                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <User className="w-5 h-5" />
                      Profile Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-gray-900">
                          <span className="font-medium">Email:</span> {user?.email}
                        </p>
                        <p className="text-gray-900">
                          <span className="font-medium">User ID:</span> {user?.id}
                        </p>
                        <p className="text-gray-600">
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
                  className="bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={handleNavigateToAdmin}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <Settings className="w-5 h-5 text-purple-600" />
                      Admin Tools
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Advanced tools for managing your profile entities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full"
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
    </CleanNavigation>
  );
};

export default ProfileManagementPage;
