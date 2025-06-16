
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InterestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InterestModal = ({ isOpen, onClose }: InterestModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    title: "",
    status: "",
    industry: "",
    challenge: "",
    stage: "",
    beta: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { theme } = useTheme();

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('user_interest')
        .insert([formData]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Email already registered",
            description: "This email has already been registered for early access.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Interest registered!",
          description: "Thanks for your detailed information. We'll be in touch soon with early access.",
        });
        setFormData({
          name: "",
          email: "",
          title: "",
          status: "",
          industry: "",
          challenge: "",
          stage: "",
          beta: false,
        });
        onClose();
      }
    } catch (error) {
      console.error('Error registering interest:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${theme === 'dark' ? 'bg-career-panel-dark border-career-gray-dark' : 'bg-career-panel-light border-career-gray-light'}`}>
        <DialogHeader>
          <DialogTitle className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
            Join CareerOS Early Access
          </DialogTitle>
          <DialogDescription className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
            Help us build the perfect career intelligence platform for you. Share your details below to get priority access and influence our development roadmap.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} text-sm font-medium mb-1 block`}>
                Name *
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Your full name"
                className={`neumorphic-input ${theme} ${theme === 'dark' ? 'text-career-text-dark placeholder:text-career-text-muted-dark' : 'text-career-text-light placeholder:text-career-text-muted-light'}`}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email" className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} text-sm font-medium mb-1 block`}>
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="your.email@company.com"
                className={`neumorphic-input ${theme} ${theme === 'dark' ? 'text-career-text-dark placeholder:text-career-text-muted-dark' : 'text-career-text-light placeholder:text-career-text-muted-light'}`}
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title" className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} text-sm font-medium mb-1 block`}>
                Current Title
              </Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., Product Manager"
                className={`neumorphic-input ${theme} ${theme === 'dark' ? 'text-career-text-dark placeholder:text-career-text-muted-dark' : 'text-career-text-light placeholder:text-career-text-muted-light'}`}
              />
            </div>
            
            <div>
              <Label htmlFor="status" className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} text-sm font-medium mb-1 block`}>
                Current Status
              </Label>
              <Input
                id="status"
                type="text"
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                placeholder="e.g., Actively job searching"
                className={`neumorphic-input ${theme} ${theme === 'dark' ? 'text-career-text-dark placeholder:text-career-text-muted-dark' : 'text-career-text-light placeholder:text-career-text-muted-light'}`}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="industry" className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} text-sm font-medium mb-1 block`}>
                Industry
              </Label>
              <Input
                id="industry"
                type="text"
                value={formData.industry}
                onChange={(e) => handleInputChange("industry", e.target.value)}
                placeholder="e.g., Technology, Finance"
                className={`neumorphic-input ${theme} ${theme === 'dark' ? 'text-career-text-dark placeholder:text-career-text-muted-dark' : 'text-career-text-light placeholder:text-career-text-muted-light'}`}
              />
            </div>
            
            <div>
              <Label htmlFor="stage" className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} text-sm font-medium mb-1 block`}>
                Career Stage
              </Label>
              <Input
                id="stage"
                type="text"
                value={formData.stage}
                onChange={(e) => handleInputChange("stage", e.target.value)}
                placeholder="e.g., Mid-career, Entry-level"
                className={`neumorphic-input ${theme} ${theme === 'dark' ? 'text-career-text-dark placeholder:text-career-text-muted-dark' : 'text-career-text-light placeholder:text-career-text-muted-light'}`}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="challenge" className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} text-sm font-medium mb-1 block`}>
              Biggest Career Challenge
            </Label>
            <Textarea
              id="challenge"
              value={formData.challenge}
              onChange={(e) => handleInputChange("challenge", e.target.value)}
              placeholder="Tell us about your biggest career challenge or what you're hoping to achieve..."
              className={`neumorphic-input ${theme} ${theme === 'dark' ? 'text-career-text-dark placeholder:text-career-text-muted-dark' : 'text-career-text-light placeholder:text-career-text-muted-light'} min-h-[80px]`}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="beta"
              checked={formData.beta}
              onChange={(e) => handleInputChange("beta", e.target.checked)}
              className="rounded border-gray-300 text-career-accent focus:ring-career-accent"
            />
            <Label htmlFor="beta" className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} text-sm`}>
              I'm interested in beta testing new features
            </Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className={`flex-1 ${theme === 'dark' ? 'border-career-gray-dark text-career-text-dark hover:bg-career-gray-dark' : 'border-career-gray-light text-career-text-light hover:bg-career-gray-light'}`}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name || !formData.email}
              className="flex-1 bg-career-accent hover:bg-career-accent-dark text-white font-semibold"
            >
              {isSubmitting ? "Registering..." : "Get Early Access"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InterestModal;
