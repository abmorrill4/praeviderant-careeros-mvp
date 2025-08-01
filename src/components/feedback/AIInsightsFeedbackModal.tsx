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

        <div className="space-y-4">
          {/* Feedback Type Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Feedback Type
            </Label>
            <RadioGroup
              value={feedbackType}
              onValueChange={(value: 'correction' | 'context' | 'enhancement') => setFeedbackType(value)}
              className="flex gap-2"
            >
              {(['correction', 'context', 'enhancement'] as const).map((type) => {
                const info = getFeedbackTypeInfo(type);
                const Icon = info.icon;
                const isSelected = feedbackType === type;
                return (
                  <div 
                    key={type} 
                    className={`flex-1 p-2 rounded border ${
                      isSelected 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border bg-background'
                    }`}
                  >
                    <RadioGroupItem value={type} id={type} className="sr-only" />
                    <Label htmlFor={type} className="cursor-pointer block text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Icon className={`w-3 h-3 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`text-xs font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {info.title}
                        </span>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Current Insight Preview */}
          <div className="p-4 rounded border bg-muted/50">
            <h4 className="font-medium text-sm mb-2">Current Insight</h4>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {currentInsight}
            </div>
          </div>

          {/* Feedback Text */}
          <div>
            <Label htmlFor="feedback" className="text-sm font-medium mb-2 block">
              Your Feedback
            </Label>
            <Textarea
              id="feedback"
              placeholder={
                feedbackType === 'correction'
                  ? "Describe what's incorrect and provide accurate information..."
                  : feedbackType === 'context'
                  ? "Share additional context to improve this insight..."
                  : "Suggest enhancements or missing elements..."
              }
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Your feedback helps improve AI insights for everyone.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
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