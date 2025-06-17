
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import WaveAnimation from "@/components/WaveAnimation";
import ThemeToggle from "@/components/ThemeToggle";
import InterestModal from "@/components/InterestModal";
import AuthForm from "@/components/auth/AuthForm";

const Index = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
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

  const handleFormToggle = (toAuth: boolean) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowAuthForm(toAuth);
      setIsTransitioning(false);
    }, 150);
  };

  const handleAuthSuccess = () => {
    // User will be automatically redirected by the useEffect above
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-career-dark' : 'bg-career-light'} transition-colors duration-300 p-4 md:p-6`}>
      <ThemeToggle />
      
      {/* Main Content - Single Screen Layout */}
      <div className="max-w-7xl mx-auto">
        {/* Hero Section - Compact */}
        <section className="relative flex items-center justify-center py-8 md:py-12">
          {/* Background Wave Animation */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <WaveAnimation />
          </div>

          <div className="relative w-full grid lg:grid-cols-2 gap-8 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              {/* Text-based Logo */}
              <div className="flex justify-center lg:justify-start mb-6">
                <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-career-accent' : 'text-career-accent'}`}>
                  Praeviderant
                </h1>
              </div>
              
              <h2 className={`text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                The first resume builder that actually knows you.
              </h2>
              <p className={`text-lg md:text-xl leading-relaxed mb-6 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                AI that listens, learns, and writes like you. Built for real people—not templates.
              </p>
            </div>

            {/* CTA Section - Fixed Height Container */}
            <div className="flex justify-center lg:justify-end">
              <div className={`h-[480px] flex flex-col transition-all duration-700 ${isTransitioning ? 'opacity-60' : 'opacity-100'}`}>
                {/* Form Toggle Indicator */}
                <div className="relative mb-6 flex-shrink-0">
                  <div className={`absolute top-0 left-0 h-1 bg-gradient-to-r from-career-accent to-career-accent-dark rounded-full transition-all duration-700 ease-in-out ${showAuthForm ? 'w-1/2 translate-x-full' : 'w-1/2 translate-x-0'}`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                  </div>
                  <div className={`h-1 w-full rounded-full ${theme === 'dark' ? 'bg-career-gray-dark' : 'bg-career-gray-light'}`}></div>
                </div>

                {/* Form Content - Flex Grow */}
                <div className={`flex-grow flex flex-col justify-between transition-all duration-500 ease-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                  {!showAuthForm ? (
                    <div className="flex flex-col h-full">
                      <div className="text-center mb-6 flex-shrink-0">
                        <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2 transition-all duration-500`}>
                          Get Early Access
                        </h2>
                        <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} mb-6 transition-all duration-600`}>
                          Join the future of resume building. Help us create the perfect tool for your career journey.
                        </p>
                      </div>

                      <div className="flex-grow flex flex-col justify-center">
                        <div className="relative overflow-hidden">
                          <Button
                            onClick={() => setIsModalOpen(true)}
                            className={`w-full h-12 bg-career-accent hover:bg-career-accent-dark text-white font-semibold neumorphic-button ${theme} border-0 text-base transition-all duration-300 hover:shadow-lg relative overflow-hidden group`}
                          >
                            <span className="relative z-10">Register Your Interest</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000 ease-out"></div>
                          </Button>
                        </div>
                      </div>

                      <div className="text-center mt-4 flex-shrink-0">
                        <button
                          onClick={() => handleFormToggle(true)}
                          className={`${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-accent' : 'text-career-text-muted-light hover:text-career-accent'} text-xs transition-all duration-500 underline relative overflow-hidden group`}
                        >
                          <span className="relative z-10">Already have access? Log in here</span>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-career-accent to-transparent opacity-0 group-hover:opacity-10 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-800 ease-out"></div>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full justify-center">
                      <AuthForm onSuccess={handleAuthSuccess} />
                      
                      <div className="text-center mt-4 flex-shrink-0">
                        <button
                          onClick={() => handleFormToggle(false)}
                          className={`${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-accent' : 'text-career-text-muted-light hover:text-career-accent'} text-xs transition-all duration-500 underline relative overflow-hidden group`}
                        >
                          <span className="relative z-10">Back to registration</span>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-career-accent to-transparent opacity-0 group-hover:opacity-10 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-800 ease-out"></div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-8 md:py-12">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Value Proposition */}
            <div>
              <h2 className={`text-2xl md:text-3xl font-bold mb-6 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                Why Praeviderant is Different
              </h2>
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-career-panel-dark' : 'bg-career-panel-light'} border border-opacity-20`}>
                  <h3 className={`font-semibold mb-2 text-career-accent`}>Deep Context</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    We extract your full story—not just resume bullets.
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-career-panel-dark' : 'bg-career-panel-light'} border border-opacity-20`}>
                  <h3 className={`font-semibold mb-2 text-career-accent`}>Real AI, Real Results</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    Every resume is built from the entire context of your career.
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-career-panel-dark' : 'bg-career-panel-light'} border border-opacity-20`}>
                  <h3 className={`font-semibold mb-2 text-career-accent`}>Your Voice</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    Your interviews power not just your career context - but your personal style guide, so your resume still sounds like you.
                  </p>
                </div>
              </div>
            </div>

            {/* Comparison */}
            <div>
              <h2 className={`text-2xl md:text-3xl font-bold mb-6 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                Praeviderant vs. Traditional Tools
              </h2>
              <div className={`${theme === 'dark' ? 'bg-career-panel-dark' : 'bg-career-panel-light'} p-6 rounded-lg border border-opacity-20`}>
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <h4 className="font-semibold text-career-accent mb-1">Praeviderant</h4>
                      <p className={`text-sm ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                        Learns from your full story
                      </p>
                    </div>
                    <div className="flex-1 pl-4 opacity-60">
                      <h4 className={`font-semibold mb-1 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>Traditional</h4>
                      <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                        Static form input
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <p className={`text-sm ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                        Resume updates in real time
                      </p>
                    </div>
                    <div className="flex-1 pl-4 opacity-60">
                      <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                        No visibility until export
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <p className={`text-sm ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                        Interview-style experience
                      </p>
                    </div>
                    <div className="flex-1 pl-4 opacity-60">
                      <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                        Bland templates with filler text
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={`${theme === 'dark' ? 'bg-career-panel-dark' : 'bg-career-panel-light'} py-6 px-4 md:px-6 rounded-lg mt-8`}>
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                Praeviderant
              </h3>
            </div>
            
            <div className="flex flex-wrap gap-4 mb-4 md:mb-0">
              <a href="#" className={`${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-accent' : 'text-career-text-muted-light hover:text-career-accent'} text-sm transition-colors duration-200`}>
                Privacy Policy
              </a>
              <a href="#" className={`${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-accent' : 'text-career-text-muted-light hover:text-career-accent'} text-sm transition-colors duration-200`}>
                Terms
              </a>
              <a href="#" className={`${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-accent' : 'text-career-text-muted-light hover:text-career-accent'} text-sm transition-colors duration-200`}>
                Contact
              </a>
            </div>
          </div>
          
          <div className="text-center pt-4 border-t border-opacity-20">
            <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} text-xs`}>
              © 2024 Praeviderant. Building the future of career development.
            </p>
          </div>
        </footer>
      </div>

      {/* Interest Registration Modal */}
      <InterestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default Index;
