
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { User, Briefcase, GraduationCap, Star, Settings, LogOut } from 'lucide-react';
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
];

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    const email = user?.email || '';
    const name = email.split('@')[0];
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className={`h-full ${theme === 'dark' ? 'neumorphic-panel dark bg-career-panel-dark' : 'neumorphic-panel light bg-career-panel-light'} m-3 p-4 flex flex-col`}>
      {/* User Identity Section */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className={`${theme === 'dark' ? 'bg-career-gray-dark text-career-text-dark' : 'bg-career-gray-light text-career-text-light'} font-semibold text-sm`}>
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className={`text-base font-semibold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-0.5`}>
              {user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
            </h2>
            <p className={`text-xs ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
              Career Professional
            </p>
          </div>
        </div>
      </div>

      <Separator className={`mb-4 ${theme === 'dark' ? 'bg-career-gray-dark' : 'bg-career-gray-light'}`} />

      {/* Main Navigation Menu */}
      <nav className="flex-1">
        <div className="space-y-1 mb-4">
          <h3 className={`text-xs font-semibold ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} uppercase tracking-wider mb-2`}>
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
                className={`w-full justify-start h-10 px-3 ${
                  isActive
                    ? 'bg-career-accent text-white shadow-neumorphic-inset-dark hover:bg-career-accent'
                    : theme === 'dark'
                      ? 'hover:bg-career-gray-dark text-career-text-muted-dark hover:text-career-text-dark'
                      : 'hover:bg-career-gray-light text-career-text-muted-light hover:text-career-text-light'
                } transition-all duration-200`}
              >
                <Icon className="w-4 h-4 mr-2" />
                <span className="font-medium text-sm">{item.label}</span>
              </Button>
            );
          })}
        </div>

        <Separator className={`mb-4 ${theme === 'dark' ? 'bg-career-gray-dark' : 'bg-career-gray-light'}`} />

        {/* Profile Management Section */}
        <div className="space-y-1 mb-4">
          <h3 className={`text-xs font-semibold ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} uppercase tracking-wider mb-2`}>
            Management
          </h3>
          <Button
            variant="ghost"
            onClick={() => navigate('/profile-management')}
            className={`w-full justify-start h-10 px-3 ${
              theme === 'dark'
                ? 'hover:bg-career-gray-dark text-career-text-muted-dark hover:text-career-text-dark'
                : 'hover:bg-career-gray-light text-career-text-muted-light hover:text-career-text-light'
            } transition-all duration-200`}
          >
            <Settings className="w-4 h-4 mr-2" />
            <span className="font-medium text-sm">Profile Management</span>
          </Button>
        </div>

        {/* Sign Out */}
        <div className="space-y-1">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className={`w-full justify-start h-10 px-3 group ${
              theme === 'dark'
                ? 'hover:bg-red-900/20 text-red-400 hover:text-red-300'
                : 'hover:bg-red-50 text-red-600 hover:text-red-700'
            } transition-all duration-200`}
          >
            <LogOut className="w-4 h-4 mr-2 group-hover:text-red-500" />
            <span className="font-medium text-sm">Sign Out</span>
          </Button>
        </div>
      </nav>
    </div>
  );
};
