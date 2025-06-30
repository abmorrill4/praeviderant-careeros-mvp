
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  Brain, 
  FileText, 
  Target, 
  Sparkles,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import AuthForm from "@/components/auth/AuthForm";

const Index = () => {
  const { user, loading } = useAuth();
  const [showAuthForm, setShowAuthForm] = useState(false);

  useEffect(() => {
    console.log('Index: user state changed', { user: user?.email, loading });
  }, [user, loading]);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Get deep insights into your career patterns, strengths, and growth opportunities through advanced AI analysis."
    },
    {
      icon: FileText,
      title: "Smart Resume Processing",
      description: "Upload your resume and let our AI extract, structure, and enrich your professional data automatically."
    },
    {
      icon: Target,
      title: "Personalized Narratives",
      description: "Generate compelling career stories and positioning statements tailored to your unique professional journey."
    },
    {
      icon: Sparkles,
      title: "Career Intelligence",
      description: "Understand your role archetype, leadership potential, and technical depth with AI-driven assessments."
    }
  ];

  const handleAuthSuccess = () => {
    // User will be automatically redirected to dashboard by auth state change
    setShowAuthForm(false);
  };

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center space-y-8 mb-16">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Your AI Career Assistant
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Transform your career narrative with AI-powered resume analysis, 
              personalized insights, and intelligent career guidance.
            </p>
          </div>
          
          {/* Authentication Section */}
          <div className="flex flex-col items-center space-y-6">
            {user ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="text-lg px-8">
                  <Link to="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="text-lg px-8">
                  <Link to="/upload">
                    Upload Resume
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="w-full max-w-md space-y-4">
                {!showAuthForm ? (
                  <div className="space-y-4">
                    <Button 
                      size="lg" 
                      onClick={() => setShowAuthForm(true)}
                      className="w-full text-lg px-8 h-12"
                    >
                      Get Started
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <p className="text-sm text-slate-500">
                      Already have an account? 
                      <button 
                        onClick={() => setShowAuthForm(true)}
                        className="text-purple-600 hover:text-purple-700 underline ml-1"
                      >
                        Sign in here
                      </button>
                    </p>
                    <p className="text-xs text-slate-400">
                      Or visit our <Link to="/auth" className="text-purple-600 hover:text-purple-700 underline">dedicated auth page</Link>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AuthForm onSuccess={handleAuthSuccess} />
                    <button
                      onClick={() => setShowAuthForm(false)}
                      className="text-sm text-slate-500 hover:text-slate-700 underline w-full"
                    >
                      Back to main page
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <feature.icon className="w-6 h-6 text-purple-600" />
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How It Works */}
        <div className="text-center space-y-12">
          <h2 className="text-3xl font-bold text-slate-800">
            How Praeviderant Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold">1. Upload Your Resume</h3>
              <p className="text-slate-600">
                Simply upload your resume in any format. Our AI will extract and structure your professional data.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold">2. AI Analysis</h3>
              <p className="text-slate-600">
                Our advanced AI analyzes your career patterns, identifies strengths, and generates insights.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold">3. Get Insights</h3>
              <p className="text-slate-600">
                Receive personalized career narratives, role recommendations, and growth opportunities.
              </p>
            </div>
          </div>
        </div>

        {/* Additional CTA for non-authenticated users */}
        {!user && !showAuthForm && (
          <div className="mt-16 text-center">
            <Card className="max-w-2xl mx-auto bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardContent className="pt-8 pb-8">
                <h3 className="text-2xl font-bold mb-4">
                  Ready to Transform Your Career?
                </h3>
                <p className="text-slate-600 mb-6">
                  Join thousands of professionals who have already discovered their career potential with AI-powered insights.
                </p>
                <Button 
                  size="lg" 
                  onClick={() => setShowAuthForm(true)}
                  className="text-lg px-8"
                >
                  Start Your Journey
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
