
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileLayout } from '@/components/layout/ProfileLayout';
import { Upload, Database, Settings, User } from 'lucide-react';
import { ResumeUploadRefactored } from '@/components/resume-upload/ResumeUploadRefactored';
import { DataManagementTab } from '@/components/profile-management/DataManagementTab';
import type { TimelineSection } from '@/pages/ProfileTimelinePage';

export type ManagementSection = 'profile' | 'uploads' | 'data' | 'admin';

const ProfileManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState<TimelineSection>('overview');
  const [activeManagementSection, setActiveManagementSection] = useState<ManagementSection>('profile');

  const handleNavigateToAdmin = () => {
    window.open('/entity-graph-admin', '_blank');
  };

  return (
    <ProfileLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      <div className="h-full flex flex-col">
        <div className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-gray-dark' : 'bg-career-panel-light border-career-gray-light'} border-b p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
              Profile Management
            </h1>
          </div>
          <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} mb-4`}>
            Manage your profile data, upload resumes, and access advanced tools
          </p>
          
          <Tabs value={activeManagementSection} onValueChange={(value) => setActiveManagementSection(value as ManagementSection)}>
            <TabsList className={`grid w-full grid-cols-4 ${theme === 'dark' ? 'bg-career-gray-dark' : 'bg-career-gray-light'}`}>
              <TabsTrigger value="profile">Profile Info</TabsTrigger>
              <TabsTrigger value="uploads">Resume Upload</TabsTrigger>
              <TabsTrigger value="data">Data Management</TabsTrigger>
              <TabsTrigger value="admin">Admin Tools</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
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
              <ResumeUploadRefactored />
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
        </div>
      </div>
    </ProfileLayout>
  );
};

export default ProfileManagementPage;
