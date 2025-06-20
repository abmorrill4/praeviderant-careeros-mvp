
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from '@/contexts/ThemeContext';
import { useInterviewSession } from '@/hooks/useInterviewSession';
import { SimpleWebRTCManager } from '@/utils/simpleWebRTC';
import { Mic, MicOff, Volume2, VolumeX, Play, Square, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SimpleVoiceInterview = () => {
  const { theme } = useTheme();
  const { toast } = useToast();
  const { session, transcript, isLoading, createSession, addTranscriptEntry, updateSessionStatus, endSession } = useInterviewSession();

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  
  const webrtcRef = useRef<SimpleWebRTCManager | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [transcript]);

  const handleStart = async () => {
    try {
      setIsConnecting(true);
      
      const sessionData = await createSession();
      
      webrtcRef.current = new SimpleWebRTCManager();
      
      await webrtcRef.current.connect(
        sessionData.clientSecret,
        sessionData.systemPrompt,
        handleMessage,
        handleConnectionState
      );

      await updateSessionStatus('active');
      setIsConnected(true);
      
      toast({
        title: "Interview Started",
        description: "The AI will begin the interview shortly.",
      });
      
    } catch (error) {
      console.error('Failed to start:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to start the interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleStop = () => {
    if (webrtcRef.current) {
      webrtcRef.current.disconnect();
      webrtcRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionState('new');
    endSession();
    
    toast({
      title: "Interview Ended",
      description: "Your interview session has been saved.",
    });
  };

  const handleMessage = (data: any) => {
    console.log('Received message:', data.type);
    
    switch (data.type) {
      case 'conversation.item.created':
        if (data.item?.content?.[0]?.type === 'text') {
          addTranscriptEntry('assistant', data.item.content[0].text);
        }
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        if (data.transcript) {
          addTranscriptEntry('user', data.transcript);
        }
        break;
        
      case 'error':
        console.error('OpenAI error:', data.error);
        toast({
          title: "AI Error",
          description: data.error.message || "An error occurred with the AI service.",
          variant: "destructive",
        });
        break;
    }
  };

  const handleConnectionState = (state: RTCPeerConnectionState) => {
    setConnectionState(state);
    
    if (state === 'failed' || state === 'disconnected') {
      setIsConnected(false);
      toast({
        title: "Connection Lost",
        description: "The interview connection was lost.",
        variant: "destructive",
      });
    }
  };

  const toggleMic = () => {
    if (webrtcRef.current) {
      const newState = !micEnabled;
      webrtcRef.current.toggleMic(newState);
      setMicEnabled(newState);
    }
  };

  const toggleAudio = () => {
    if (webrtcRef.current) {
      const newState = !audioEnabled;
      webrtcRef.current.toggleAudio(newState);
      setAudioEnabled(newState);
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'failed': case 'disconnected': return 'text-red-500';
      default: return theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (webrtcRef.current) {
        webrtcRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
        <CardHeader className="pb-3">
          <CardTitle className={`text-lg ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} flex items-center justify-between`}>
            <span>Voice Interview</span>
            <span className={`text-sm font-normal ${getConnectionStatusColor()}`}>
              {connectionState}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-center">
            {!isConnected ? (
              <Button
                onClick={handleStart}
                disabled={isLoading || isConnecting}
                className="bg-career-accent hover:bg-career-accent-dark text-white"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Interview
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button onClick={handleStop} variant="destructive">
                  <Square className="w-4 h-4 mr-2" />
                  End Interview
                </Button>
                
                <Button onClick={toggleMic} variant={micEnabled ? "default" : "destructive"} size="sm">
                  {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>
                
                <Button onClick={toggleAudio} variant={audioEnabled ? "default" : "destructive"} size="sm">
                  {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
              </>
            )}
          </div>
          
          {isConnected && (
            <div className={`text-sm mt-3 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
              💡 Speak naturally - the AI will respond when you finish talking.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-scrolling Transcript */}
      <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
        <CardHeader className="pb-3">
          <CardTitle className={`text-lg ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
            Interview Transcript
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea ref={scrollAreaRef} className="h-80">
            <div className="space-y-3 pr-4">
              {transcript.length === 0 ? (
                <div className={`text-center py-8 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                  {isConnected ? "Transcript will appear here as you speak..." : "Start the interview to see the conversation transcript."}
                </div>
              ) : (
                transcript.map((entry, index) => (
                  <div
                    key={entry.id || index}
                    className={`p-3 rounded-lg ${
                      entry.speaker === 'user'
                        ? theme === 'dark'
                          ? 'bg-career-accent/20 ml-8'
                          : 'bg-career-accent/10 ml-8'
                        : theme === 'dark'
                          ? 'bg-career-gray-dark/20 mr-8'
                          : 'bg-career-gray-light/20 mr-8'
                    }`}
                  >
                    <div className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                      {entry.speaker === 'user' ? 'You' : 'AI Interviewer'}
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                      {entry.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleVoiceInterview;
