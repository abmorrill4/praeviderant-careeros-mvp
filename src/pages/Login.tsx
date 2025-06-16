
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate login process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Login functionality coming soon!",
        description: "Authentication will be available once Supabase is connected.",
      });
    } catch (error) {
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
      <div className="relative flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <div className="mb-6">
            <a
              href="/"
              className="inline-flex items-center text-career-text-muted hover:text-career-mint transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to home
            </a>
          </div>

          {/* Login Panel */}
          <div className="neumorphic-panel p-8 md:p-10">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-career-text mb-2">
                Welcome Back
              </h1>
              <p className="text-career-text-muted">
                Sign in to your CareerOS account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
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
                
                <div>
                  <Label htmlFor="password" className="text-career-text text-sm font-medium mb-2 block">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Enter your password"
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
                {isSubmitting ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="text-center mt-6">
              <p className="text-career-text-muted text-sm">
                Don't have access yet?{" "}
                <a href="/" className="text-career-mint hover:text-career-mint-dark transition-colors duration-200">
                  Register your interest
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
