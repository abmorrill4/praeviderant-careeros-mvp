
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, CheckCircle } from "lucide-react";

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
  onComplete: () => void;
  theme: 'light' | 'dark';
}

export const InterviewCard = ({ type, isRecording, isProcessing, onComplete, theme }: InterviewCardProps) => {
  const [notes, setNotes] = useState("");

  return (
    <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
      <CardHeader>
        <CardTitle className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} flex items-center space-x-2`}>
          {isRecording ? (
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

        {isRecording && (
          <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-red-900/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                Recording in progress...
              </span>
            </div>
            <p className={`text-xs ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
              Speak naturally and take your time. The AI is listening and will extract key information.
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
          onClick={onComplete}
          disabled={!isRecording || isProcessing}
          className="w-full bg-career-accent hover:bg-career-accent-dark text-white"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Processing...
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
