
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { Play, Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RealtimeInterviewCard } from "./RealtimeInterviewCard";
import { ResumePreview } from "./ResumePreview";
import { VoiceVisualizer } from "./VoiceVisualizer";

const InterviewBuilder = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [hasStarted, setHasStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [extractedData, setExtractedData] = useState<any>({});
  const [isCompleted, setIsCompleted] = useState(false);

  const startInterview = () => {
    setHasStarted(true);
  };

  const handleTranscriptUpdate = (transcript: string) => {
    console.log('Transcript updated:', transcript);
  };

  const handleInterviewComplete = async (interviewData: any) => {
    if (!user) return;

    try {
      // Save the interview data to Supabase
      const { error } = await supabase
        .from('interviews')
        .insert({
          user_id: user.id,
          interview_type: 'realtime_ai_interview',
          status: 'completed',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          transcript: interviewData.transcript,
          extracted_context: interviewData
        });

      if (error) throw error;

      setExtractedData(interviewData);
      setIsCompleted(true);
      console.log('Interview completed and saved:', interviewData);
    } catch (error) {
      console.error('Error saving interview:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-4`}>
          AI Real-time Interview
        </h2>
        <p className={`text-lg ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
          Have a natural conversation with our AI - real-time voice communication
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Interview Section */}
        <div className="space-y-6">
          {!hasStarted ? (
            /* Welcome Card */
            <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
              <CardHeader>
                <CardTitle className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                  Ready for Your Real-time AI Interview?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                  Experience the future of career interviews with OpenAI's real-time voice technology. 
                  Have a natural conversation with our AI interviewer who will ask thoughtful questions 
                  about your background, experience, and career goals.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-career-text-muted-dark' : 'bg-career-text-muted-light'}`} />
                    <span className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                      Real-time voice conversation
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-career-text-muted-dark' : 'bg-career-text-muted-light'}`} />
                    <span className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                      Intelligent follow-up questions
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-career-text-muted-dark' : 'bg-career-text-muted-light'}`} />
                    <span className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                      Automatic transcript generation
                    </span>
                  </div>
                </div>
                <Button 
                  onClick={startInterview}
                  className="w-full bg-career-accent hover:bg-career-accent-dark text-white"
                  disabled={!user}
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Start Real-time Interview
                </Button>
              </CardContent>
            </Card>
          ) : isCompleted ? (
            /* Completion Card */
            <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
              <CardHeader>
                <CardTitle className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                  Interview Complete! 🎉
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} mb-4`}>
                  Excellent work! Your real-time AI interview has been completed and saved. 
                  You can review the transcript and generate a resume from the extracted information.
                </p>
                <Button 
                  onClick={() => window.location.reload()}
                  className="w-full bg-career-accent hover:bg-career-accent-dark text-white"
                >
                  Start New Interview
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Real-time Interview Component */
            <RealtimeInterviewCard
              onTranscriptUpdate={handleTranscriptUpdate}
              onComplete={handleInterviewComplete}
              theme={theme}
            />
          )}

          {/* Voice Visualizer */}
          {isRecording && (
            <VoiceVisualizer isRecording={isRecording} theme={theme} />
          )}
        </div>

        {/* Resume Preview */}
        <div className="space-y-6">
          <ResumePreview 
            extractedData={extractedData} 
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
};

export default InterviewBuilder;
