
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import WaveAnimation from "@/components/WaveAnimation";
import ThemeToggle from "@/components/ThemeToggle";
import ValueCard from "@/components/ValueCard";
import ComparisonTable from "@/components/ComparisonTable";

const Index = () => {
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('interest_registrations')
        .insert([
          {
            name: formData.name,
            email: formData.email,
          }
        ]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Email already registered",
            description: "This email has already been registered for early access.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Interest registered!",
          description: "Thanks for your interest in CareerOS. We'll be in touch soon.",
        });
        setFormData({ name: "", email: "" });
      }
    } catch (error) {
      console.error('Error registering interest:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
              <h1 className={`text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                The first resume builder that actually knows you.
              </h1>
              <p className={`text-lg md:text-xl leading-relaxed mb-6 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                AI that listens, learns, and writes like you. Built for real people—not templates.
              </p>
            </div>

            {/* CTA Form */}
            <div className="flex justify-center lg:justify-end">
              <div className={`neumorphic-panel ${theme} p-6 md:p-8 w-full max-w-md`}>
                <div className="text-center mb-6">
                  <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
                    Get Early Access
                  </h2>
                  <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    Join the future of resume building
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="name" className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} text-sm font-medium mb-1 block`}>
                        Name
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Enter your name"
                        className={`neumorphic-input ${theme} ${theme === 'dark' ? 'text-career-text-dark placeholder:text-career-text-muted-dark' : 'text-career-text-light placeholder:text-career-text-muted-light'} h-10`}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email" className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} text-sm font-medium mb-1 block`}>
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="Enter your email"
                        className={`neumorphic-input ${theme} ${theme === 'dark' ? 'text-career-text-dark placeholder:text-career-text-muted-dark' : 'text-career-text-light placeholder:text-career-text-muted-light'} h-10`}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full h-10 bg-career-accent hover:bg-career-accent-dark text-white font-semibold neumorphic-button ${theme} border-0`}
                  >
                    {isSubmitting ? "Registering..." : "Register Interest"}
                  </Button>
                </form>

                <div className="text-center mt-4">
                  <a
                    href="/login"
                    className={`${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-accent' : 'text-career-text-muted-light hover:text-career-accent'} text-xs transition-colors duration-200`}
                  >
                    Already have access? Log in here
                  </a>
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
                Why CareerOS is Different
              </h2>
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-career-panel-dark' : 'bg-career-panel-light'} border border-opacity-20`}>
                  <h3 className={`font-semibold mb-2 text-career-accent`}>Deep Context</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    We extract your full story—not just job titles.
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-career-panel-dark' : 'bg-career-panel-light'} border border-opacity-20`}>
                  <h3 className={`font-semibold mb-2 text-career-accent`}>Real AI, Real Results</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    Every resume is built from an interview, not a form.
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-career-panel-dark' : 'bg-career-panel-light'} border border-opacity-20`}>
                  <h3 className={`font-semibold mb-2 text-career-accent`}>Your Voice</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    Styled and phrased to sound like you—not generic AI.
                  </p>
                </div>
              </div>
            </div>

            {/* Comparison */}
            <div>
              <h2 className={`text-2xl md:text-3xl font-bold mb-6 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                CareerOS vs. Traditional Tools
              </h2>
              <div className={`${theme === 'dark' ? 'bg-career-panel-dark' : 'bg-career-panel-light'} p-6 rounded-lg border border-opacity-20`}>
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <h4 className="font-semibold text-career-accent mb-1">CareerOS</h4>
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
                CareerOS
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
              © 2024 CareerOS. Building the future of career development.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
