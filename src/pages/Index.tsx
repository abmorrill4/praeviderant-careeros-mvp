
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import WaveAnimation from "@/components/WaveAnimation";
import ThemeToggle from "@/components/ThemeToggle";
import InterestModal from "@/components/InterestModal";

const Index = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { user, loading, signIn } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleFormToggle = (toLogin: boolean) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowLoginForm(toLogin);
      setIsTransitioning(false);
    }, 150);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await signIn(loginData.email, loginData.password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Invalid credentials",
            description: "Please check your email and password.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        // User will be automatically redirected by the useEffect above
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Something went wrong",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginInputChange = (field: string, value: string) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
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
              <div className={`neumorphic-panel ${theme} p-6 md:p-8 w-full max-w-md h-[420px] flex flex-col transition-all duration-500 ${isTransitioning ? 'scale-95 opacity-70' : 'scale-100 opacity-100'}`}>
                {/* Form Toggle Indicator */}
                <div className="relative mb-6 flex-shrink-0">
                  <div className={`absolute top-0 left-0 h-1 bg-career-accent rounded-full transition-all duration-500 ease-out ${showLoginForm ? 'w-1/2 translate-x-full' : 'w-1/2 translate-x-0'}`}></div>
                  <div className={`h-1 w-full rounded-full ${theme === 'dark' ? 'bg-career-gray-dark' : 'bg-career-gray-light'}`}></div>
                </div>

                {/* Form Content - Flex Grow */}
                <div className={`flex-grow flex flex-col justify-between transition-all duration-300 ease-out ${isTransitioning ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'}`}>
                  {!showLoginForm ? (
                    <div className="animate-fade-in flex flex-col h-full">
                      <div className="text-center mb-6 flex-shrink-0">
                        <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2 transform transition-all duration-300`}>
                          Get Early Access
                        </h2>
                        <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} mb-6 transform transition-all duration-300 delay-75`}>
                          Join the future of resume building. Help us create the perfect tool for your career journey.
                        </p>
                      </div>

                      <div className="flex-grow flex flex-col justify-center">
                        <div className="transform transition-all duration-300 delay-150">
                          <Button
                            onClick={() => setIsModalOpen(true)}
                            className={`w-full h-12 bg-career-accent hover:bg-career-accent-dark text-white font-semibold neumorphic-button ${theme} border-0 text-base transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95`}
                          >
                            Register Your Interest
                          </Button>
                        </div>
                      </div>

                      <div className="text-center mt-4 flex-shrink-0 transform transition-all duration-300 delay-200">
                        <button
                          onClick={() => handleFormToggle(true)}
                          className={`${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-accent' : 'text-career-text-muted-light hover:text-career-accent'} text-xs transition-all duration-300 underline hover:scale-105 relative overflow-hidden group`}
                        >
                          <span className="relative z-10">Already have access? Log in here</span>
                          <span className="absolute inset-0 bg-career-accent opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-fade-in flex flex-col h-full">
                      <div className="text-center mb-6 flex-shrink-0">
                        <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2 transform transition-all duration-300`}>
                          Welcome Back
                        </h2>
                        <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} mb-6 transform transition-all duration-300 delay-75`}>
                          Sign in to your Praeviderant account
                        </p>
                      </div>

                      <form onSubmit={handleLogin} className="flex-grow flex flex-col justify-center space-y-4">
                        <div className="transform transition-all duration-300 delay-100">
                          <Label htmlFor="email" className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} text-sm font-medium mb-2 block transition-colors duration-200`}>
                            Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={loginData.email}
                            onChange={(e) => handleLoginInputChange("email", e.target.value)}
                            placeholder="Enter your email"
                            className={`neumorphic-input ${theme === 'dark' ? 'text-career-text-dark placeholder:text-career-text-muted-dark' : 'text-career-text-light placeholder:text-career-text-muted-light'} h-12 transition-all duration-200 focus:scale-[1.02] focus:shadow-lg`}
                            required
                          />
                        </div>
                        
                        <div className="transform transition-all duration-300 delay-150">
                          <Label htmlFor="password" className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} text-sm font-medium mb-2 block transition-colors duration-200`}>
                            Password
                          </Label>
                          <Input
                            id="password"
                            type="password"
                            value={loginData.password}
                            onChange={(e) => handleLoginInputChange("password", e.target.value)}
                            placeholder="Enter your password"
                            className={`neumorphic-input ${theme === 'dark' ? 'text-career-text-dark placeholder:text-career-text-muted-dark' : 'text-career-text-light placeholder:text-career-text-muted-light'} h-12 transition-all duration-200 focus:scale-[1.02] focus:shadow-lg`}
                            required
                            minLength={6}
                          />
                        </div>

                        <div className="transform transition-all duration-300 delay-200">
                          <Button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full h-12 bg-career-accent hover:bg-career-accent-dark text-white font-semibold neumorphic-button ${theme} border-0 text-base transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 disabled:hover:scale-100 disabled:opacity-50`}
                          >
                            <span className={`transition-all duration-200 ${isSubmitting ? 'opacity-0' : 'opacity-100'}`}>
                              Sign In
                            </span>
                            {isSubmitting && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            )}
                          </Button>
                        </div>
                      </form>

                      <div className="text-center mt-4 flex-shrink-0 transform transition-all duration-300 delay-250">
                        <button
                          onClick={() => handleFormToggle(false)}
                          className={`${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-accent' : 'text-career-text-muted-light hover:text-career-accent'} text-xs transition-all duration-300 underline hover:scale-105 relative overflow-hidden group`}
                        >
                          <span className="relative z-10">Back to registration</span>
                          <span className="absolute inset-0 bg-career-accent opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Compact Features Section */}
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
