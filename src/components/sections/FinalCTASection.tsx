
import { useState } from "react";
import { Button } from "@/components/ui/button";
import AuthForm from "@/components/auth/AuthForm";

const FinalCTASection = () => {
  const [showAuthForm, setShowAuthForm] = useState(false);

  const handleAuthSuccess = () => {
    // User will be automatically redirected to profile timeline
  };

  return (
    <section className="py-16 md:py-24">
      <div className="text-center space-y-8">
        <h2 className="text-3xl md:text-4xl font-bold text-career-text">
          Ready to Tell Your Story?
        </h2>
        
        <p className="text-lg md:text-xl max-w-2xl mx-auto text-career-text-muted">
          Stop letting templates define you. Start building documents that capture who you really are.
        </p>

        {!showAuthForm ? (
          <div className="space-y-4">
            <Button
              onClick={() => setShowAuthForm(true)}
              className="h-12 px-8 bg-career-accent hover:bg-career-accent-dark text-white font-semibold neumorphic-button border-0 text-lg"
            >
              Get Started Today
            </Button>
            
            <p className="text-sm text-career-text-muted">
              No templates. No limits. Just your authentic career story.
            </p>
          </div>
        ) : (
          <div className="max-w-md mx-auto space-y-4">
            <AuthForm onSuccess={handleAuthSuccess} />
            <button
              onClick={() => setShowAuthForm(false)}
              className="text-sm text-career-text-muted hover:text-career-accent transition-colors underline"
            >
              Back to main page
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default FinalCTASection;
