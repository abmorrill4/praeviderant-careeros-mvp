
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, Database, Settings, User } from 'lucide-react';

const ProfileManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const managementSections = [
    {
      title: 'Resume Upload',
      description: 'Upload and process your resume to extract career data',
      icon: Upload,
      path: '/resume-upload-v2',
    },
    {
      title: 'Data Management',
      description: 'Manage your profile data and career information',
      icon: Database,
      path: '/data-management',
    },
    {
      title: 'Admin Tools',
      description: 'Advanced tools for managing your profile entities',
      icon: Settings,
      path: '/entity-graph-admin',
    },
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-career-dark' : 'bg-career-light'} transition-colors duration-300`}>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/profile-timeline')}
            className={`${theme === 'dark' ? 'hover:bg-career-gray-dark text-career-text-dark' : 'hover:bg-career-gray-light text-career-text-light'}`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Timeline
          </Button>
          <div>
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              Profile Management
            </h1>
            <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} mt-2`}>
              Manage your profile data, upload resumes, and access advanced tools
            </p>
          </div>
        </div>

        {/* User Info Card */}
        <Card className={`${theme === 'dark' ? 'neumorphic-panel dark bg-career-panel-dark' : 'neumorphic-panel light bg-career-panel-light'} mb-8`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                <span className="font-medium">User ID:</span> {user.id}
              </p>
              <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                Manage your profile settings and account preferences here.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Management Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {managementSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card
                key={section.title}
                className={`${theme === 'dark' ? 'neumorphic-panel dark bg-career-panel-dark hover:shadow-neumorphic-hover-dark' : 'neumorphic-panel light bg-career-panel-light hover:shadow-neumorphic-hover-light'} transition-all duration-200 cursor-pointer`}
                onClick={() => navigate(section.path)}
              >
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                    <Icon className="w-5 h-5 text-career-accent" />
                    {section.title}
                  </CardTitle>
                  <CardDescription className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className={`w-full ${theme === 'dark' ? 'border-career-gray-dark hover:bg-career-gray-dark' : 'border-career-gray-light hover:bg-career-gray-light'}`}
                  >
                    Open {section.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProfileManagementPage;
