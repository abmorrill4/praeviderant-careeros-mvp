
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";
import HeroSection from "@/components/sections/HeroSection";
import BeliefsSection from "@/components/sections/BeliefsSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import ComparisonSection from "@/components/sections/ComparisonSection";
import UseCasesSection from "@/components/sections/UseCasesSection";
import FinalCTASection from "@/components/sections/FinalCTASection";
import FooterSection from "@/components/sections/FooterSection";

const Index = () => {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-career-dark' : 'bg-career-light'} flex items-center justify-center`}>
        <div className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>Loading...</div>
      </div>
    );
  }

  const handleAuthSuccess = () => {
    // User will be automatically redirected by the useEffect above
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-career-dark' : 'bg-career-light'} transition-colors duration-300`}>
      <ThemeToggle />
      
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <HeroSection onAuthSuccess={handleAuthSuccess} />
        
        <BeliefsSection />
        
        <HowItWorksSection />
        
        <ComparisonSection />
        
        <UseCasesSection />
        
        <FinalCTASection />
        
        <FooterSection />
      </div>
    </div>
  );
};

export default Index;
