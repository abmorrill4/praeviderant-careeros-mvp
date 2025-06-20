
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useFollowupFlags } from '@/hooks/useFollowupFlags';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Flag } from 'lucide-react';

interface FollowupButtonProps {
  sessionId: string | null;
  questionId: string;
  className?: string;
}

const FollowupButton = ({ sessionId, questionId, className }: FollowupButtonProps) => {
  const { theme } = useTheme();
  const { flagForFollowup, isLoading } = useFollowupFlags(sessionId);
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const handleSubmit = async () => {
    if (!reason.trim()) return;

    const result = await flagForFollowup(questionId, reason.trim(), priority);
    
    if (result) {
      setIsOpen(false);
      setReason('');
      setPriority('medium');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`${className} ${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-text-dark' : 'text-career-text-muted-light hover:text-career-text-light'}`}
        >
          <Flag className="w-4 h-4 mr-1" />
          Flag for Follow-up
        </Button>
      </DialogTrigger>
      
      <DialogContent className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-gray-dark/30' : 'bg-white border-career-gray-light/30'}`}>
        <DialogHeader>
          <DialogTitle className={theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}>
            Flag for Follow-up
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="reason" className={theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}>
              Reason for Follow-up
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why does this need a follow-up? (e.g., need more details, unclear answer, want specific examples)"
              className={`mt-1 ${theme === 'dark' ? 'bg-career-gray-dark/30 border-career-gray-dark/40' : 'bg-white border-career-gray-light/40'}`}
            />
          </div>
          
          <div>
            <Label htmlFor="priority" className={theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}>
              Priority Level
            </Label>
            <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}>
              <SelectTrigger className={`mt-1 ${theme === 'dark' ? 'bg-career-gray-dark/30 border-career-gray-dark/40' : 'bg-white border-career-gray-light/40'}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Nice to have</SelectItem>
                <SelectItem value="medium">Medium - Important</SelectItem>
                <SelectItem value="high">High - Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className={theme === 'dark' ? 'border-career-gray-dark/40' : 'border-career-gray-light/40'}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!reason.trim() || isLoading}
              className="bg-career-accent hover:bg-career-accent-dark text-white"
            >
              {isLoading ? 'Flagging...' : 'Flag for Follow-up'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FollowupButton;
