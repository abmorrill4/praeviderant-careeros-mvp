
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import WaveAnimation from "@/components/WaveAnimation";

const Index = () => {
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, loading } = useAuth();
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
      <div className="min-h-screen bg-career-dark flex items-center justify-center">
        <div className="text-career-text">Loading...</div>
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
    <div className="min-h-screen bg-career-dark flex flex-col">
      {/* Background Wave Animation */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <WaveAnimation />
      </div>

      {/* Main Content */}
      <div className="relative flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          {/* Main Panel */}
          <div className="neumorphic-panel p-8 md:p-10">
            {/* Header Section */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-career-text mb-4">
                CareerOS
              </h1>
              <p className="text-lg md:text-xl text-career-text-muted leading-relaxed">
                The first resume builder that actually knows you.
              </p>
            </div>

            {/* Register Interest Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-career-text text-sm font-medium mb-2 block">
                    Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter your name"
                    className="neumorphic-input text-career-text placeholder:text-career-text-muted h-12"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-career-text text-sm font-medium mb-2 block">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter your email"
                    className="neumorphic-input text-career-text placeholder:text-career-text-muted h-12"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-career-mint hover:bg-career-mint-dark text-white font-semibold neumorphic-button border-0"
              >
                {isSubmitting ? "Registering..." : "Register Interest"}
              </Button>
            </form>

            {/* Secondary Login CTA */}
            <div className="text-center mt-8">
              <a
                href="/login"
                className="text-career-text-muted hover:text-career-mint text-sm transition-colors duration-200"
              >
                Already have access? Log in here
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative text-center p-4">
        <p className="text-career-text-muted text-xs">
          © 2024 CareerOS. Building the future of career development.
        </p>
      </div>
    </div>
  );
};

export default Index;
