
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  SidebarMenuButton
} from "@/components/ui/sidebar";
import { 
  User, 
  Settings, 
  LogOut, 
  Mic,
  FileText,
  Users,
  BarChart3
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import AIInterviewPage from "@/components/interview/AIInterviewPage";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("interview");

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  const menuItems = [
    { id: "interview", label: "AI Interview", icon: Mic },
    { id: "resumes", label: "My Resumes", icon: FileText },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "team", label: "Team", icon: Users },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "interview":
        return <AIInterviewPage />;
      case "resumes":
        return (
          <div className="space-y-8">
            <div>
              <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
                My Resumes
              </h2>
              <p className={`text-lg ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                Generated resumes from your AI interviews
              </p>
            </div>
            <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-gray-dark/30' : 'bg-career-panel-light border-career-gray-light/30 shadow-neumorphic-sm-light'}`}>
              <CardContent className="p-12 text-center">
                <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
                  theme === 'dark' ? 'bg-career-gray-dark/40' : 'bg-career-gray-light/40'
                }`}>
                  <FileText className={`w-8 h-8 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`} />
                </div>
                <h3 className={`text-xl font-semibold mb-3 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                  No resumes yet
                </h3>
                <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} mb-6 max-w-md mx-auto`}>
                  Complete an AI interview to generate your first professional resume tailored to your experience
                </p>
                <Button 
                  onClick={() => setActiveTab("interview")}
                  className="bg-career-accent hover:bg-career-accent-dark text-white px-6 py-2 rounded-xl font-medium"
                >
                  Start Interview
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      case "analytics":
        return (
          <div className="space-y-8">
            <div>
              <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
                Analytics
              </h2>
              <p className={`text-lg ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                Track your career development progress
              </p>
            </div>
            <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-gray-dark/30' : 'bg-career-panel-light border-career-gray-light/30 shadow-neumorphic-sm-light'}`}>
              <CardContent className="p-12 text-center">
                <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
                  theme === 'dark' ? 'bg-career-gray-dark/40' : 'bg-career-gray-light/40'
                }`}>
                  <BarChart3 className={`w-8 h-8 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`} />
                </div>
                <h3 className={`text-xl font-semibold mb-3 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                  Analytics Coming Soon
                </h3>
                <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} max-w-md mx-auto`}>
                  Track your interview progress, resume performance, and career growth metrics
                </p>
              </CardContent>
            </Card>
          </div>
        );
      case "team":
        return (
          <div className="space-y-8">
            <div>
              <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
                Team Management
              </h2>
              <p className={`text-lg ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                Collaborate on career development
              </p>
            </div>
            <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-gray-dark/30' : 'bg-career-panel-light border-career-gray-light/30 shadow-neumorphic-sm-light'}`}>
              <CardContent className="p-12 text-center">
                <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
                  theme === 'dark' ? 'bg-career-gray-dark/40' : 'bg-career-gray-light/40'
                }`}>
                  <Users className={`w-8 h-8 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`} />
                </div>
                <h3 className={`text-xl font-semibold mb-3 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                  Team Features Coming Soon
                </h3>
                <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} max-w-md mx-auto`}>
                  Collaborate with your team on career development and share interview insights
                </p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return <AIInterviewPage />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className={`${theme === 'dark' ? 'border-career-gray-dark/30' : 'border-career-gray-light/30'}`}>
          <SidebarHeader className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-career-accent rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <div>
                <h2 className={`font-bold text-lg ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                  Praeviderant
                </h2>
                <p className={`text-xs px-2 py-1 rounded-full ${
                  theme === 'dark' 
                    ? 'bg-career-accent/20 text-career-accent' 
                    : 'bg-career-accent/10 text-career-accent-dark'
                }`}>
                  Beta
                </p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="px-4">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setActiveTab(item.id)}
                    isActive={activeTab === item.id}
                    className={`w-full justify-start py-3 px-4 rounded-xl transition-all ${
                      activeTab === item.id
                        ? 'bg-career-accent text-white shadow-sm'
                        : `${theme === 'dark' 
                            ? 'hover:bg-career-gray-dark/40 text-career-text-muted-dark hover:text-career-text-dark' 
                            : 'hover:bg-career-gray-light/40 text-career-text-muted-light hover:text-career-text-light'
                          }`
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          
          <SidebarFooter className="p-6 space-y-4">
            <div className={`flex items-center space-x-3 px-3 py-2 rounded-xl ${
              theme === 'dark' 
                ? 'bg-career-gray-dark/30' 
                : 'bg-career-gray-light/30'
            }`}>
              <User className="w-4 h-4" />
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                {user.email}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <ThemeToggle />
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className={`rounded-xl p-2 ${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-text-dark hover:bg-career-gray-dark/40' : 'text-career-text-muted-light hover:text-career-text-light hover:bg-career-gray-light/40'}`}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <div className="flex-1">
            <header className={`flex h-16 shrink-0 items-center gap-2 border-b px-6 ${
              theme === 'dark' 
                ? 'border-career-gray-dark/30 bg-career-panel-dark/50' 
                : 'border-career-gray-light/30 bg-career-panel-light/50'
            }`}>
              <SidebarTrigger className="-ml-1" />
              <div className="ml-auto flex items-center space-x-4">
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                  Welcome back, {user.email?.split('@')[0]}
                </span>
              </div>
            </header>
            
            <main className="flex-1 overflow-auto p-8">
              {renderContent()}
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
