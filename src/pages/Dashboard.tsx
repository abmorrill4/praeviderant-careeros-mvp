
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, User } from "lucide-react";

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    // Redirect unauthenticated users to login
    if (!loading && !user) {
      navigate('/login');
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
      <div className="min-h-screen bg-career-dark flex items-center justify-center">
        <div className="text-career-text">Loading...</div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (redirect will happen)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-career-dark">
      {/* Header */}
      <div className="border-b border-career-text/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/3b71e4b0-2a43-465e-81b3-e0dfd99f8b33.png" 
                alt="Praeviderant Logo" 
                className="h-8 w-auto"
              />
              <h1 className="text-2xl font-bold text-career-text">Praeviderant</h1>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="border-career-text/20 text-career-text hover:bg-career-text/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="neumorphic-panel p-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-career-mint rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-career-text">
                  Welcome, {profile?.name || user.email}!
                </h2>
                <p className="text-career-text-muted">
                  Ready to build your career with AI-powered insights?
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="neumorphic-panel p-6">
                <h3 className="font-semibold text-career-text mb-2">AI Interview</h3>
                <p className="text-career-text-muted text-sm mb-4">
                  Start your personalized AI-powered career interview
                </p>
                <Button 
                  className="w-full bg-career-mint hover:bg-career-mint-dark text-white"
                  disabled
                >
                  Coming Soon
                </Button>
              </div>

              <div className="neumorphic-panel p-6">
                <h3 className="font-semibold text-career-text mb-2">Resume Builder</h3>
                <p className="text-career-text-muted text-sm mb-4">
                  Generate your resume with deep context understanding
                </p>
                <Button 
                  className="w-full bg-career-mint hover:bg-career-mint-dark text-white"
                  disabled
                >
                  Coming Soon
                </Button>
              </div>

              <div className="neumorphic-panel p-6">
                <h3 className="font-semibold text-career-text mb-2">Career Insights</h3>
                <p className="text-career-text-muted text-sm mb-4">
                  Get personalized career recommendations
                </p>
                <Button 
                  className="w-full bg-career-mint hover:bg-career-mint-dark text-white"
                  disabled
                >
                  Coming Soon
                </Button>
              </div>
            </div>
          </div>

          {/* Profile Section */}
          <div className="neumorphic-panel p-8">
            <h3 className="text-xl font-bold text-career-text mb-6">Your Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-career-text">Name</label>
                <p className="text-career-text-muted">{profile?.name || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-career-text">Email</label>
                <p className="text-career-text-muted">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-career-text">Member Since</label>
                <p className="text-career-text-muted">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
