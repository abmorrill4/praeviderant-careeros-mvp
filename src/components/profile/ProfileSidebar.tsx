
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Briefcase, GraduationCap, Star, Settings, LogOut, TrendingUp, MessageCircle, Shield } from 'lucide-react';
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
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase.rpc('is_admin_user');
        setIsAdmin(data || false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

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

  // Check if we're on the profile timeline page for section navigation
  const isOnTimelinePage = location.pathname === '/profile-timeline';

  // Check if a route is active
  const isRouteActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="h-full bg-white shadow-lg m-3 p-4 flex flex-col rounded-lg border border-slate-200">
      {/* User Identity Section */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-slate-100 text-slate-700 font-semibold text-sm">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-0.5">
              {user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
            </h2>
            <p className="text-xs text-slate-600">
              Career Professional
            </p>
          </div>
        </div>
      </div>

      <Separator className="mb-4" />

      {/* Main Navigation Menu */}
      <nav className="flex-1">
        <div className="space-y-1 mb-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Profile
          </h3>
          {navigationItems.map((item) => {
            // Only show active state if we're on the timeline page AND this section is active
            const isActive = isOnTimelinePage && activeSection === item.id;
            const Icon = item.icon;
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => {
                  if (isOnTimelinePage) {
                    // If we're already on the timeline page, just change the section
                    onSectionChange(item.id);
                  } else {
                    // If we're on a different page, navigate with the section as a URL parameter
                    navigate(`/profile-timeline?section=${item.id}`);
                  }
                }}
                className={`w-full justify-start h-10 px-3 ${
                  isActive
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                } transition-all duration-200`}
              >
                <Icon className="w-4 h-4 mr-2" />
                <span className="font-medium text-sm">{item.label}</span>
              </Button>
            );
          })}
        </div>

        <Separator className="mb-4" />

        {/* Profile Management Section */}
        <div className="space-y-1 mb-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Tools & Optimization
          </h3>
          <Button
            variant="ghost"
            onClick={() => navigate('/interview')}
            className={`w-full justify-start h-10 px-3 ${
              isRouteActive('/interview')
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
            } transition-all duration-200`}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            <span className="font-medium text-sm">AI Interview</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/profile-optimization')}
            className={`w-full justify-start h-10 px-3 ${
              isRouteActive('/profile-optimization')
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
            } transition-all duration-200`}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            <span className="font-medium text-sm">Profile Optimization</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/profile-management')}
            className={`w-full justify-start h-10 px-3 ${
              isRouteActive('/profile-management')
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
            } transition-all duration-200`}
          >
            <Settings className="w-4 h-4 mr-2" />
            <span className="font-medium text-sm">Profile Management</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/application-toolkit')}
            className={`w-full justify-start h-10 px-3 ${
              isRouteActive('/application-toolkit')
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
            } transition-all duration-200`}
          >
            <Briefcase className="w-4 h-4 mr-2" />
            <span className="font-medium text-sm">Application Toolkit</span>
          </Button>
        </div>

        {/* Admin Section - Only show for admin users */}
        {isAdmin && (
          <>
            <Separator className="mb-4" />
            <div className="space-y-1 mb-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Administration
              </h3>
              <Button
                variant="ghost"
                onClick={() => navigate('/admin')}
                className={`w-full justify-start h-10 px-3 ${
                  isRouteActive('/admin')
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                } transition-all duration-200`}
              >
                <Shield className="w-4 h-4 mr-2" />
                <span className="font-medium text-sm">Admin Portal</span>
              </Button>
            </div>
          </>
        )}


        {/* Sign Out */}
        <div className="space-y-1">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start h-10 px-3 group hover:bg-red-50 text-red-600 hover:text-red-700 transition-all duration-200"
          >
            <LogOut className="w-4 h-4 mr-2 group-hover:text-red-500" />
            <span className="font-medium text-sm">Sign Out</span>
          </Button>
        </div>
      </nav>
    </div>
  );
};
