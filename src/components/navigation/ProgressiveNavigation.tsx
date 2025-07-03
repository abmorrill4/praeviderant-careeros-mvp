import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
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
  Briefcase, 
  MessageCircle, 
  TrendingUp, 
  Settings, 
  FileText,
  Shield,
  LogOut,
  ChevronRight,
  Home,
  Menu
} from 'lucide-react';

interface ProgressiveNavigationProps {
  children: React.ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  phase: 'build' | 'optimize' | 'apply';
  description?: string;
  badge?: string;
}

const navigationItems: NavItem[] = [
  // Build Phase - Foundation Creation
  {
    id: 'profile-timeline',
    label: 'Career Timeline',
    icon: User,
    path: '/profile-timeline',
    phase: 'build',
    description: 'Build your complete career foundation',
    badge: 'Core'
  },
  {
    id: 'interview',
    label: 'AI Interview',
    icon: MessageCircle,
    path: '/interview',
    phase: 'build',
    description: 'Extract insights through conversation',
    badge: 'Insights'
  },
  
  // Optimize Phase - Enhancement & Refinement
  {
    id: 'profile-optimization',
    label: 'Optimization',
    icon: TrendingUp,
    path: '/profile-optimization',
    phase: 'optimize',
    description: 'Enhance profile effectiveness',
    badge: 'Analysis'
  },
  {
    id: 'profile-management',
    label: 'Data Management',
    icon: Settings,
    path: '/profile-management',
    phase: 'optimize',
    description: 'Organize and refine your data',
    badge: 'Control'
  },
  
  // Apply Phase - Application & Execution
  {
    id: 'application-toolkit',
    label: 'Applications',
    icon: FileText,
    path: '/application-toolkit',
    phase: 'apply',
    description: 'Generate targeted applications',
    badge: 'Deploy'
  }
];

const phaseConfig = {
  build: {
    label: 'Build',
    color: 'nav-build',
    bgColor: 'bg-nav-build',
    lightColor: 'bg-nav-build-light',
    description: 'Create your foundation'
  },
  optimize: {
    label: 'Optimize',
    color: 'nav-optimize',
    bgColor: 'bg-nav-optimize',
    lightColor: 'bg-nav-optimize-light',
    description: 'Enhance and refine'
  },
  apply: {
    label: 'Apply',
    color: 'nav-apply',
    bgColor: 'bg-nav-apply',
    lightColor: 'bg-nav-apply-light',
    description: 'Generate and execute'
  }
};

export const ProgressiveNavigation: React.FC<ProgressiveNavigationProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isAdmin, setIsAdmin] = useState(false);

  const currentPath = location.pathname;
  const currentItem = navigationItems.find(item => item.path === currentPath);
  const currentPhase = currentItem?.phase || 'build';

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
      <div className="min-h-screen flex w-full bg-sidebar">
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
    <Sidebar className="border-r bg-sidebar">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-sidebar-foreground">
                Praeviderant
              </h2>
              <p className="text-xs text-sidebar-foreground/60">
                Career Intelligence
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        {/* Phase Progress Indicator */}
        {!collapsed && (
          <div className="mb-6 p-3 rounded-lg bg-sidebar-accent/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-sidebar-foreground/70">
                Current Phase
              </span>
              <Badge 
                variant="secondary" 
                className={`${phaseConfig[currentPhase as keyof typeof phaseConfig]?.bgColor} text-white`}
              >
                {phaseConfig[currentPhase as keyof typeof phaseConfig]?.label}
              </Badge>
            </div>
            <p className="text-xs text-sidebar-foreground/60">
              {phaseConfig[currentPhase as keyof typeof phaseConfig]?.description}
            </p>
          </div>
        )}

        {/* Navigation Groups by Phase */}
        {Object.entries(phaseConfig).map(([phase, config]) => {
          const items = groupedItems[phase] || [];
          const isCurrentPhase = phase === currentPhase;
          
          return (
            <SidebarGroup key={phase}>
              <SidebarGroupLabel className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${config.bgColor}`} />
                <span className={isCurrentPhase ? config.color : 'text-sidebar-foreground/60'}>
                  {config.label}
                </span>
                {isCurrentPhase && (
                  <ChevronRight className="w-3 h-3 text-sidebar-foreground/40" />
                )}
              </SidebarGroupLabel>
              
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => {
                    const isActive = isItemActive(item.path);
                    const Icon = item.icon;
                    
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => navigate(item.path)}
                          isActive={isActive}
                          className={`
                            group smooth-transition touch-action-manipulation
                            ${isActive ? `${config.bgColor} text-white hover:${config.bgColor}/90` : ''}
                            ${!collapsed ? 'p-3' : 'p-2'}
                          `}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : config.color}`} />
                          {!collapsed && (
                            <div className="flex-1 text-left">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{item.label}</span>
                                {item.badge && (
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs"
                                  >
                                    {item.badge}
                                  </Badge>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs mt-1 text-sidebar-foreground/60">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}

        {/* Admin Section */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate('/admin')}>
                    <Shield className="w-4 h-4" />
                    {!collapsed && <span>Admin Portal</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        {/* User Profile Section */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-sidebar-foreground/60">
                  Career Professional
                </p>
              </div>
            )}
          </div>
          
          <Button
            onClick={handleSignOut}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

const MobileHeader: React.FC<{ currentPhase: string }> = ({ currentPhase }) => {
  const config = phaseConfig[currentPhase as keyof typeof phaseConfig];
  
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-16 lg:px-6">
      <SidebarTrigger className="lg:hidden">
        <Menu className="w-5 h-5" />
      </SidebarTrigger>
      
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${config?.bgColor}`} />
        <h1 className="font-semibold text-lg">
          {config?.label} Phase
        </h1>
      </div>
    </header>
  );
};

export default ProgressiveNavigation;