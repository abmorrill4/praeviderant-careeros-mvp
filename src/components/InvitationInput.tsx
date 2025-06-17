
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useInvitations } from '@/hooks/useInvitations';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface InvitationInputProps {
  onValidCode: (code: string) => void;
  className?: string;
}

const InvitationInput = ({ onValidCode, className = "" }: InvitationInputProps) => {
  const [code, setCode] = useState('');
  const [validationState, setValidationState] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const { validateInvitationCode } = useInvitations();

  const handleValidate = async () => {
    if (!code.trim()) return;
    
    setValidationState('validating');
    setErrorMessage('');

    const { isValid, error } = await validateInvitationCode(code.trim());
    
    if (isValid) {
      setValidationState('valid');
      onValidCode(code.trim().toUpperCase());
    } else {
      setValidationState('invalid');
      setErrorMessage(error || 'Invalid invitation code');
    }
  };

  const handleInputChange = (value: string) => {
    setCode(value);
    if (validationState !== 'idle') {
      setValidationState('idle');
      setErrorMessage('');
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="invitationCode" className="text-career-text text-sm font-medium">
        Invitation Code
      </Label>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            id="invitationCode"
            type="text"
            value={code}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Enter invitation code"
            className="neumorphic-input text-career-text placeholder:text-career-text-muted h-12 uppercase"
            maxLength={8}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleValidate();
              }
            }}
          />
          {validationState === 'valid' && (
            <CheckCircle className="absolute right-3 top-3 w-6 h-6 text-green-500" />
          )}
          {validationState === 'invalid' && (
            <XCircle className="absolute right-3 top-3 w-6 h-6 text-red-500" />
          )}
        </div>
        <Button
          type="button"
          onClick={handleValidate}
          disabled={!code.trim() || validationState === 'validating' || validationState === 'valid'}
          className="h-12 px-6 bg-career-mint hover:bg-career-mint-dark text-white neumorphic-button border-0"
        >
          {validationState === 'validating' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Verify'
          )}
        </Button>
      </div>
      {errorMessage && (
        <p className="text-red-500 text-sm">{errorMessage}</p>
      )}
      {validationState === 'valid' && (
        <p className="text-green-500 text-sm">✓ Valid invitation code</p>
      )}
    </div>
  );
};

export default InvitationInput;
