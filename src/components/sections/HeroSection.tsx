
import { useState } from "react";
import AuthForm from "@/components/auth/AuthForm";

interface HeroSectionProps {
  onAuthSuccess: () => void;
}

const HeroSection = ({ onAuthSuccess }: HeroSectionProps) => {
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleFormToggle = (toAuth: boolean) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowAuthForm(toAuth);
      setIsTransitioning(false);
    }, 150);
  };

  return (
    <section className="relative flex items-center justify-center py-12 md:py-20">
      <div className="relative w-full grid lg:grid-cols-2 gap-12 items-center">
        {/* Hero Content */}
        <div className="text-center lg:text-left space-y-6">
          {/* Brand */}
          <div className="flex justify-center lg:justify-start mb-8">
            <h1 className="text-3xl font-bold text-career-accent">
              Praeviderant
            </h1>
          </div>
          
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight text-career-text">
            Forget the Resume. Tell Your Story.
          </h2>
          
          <p className="text-xl md:text-2xl leading-relaxed text-career-text-muted">
            You're not a template. You're a timeline of effort, change, and growth. Praeviderant helps you understand it—and translate it into documents that speak your truth.
          </p>
        </div>

        {/* CTA Section */}
        <div className="flex justify-center lg:justify-end">
          <div className={`w-full max-w-md h-[400px] flex flex-col transition-all duration-700 ${isTransitioning ? 'opacity-60' : 'opacity-100'}`}>
            {/* Form Toggle Indicator */}
            <div className="relative mb-6 flex-shrink-0">
              <div className={`absolute top-0 left-0 h-1 bg-gradient-to-r from-career-accent to-career-accent-dark rounded-full transition-all duration-700 ease-in-out ${showAuthForm ? 'w-1/2 translate-x-full' : 'w-1/2 translate-x-0'}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
              </div>
              <div className="h-1 w-full rounded-full bg-career-gray"></div>
            </div>

            {/* Form Content */}
            <div className={`flex-grow flex flex-col justify-between transition-all duration-500 ease-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
              {!showAuthForm ? (
                <div className="flex flex-col h-full justify-center space-y-8">
                  <div className="text-center space-y-4">
                    <h3 className="text-xl font-semibold text-career-text">
                      Ready to get started?
                    </h3>
                    <p className="text-sm text-career-text-muted">
                      Create your account and begin building your career story.
                    </p>
                  </div>

                  <button
                    onClick={() => handleFormToggle(true)}
                    className="w-full h-14 bg-career-accent hover:bg-career-accent-dark text-white font-semibold neumorphic-button border-0 text-lg transition-all duration-300 hover:shadow-lg relative overflow-hidden group"
                  >
                    <span className="relative z-10">Get Started</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000 ease-out"></div>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex-grow flex items-center justify-center">
                    <AuthForm onSuccess={onAuthSuccess} />
                  </div>
                  
                  <div className="text-center mt-4 flex-shrink-0">
                    <button
                      onClick={() => handleFormToggle(false)}
                      className="text-career-text-muted hover:text-career-accent text-sm transition-all duration-500 underline relative overflow-hidden group"
                    >
                      <span className="relative z-10">Back</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-career-accent to-transparent opacity-0 group-hover:opacity-10 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-800 ease-out"></div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
