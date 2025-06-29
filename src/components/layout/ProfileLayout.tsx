
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { ProfileSidebar } from '@/components/profile/ProfileSidebar';
import type { TimelineSection } from '@/pages/ProfileTimelinePage';

interface ProfileLayoutProps {
  children: React.ReactNode;
  activeSection: TimelineSection;
  onSectionChange: (section: TimelineSection) => void;
}

export const ProfileLayout: React.FC<ProfileLayoutProps> = ({
  children,
  activeSection,
  onSectionChange,
}) => {
  const { user, loading } = useAuth();

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if no user
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 transition-colors duration-300">
      <div className="flex h-screen">
        {/* Left Sidebar */}
        <div className="w-64 flex-shrink-0">
          <ProfileSidebar 
            activeSection={activeSection}
            onSectionChange={onSectionChange}
          />
        </div>
        
        {/* Right Content Area */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};
