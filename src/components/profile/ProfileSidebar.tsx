
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { User, Briefcase, GraduationCap, Star, Target } from 'lucide-react';
import type { TimelineSection } from '@/pages/ProfileTimelinePage';

interface ProfileSidebarProps {
  activeSection: TimelineSection;
  onSectionChange: (section: TimelineSection) => void;
}

const navigationItems = [
  { id: 'overview' as const, label: 'Overview', icon: User },
  { id: 'experience' as const, label: 'Experience', icon: Briefcase },
  { id: 'education' as const, label: 'Education', icon: GraduationCap },
  { id: 'skills' as const, label: 'Skills', icon: Star },
  { id: 'goals' as const, label: 'Goals', icon: Target },
];

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const { user } = useAuth();
  const { theme } = useTheme();

  // Calculate profile completeness (placeholder logic)
  const profileCompleteness = 75;

  return (
    <div className={`h-full ${theme === 'dark' ? 'neumorphic-panel dark bg-career-panel-dark' : 'neumorphic-panel light bg-career-panel-light'} m-4 p-6 flex flex-col`}>
      {/* User Identity Section */}
      <div className="mb-8">
        <div className={`w-16 h-16 rounded-full ${theme === 'dark' ? 'bg-career-gray-dark shadow-neumorphic-inset-dark' : 'bg-career-gray-light shadow-neumorphic-inset-light'} flex items-center justify-center mb-4`}>
          <User className={`w-8 h-8 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`} />
        </div>
        
        <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-1`}>
          {user?.email?.split('@')[0] || 'User'}
        </h2>
        
        <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
          Career Professional
        </p>
      </div>

      {/* Profile Completeness */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
            Profile Completeness
          </span>
          <span className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
            {profileCompleteness}%
          </span>
        </div>
        <Progress value={profileCompleteness} className="h-2" />
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = activeSection === item.id;
            const Icon = item.icon;
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => onSectionChange(item.id)}
                className={`w-full justify-start h-12 px-4 ${
                  isActive
                    ? theme === 'dark'
                      ? 'neumorphic-button dark bg-career-accent text-white shadow-neumorphic-inset-dark'
                      : 'neumorphic-button light bg-career-accent text-white shadow-neumorphic-inset-light'
                    : theme === 'dark'
                      ? 'hover:bg-career-gray-dark text-career-text-muted-dark hover:text-career-text-dark'
                      : 'hover:bg-career-gray-light text-career-text-muted-light hover:text-career-text-light'
                } transition-all duration-200`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
