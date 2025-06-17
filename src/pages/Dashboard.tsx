
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, User, Mic, FileText, Lightbulb, Users } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import OnboardingCardFlow from "@/components/onboarding/OnboardingCardFlow";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingData } from "@/components/onboarding/types";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar";

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const { completeOnboarding, loading: onboardingLoading } = useOnboarding();

  useEffect(() => {
    // Redirect unauthenticated users to login
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Fetch user profile
    const fetchProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Error fetching profile:', error);
          } else {
            setProfile(data);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        } finally {
          setLoadingProfile(false);
        }
      }
    };

    fetchProfile();
  }, [user]);

  const handleOnboardingComplete = async (data: OnboardingData) => {
    try {
      await completeOnboarding(data);
      // Refresh profile to reflect onboarding completion
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      setProfile(updatedProfile);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show loading while checking auth state
  if (loading || loadingProfile) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-career-dark' : 'bg-career-light'} flex items-center justify-center transition-colors duration-300`}>
        <div className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>Loading...</div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (redirect will happen)
  if (!user) {
    return null;
  }

  // Show onboarding flow if not completed
  if (!profile?.onboarding_completed) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-career-dark' : 'bg-career-light'} transition-colors duration-300`}>
        <ThemeToggle />
        <div className="flex items-center justify-center min-h-screen">
          <OnboardingCardFlow onComplete={handleOnboardingComplete} />
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className={`min-h-screen flex w-full ${theme === 'dark' ? 'bg-career-dark' : 'bg-career-light'} transition-colors duration-300`}>
        <ThemeToggle />
        
        <Sidebar>
          <SidebarHeader>
            <div className="p-4">
              <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
                Praeviderant
              </h1>
              <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                Your Career AI
              </p>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <Mic className="w-4 h-4" />
                  <span>AI Interview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <FileText className="w-4 h-4" />
                  <span>Resume Builder</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <Lightbulb className="w-4 h-4" />
                  <span>Career Insights</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarSeparator />
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate('/invitations')}>
                  <Users className="w-4 h-4" />
                  <span>Invitation Management</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className={`w-full ${theme === 'dark' ? 'border-career-text-dark/20 text-career-text-dark hover:bg-career-text-dark/10' : 'border-career-text-light/20 text-career-text-light hover:bg-career-text-light/10'} transition-all duration-200`}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className={`border-b ${theme === 'dark' ? 'border-career-text-dark/10' : 'border-career-text-light/10'} mb-8`}>
            <div className="flex items-center py-6">
              <SidebarTrigger />
              <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} ml-4 hidden md:block`}>
                Praeviderant
              </h1>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className={`p-8 rounded-2xl ${theme === 'dark' ? 'bg-career-panel-dark shadow-neumorphic-dark' : 'bg-career-panel-light shadow-neumorphic-light'} transition-all duration-300`}>
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-career-accent rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                    Welcome, {profile?.name || user.email}!
                  </h2>
                  <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    Ready to build your career with AI-powered insights?
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-career-gray-dark shadow-neumorphic-sm-dark' : 'bg-career-gray-light shadow-neumorphic-sm-light'} transition-all duration-300`}>
                  <h3 className={`font-semibold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
                    AI Interview
                  </h3>
                  <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} text-sm mb-4`}>
                    Start your personalized AI-powered career interview
                  </p>
                  <Button 
                    className="w-full bg-career-accent hover:bg-career-accent-dark text-white transition-all duration-200"
                    disabled
                  >
                    Coming Soon
                  </Button>
                </div>

                <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-career-gray-dark shadow-neumorphic-sm-dark' : 'bg-career-gray-light shadow-neumorphic-sm-light'} transition-all duration-300`}>
                  <h3 className={`font-semibold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
                    Resume Builder
                  </h3>
                  <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} text-sm mb-4`}>
                    Generate your resume with deep context understanding
                  </p>
                  <Button 
                    className="w-full bg-career-accent hover:bg-career-accent-dark text-white transition-all duration-200"
                    disabled
                  >
                    Coming Soon
                  </Button>
                </div>

                <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-career-gray-dark shadow-neumorphic-sm-dark' : 'bg-career-gray-light shadow-neumorphic-sm-light'} transition-all duration-300`}>
                  <h3 className={`font-semibold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
                    Career Insights
                  </h3>
                  <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} text-sm mb-4`}>
                    Get personalized career recommendations
                  </p>
                  <Button 
                    className="w-full bg-career-accent hover:bg-career-accent-dark text-white transition-all duration-200"
                    disabled
                  >
                    Coming Soon
                  </Button>
                </div>
              </div>
            </div>

            {/* Profile Section */}
            <div className={`p-8 rounded-2xl ${theme === 'dark' ? 'bg-career-panel-dark shadow-neumorphic-dark' : 'bg-career-panel-light shadow-neumorphic-light'} transition-all duration-300`}>
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-6`}>
                Your Profile
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={`text-sm font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                    Name
                  </label>
                  <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    {profile?.name || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                    Email
                  </label>
                  <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    {user.email}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                    Member Since
                  </label>
                  <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
