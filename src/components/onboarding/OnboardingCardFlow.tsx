
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

  const handleMultiSelect = (stepId: string, value: string, checked: boolean) => {
    setResponses(prev => {
      const current = (prev[stepId] as string[]) || [];
      if (checked) {
        return { ...prev, [stepId]: [...current, value] };
      } else {
        return { ...prev, [stepId]: current.filter(item => item !== value) };
      }
    });
  };

  const step = onboardingSteps[currentStep];
  const isValid = responses[step.id] && (
    step.type === 'single-select' 
      ? responses[step.id] 
      : Array.isArray(responses[step.id]) && (responses[step.id] as string[]).length > 0
  );

  return (
    <div className={`w-full max-w-2xl mx-auto p-6 ${theme === 'dark' ? 'bg-career-dark' : 'bg-career-light'}`}>
      <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'} transition-all duration-300`}>
        <CardHeader className="text-center">
          <CardTitle className={`text-2xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
            Let's get to know you
          </CardTitle>
          <CardDescription className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
            We'll ask a few quick questions to tailor your experience and build your career profile.
          </CardDescription>
          <div className="flex justify-center mt-4">
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
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              {step.title}
            </h3>

            {step.type === 'single-select' && (
              <RadioGroup
                value={responses[step.id] as string || ''}
                onValueChange={(value) => handleSingleSelect(step.id, value)}
                className="space-y-3"
              >
                {step.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={option.id} 
                      id={option.id}
                      className={`${theme === 'dark' ? 'border-career-text-dark/30 text-career-accent' : 'border-career-text-light/30 text-career-accent'}`}
                    />
                    <Label 
                      htmlFor={option.id}
                      className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} cursor-pointer`}
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {step.type === 'multi-select' && (
              <div className="space-y-3">
                {step.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={(responses[step.id] as string[] || []).includes(option.id)}
                      onCheckedChange={(checked) => handleMultiSelect(step.id, option.id, checked as boolean)}
                      className={`${theme === 'dark' ? 'border-career-text-dark/30' : 'border-career-text-light/30'}`}
                    />
                    <Label 
                      htmlFor={option.id}
                      className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} cursor-pointer`}
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

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
              {currentStep === onboardingSteps.length - 1 ? 'Complete' : 'Next'}
              {currentStep < onboardingSteps.length - 1 && <ChevronRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingCardFlow;
