
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, CheckCircle, Brain } from "lucide-react";
import { AudioRecorder } from "./AudioRecorder";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface InterviewType {
  id: string;
  name: string;
  title: string;
  description: string;
  prompt_template: string;
}

interface InterviewCardProps {
  type: InterviewType;
  isRecording: boolean;
  isProcessing: boolean;
  onComplete: (extractedData: any) => void;
  theme: 'light' | 'dark';
}

export const InterviewCard = ({ type, isRecording, isProcessing, onComplete, theme }: InterviewCardProps) => {
  const [notes, setNotes] = useState("");
  const [transcript, setTranscript] = useState("");
  const [currentlyRecording, setCurrentlyRecording] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const { toast } = useToast();

  const handleTranscriptUpdate = (newTranscript: string) => {
    setTranscript(prev => prev + (prev ? ' ' : '') + newTranscript);
  };

  const handleExtractContext = async () => {
    if (!transcript.trim()) {
      toast({
        title: "No Content",
        description: "Please record some audio or add notes before completing the section.",
        variant: "destructive",
      });
      return;
    }

    setExtracting(true);
    try {
      console.log('Extracting context for:', type.name);
      
      const { data, error } = await supabase.functions.invoke('extract-context', {
        body: {
          transcript: transcript + (notes ? `\n\nAdditional Notes: ${notes}` : ''),
          interviewType: type.name,
          promptTemplate: type.prompt_template
        }
      });

      if (error) {
        throw error;
      }

      console.log('Context extraction complete:', data);
      
      onComplete({
        [type.name]: {
          ...data.extractedContext,
          notes: notes,
          fullTranscript: transcript
        }
      });

      toast({
        title: "Section Complete",
        description: "Context has been extracted and saved successfully.",
      });

    } catch (error) {
      console.error('Error extracting context:', error);
      toast({
        title: "Extraction Error",
        description: "Failed to extract context. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExtracting(false);
    }
  };

  return (
    <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
      <CardHeader>
        <CardTitle className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} flex items-center space-x-2`}>
          {currentlyRecording ? (
            <Mic className="w-5 h-5 text-red-500 animate-pulse" />
          ) : (
            <MicOff className="w-5 h-5 text-gray-400" />
          )}
          <span>{type.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-career-gray-dark/20' : 'bg-career-gray-light/20'}`}>
          <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} font-medium mb-2`}>
            Interview Prompt:
          </p>
          <p className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
            {type.prompt_template}
          </p>
        </div>

        {/* Audio Recorder */}
        <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-blue-900/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center space-x-2 mb-3">
            <Mic className={`w-4 h-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
              Voice Recording
            </span>
          </div>
          <AudioRecorder
            onTranscriptUpdate={handleTranscriptUpdate}
            onRecordingStateChange={setCurrentlyRecording}
            theme={theme}
          />
        </div>

        {/* Live Transcript */}
        {transcript && (
          <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-green-900/10 border-green-500/20' : 'bg-green-50 border-green-200'}`}>
            <p className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
              Live Transcript:
            </p>
            <p className={`text-sm ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              {transcript}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label className={`text-sm font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
            Additional Notes (Optional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes or details you'd like to include..."
            className={`${theme === 'dark' ? 'bg-career-gray-dark/20 border-career-text-dark/20 text-career-text-dark' : 'bg-white border-career-text-light/20 text-career-text-light'}`}
            rows={3}
          />
        </div>

        <Button 
          onClick={handleExtractContext}
          disabled={currentlyRecording || extracting || (!transcript.trim() && !notes.trim())}
          className="w-full bg-career-accent hover:bg-career-accent-dark text-white"
        >
          {extracting ? (
            <>
              <Brain className="w-4 h-4 mr-2 animate-pulse" />
              Extracting Context...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Section
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
