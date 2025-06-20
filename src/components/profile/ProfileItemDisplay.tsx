
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from '@/contexts/ThemeContext';
import { Check, Edit } from 'lucide-react';
import type { VersionedEntity } from '@/types/versioned-entities';

interface ProfileItemDisplayProps<T extends VersionedEntity> {
  item: T;
  onAccept: (item: VersionedEntity) => void;
  onEdit: (item: T) => void;
  renderItem: (item: T) => React.ReactNode;
}

export const ProfileItemDisplay = <T extends VersionedEntity>({
  item,
  onAccept,
  onEdit,
  renderItem
}: ProfileItemDisplayProps<T>) => {
  const { theme } = useTheme();

  const isPendingAIExtraction = (item: VersionedEntity) => 
    item.source === 'AI_EXTRACTION' && !item.is_active;

  const handleEditClick = () => {
    onEdit(item);
  };

  return (
    <div
      className={`p-3 rounded-lg border transition-all ${
        isPendingAIExtraction(item)
          ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
          : theme === 'dark'
          ? 'border-career-text-dark/10 bg-career-background-dark/50'
          : 'border-career-text-light/10 bg-career-background-light/50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {renderItem(item)}
          <div className="flex items-center gap-2 mt-2">
            <Badge 
              variant={item.is_active ? "default" : "secondary"}
              className="text-xs"
            >
              {item.is_active ? 'Active' : 'Pending'}
            </Badge>
            {item.source && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs cursor-help">
                    {item.source}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Source: {item.source}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {item.source_confidence && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs cursor-help">
                    {Math.round(item.source_confidence * 100)}% confidence
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>AI Confidence: {Math.round(item.source_confidence * 100)}%</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 flex-shrink-0">
          {isPendingAIExtraction(item) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAccept(item)}
              className="text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              <Check className="w-3 h-3 mr-1" />
              Accept
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleEditClick}
            className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
};
