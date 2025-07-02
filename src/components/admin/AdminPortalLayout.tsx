import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
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
  SidebarGroupContent
} from '@/components/ui/sidebar';
import { 
  Settings, 
  Database, 
  Shield, 
  Bot, 
  Users, 
  LogOut,
  ArrowLeft,
  Crown
} from 'lucide-react';
import type { AdminModule } from '@/pages/AdminPortal';

interface AdminPortalLayoutProps {
  children: React.ReactNode;
  activeModule: AdminModule;
  onModuleChange: (module: AdminModule) => void;
}

const adminModules = [
  { 
    id: 'system' as const, 
    label: 'System Management', 
    icon: Settings,
    description: 'System monitoring, performance, and configuration'
  },
  { 
    id: 'data' as const, 
    label: 'Data Management', 
    icon: Database,
    description: 'Entity graphs, normalization, and data quality'
  },
  { 
    id: 'security' as const, 
    label: 'Security & Compliance', 
    icon: Shield,
    description: 'Security monitoring, testing, and audit logs'
  },
  { 
    id: 'ai-content' as const, 
    label: 'AI & Content', 
    icon: Bot,
    description: 'Prompt templates, AI models, and content management'
  },
  { 
    id: 'users' as const, 
    label: 'User Management', 
    icon: Users,
    description: 'User accounts, roles, and permissions'
  },
];

export const AdminPortalLayout: React.FC<AdminPortalLayoutProps> = ({
  children,
  activeModule,
  onModuleChange
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/20">
        <Sidebar className="border-r">
          <SidebarHeader className="p-4 border-b">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">
                  Admin Portal
                </h2>
                <p className="text-xs text-muted-foreground">
                  System Administration
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleBackToDashboard}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Admin Modules</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminModules.map((module) => (
                    <SidebarMenuItem key={module.id}>
                      <SidebarMenuButton
                        onClick={() => onModuleChange(module.id)}
                        isActive={activeModule === module.id}
                        className="w-full justify-start flex-col items-start h-auto py-3"
                      >
                        <div className="flex items-center w-full">
                          <module.icon className="w-4 h-4 mr-3" />
                          <span className="font-medium">{module.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 ml-7">
                          {module.description}
                        </p>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter className="p-4 border-t space-y-3">
            <div className="flex items-center space-x-2 px-2 py-1">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {user?.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.email?.split('@')[0]}
                </p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            </div>
            
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <div className="flex-1">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <SidebarTrigger className="-ml-1" />
              <div className="ml-auto flex items-center space-x-4">
                <div className="text-sm text-muted-foreground">
                  {adminModules.find(m => m.id === activeModule)?.label}
                </div>
              </div>
            </header>
            
            <main className="flex-1 overflow-auto p-6">
              {children}
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};