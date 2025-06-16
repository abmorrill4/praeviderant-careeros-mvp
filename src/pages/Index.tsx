
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
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-career-dark' : 'bg-career-light'} transition-colors duration-300`}>
      <ThemeToggle />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center p-4 md:p-8">
        {/* Background Wave Animation */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <WaveAnimation />
        </div>

        <div className="relative w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="text-center lg:text-left">
            <h1 className={`text-4xl md:text-6xl font-bold leading-tight mb-6 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              The first resume builder that actually knows you.
            </h1>
            <p className={`text-xl md:text-2xl leading-relaxed mb-8 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
              AI that listens, learns, and writes like you. Built for real people—not templates.
            </p>
          </div>

          {/* CTA Form */}
          <div className="flex justify-center lg:justify-end">
            <div className={`neumorphic-panel ${theme} p-8 md:p-10 w-full max-w-md`}>
              <div className="text-center mb-8">
                <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-4`}>
                  Get Early Access
                </h2>
                <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                  Join the future of resume building
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} text-sm font-medium mb-2 block`}>
                      Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Enter your name"
                      className={`neumorphic-input ${theme} ${theme === 'dark' ? 'text-career-text-dark placeholder:text-career-text-muted-dark' : 'text-career-text-light placeholder:text-career-text-muted-light'} h-12`}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} text-sm font-medium mb-2 block`}>
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="Enter your email"
                      className={`neumorphic-input ${theme} ${theme === 'dark' ? 'text-career-text-dark placeholder:text-career-text-muted-dark' : 'text-career-text-light placeholder:text-career-text-muted-light'} h-12`}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full h-12 bg-career-accent hover:bg-career-accent-dark text-white font-semibold neumorphic-button ${theme} border-0`}
                >
                  {isSubmitting ? "Registering..." : "Register Interest"}
                </Button>
              </form>

              <div className="text-center mt-8">
                <a
                  href="/login"
                  className={`${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-accent' : 'text-career-text-muted-light hover:text-career-accent'} text-sm transition-colors duration-200`}
                >
                  Already have access? Log in here
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              Why CareerOS is Different
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <ValueCard
              title="Deep Context"
              description="We extract your full story—not just job titles."
            />
            <ValueCard
              title="Real AI, Real Results"
              description="Every resume is built from an interview, not a form."
            />
            <ValueCard
              title="Your Voice"
              description="Styled and phrased to sound like you—not generic AI."
            />
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              CareerOS vs. Traditional Tools
            </h2>
          </div>
          
          <ComparisonTable />
        </div>
      </section>

      {/* Footer */}
      <footer className={`${theme === 'dark' ? 'bg-career-panel-dark' : 'bg-career-panel-light'} py-12 px-4 md:px-8 mt-20`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                CareerOS
              </h3>
            </div>
            
            <div className="flex flex-wrap gap-6 mb-6 md:mb-0">
              <a href="#" className={`${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-accent' : 'text-career-text-muted-light hover:text-career-accent'} transition-colors duration-200`}>
                Privacy Policy
              </a>
              <a href="#" className={`${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-accent' : 'text-career-text-muted-light hover:text-career-accent'} transition-colors duration-200`}>
                Terms
              </a>
              <a href="#" className={`${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-accent' : 'text-career-text-muted-light hover:text-career-accent'} transition-colors duration-200`}>
                Contact
              </a>
            </div>
          </div>
          
          <div className="text-center pt-8 border-t border-opacity-20">
            <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} text-sm`}>
              © 2024 CareerOS. Building the future of career development.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
