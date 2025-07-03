import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  MessageCircle, 
  TrendingUp, 
  Settings, 
  FileText,
  Shield,
  LogOut,
  Menu,
  ChevronRight
} from 'lucide-react';

interface CleanNavigationProps {
  children: React.ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  phase: 'build' | 'optimize' | 'apply';
}

const navigationItems: NavItem[] = [
  {
    id: 'profile-timeline',
    label: 'Profile',
    icon: User,
    path: '/profile-timeline',
    phase: 'build'
  },
  {
    id: 'interview',
    label: 'Interview',
    icon: MessageCircle,
    path: '/interview',
    phase: 'build'
  },
  {
    id: 'profile-management',
    label: 'Manage',
    icon: Settings,
    path: '/profile-management',
    phase: 'optimize'
  },
  {
    id: 'application-toolkit',
    label: 'Apply',
    icon: FileText,
    path: '/application-toolkit',
    phase: 'apply'
  }
];

const phaseConfig = {
  build: {
    label: 'Build',
    description: 'Create your foundation',
    color: 'text-green-600',
    bgColor: 'bg-green-600',
    lightBg: 'bg-green-50',
    border: 'border-green-200'
  },
  optimize: {
    label: 'Optimize', 
    description: 'Enhance and refine',
    color: 'text-orange-600',
    bgColor: 'bg-orange-600',
    lightBg: 'bg-orange-50',
    border: 'border-orange-200'
  },
  apply: {
    label: 'Apply',
    description: 'Generate and execute',
    color: 'text-purple-600',
    bgColor: 'bg-purple-600',
    lightBg: 'bg-purple-50', 
    border: 'border-purple-200'
  }
};

export const CleanNavigation: React.FC<CleanNavigationProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  const currentPath = location.pathname;
  const currentItem = navigationItems.find(item => item.path === currentPath);
  const currentPhase = currentItem?.phase || 'build';

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

  const getUserInitials = () => {
    const email = user?.email || '';
    const name = email.split('@')[0];
    return name.slice(0, 2).toUpperCase();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isItemActive = (path: string) => currentPath === path;

  const groupedItems = navigationItems.reduce((acc, item) => {
    if (!acc[item.phase]) acc[item.phase] = [];
    acc[item.phase].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar 
          user={user}
          currentPhase={currentPhase}
          groupedItems={groupedItems}
          isItemActive={isItemActive}
          getUserInitials={getUserInitials}
          handleSignOut={handleSignOut}
          isAdmin={isAdmin}
          navigate={navigate}
        />
        
        <SidebarInset className="flex-1">
          <MobileHeader currentPhase={currentPhase} />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

interface AppSidebarProps {
  user: any;
  currentPhase: string;
  groupedItems: Record<string, NavItem[]>;
  isItemActive: (path: string) => boolean;
  getUserInitials: () => string;
  handleSignOut: () => void;
  isAdmin: boolean;
  navigate: (path: string) => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({
  user,
  currentPhase,
  groupedItems,
  isItemActive,
  getUserInitials,
  handleSignOut,
  isAdmin,
  navigate
}) => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar className="border-r bg-white">
      <SidebarHeader className="p-2 border-b">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
            <User className="w-3 h-3 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                Praeviderant
              </h2>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        {/* Single Navigation Menu */}
        <SidebarMenu className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = isItemActive(item.path);
            const Icon = item.icon;
            const config = phaseConfig[item.phase];
            
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  onClick={() => navigate(item.path)}
                  className={`
                    w-full h-8 px-2 rounded-md transition-all duration-200 font-medium
                    ${isActive 
                      ? `${config.bgColor} text-white shadow-sm` 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                    ${collapsed ? 'justify-center' : 'justify-start'}
                  `}
                >
                  <Icon className={`w-4 h-4 ${collapsed ? '' : 'mr-2'} ${isActive ? 'text-white' : config.color}`} />
                  {!collapsed && (
                    <span className="text-sm">{item.label}</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>

        {/* Admin Section */}
        {isAdmin && (
          <div className="mt-2 pt-2 border-t">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/admin')}
                  className="w-full h-8 px-2 rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium"
                >
                  <Shield className="w-4 h-4 mr-2 text-gray-500" />
                  {!collapsed && <span className="text-sm">Admin</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t">
        <div className="flex items-center justify-between">
          <Avatar className="w-6 h-6">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 mx-2 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
              </p>
            </div>
          )}
          <Button
            onClick={handleSignOut}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            <LogOut className="w-3 h-3" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

const MobileHeader: React.FC<{ currentPhase: string }> = ({ currentPhase }) => {
  const config = phaseConfig[currentPhase as keyof typeof phaseConfig];
  
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-white px-6">
      <SidebarTrigger className="lg:hidden">
        <Menu className="w-5 h-5" />
      </SidebarTrigger>
      
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 rounded-full ${config?.bgColor}`} />
        <h1 className="text-lg font-semibold text-gray-900">
          {config?.label} Phase
        </h1>
      </div>
    </header>
  );
};

export default CleanNavigation;