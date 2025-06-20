
import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AudioRecorder, encodeAudioForAPI, AudioQueue } from '@/utils/realtimeAudio';

interface RealtimeMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface UseRealtimeSpeechProps {
  sessionId: string | null;
}

export const useRealtimeSpeech = ({ sessionId }: UseRealtimeSpeechProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const connect = useCallback(async () => {
    if (!sessionId || isConnecting) return;

    setIsConnecting(true);
    
    try {
      // Initialize audio context and queue
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      audioQueueRef.current = new AudioQueue(audioContextRef.current);

      // Connect to WebSocket
      const wsUrl = `wss://deofbwuazrvpocyybjpl.functions.supabase.co/realtime-speech`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
      };

      wsRef.current.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message:', data.type);

          switch (data.type) {
            case 'connection.ready':
              setIsConnected(true);
              setIsConnecting(false);
              toast({
                title: "Connected",
                description: "Real-time voice chat is ready",
              });
              break;

            case 'session.created':
              console.log('Session created');
              break;

            case 'response.audio.delta':
              if (data.delta && audioQueueRef.current) {
                const binaryString = atob(data.delta);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                await audioQueueRef.current.addToQueue(bytes);
                setIsSpeaking(true);
              }
              break;

            case 'response.audio.done':
              setIsSpeaking(false);
              break;

            case 'response.audio_transcript.delta':
              if (data.delta) {
                setCurrentTranscript(prev => prev + data.delta);
              }
              break;

            case 'response.audio_transcript.done':
              if (data.transcript) {
                const newMessage: RealtimeMessage = {
                  id: `ai-${Date.now()}`,
                  type: 'assistant',
                  content: data.transcript,
                  timestamp: new Date().toISOString(),
                };
                setMessages(prev => [...prev, newMessage]);
                setCurrentTranscript('');
              }
              break;

            case 'conversation.item.input_audio_transcription.completed':
              if (data.transcript) {
                const newMessage: RealtimeMessage = {
                  id: `user-${Date.now()}`,
                  type: 'user',
                  content: data.transcript,
                  timestamp: new Date().toISOString(),
                };
                setMessages(prev => [...prev, newMessage]);
              }
              break;

            case 'response.created':
              console.log('Response created');
              break;

            case 'error':
              console.error('OpenAI error:', data.error);
              toast({
                title: "Error",
                description: data.error.message || "An error occurred",
                variant: "destructive",
              });
              break;
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setIsConnecting(false);
        setIsRecording(false);
        setIsSpeaking(false);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnecting(false);
        toast({
          title: "Connection Error",
          description: "Failed to connect to voice service",
          variant: "destructive",
        });
      };

    } catch (error) {
      console.error('Error connecting:', error);
      setIsConnecting(false);
      toast({
        title: "Error",
        description: "Failed to initialize voice connection",
        variant: "destructive",
      });
    }
  }, [sessionId, isConnecting, toast]);

  const startRecording = useCallback(async () => {
    if (!isConnected || isRecording) return;

    try {
      recorderRef.current = new AudioRecorder((audioData) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const encodedAudio = encodeAudioForAPI(audioData);
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encodedAudio
          }));
        }
      });

      await recorderRef.current.start();
      setIsRecording(true);
      console.log('Started recording');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  }, [isConnected, isRecording, toast]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
      setIsRecording(false);
      console.log('Stopped recording');

      // Commit the audio buffer
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'input_audio_buffer.commit'
        }));
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    audioQueueRef.current = null;
    setIsConnected(false);
    setIsRecording(false);
    setIsSpeaking(false);
    setMessages([]);
    setCurrentTranscript('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    isRecording,
    isSpeaking,
    messages,
    currentTranscript,
    connect,
    startRecording,
    stopRecording,
    disconnect,
  };
};
