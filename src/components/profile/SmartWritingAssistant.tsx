
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { useLLMProxy } from '@/hooks/useLLMProxy';
import { Wand2, CheckCircle, AlertTriangle, Target, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WritingFeedback {
  score: number;
  suggestions: string[];
  improvements: string[];
  strengthened_version?: string;
}

interface SmartWritingAssistantProps {
  initialText?: string;
  context: 'work_experience' | 'skill' | 'education' | 'general';
  onTextImproved?: (improvedText: string) => void;
}

export const SmartWritingAssistant: React.FC<SmartWritingAssistantProps> = ({
  initialText = '',
  context,
  onTextImproved
}) => {
  const { theme } = useTheme();
  const { sendComplexRequest, isLoading } = useLLMProxy();
  const { toast } = useToast();
  const [text, setText] = useState(initialText);
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);

  const contextPrompts = {
    work_experience: `
      Analyze this work experience description for resume best practices:
      - Use strong action verbs
      - Include quantified achievements
      - Focus on impact and results
      - Be specific and concise
      - Use past tense for previous roles
    `,
    skill: `
      Analyze this skill description for resume best practices:
      - Provide context for how the skill was used
      - Include proficiency level or years of experience
      - Connect to specific achievements or projects
      - Be relevant to target roles
    `,
    education: `
      Analyze this education description for resume best practices:
      - Include relevant coursework or projects
      - Mention academic achievements or honors
      - Connect education to career goals
      - Be concise but informative
    `,
    general: `
      Analyze this text for professional resume writing best practices:
      - Clear and concise language
      - Professional tone
      - Action-oriented descriptions
      - Specific and measurable details
    `
  };

  const analyzeText = async () => {
    if (!text.trim()) {
      toast({
        title: "No text to analyze",
        description: "Please enter some text to get feedback",
        variant: "destructive",
      });
      return;
    }

    try {
      const systemPrompt = `You are a professional resume writing expert. ${contextPrompts[context]}

Provide feedback in this JSON format:
{
  "score": number (0-100),
  "suggestions": ["specific improvement suggestion 1", "suggestion 2"],
  "improvements": ["what this text does well 1", "strength 2"],
  "strengthened_version": "improved version of the text following best practices"
}

Focus on actionable, specific feedback that helps create compelling resume content.`;

      const response = await sendComplexRequest(
        `Please analyze this text and provide improvement suggestions:\n\n"${text}"`,
        systemPrompt
      );

      const feedbackData = JSON.parse(response.response);
      setFeedback(feedbackData);

    } catch (error) {
      console.error('Error analyzing text:', error);
      toast({
        title: "Analysis failed",
        description: "Could not analyze the text. Please try again.",
        variant: "destructive",
      });
    }
  };

  const applyImprovedVersion = () => {
    if (feedback?.strengthened_version) {
      setText(feedback.strengthened_version);
      onTextImproved?.(feedback.strengthened_version);
      toast({
        title: "Text improved",
        description: "Applied the AI-suggested improvements to your text",
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (score >= 60) return <Target className="w-4 h-4 text-yellow-600" />;
    return <AlertTriangle className="w-4 h-4 text-red-600" />;
  };

  return (
    <Card className="bg-career-panel-light border-career-text-light/20">
      <CardHeader>
        <CardTitle className="text-lg text-career-text-light flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          Smart Writing Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-career-text-light block mb-2">
            Your Text
          </label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Enter your ${context.replace('_', ' ')} description here...`}
            rows={4}
            className="bg-white border-career-gray-light text-career-text-light"
          />
        </div>

        <Button
          onClick={analyzeText}
          disabled={isLoading || !text.trim()}
          className="w-full bg-career-accent hover:bg-career-accent-dark text-white"
        >
          {isLoading ? (
            <>
              <Wand2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Analyze & Improve
            </>
          )}
        </Button>

        {feedback && (
          <div className="space-y-4 mt-6">
            {/* Score */}
            <div className="p-4 rounded-lg border border-career-gray-light bg-career-background-light/50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-career-text-light">
                  Writing Score
                </span>
                <div className="flex items-center gap-2">
                  {getScoreIcon(feedback.score)}
                  <span className={`font-bold ${getScoreColor(feedback.score)}`}>
                    {feedback.score}/100
                  </span>
                </div>
              </div>
            </div>

            {/* Strengths */}
            {feedback.improvements.length > 0 && (
              <div>
                <h4 className="font-medium text-career-text-light mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  What's Working Well
                </h4>
                <div className="space-y-1">
                  {feedback.improvements.map((improvement, index) => (
                    <div key={index} className="text-sm p-2 rounded bg-green-50 text-green-700">
                      {improvement}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {feedback.suggestions.length > 0 && (
              <div>
                <h4 className="font-medium text-career-text-light mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-600" />
                  Suggestions for Improvement
                </h4>
                <div className="space-y-1">
                  {feedback.suggestions.map((suggestion, index) => (
                    <div key={index} className="text-sm p-2 rounded bg-yellow-50 text-yellow-700">
                      {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improved Version */}
            {feedback.strengthened_version && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-career-text-light flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-blue-600" />
                    AI-Improved Version
                  </h4>
                  <Button
                    onClick={applyImprovedVersion}
                    size="sm"
                    variant="outline"
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    Apply This Version
                  </Button>
                </div>
                <div className="p-3 rounded-lg border border-blue-300 bg-blue-50">
                  <p className="text-sm text-career-text-light">
                    {feedback.strengthened_version}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
