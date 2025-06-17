import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AudioRecorder, encodeAudioForAPI, playAudioData } from "@/utils/RealtimeAudio";
import { useRealtimeInterviewSocket, ConnectionStatus } from "@/hooks/useRealtimeInterviewSocket";

interface RealtimeInterviewCardProps {
  onTranscriptUpdate: (transcript: string) => void;
  onComplete: (extractedData: any) => void;
  theme: 'light' | 'dark';
}

export const RealtimeInterviewCard = ({ onTranscriptUpdate, onComplete, theme }: RealtimeInterviewCardProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const { toast } = useToast();

  const websocketUrl = "wss://deofbwuazrvpocyybjpl.supabase.co/functions/v1/realtime-interview";
  const { connect, disconnect, sendMessage, lastMessage, status, error } = useRealtimeInterviewSocket();
  
  const isConnected = status === ConnectionStatus.Open;
  const isConnecting = status === ConnectionStatus.Connecting;

  // Show error messages
  useEffect(() => {
    if (error) {
      console.error('WebSocket error:', error);
      toast({
        title: "Connection Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  useEffect(() => {
    if (!lastMessage) return;

    try {
      console.log('Processing message:', lastMessage.type);

      if (lastMessage.type === 'error') {
        console.error('Received error from server:', lastMessage.error);
        toast({
          title: "Server Error",
          description: lastMessage.error,
          variant: "destructive",
        });
        return;
      }

      if (lastMessage.type === 'session.updated') {
        console.log('Session configured successfully');
        setSessionReady(true);
        
        toast({
          title: "Session Ready",
          description: "AI interview session is configured and ready",
        });
      } else if (lastMessage.type === 'response.audio.delta') {
        setIsSpeaking(true);
        
        // Convert base64 to Uint8Array and play
        const binaryString = atob(lastMessage.delta);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        if (audioContextRef.current) {
          playAudioData(audioContextRef.current, bytes);
        }
      } else if (lastMessage.type === 'response.audio.done') {
        setIsSpeaking(false);
      } else if (lastMessage.type === 'response.audio_transcript.delta') {
        setCurrentTranscript(prev => prev + lastMessage.delta);
      } else if (lastMessage.type === 'response.audio_transcript.done') {
        const fullTranscript = currentTranscript;
        setTranscript(prev => prev + '\nAI: ' + fullTranscript);
        onTranscriptUpdate(fullTranscript);
        setCurrentTranscript("");
      } else if (lastMessage.type === 'input_audio_buffer.speech_started') {
        console.log('User started speaking');
      } else if (lastMessage.type === 'input_audio_buffer.speech_stopped') {
        console.log('User stopped speaking');
      }
    } catch (error) {
      console.error('Error processing message:', error);
      toast({
        title: "Message Processing Error",
        description: "Error processing message from server",
        variant: "destructive",
      });
    }
  }, [lastMessage, onTranscriptUpdate, toast, currentTranscript]);

  const startInterview = async () => {
    try {
      console.log('Starting interview...');
      
      // Initialize audio context
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      // Connect to WebSocket
      connect(websocketUrl);
      
      console.log('Interview start initiated');
    } catch (error) {
      console.error('Error starting interview:', error);
      toast({
        title: "Connection Error",
        description: "Failed to initialize the interview",
        variant: "destructive",
      });
    }
  };

  const startRecording = async () => {
    try {
      console.log('Starting audio recording...');
      audioRecorderRef.current = new AudioRecorder((audioData) => {
        if (status === ConnectionStatus.Open && sessionReady) {
          const encodedAudio = encodeAudioForAPI(audioData);
          sendMessage({
            type: 'input_audio_buffer.append',
            audio: encodedAudio
          });
        }
      });

      await audioRecorderRef.current.start();
      setIsRecording(true);
      
      console.log('Audio recording started successfully');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Error",
        description: "Failed to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const endInterview = () => {
    console.log('Ending interview...');
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
    }
    
    disconnect();
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsRecording(false);
    setIsSpeaking(false);
    setSessionReady(false);
  };

  const completeInterview = () => {
    onComplete({
      transcript: transcript,
      summary: "Real-time AI interview completed",
      keyPoints: transcript.split('\n').filter(line => line.trim()),
      extractedData: { fullTranscript: transcript }
    });
    
    toast({
      title: "Interview Complete",
      description: "Your interview has been saved successfully",
    });
  };

  // Auto-start recording when session is ready
  useEffect(() => {
    if (isConnected && sessionReady && !isRecording) {
      startRecording();
    }
  }, [isConnected, sessionReady, isRecording]);

  return (
    <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
      <CardHeader>
        <CardTitle className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} flex items-center space-x-2`}>
          {isConnected && sessionReady ? (
            <Phone className="w-5 h-5 text-green-500" />
          ) : isConnecting ? (
            <div className="w-5 h-5 border-2 border-career-accent border-t-transparent rounded-full animate-spin" />
          ) : (
            <PhoneOff className="w-5 h-5 text-gray-400" />
          )}
          <span>AI Real-time Interview</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-career-gray-dark/20' : 'bg-career-gray-light/20'}`}>
          <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} font-medium mb-2`}>
            Real-time AI Interview
          </p>
          <p className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
            Have a natural conversation with our AI interviewer. Speak naturally and the AI will ask follow-up questions about your background, experience, and goals.
          </p>
        </div>

        {/* Connection Status */}
        <div className={`p-4 rounded-lg border ${
          isConnected && sessionReady
            ? theme === 'dark' ? 'bg-green-900/10 border-green-500/20' : 'bg-green-50 border-green-200'
            : error
            ? theme === 'dark' ? 'bg-red-900/10 border-red-500/20' : 'bg-red-50 border-red-200'
            : theme === 'dark' ? 'bg-gray-900/10 border-gray-500/20' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            {isConnected && sessionReady ? (
              <>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                  Connected - Interview in progress
                </span>
              </>
            ) : isConnecting || (isConnected && !sessionReady) ? (
              <>
                <div className="w-3 h-3 border-2 border-career-accent border-t-transparent rounded-full animate-spin" />
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-career-accent' : 'text-career-accent'}`}>
                  {isConnected ? 'Configuring session...' : 'Connecting to AI service...'}
                </span>
              </>
            ) : error ? (
              <>
                <AlertCircle className="w-3 h-3 text-red-500" />
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                  Connection failed
                </span>
              </>
            ) : (
              <>
                <div className={`w-3 h-3 rounded-full ${theme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'}`} />
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Ready to connect
                </span>
              </>
            )}
          </div>
          
          {error && (
            <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
              {error}
            </p>
          )}
          
          <div className="flex items-center space-x-4">
            {isRecording && (
              <div className="flex items-center space-x-2">
                <Mic className="w-4 h-4 text-red-500 animate-pulse" />
                <span className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                  Recording
                </span>
              </div>
            )}
            
            {isSpeaking && (
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-blue-500 animate-pulse" />
                <span className={`text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                  AI Speaking
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Live Transcript */}
        {transcript && (
          <div className={`p-4 rounded-lg border max-h-48 overflow-y-auto ${theme === 'dark' ? 'bg-purple-900/10 border-purple-500/20' : 'bg-purple-50 border-purple-200'}`}>
            <p className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
              Interview Transcript:
            </p>
            <pre className={`text-sm whitespace-pre-wrap ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              {transcript}
            </pre>
            {currentTranscript && (
              <p className={`text-sm mt-2 italic ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                AI: {currentTranscript}...
              </p>
            )}
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex space-x-3">
          {!isConnected && !isConnecting ? (
            <Button
              onClick={startInterview}
              className="flex-1 bg-career-accent hover:bg-career-accent-dark text-white"
              disabled={false}
            >
              <Phone className="w-4 h-4 mr-2" />
              Start Interview
            </Button>
          ) : isConnecting || (isConnected && !sessionReady) ? (
            <Button
              disabled
              className="flex-1 bg-gray-400 text-white cursor-not-allowed"
            >
              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {isConnected ? 'Configuring...' : 'Connecting...'}
            </Button>
          ) : (
            <>
              <Button
                onClick={endInterview}
                variant="destructive"
                className="flex-1"
              >
                <PhoneOff className="w-4 h-4 mr-2" />
                End Interview
              </Button>
              
              {transcript && (
                <Button
                  onClick={completeInterview}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Complete & Save
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
