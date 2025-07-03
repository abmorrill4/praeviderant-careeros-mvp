
import { useAuth } from "@/contexts/AuthContext";
import HeroSection from "@/components/sections/HeroSection";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  console.log('Index component rendering:', { user: user?.email, loading, pathname: location.pathname });

  useEffect(() => {
    console.log('Index: user state changed', { user: user?.email, loading, currentPath: location.pathname });
    
    // Only redirect authenticated users to profile timeline if they're actually on the Index page
    // Don't redirect if they're trying to access other routes like /admin
    if (user && !loading && location.pathname === '/') {
      console.log('Index: Redirecting authenticated user from / to /profile-timeline');
      navigate('/profile-timeline');
    }
  }, [user, loading, navigate, location.pathname]);

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

  // Don't render the landing page if user is authenticated and on the index route
  if (user && location.pathname === '/') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Redirecting to your profile...</p>
        </div>
      </div>
    );
  }

  // Simplified test return to see if the issue is with the HeroSection
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Welcome to Praeviderant</h1>
        <p className="text-center text-lg mb-8">This is a test to see if the Index page renders</p>
        <div className="text-center">
          <button 
            onClick={() => navigate('/auth')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go to Auth
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
