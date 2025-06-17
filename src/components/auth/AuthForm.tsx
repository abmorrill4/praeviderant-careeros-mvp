
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import InvitationInput from "@/components/InvitationInput";

interface AuthFormProps {
  onSuccess?: () => void;
}

const AuthForm = ({ onSuccess }: AuthFormProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    confirmPassword: "" 
  });
  const [validInvitationCode, setValidInvitationCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        // Validate invitation code for sign up
        if (!validInvitationCode) {
          toast({
            title: "Invitation code required",
            description: "Please enter and verify a valid invitation code to create an account.",
            variant: "destructive",
          });
          return;
        }

        // Validate passwords match
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

        const { user, error } = await signUp(
          formData.email, 
          formData.password, 
          formData.name,
          validInvitationCode
        );
        
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
        } else if (user) {
          toast({
            title: "Account created successfully!",
            description: "Welcome to Praeviderant! You can now access the platform.",
          });
          onSuccess?.();
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
          onSuccess?.();
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

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setValidInvitationCode(null);
    setFormData({ name: "", email: "", password: "", confirmPassword: "" });
  };

  return (
    <div className={`neumorphic-panel ${theme} p-4 w-full max-w-md`}>
      <div className="text-center mb-4">
        <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-1`}>
          {isSignUp ? "Create Account" : "Welcome Back"}
        </h2>
        <p className={`text-xs ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
          {isSignUp ? "Join Praeviderant with an invitation code" : "Sign in to your Praeviderant account"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {isSignUp && (
          <InvitationInput
            onValidCode={setValidInvitationCode}
            className="mb-3"
          />
        )}

        {isSignUp && (
          <div>
            <Label htmlFor="name" className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} text-xs font-medium mb-1 block`}>
              Name
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter your full name"
              className={`neumorphic-input ${theme === 'dark' ? 'text-career-text-dark placeholder:text-career-text-muted-dark' : 'text-career-text-light placeholder:text-career-text-muted-light'} h-9 text-sm`}
              required
            />
          </div>
        )}
        
        <div>
          <Label htmlFor="email" className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} text-xs font-medium mb-1 block`}>
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="Enter your email"
            className={`neumorphic-input ${theme === 'dark' ? 'text-career-text-dark placeholder:text-career-text-muted-dark' : 'text-career-text-light placeholder:text-career-text-muted-light'} h-9 text-sm`}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="password" className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} text-xs font-medium mb-1 block`}>
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            placeholder="Enter your password"
            className={`neumorphic-input ${theme === 'dark' ? 'text-career-text-dark placeholder:text-career-text-muted-dark' : 'text-career-text-light placeholder:text-career-text-muted-light'} h-9 text-sm`}
            required
            minLength={6}
          />
        </div>

        {isSignUp && (
          <div>
            <Label htmlFor="confirmPassword" className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} text-xs font-medium mb-1 block`}>
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              placeholder="Confirm your password"
              className={`neumorphic-input ${theme === 'dark' ? 'text-career-text-dark placeholder:text-career-text-muted-dark' : 'text-career-text-light placeholder:text-career-text-muted-light'} h-9 text-sm`}
              required
              minLength={6}
            />
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting || (isSignUp && !validInvitationCode)}
          className={`w-full h-10 bg-career-accent hover:bg-career-accent-dark text-white font-semibold neumorphic-button ${theme} border-0 text-sm mt-4`}
        >
          {isSubmitting 
            ? (isSignUp ? "Creating Account..." : "Signing In...") 
            : (isSignUp ? "Create Account" : "Sign In")
          }
        </Button>
      </form>

      <div className="text-center mt-3">
        <button
          type="button"
          onClick={toggleMode}
          className={`${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-accent' : 'text-career-text-muted-light hover:text-career-accent'} text-xs transition-colors duration-200`}
        >
          {isSignUp ? "Already have an account? Sign in here" : "Need an account? Sign up here"}
        </button>
      </div>
    </div>
  );
};

export default AuthForm;
