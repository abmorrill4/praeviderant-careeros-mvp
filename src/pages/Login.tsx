
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import InvitationInput from "@/components/InvitationInput";
import { useInvitations } from "@/hooks/useInvitations";

const Login = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [validInvitationCode, setValidInvitationCode] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, loading, signIn, signUp } = useAuth();
  const { markInvitationAsUsed } = useInvitations();
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
      if (isSignUp) {
        // Check for valid invitation code
        if (!validInvitationCode) {
          toast({
            title: "Invitation code required",
            description: "Please enter and verify a valid invitation code to create an account.",
            variant: "destructive",
          });
          return;
        }

        // Sign up flow
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Passwords don't match",
            description: "Please make sure your passwords match.",
            variant: "destructive",
          });
          return;
        }

        if (formData.password.length < 6) {
          toast({
            title: "Password too short",
            description: "Password must be at least 6 characters long.",
            variant: "destructive",
          });
          return;
        }

        const { user: newUser, error } = await signUp(formData.email, formData.password, formData.name);
        
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: "Account already exists",
              description: "An account with this email already exists. Try signing in instead.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else if (newUser) {
          // Mark invitation as used
          await markInvitationAsUsed(validInvitationCode, newUser.id);
          
          toast({
            title: "Account created successfully!",
            description: "You can now access Praeviderant.",
          });
          // User will be automatically redirected by the useEffect above
        }
      } else {
        // Sign in flow
        const { error } = await signIn(formData.email, formData.password);
        
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleModeToggle = () => {
    setIsSignUp(!isSignUp);
    setValidInvitationCode(null);
    setFormData({ name: "", email: "", password: "", confirmPassword: "" });
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

          {/* Auth Panel */}
          <div className="neumorphic-panel p-8 md:p-10">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-career-text mb-2">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h1>
              <p className="text-career-text-muted">
                {isSignUp ? "Join Praeviderant with an invitation code" : "Sign in to your Praeviderant account"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {isSignUp && (
                  <InvitationInput
                    onValidCode={setValidInvitationCode}
                    className="mb-4"
                  />
                )}

                {isSignUp && (
                  <div>
                    <Label htmlFor="name" className="text-career-text text-sm font-medium mb-2 block">
                      Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Enter your full name"
                      className="neumorphic-input text-career-text placeholder:text-career-text-muted h-12"
                      required
                    />
                  </div>
                )}
                
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
                    minLength={6}
                  />
                </div>

                {isSignUp && (
                  <div>
                    <Label htmlFor="confirmPassword" className="text-career-text text-sm font-medium mb-2 block">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      placeholder="Confirm your password"
                      className="neumorphic-input text-career-text placeholder:text-career-text-muted h-12"
                      required
                      minLength={6}
                    />
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || (isSignUp && !validInvitationCode)}
                className="w-full h-12 bg-career-mint hover:bg-career-mint-dark text-white font-semibold neumorphic-button border-0"
              >
                {isSubmitting 
                  ? (isSignUp ? "Creating Account..." : "Signing In...") 
                  : (isSignUp ? "Create Account" : "Sign In")
                }
              </Button>
            </form>

            <div className="text-center mt-6">
              <p className="text-career-text-muted text-sm">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={handleModeToggle}
                  className="text-career-mint hover:text-career-mint-dark transition-colors duration-200"
                >
                  {isSignUp ? "Sign in here" : "Create one here"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
