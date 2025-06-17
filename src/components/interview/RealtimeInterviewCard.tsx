
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AudioRecorder, encodeAudioForAPI, playAudioData } from "@/utils/RealtimeAudio";

interface RealtimeInterviewCardProps {
  onTranscriptUpdate: (transcript: string) => void;
  onComplete: (extractedData: any) => void;
  theme: 'light' | 'dark';
}

export const RealtimeInterviewCard = ({ onTranscriptUpdate, onComplete, theme }: RealtimeInterviewCardProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [currentTranscript, setCurrentTranscript] = useState("");
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const connect = async () => {
    try {
      // Initialize audio context
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      // Connect to WebSocket
      const wsUrl = `wss://deofbwuazrvpocyybjpl.functions.supabase.co/realtime-interview`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Connected to realtime interview');
        setIsConnected(true);
        startRecording();
        
        toast({
          title: "Connected",
          description: "Ready to start your AI interview",
        });
      };

      wsRef.current.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message:', data.type);

          if (data.type === 'session.created') {
            console.log('Session created successfully');
          } else if (data.type === 'session.updated') {
            console.log('Session configured successfully');
          } else if (data.type === 'response.audio.delta') {
            setIsSpeaking(true);
            
            // Convert base64 to Uint8Array and play
            const binaryString = atob(data.delta);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            if (audioContextRef.current) {
              await playAudioData(audioContextRef.current, bytes);
            }
          } else if (data.type === 'response.audio.done') {
            setIsSpeaking(false);
          } else if (data.type === 'response.audio_transcript.delta') {
            setCurrentTranscript(prev => prev + data.delta);
          } else if (data.type === 'response.audio_transcript.done') {
            const fullTranscript = currentTranscript;
            setTranscript(prev => prev + '\nAI: ' + fullTranscript);
            onTranscriptUpdate(fullTranscript);
            setCurrentTranscript("");
          } else if (data.type === 'input_audio_buffer.speech_started') {
            console.log('User started speaking');
          } else if (data.type === 'input_audio_buffer.speech_stopped') {
            console.log('User stopped speaking');
          } else if (data.error) {
            throw new Error(data.error);
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to the interview service",
          variant: "destructive",
        });
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket connection closed');
        setIsConnected(false);
        setIsRecording(false);
        setIsSpeaking(false);
      };

    } catch (error) {
      console.error('Error connecting:', error);
      toast({
        title: "Connection Error",
        description: "Failed to initialize the interview",
        variant: "destructive",
      });
    }
  };

  const startRecording = async () => {
    try {
      audioRecorderRef.current = new AudioRecorder((audioData) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const encodedAudio = encodeAudioForAPI(audioData);
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encodedAudio
          }));
        }
      });

      await audioRecorderRef.current.start();
      setIsRecording(true);
      
      console.log('Audio recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Error",
        description: "Failed to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const disconnect = () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsConnected(false);
    setIsRecording(false);
    setIsSpeaking(false);
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

  return (
    <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
      <CardHeader>
        <CardTitle className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} flex items-center space-x-2`}>
          {isConnected ? (
            <Phone className="w-5 h-5 text-green-500" />
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
          isConnected 
            ? theme === 'dark' ? 'bg-green-900/10 border-green-500/20' : 'bg-green-50 border-green-200'
            : theme === 'dark' ? 'bg-gray-900/10 border-gray-500/20' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            {isConnected ? (
              <>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                  Connected - Interview in progress
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
          {!isConnected ? (
            <Button
              onClick={connect}
              className="flex-1 bg-career-accent hover:bg-career-accent-dark text-white"
            >
              <Phone className="w-4 h-4 mr-2" />
              Start Interview
            </Button>
          ) : (
            <>
              <Button
                onClick={disconnect}
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
