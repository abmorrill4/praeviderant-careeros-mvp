
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { User, Briefcase, GraduationCap, Star, Target, Settings, LogOut, BarChart3, ChevronDown, Upload, Database } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
];

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = React.useState(false);

  // Calculate profile completeness (placeholder logic)
  const profileCompleteness = 75;

  const handleSignOut = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

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

      {/* Main Navigation Menu */}
      <nav className="flex-1">
        <div className="space-y-2 mb-6">
          <h3 className={`text-xs font-semibold ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} uppercase tracking-wider mb-3`}>
            Profile Sections
          </h3>
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

        {/* Tools & Data Section */}
        <div className="space-y-2 mb-6">
          <Collapsible open={toolsMenuOpen} onOpenChange={setToolsMenuOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full justify-between h-12 px-4 ${
                  theme === 'dark'
                    ? 'hover:bg-career-gray-dark text-career-text-muted-dark hover:text-career-text-dark'
                    : 'hover:bg-career-gray-light text-career-text-muted-light hover:text-career-text-light'
                } transition-all duration-200`}
              >
                <div className="flex items-center">
                  <Database className="w-5 h-5 mr-3" />
                  <span className="font-medium">Tools & Data</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${toolsMenuOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 ml-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/resume-upload-v2')}
                className={`w-full justify-start h-10 px-4 ${
                  theme === 'dark'
                    ? 'hover:bg-career-gray-dark text-career-text-muted-dark hover:text-career-text-dark'
                    : 'hover:bg-career-gray-light text-career-text-muted-light hover:text-career-text-light'
                } transition-all duration-200`}
              >
                <Upload className="w-4 h-4 mr-3" />
                <span>Resume Upload</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/data-management')}
                className={`w-full justify-start h-10 px-4 ${
                  theme === 'dark'
                    ? 'hover:bg-career-gray-dark text-career-text-muted-dark hover:text-career-text-dark'
                    : 'hover:bg-career-gray-light text-career-text-muted-light hover:text-career-text-light'
                } transition-all duration-200`}
              >
                <Database className="w-4 h-4 mr-3" />
                <span>Data Management</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/entity-graph-admin')}
                className={`w-full justify-start h-10 px-4 ${
                  theme === 'dark'
                    ? 'hover:bg-career-gray-dark text-career-text-muted-dark hover:text-career-text-dark'
                    : 'hover:bg-career-gray-light text-career-text-muted-light hover:text-career-text-light'
                } transition-all duration-200`}
              >
                <Settings className="w-4 h-4 mr-3" />
                <span>Admin Tools</span>
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Profile Settings Section */}
        <div className="space-y-2 mb-6">
          <Collapsible open={profileMenuOpen} onOpenChange={setProfileMenuOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full justify-between h-12 px-4 ${
                  theme === 'dark'
                    ? 'hover:bg-career-gray-dark text-career-text-muted-dark hover:text-career-text-dark'
                    : 'hover:bg-career-gray-light text-career-text-muted-light hover:text-career-text-light'
                } transition-all duration-200`}
              >
                <div className="flex items-center">
                  <User className="w-5 h-5 mr-3" />
                  <span className="font-medium">Profile</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 ml-4">
              <Button
                variant="ghost"
                className={`w-full justify-start h-10 px-4 ${
                  theme === 'dark'
                    ? 'hover:bg-career-gray-dark text-career-text-muted-dark hover:text-career-text-dark'
                    : 'hover:bg-career-gray-light text-career-text-muted-light hover:text-career-text-light'
                } transition-all duration-200`}
              >
                <Settings className="w-4 h-4 mr-3" />
                <span>Settings</span>
              </Button>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className={`w-full justify-start h-10 px-4 ${
                  theme === 'dark'
                    ? 'hover:bg-red-900/20 text-red-400 hover:text-red-300'
                    : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                } transition-all duration-200`}
              >
                <LogOut className="w-4 h-4 mr-3" />
                <span>Sign Out</span>
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </nav>
    </div>
  );
};
