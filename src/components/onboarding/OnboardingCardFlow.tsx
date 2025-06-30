
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { onboardingSteps } from "./onboardingConfig";
import { OnboardingData, OnboardingStep } from "./types";

interface OnboardingCardFlowProps {
  onComplete: (data: OnboardingData) => void;
}

const OnboardingCardFlow = ({ onComplete }: OnboardingCardFlowProps) => {
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
                  : 'bg-career-gray'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-career-text mb-2">
          {step.title}
        </h3>
        <p className="text-sm text-career-text-muted">
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
                  : 'bg-career-panel border-career-text/20 hover:border-career-accent/50'
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
                  <span className="text-career-text font-medium">
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
          className="border-career-text/20 text-career-text hover:bg-career-text/10 transition-all duration-200"
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
