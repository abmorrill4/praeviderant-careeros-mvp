
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic } from "lucide-react";
import SimpleVoiceInterview from "./SimpleVoiceInterview";

const AIInterviewPage = () => {
  const { user } = useAuth();
  const { theme } = useTheme();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
          AI Career Interview
        </h2>
        <p className={`text-lg ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
          Have a natural conversation about your career
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SimpleVoiceInterview />
        </div>

        <div className="space-y-4">
          <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-lg ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                How it works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                <div className="flex items-start space-x-2 mb-2">
                  <span className="text-career-accent font-bold">1.</span>
                  <span>Click "Start Interview"</span>
                </div>
                <div className="flex items-start space-x-2 mb-2">
                  <span className="text-career-accent font-bold">2.</span>
                  <span>The AI will greet you and begin asking questions</span>
                </div>
                <div className="flex items-start space-x-2 mb-2">
                  <span className="text-career-accent font-bold">3.</span>
                  <span>Speak naturally about your experience</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-career-accent font-bold">4.</span>
                  <span>Your responses will be saved and analyzed</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
            <CardContent className="p-6 text-center">
              <Mic className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`} />
              <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                The interview will start automatically once you connect. Just speak naturally when prompted.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIInterviewPage;
