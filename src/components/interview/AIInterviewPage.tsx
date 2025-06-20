
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, FileText } from "lucide-react";
import VoiceInterview from "./VoiceInterview";

const AIInterviewPage = () => {
  const { user } = useAuth();
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-4`}>
          AI Interview System
        </h2>
        <p className={`text-lg ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
          Real-time voice interview with AI career coach
        </p>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Interview Section */}
        <div className="space-y-6">
          <VoiceInterview />
        </div>

        {/* Resume Generation Section */}
        <div className="space-y-6">
          <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
            <CardHeader>
              <CardTitle className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} flex items-center space-x-2`}>
                <FileText className="w-5 h-5" />
                <span>Resume Generation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-8 rounded-lg text-center ${theme === 'dark' ? 'bg-career-gray-dark/20' : 'bg-career-gray-light/20'}`}>
                <FileText className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`} />
                <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                  Resume Coming Soon
                </h3>
                <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                  Start an interview to begin generating your personalized resume based on the conversation.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
            <CardHeader>
              <CardTitle className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                <div className="flex items-start space-x-2 mb-2">
                  <span className="text-career-accent font-bold">1.</span>
                  <span>Click "Start Interview" to begin your voice session</span>
                </div>
                <div className="flex items-start space-x-2 mb-2">
                  <span className="text-career-accent font-bold">2.</span>
                  <span>Speak naturally about your background and experience</span>
                </div>
                <div className="flex items-start space-x-2 mb-2">
                  <span className="text-career-accent font-bold">3.</span>
                  <span>The AI will ask follow-up questions about your career</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-career-accent font-bold">4.</span>
                  <span>Your responses will be used to generate a personalized resume</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIInterviewPage;
