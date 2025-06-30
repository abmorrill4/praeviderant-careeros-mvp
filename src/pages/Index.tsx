
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import HeroSection from "@/components/sections/HeroSection";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Index: user state changed', { user: user?.email, loading });
    
    // Redirect authenticated users to profile timeline
    if (user && !loading) {
      navigate('/profile-timeline');
    }
  }, [user, loading, navigate]);

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render the landing page if user is authenticated (they'll be redirected)
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Redirecting to your profile...</p>
        </div>
      </div>
    );
  }

  const handleAuthSuccess = () => {
    // The AuthContext will handle the redirect to /profile-timeline
    console.log('Auth success - redirect will be handled by AuthContext');
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white' 
        : 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900'
    }`}>
      <div className="container mx-auto px-4">
        <HeroSection onAuthSuccess={handleAuthSuccess} />
      </div>
    </div>
  );
};

export default Index;
