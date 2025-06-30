
import { Mic, Target, Users } from "lucide-react";

const HowItWorksSection = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-career-text">
          How It Works
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-xl bg-career-panel flex items-center justify-center border border-career-accent">
              <Mic className="w-8 h-8 text-career-accent" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-career-text">
            Voice Interview
          </h3>
          <p className="text-career-text-muted">
            We talk to you—like a coach, not a chatbot.
          </p>
        </div>

        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-xl bg-career-panel flex items-center justify-center border border-career-accent">
              <Target className="w-8 h-8 text-career-accent" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-career-text">
            Deep Context Modeling
          </h3>
          <p className="text-career-text-muted">
            We structure your work history, skills, transitions, voice, and goals into usable data.
          </p>
        </div>

        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-xl bg-career-panel flex items-center justify-center border border-career-accent">
              <Users className="w-8 h-8 text-career-accent" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-career-text">
            Smart Output Engine
          </h3>
          <p className="text-career-text-muted">
            We generate resumes, career documents, and strategy—tailored to each job, all in your tone, instantly.
          </p>
        </div>
      </div>

      <div className="text-center p-6 rounded-xl bg-career-panel border border-opacity-20">
        <p className="text-lg font-medium text-career-text mb-2">
          Designed from day one for accessibility, inclusivity, and clarity.
        </p>
        <p className="text-career-text-muted">
          Because not everyone starts at the same place—but everyone deserves to show up fully.
        </p>
      </div>
    </section>
  );
};

export default HowItWorksSection;
