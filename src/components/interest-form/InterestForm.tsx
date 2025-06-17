
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import FormField from "./FormField";
import { useEmailValidation } from "./useEmailValidation";
import { useInterestSubmission } from "./useInterestSubmission";
import { useDomainValues } from "./useDomainValues";

interface InterestFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const InterestForm = ({ isOpen, onClose }: InterestFormProps) => {
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

  const { theme } = useTheme();
  const { emailError, validateEmail, handleEmailBlur, clearEmailError } = useEmailValidation();
  const { isSubmitting, submitInterest } = useInterestSubmission();
  const { getDomainValuesByCategory } = useDomainValues(isOpen);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'email' && emailError) {
      clearEmailError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(formData.email)) {
      return;
    }

    await submitInterest(formData, () => {
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
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <FormField
          id="name"
          label="Name"
          type="text"
          value={formData.name}
          onChange={(value) => handleInputChange("name", value)}
          placeholder="Your full name"
          required
        />
        
        <FormField
          id="email"
          label="Email"
          type="email"
          value={formData.email}
          onChange={(value) => handleInputChange("email", value)}
          onBlur={() => handleEmailBlur(formData.email)}
          placeholder="your.email@company.com"
          required
          error={emailError}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <FormField
          id="title"
          label="Current Title"
          type="text"
          value={formData.title}
          onChange={(value) => handleInputChange("title", value)}
          placeholder="e.g., Product Manager"
        />
        
        <FormField
          id="status"
          label="Current Status"
          type="select"
          value={formData.status}
          onChange={(value) => handleInputChange("status", value)}
          placeholder="Select your current status"
          options={getDomainValuesByCategory('current_status').map(item => ({
            value: item.value,
            label: item.value
          }))}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <FormField
          id="industry"
          label="Industry"
          type="select"
          value={formData.industry}
          onChange={(value) => handleInputChange("industry", value)}
          placeholder="Select your industry"
          options={getDomainValuesByCategory('industry').map(item => ({
            value: item.value,
            label: item.value
          }))}
        />
        
        <FormField
          id="stage"
          label="Career Stage"
          type="select"
          value={formData.stage}
          onChange={(value) => handleInputChange("stage", value)}
          placeholder="Select your career stage"
          options={getDomainValuesByCategory('career_stage').map(item => ({
            value: item.value,
            label: item.value
          }))}
        />
      </div>

      <FormField
        id="challenge"
        label="Biggest Career Challenge"
        type="textarea"
        value={formData.challenge}
        onChange={(value) => handleInputChange("challenge", value)}
        placeholder="Tell us about your biggest career challenge or what you're hoping to achieve..."
      />

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="beta"
          checked={formData.beta}
          onChange={(e) => handleInputChange("beta", e.target.checked)}
          className="rounded border-gray-300 text-career-accent focus:ring-career-accent"
        />
        <label htmlFor="beta" className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} text-sm`}>
          I'm interested in beta testing new features
        </label>
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
          disabled={isSubmitting || !formData.name || !formData.email || !!emailError}
          className="flex-1 bg-career-accent hover:bg-career-accent-dark text-white font-semibold"
        >
          {isSubmitting ? "Registering..." : "Get Early Access"}
        </Button>
      </div>
    </form>
  );
};

export default InterestForm;
