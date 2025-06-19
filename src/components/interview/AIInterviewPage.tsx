
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import VoiceInterview from "./VoiceInterview";

const AIInterviewPage = () => {
  const { user } = useAuth();
  const { theme } = useTheme();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-3`}>
          AI Career Interview
        </h1>
        <p className={`text-lg ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} max-w-2xl`}>
          Have a natural conversation with our AI career coach to create a personalized resume based on your experience and goals.
        </p>
      </div>

      {/* Main Interview Interface */}
      <VoiceInterview />
    </div>
  );
};

export default AIInterviewPage;
