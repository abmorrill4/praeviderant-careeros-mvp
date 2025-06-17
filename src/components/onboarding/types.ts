
export interface OnboardingOption {
  id: string;
  label: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  type: 'single-select' | 'multi-select';
  options: OnboardingOption[];
}

export interface OnboardingData {
  [stepId: string]: string | string[];
}
