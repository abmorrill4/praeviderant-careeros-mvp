
import { useTheme } from "@/contexts/ThemeContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import InterestForm from "./interest-form/InterestForm";

interface InterestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InterestModal = ({ isOpen, onClose }: InterestModalProps) => {
  const { theme } = useTheme();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${theme === 'dark' ? 'bg-career-panel-dark border-career-gray-dark' : 'bg-career-panel-light border-career-gray-light'}`}>
        <DialogHeader>
          <DialogTitle className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
            Join Praeviderant Early Access
          </DialogTitle>
          <DialogDescription className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
            Help us build the perfect career intelligence platform for you. Share your details below to get priority access and influence our development roadmap.
          </DialogDescription>
        </DialogHeader>

        <InterestForm isOpen={isOpen} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default InterestModal;
