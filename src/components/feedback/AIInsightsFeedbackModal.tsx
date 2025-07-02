import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, AlertCircle, Plus } from 'lucide-react';

interface AIInsightsFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  insightType: 'career_enrichment' | 'career_narrative' | 'entry_enrichment';
  insightId: string;
  currentInsight: string;
}

export const AIInsightsFeedbackModal: React.FC<AIInsightsFeedbackModalProps> = ({
  isOpen,
  onClose,
  insightType,
  insightId,
  currentInsight
}) => {
  const [feedbackType, setFeedbackType] = useState<'correction' | 'context' | 'enhancement'>('context');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!feedbackText.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('ai_insights_feedback')
        .insert({
          user_id: user.id,
          insight_type: insightType,
          insight_id: insightId,
          feedback_type: feedbackType,
          feedback_text: feedbackText.trim(),
          user_context: {
            original_insight: currentInsight,
            timestamp: new Date().toISOString()
          }
        });

      if (error) throw error;

      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! We'll use it to improve future insights.",
      });

      // Reset form and close modal
      setFeedbackText('');
      setFeedbackType('context');
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFeedbackTypeInfo = (type: string) => {
    switch (type) {
      case 'correction':
        return {
          icon: AlertCircle,
          title: 'Correction',
          description: 'Report inaccurate information'
        };
      case 'context':
        return {
          icon: MessageSquare,
          title: 'Add Context',
          description: 'Provide additional background information'
        };
      case 'enhancement':
        return {
          icon: Plus,
          title: 'Enhancement',
          description: 'Suggest improvements or additions'
        };
      default:
        return { icon: MessageSquare, title: 'Feedback', description: '' };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Improve AI Insights
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Insight Preview */}
          <div className="neo-card-subtle p-4">
            <h4 className="font-medium neo-text mb-2">Current Insight</h4>
            <p className="text-sm neo-text-muted line-clamp-3">
              {currentInsight}
            </p>
          </div>

          {/* Feedback Type Selection */}
          <div>
            <Label className="text-base font-medium">What type of feedback are you providing?</Label>
            <RadioGroup
              value={feedbackType}
              onValueChange={(value: 'correction' | 'context' | 'enhancement') => setFeedbackType(value)}
              className="mt-3"
            >
              {(['correction', 'context', 'enhancement'] as const).map((type) => {
                const info = getFeedbackTypeInfo(type);
                const Icon = info.icon;
                return (
                  <div key={type} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                    <RadioGroupItem value={type} id={type} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={type} className="flex items-center gap-2 font-medium cursor-pointer">
                        <Icon className="w-4 h-4" />
                        {info.title}
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">{info.description}</p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Feedback Text */}
          <div>
            <Label htmlFor="feedback" className="text-base font-medium">
              Your Feedback
            </Label>
            <Textarea
              id="feedback"
              placeholder={
                feedbackType === 'correction'
                  ? "Please describe what's incorrect and provide the accurate information..."
                  : feedbackType === 'context'
                  ? "Share additional context that could help improve this insight..."
                  : "Suggest how this insight could be enhanced or what's missing..."
              }
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="mt-2 min-h-[120px]"
            />
            <p className="text-xs text-gray-500 mt-2">
              Your feedback helps our AI learn and provide better insights for you and other users.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!feedbackText.trim() || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};