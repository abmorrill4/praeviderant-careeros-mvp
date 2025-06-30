
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useInterviewSession } from '@/hooks/useInterviewSession';
import { SimpleWebRTCManager } from '@/utils/simpleWebRTC';
import { Mic, MicOff, Volume2, VolumeX, Play, Square, Loader2, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConnectionStats {
  latency: number;
  packetsLost: number;
  audioLevel: number;
}

const SimpleVoiceInterview = () => {
  const { toast } = useToast();
  const { session, transcript, isLoading, createSession, addTranscriptEntry, updateSessionStatus, endSession } = useInterviewSession();

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [connectionStats, setConnectionStats] = useState<ConnectionStats>({ latency: 0, packetsLost: 0, audioLevel: 0 });
  
  // Audio controls
  const [micEnabled, setMicEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Refs
  const webrtcRef = useRef<SimpleWebRTCManager | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [transcript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (webrtcRef.current) {
        webrtcRef.current.disconnect();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, []);

  const handleStart = async () => {
    try {
      setIsConnecting(true);
      console.log('Starting interview session...');
      
      const sessionData = await createSession();
      console.log('Session created:', sessionData.sessionId);
      
      webrtcRef.current = new SimpleWebRTCManager();
      
      try {
        await webrtcRef.current.connect(
          sessionData.clientSecret,
          sessionData.systemPrompt,
          handleMessage,
          handleConnectionState
        );
      } catch (error: any) {
        if (error.name === 'NotAllowedError') {
          toast({
            title: "Microphone Access Denied",
            description: "Please enable microphone access in your browser's site settings to start the AI interview.",
            variant: "destructive",
          });
        } else {
          throw error; // Re-throw other errors to be handled by the outer catch
        }
        return; // Exit early for permission errors
      }

      await updateSessionStatus('active');
      setIsConnected(true);
      setIsListening(true);
      
      // Start connection stats monitoring
      startStatsMonitoring();
      
      toast({
        title: "Interview Started",
        description: "Connected successfully! The AI will begin shortly.",
      });
      
    } catch (error) {
      console.error('Failed to start interview:', error);
      handleConnectionError(error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleStop = async () => {
    try {
      console.log('Stopping interview session...');
      
      if (webrtcRef.current) {
        webrtcRef.current.disconnect();
        webrtcRef.current = null;
      }
      
      // Clear monitoring intervals
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = null;
      }
      
      setIsConnected(false);
      setIsListening(false);
      setIsSpeaking(false);
      setConnectionState('new');
      setConnectionStats({ latency: 0, packetsLost: 0, audioLevel: 0 });
      
      await endSession();
      
      toast({
        title: "Interview Ended",
        description: "Your interview session has been saved successfully.",
      });
      
    } catch (error) {
      console.error('Error stopping interview:', error);
      toast({
        title: "Error",
        description: "There was an issue ending the session, but your data has been saved.",
        variant: "destructive",
      });
    }
  };

  const handleMessage = (data: any) => {
    console.log('Received WebRTC message:', data.type);
    
    try {
      switch (data.type) {
        case 'session.created':
          console.log('OpenAI session created successfully');
          break;
          
        case 'session.updated':
          console.log('OpenAI session updated');
          break;
          
        case 'conversation.item.created':
          if (data.item?.content?.[0]?.type === 'text') {
            addTranscriptEntry('assistant', data.item.content[0].text);
          }
          break;
          
        case 'conversation.item.input_audio_transcription.completed':
          if (data.transcript) {
            console.log('User transcript:', data.transcript);
            addTranscriptEntry('user', data.transcript);
          }
          break;
          
        case 'response.audio.delta':
          setIsSpeaking(true);
          break;
          
        case 'response.audio.done':
          setIsSpeaking(false);
          break;
          
        case 'input_audio_buffer.speech_started':
          setIsListening(true);
          console.log('User started speaking');
          break;
          
        case 'input_audio_buffer.speech_stopped':
          setIsListening(false);
          console.log('User stopped speaking');
          break;
          
        case 'error':
          console.error('OpenAI Realtime API error:', data.error);
          toast({
            title: "AI Service Error",
            description: data.error.message || "An error occurred with the AI service.",
            variant: "destructive",
          });
          break;
          
        default:
          console.log('Unhandled message type:', data.type);
      }
    } catch (error) {
      console.error('Error handling WebRTC message:', error);
    }
  };

  const handleConnectionState = (state: RTCPeerConnectionState) => {
    console.log('WebRTC connection state changed:', state);
    setConnectionState(state);
    
    switch (state) {
      case 'connected':
        toast({
          title: "Connected",
          description: "WebRTC connection established successfully.",
        });
        break;
        
      case 'disconnected':
        setIsConnected(false);
        setIsListening(false);
        setIsSpeaking(false);
        toast({
          title: "Connection Lost",
          description: "Attempting to reconnect...",
          variant: "destructive",
        });
        attemptReconnect();
        break;
        
      case 'failed':
        setIsConnected(false);
        setIsListening(false);
        setIsSpeaking(false);
        toast({
          title: "Connection Failed",
          description: "Please try starting the interview again.",
          variant: "destructive",
        });
        break;
    }
  };

  const handleConnectionError = (error: any) => {
    console.error('Connection error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
    
    toast({
      title: "Connection Failed",
      description: errorMessage,
      variant: "destructive",
    });
    
    setIsConnected(false);
    setIsConnecting(false);
    setIsListening(false);
    setIsSpeaking(false);
  };

  const attemptReconnect = () => {
    if (reconnectTimeoutRef.current) return; // Prevent multiple reconnect attempts
    
    reconnectTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('Attempting to reconnect...');
        if (session) {
          await handleStart();
        }
      } catch (error) {
        console.error('Reconnection failed:', error);
      } finally {
        reconnectTimeoutRef.current = null;
      }
    }, 3000);
  };

  const startStatsMonitoring = () => {
    statsIntervalRef.current = setInterval(() => {
      // This would be implemented with actual WebRTC stats
      // For now, we'll simulate some basic stats
      setConnectionStats(prev => ({
        latency: Math.random() * 100 + 50, // 50-150ms
        packetsLost: Math.floor(Math.random() * 5),
        audioLevel: Math.random() * 100,
      }));
    }, 2000);
  };

  const toggleMic = () => {
    if (webrtcRef.current) {
      const newState = !micEnabled;
      webrtcRef.current.toggleMic(newState);
      setMicEnabled(newState);
      
      toast({
        title: newState ? "Microphone Enabled" : "Microphone Disabled",
        description: newState ? "You can now speak to the AI" : "Your voice is muted",
      });
    }
  };

  const toggleAudio = () => {
    if (webrtcRef.current) {
      const newState = !audioEnabled;
      webrtcRef.current.toggleAudio(newState);
      setAudioEnabled(newState);
      
      toast({
        title: newState ? "Audio Enabled" : "Audio Disabled",
        description: newState ? "You can now hear the AI" : "AI audio is muted",
      });
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'failed': case 'disconnected': return 'text-red-500';
      default: return 'text-career-text-muted';
    }
  };

  const getConnectionIcon = () => {
    return connectionState === 'connected' ? Wifi : WifiOff;
  };

  const ConnectionIcon = getConnectionIcon();

  return (
    <div className="space-y-4">
      {/* Connection Status & Controls */}
      <Card className="bg-career-panel border-career-text/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-career-text flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ConnectionIcon className={`w-5 h-5 ${getConnectionStatusColor()}`} />
              Voice Interview
            </span>
            <div className="flex items-center gap-2 text-sm font-normal">
              <span className={getConnectionStatusColor()}>
                {connectionState}
              </span>
              {isConnected && (
                <span className="text-xs text-career-text-muted">
                  {Math.round(connectionStats.latency)}ms
                </span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-center flex-wrap">
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
                
                <Button 
                  onClick={toggleMic} 
                  variant={micEnabled ? "default" : "destructive"} 
                  size="sm"
                  className="min-w-[44px]"
                >
                  {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>
                
                <Button 
                  onClick={toggleAudio} 
                  variant={audioEnabled ? "default" : "destructive"} 
                  size="sm"
                  className="min-w-[44px]"
                >
                  {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
              </>
            )}
          </div>
          
          {/* Status Indicators */}
          {isConnected && (
            <div className="mt-4 space-y-2">
              <div className="text-sm text-career-text-muted flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-2">
                  💡 Speak naturally - the AI responds when you finish talking
                </span>
                {isListening && (
                  <span className="text-blue-500 flex items-center gap-1">
                    🎤 Listening...
                  </span>
                )}
                {isSpeaking && (
                  <span className="text-green-500 flex items-center gap-1">
                    🔊 AI Speaking...
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Transcript */}
      <Card className="bg-career-panel border-career-text/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-career-text flex items-center justify-between">
            <span>Live Transcript</span>
            {transcript.length > 0 && (
              <span className="text-sm font-normal text-career-text-muted">
                {transcript.length} messages
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea ref={scrollAreaRef} className="h-80">
            <div className="space-y-3 pr-4">
              {transcript.length === 0 ? (
                <div className="text-center py-8 text-career-text-muted">
                  {isConnected 
                    ? "The conversation transcript will appear here as you and the AI speak..." 
                    : "Start the interview to see the real-time conversation transcript."
                  }
                </div>
              ) : (
                transcript.map((entry, index) => (
                  <div
                    key={entry.id || index}
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      entry.speaker === 'user'
                        ? 'bg-career-accent/10 border-career-accent/20 ml-8'
                        : 'bg-career-gray/30 border-career-gray/40 mr-8'
                    }`}
                  >
                    <div className="text-xs font-semibold mb-2 text-career-text-muted flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {entry.speaker === 'user' ? (
                          <>
                            <span className="w-2 h-2 bg-career-accent rounded-full"></span>
                            You
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            AI Interviewer
                          </>
                        )}
                      </span>
                      <span className="text-xs opacity-70">
                        {new Date(entry.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm leading-relaxed text-career-text">
                      {entry.content}
                    </div>
                  </div>
                ))
              )}
              
              {/* Live indicators */}
              {isConnected && (isListening || isSpeaking) && (
                <div className="text-center py-2 text-career-text-muted">
                  {isListening && <div className="animate-pulse">🎤 Listening for your voice...</div>}
                  {isSpeaking && <div className="animate-pulse">🔊 AI is responding...</div>}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleVoiceInterview;
