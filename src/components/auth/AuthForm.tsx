
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isSignUp) {
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
          formData.name
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

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        throw error;
      }
      
      // Note: The redirect will happen automatically, so we don't show a success message here
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast({
        title: "Google Sign In Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setFormData({ name: "", email: "", password: "", confirmPassword: "" });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-slate-200 w-full max-w-md">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </h2>
        <p className="text-sm text-slate-600">
          {isSignUp ? "Join Praeviderant today" : "Sign in to your Praeviderant account"}
        </p>
      </div>

      {/* Google Sign In Button */}
      <Button
        onClick={handleGoogleSignIn}
        disabled={isSubmitting}
        variant="outline"
        className="w-full h-12 mb-4 border-2 border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors duration-200"
      >
        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {isSubmitting ? "Signing in..." : `Continue with Google`}
      </Button>

      <div className="flex items-center my-4 text-slate-400">
        <div className="flex-1 h-px bg-slate-300"></div>
        <span className="px-3 text-sm">or</span>
        <div className="flex-1 h-px bg-slate-300"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div>
            <Label htmlFor="name" className="text-slate-700 text-sm font-medium mb-2 block">
              Name
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter your full name"
              className="h-10 text-sm border-slate-300 focus:border-purple-500 focus:ring-purple-500"
              required
            />
          </div>
        )}
        
        <div>
          <Label htmlFor="email" className="text-slate-700 text-sm font-medium mb-2 block">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="Enter your email"
            className="h-10 text-sm border-slate-300 focus:border-purple-500 focus:ring-purple-500"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="password" className="text-slate-700 text-sm font-medium mb-2 block">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            placeholder="Enter your password"
            className="h-10 text-sm border-slate-300 focus:border-purple-500 focus:ring-purple-500"
            required
            minLength={6}
          />
        </div>

        {isSignUp && (
          <div>
            <Label htmlFor="confirmPassword" className="text-slate-700 text-sm font-medium mb-2 block">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              placeholder="Confirm your password"
              className="h-10 text-sm border-slate-300 focus:border-purple-500 focus:ring-purple-500"
              required
              minLength={6}
            />
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold border-0 text-sm mt-6"
        >
          {isSubmitting 
            ? (isSignUp ? "Creating Account..." : "Signing In...") 
            : (isSignUp ? "Create Account" : "Sign In")
          }
        </Button>
      </form>

      <div className="text-center mt-4">
        <button
          type="button"
          onClick={toggleMode}
          className="text-slate-500 hover:text-purple-600 text-sm transition-colors duration-200"
        >
          {isSignUp ? "Already have an account? Sign in here" : "Need an account? Sign up here"}
        </button>
      </div>
    </div>
  );
};

export default AuthForm;
