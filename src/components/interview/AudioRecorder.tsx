
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AudioRecorderProps {
  onTranscriptUpdate: (transcript: string) => void;
  onRecordingStateChange: (isRecording: boolean) => void;
  theme: 'light' | 'dark';
}

export const AudioRecorder = ({ onTranscriptUpdate, onRecordingStateChange, theme }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await processAudio(audioBlob);
        } catch (error) {
          console.error('Error processing audio:', error);
          toast({
            title: "Processing Error",
            description: "Failed to process audio. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      onRecordingStateChange(true);
      
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Failed to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [onRecordingStateChange, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      onRecordingStateChange(false);
      console.log('Recording stopped');
    }
  }, [isRecording, onRecordingStateChange]);

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64Audio = btoa(String.fromCharCode(...uint8Array));

      console.log('Sending audio for transcription...');

      // Send to Supabase Edge Function for transcription
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64Audio }
      });

      if (error) {
        throw error;
      }

      if (data?.text) {
        console.log('Transcription received:', data.text);
        onTranscriptUpdate(data.text);
        
        toast({
          title: "Transcription Complete",
          description: "Audio has been transcribed successfully.",
        });
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      throw error;
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex space-x-4">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            disabled={isProcessing}
            className="bg-career-accent hover:bg-career-accent-dark text-white"
          >
            <Mic className="w-4 h-4 mr-2" />
            Start Recording
          </Button>
        ) : (
          <Button
            onClick={stopRecording}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop Recording
          </Button>
        )}
      </div>

      {isProcessing && (
        <div className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-career-accent border-t-transparent rounded-full animate-spin" />
            <span>Processing audio...</span>
          </div>
        </div>
      )}

      {isRecording && (
        <div className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'} flex items-center space-x-2`}>
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span>Recording in progress...</span>
        </div>
      )}
    </div>
  );
};
