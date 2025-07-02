import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { AIInsightsFeedbackModal } from './AIInsightsFeedbackModal';

interface AIInsightsFeedbackButtonProps {
  insightType: 'career_enrichment' | 'career_narrative' | 'entry_enrichment';
  insightId: string;
  currentInsight: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'default';
  className?: string;
}

export const AIInsightsFeedbackButton: React.FC<AIInsightsFeedbackButtonProps> = ({
  insightType,
  insightId,
  currentInsight,
  variant = 'ghost',
  size = 'sm',
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-2 ${className}`}
      >
        <MessageSquare className="w-4 h-4" />
        Improve
      </Button>

      <AIInsightsFeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        insightType={insightType}
        insightId={insightId}
        currentInsight={currentInsight}
      />
    </>
  );
};