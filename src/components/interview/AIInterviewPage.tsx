
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import VoiceInterview from "./VoiceInterview";

const AIInterviewPage = () => {
  const { user } = useAuth();
  const { theme } = useTheme();

  return (
    <div className="min-h-screen">
      {/* Main Interview Interface - No duplicate header */}
      <VoiceInterview />
    </div>
  );
};

export default AIInterviewPage;
