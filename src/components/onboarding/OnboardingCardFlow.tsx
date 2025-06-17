
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { onboardingSteps } from "./onboardingConfig";
import { OnboardingData, OnboardingStep } from "./types";

interface OnboardingCardFlowProps {
  onComplete: (data: OnboardingData) => void;
}

const OnboardingCardFlow = ({ onComplete }: OnboardingCardFlowProps) => {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<OnboardingData>({});

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(responses);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSingleSelect = (stepId: string, value: string) => {
    setResponses(prev => ({ ...prev, [stepId]: value }));
  };

  const handleMultiSelect = (stepId: string, value: string) => {
    setResponses(prev => {
      const current = (prev[stepId] as string[]) || [];
      const isSelected = current.includes(value);
      
      if (isSelected) {
        return { ...prev, [stepId]: current.filter(item => item !== value) };
      } else {
        return { ...prev, [stepId]: [...current, value] };
      }
    });
  };

  const step = onboardingSteps[currentStep];
  const isValid = responses[step.id] && (
    step.type === 'single-select' 
      ? responses[step.id] 
      : Array.isArray(responses[step.id]) && (responses[step.id] as string[]).length > 0
  );

  const isOptionSelected = (stepId: string, optionId: string) => {
    if (step.type === 'single-select') {
      return responses[stepId] === optionId;
    } else {
      return (responses[stepId] as string[] || []).includes(optionId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex justify-center">
        <div className="flex space-x-2">
          {onboardingSteps.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                index === currentStep
                  ? 'bg-career-accent'
                  : index < currentStep
                  ? 'bg-career-accent/60'
                  : theme === 'dark'
                  ? 'bg-career-gray-dark'
                  : 'bg-career-gray-light'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="text-center mb-6">
        <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
          {step.title}
        </h3>
        <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
          {step.type === 'multi-select' ? 'Select all that apply:' : 'Choose one option:'}
        </p>
      </div>

      {/* Options as cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {step.options.map((option) => {
          const isSelected = isOptionSelected(step.id, option.id);
          
          return (
            <Card
              key={option.id}
              className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                isSelected
                  ? 'ring-2 ring-career-accent bg-career-accent/5'
                  : theme === 'dark'
                  ? 'bg-career-panel-dark border-career-text-dark/20 hover:border-career-accent/50'
                  : 'bg-career-panel-light border-career-text-light/20 hover:border-career-accent/50'
              }`}
              onClick={() => {
                if (step.type === 'single-select') {
                  handleSingleSelect(step.id, option.id);
                } else {
                  handleMultiSelect(step.id, option.id);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} font-medium`}>
                    {option.label}
                  </span>
                  {isSelected && (
                    <Check className="w-5 h-5 text-career-accent" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-6">
        <Button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          variant="outline"
          className={`${theme === 'dark' ? 'border-career-text-dark/20 text-career-text-dark hover:bg-career-text-dark/10' : 'border-career-text-light/20 text-career-text-light hover:bg-career-text-light/10'} transition-all duration-200`}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <Button
          onClick={handleNext}
          disabled={!isValid}
          className="bg-career-accent hover:bg-career-accent-dark text-white transition-all duration-200"
        >
          {currentStep === onboardingSteps.length - 1 ? 'Complete Setup' : 'Next'}
          {currentStep < onboardingSteps.length - 1 && <ChevronRight className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
};

export default OnboardingCardFlow;
