
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import VoiceInterview from "./VoiceInterview";

const AIInterviewPage = () => {
  const { user } = useAuth();
  const { theme } = useTheme();

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
          AI Career Interview
        </h1>
        <p className={`text-lg ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
          Real-time voice and text interview with AI career coach
        </p>
      </div>

      {/* Main Interview Interface */}
      <VoiceInterview />
    </div>
  );
};

export default AIInterviewPage;
