
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { Play, Pause, Square, Mic, MicOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { InterviewCard } from "./InterviewCard";
import { ResumePreview } from "./ResumePreview";
import { VoiceVisualizer } from "./VoiceVisualizer";

interface InterviewType {
  id: string;
  name: string;
  title: string;
  description: string;
  prompt_template: string;
  display_order: number;
}

interface Interview {
  id: string;
  interview_type: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  transcript?: string;
  extracted_context?: any;
}

const InterviewBuilder = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [interviewTypes, setInterviewTypes] = useState<InterviewType[]>([]);
  const [currentInterview, setCurrentInterview] = useState<Interview | null>(null);
  const [currentTypeIndex, setCurrentTypeIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [extractedData, setExtractedData] = useState<any>({});
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  useEffect(() => {
    fetchInterviewTypes();
  }, []);

  const fetchInterviewTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('interview_types')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setInterviewTypes(data || []);
    } catch (error) {
      console.error('Error fetching interview types:', error);
    }
  };

  const startInterview = async () => {
    if (!user || !interviewTypes[currentTypeIndex]) return;

    try {
      const { data, error } = await supabase
        .from('interviews')
        .insert({
          user_id: user.id,
          interview_type: interviewTypes[currentTypeIndex].name,
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      setCurrentInterview(data);
      
      // Start voice recording
      await startRecording();
    } catch (error) {
      console.error('Error starting interview:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          // In a real implementation, you'd send this to a transcription service
          console.log('Audio data received:', event.data);
        }
      };

      recorder.start(1000); // Capture every second
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setMediaRecorder(null);
    }
    setIsRecording(false);
  };

  const completeCurrentSection = async () => {
    if (!currentInterview) return;

    setIsProcessing(true);
    stopRecording();

    try {
      // In a real implementation, you'd process the audio/transcript with AI
      const mockExtractedData = {
        [interviewTypes[currentTypeIndex].name]: {
          summary: `Summary for ${interviewTypes[currentTypeIndex].title}`,
          keyPoints: [`Key point 1`, `Key point 2`],
          transcript: transcript || "Mock transcript content"
        }
      };

      const { error } = await supabase
        .from('interviews')
        .update({
          transcript: transcript,
          extracted_context: { ...extractedData, ...mockExtractedData },
          updated_at: new Date().toISOString()
        })
        .eq('id', currentInterview.id);

      if (error) throw error;

      setExtractedData(prev => ({ ...prev, ...mockExtractedData }));

      // Move to next section or complete interview
      if (currentTypeIndex < interviewTypes.length - 1) {
        setCurrentTypeIndex(currentTypeIndex + 1);
        setTranscript("");
        await startRecording(); // Start next section
      } else {
        // Complete entire interview
        await supabase
          .from('interviews')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', currentInterview.id);
      }
    } catch (error) {
      console.error('Error completing section:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const currentType = interviewTypes[currentTypeIndex];
  const hasStarted = currentInterview !== null;
  const isCompleted = currentTypeIndex >= interviewTypes.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-4`}>
          AI Career Interview
        </h2>
        <p className={`text-lg ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
          Let's build your resume together through an intelligent conversation
        </p>
      </div>

      {/* Progress Indicator */}
      {hasStarted && (
        <div className="flex justify-center">
          <div className="flex space-x-2">
            {interviewTypes.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                  index < currentTypeIndex
                    ? 'bg-green-500'
                    : index === currentTypeIndex
                    ? 'bg-career-accent'
                    : theme === 'dark'
                    ? 'bg-career-gray-dark'
                    : 'bg-career-gray-light'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Interview Section */}
        <div className="space-y-6">
          {!hasStarted ? (
            /* Welcome Card */
            <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
              <CardHeader>
                <CardTitle className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                  Ready to Begin?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                  We'll guide you through {interviewTypes.length} sections to build your comprehensive resume. 
                  Each section will be recorded and processed to extract key information.
                </p>
                <div className="space-y-2">
                  {interviewTypes.map((type, index) => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-career-text-muted-dark' : 'bg-career-text-muted-light'}`} />
                      <span className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                        {type.title}
                      </span>
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={startInterview}
                  className="w-full bg-career-accent hover:bg-career-accent-dark text-white"
                  disabled={!user}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Interview
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
                  Great job! Your resume has been generated based on our conversation. 
                  You can review and edit it anytime.
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
            /* Current Interview Section */
            <InterviewCard
              type={currentType}
              isRecording={isRecording}
              isProcessing={isProcessing}
              onComplete={completeCurrentSection}
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
