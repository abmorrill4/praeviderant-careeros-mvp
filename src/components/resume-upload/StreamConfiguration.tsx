
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Folder } from 'lucide-react';

interface StreamConfigurationProps {
  streamName: string;
  onStreamNameChange: (name: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  tagInput: string;
  onTagInputChange: (input: string) => void;
  disabled?: boolean;
}

export const StreamConfiguration: React.FC<StreamConfigurationProps> = ({
  streamName,
  onStreamNameChange,
  tags,
  onTagsChange,
  tagInput,
  onTagInputChange,
  disabled = false
}) => {
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      onTagsChange([...tags, tagInput.trim()]);
      onTagInputChange('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="streamName" className="flex items-center gap-2">
          <Folder className="w-4 h-4" />
          Resume Collection Name
        </Label>
        <Input
          id="streamName"
          value={streamName}
          onChange={(e) => onStreamNameChange(e.target.value)}
          placeholder="e.g., Software Engineer Resume"
          disabled={disabled}
          className="font-medium"
        />
        <p className="text-sm text-muted-foreground">
          Group related resume versions together in a collection
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (Optional)</Label>
        <div className="flex gap-2">
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => onTagInputChange(e.target.value)}
            placeholder="Add a tag (e.g., tech, finance, remote)"
            disabled={disabled}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddTag}
            disabled={!tagInput.trim() || disabled}
            className="px-3"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                {tag}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent ml-1"
                  onClick={() => handleRemoveTag(tag)}
                  disabled={disabled}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
        
        <p className="text-sm text-muted-foreground">
          Tags help organize and filter your resume collections
        </p>
      </div>
    </div>
  );
};
