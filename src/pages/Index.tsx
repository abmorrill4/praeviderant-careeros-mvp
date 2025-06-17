
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import WaveAnimation from "@/components/WaveAnimation";
import ThemeToggle from "@/components/ThemeToggle";
import InterestModal from "@/components/InterestModal";
import AuthForm from "@/components/auth/AuthForm";
import { Mic, Target, Users } from "lucide-react";

const Index = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
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

  const handleFormToggle = (toAuth: boolean) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowAuthForm(toAuth);
      setIsTransitioning(false);
    }, 150);
  };

  const handleAuthSuccess = () => {
    // User will be automatically redirected by the useEffect above
  };

  const beliefStatements = [
    "Resumes are built for machines. You are not.",
    "No one should have to flatten themselves to apply.",
    "Confidence shouldn't depend on formatting.",
    "Voice matters. Yours stays yours.",
    "Bias—yours or theirs—shouldn't dictate your options.",
    "Your resume should reflect you. Not just what you've done—but who you are becoming."
  ];

  const useCases = [
    {
      icon: "🎯",
      title: "The Builder",
      description: "Product manager shaping systems behind the scenes"
    },
    {
      icon: "🧠",
      title: "The Rebooter", 
      description: "Academic pivoting into industry"
    },
    {
      icon: "🪖",
      title: "The Veteran",
      description: "Translating service into strategy"
    },
    {
      icon: "👩‍👧",
      title: "The Returner",
      description: "Re-entering the workforce with even more to offer"
    },
    {
      icon: "🧑‍💻",
      title: "The Self-Taught",
      description: "No credentials. No apologies. Just real work."
    }
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-career-dark' : 'bg-career-light'} transition-colors duration-300`}>
      <ThemeToggle />
      
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Hero Section */}
        <section className="relative flex items-center justify-center py-12 md:py-20">
          {/* Background Wave Animation */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <WaveAnimation />
          </div>

          <div className="relative w-full grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left space-y-6">
              {/* Brand */}
              <div className="flex justify-center lg:justify-start mb-8">
                <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-career-accent' : 'text-career-accent'}`}>
                  Praeviderant
                </h1>
              </div>
              
              <h2 className={`text-4xl md:text-6xl lg:text-7xl font-bold leading-tight ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                Forget the Resume. Tell Your Story.
              </h2>
              
              <p className={`text-xl md:text-2xl leading-relaxed ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
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
                  <div className={`h-1 w-full rounded-full ${theme === 'dark' ? 'bg-career-gray-dark' : 'bg-career-gray-light'}`}></div>
                </div>

                {/* Form Content */}
                <div className={`flex-grow flex flex-col justify-between transition-all duration-500 ease-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                  {!showAuthForm ? (
                    <div className="flex flex-col h-full justify-center space-y-8">
                      <Button
                        onClick={() => setIsModalOpen(true)}
                        className={`w-full h-14 bg-career-accent hover:bg-career-accent-dark text-white font-semibold neumorphic-button ${theme} border-0 text-lg transition-all duration-300 hover:shadow-lg relative overflow-hidden group`}
                      >
                        <span className="relative z-10">Register Your Interest</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000 ease-out"></div>
                      </Button>

                      <div className="text-center">
                        <button
                          onClick={() => handleFormToggle(true)}
                          className={`${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-accent' : 'text-career-text-muted-light hover:text-career-accent'} text-sm transition-all duration-500 underline relative overflow-hidden group`}
                        >
                          <span className="relative z-10">Already signed up? Log in here.</span>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-career-accent to-transparent opacity-0 group-hover:opacity-10 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-800 ease-out"></div>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full">
                      <div className="flex-grow flex items-center justify-center">
                        <AuthForm onSuccess={handleAuthSuccess} />
                      </div>
                      
                      <div className="text-center mt-4 flex-shrink-0">
                        <button
                          onClick={() => handleFormToggle(false)}
                          className={`${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-accent' : 'text-career-text-muted-light hover:text-career-accent'} text-sm transition-all duration-500 underline relative overflow-hidden group`}
                        >
                          <span className="relative z-10">Back to registration</span>
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

        {/* Belief Section */}
        <section className="py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              What We Believe
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beliefStatements.map((statement, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-career-panel-dark' : 'bg-career-panel-light'} border border-opacity-20 hover:border-career-accent transition-all duration-300`}
              >
                <p className={`text-lg font-semibold leading-relaxed ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                  {statement}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              How It Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-4">
                <div className={`w-16 h-16 rounded-xl ${theme === 'dark' ? 'bg-career-panel-dark' : 'bg-career-panel-light'} flex items-center justify-center border border-career-accent`}>
                  <Mic className="w-8 h-8 text-career-accent" />
                </div>
              </div>
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                Voice Interview
              </h3>
              <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                We talk to you—like a coach, not a chatbot.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="flex justify-center mb-4">
                <div className={`w-16 h-16 rounded-xl ${theme === 'dark' ? 'bg-career-panel-dark' : 'bg-career-panel-light'} flex items-center justify-center border border-career-accent`}>
                  <Target className="w-8 h-8 text-career-accent" />
                </div>
              </div>
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                Deep Context Modeling
              </h3>
              <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                We structure your work history, skills, transitions, voice, and goals into usable data.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="flex justify-center mb-4">
                <div className={`w-16 h-16 rounded-xl ${theme === 'dark' ? 'bg-career-panel-dark' : 'bg-career-panel-light'} flex items-center justify-center border border-career-accent`}>
                  <Users className="w-8 h-8 text-career-accent" />
                </div>
              </div>
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                Smart Output Engine
              </h3>
              <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                We generate resumes, career documents, and strategy—tailored to each job, all in your tone, instantly.
              </p>
            </div>
          </div>

          <div className={`text-center p-6 rounded-xl ${theme === 'dark' ? 'bg-career-panel-dark' : 'bg-career-panel-light'} border border-opacity-20`}>
            <p className={`text-lg font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
              Designed from day one for accessibility, inclusivity, and clarity.
            </p>
            <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
              Because not everyone starts at the same place—but everyone deserves to show up fully.
            </p>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              We Don't Do Templates
            </h2>
          </div>

          <div className={`${theme === 'dark' ? 'bg-career-panel-dark' : 'bg-career-panel-light'} p-8 rounded-xl border border-opacity-20 overflow-x-auto`}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-career-accent border-opacity-30">
                  <th className={`text-left py-4 text-xl font-bold text-career-accent`}>
                    Praeviderant
                  </th>
                  <th className={`text-left py-4 text-xl font-bold ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    Traditional Tools
                  </th>
                </tr>
              </thead>
              <tbody className="space-y-4">
                <tr className="border-b border-opacity-10 border-gray-500">
                  <td className={`py-4 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                    Learns from voice & context
                  </td>
                  <td className={`py-4 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    Fills in a form
                  </td>
                </tr>
                <tr className="border-b border-opacity-10 border-gray-500">
                  <td className={`py-4 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                    Grows with your story
                  </td>
                  <td className={`py-4 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    Resets every time
                  </td>
                </tr>
                <tr className="border-b border-opacity-10 border-gray-500">
                  <td className={`py-4 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                    Maintains your voice
                  </td>
                  <td className={`py-4 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    Sounds like ChatGPT
                  </td>
                </tr>
                <tr className="border-b border-opacity-10 border-gray-500">
                  <td className={`py-4 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                    Helps overcome internal bias
                  </td>
                  <td className={`py-4 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    Leaves you guessing
                  </td>
                </tr>
                <tr>
                  <td className={`py-4 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                    Accessible, voice-first
                  </td>
                  <td className={`py-4 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    Keyboard-heavy, form-centric
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Use Case Tiles */}
        <section className="py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              Made for Real People With Real Stories
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-career-panel-dark' : 'bg-career-panel-light'} border border-opacity-20 hover:border-career-accent transition-all duration-300 text-center`}
              >
                <div className="text-4xl mb-4">{useCase.icon}</div>
                <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                  {useCase.title}
                </h3>
                <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                  {useCase.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-24">
          <div className="text-center space-y-8">
            <h2 className={`text-4xl md:text-5xl font-bold leading-tight ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              It's time your story got the tools it deserves.
            </h2>
            <p className={`text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
              Join us in building a career platform that respects who you are—and who you're becoming.
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className={`h-14 px-12 bg-career-accent hover:bg-career-accent-dark text-white font-semibold neumorphic-button ${theme} border-0 text-lg transition-all duration-300 hover:shadow-lg relative overflow-hidden group`}
            >
              <span className="relative z-10">Register Your Interest</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000 ease-out"></div>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className={`${theme === 'dark' ? 'bg-career-panel-dark' : 'bg-career-panel-light'} py-8 px-6 rounded-lg mt-8`}>
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div>
              <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} text-sm`}>
                © 2024 Praeviderant. Built for humans, not templates.
              </p>
            </div>
            
            <div className="flex gap-6">
              <a href="#" className={`${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-accent' : 'text-career-text-muted-light hover:text-career-accent'} text-sm transition-colors duration-200`}>
                Privacy
              </a>
              <a href="#" className={`${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-accent' : 'text-career-text-muted-light hover:text-career-accent'} text-sm transition-colors duration-200`}>
                Terms
              </a>
              <a href="#" className={`${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-accent' : 'text-career-text-muted-light hover:text-career-accent'} text-sm transition-colors duration-200`}>
                Contact
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* Interest Registration Modal */}
      <InterestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default Index;
