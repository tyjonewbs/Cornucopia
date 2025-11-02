'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { usernameSchema } from '@/lib/validators/userSchemas';
import { useDebounce } from '@/hooks/useDebounce';

interface UsernameInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  currentUsername?: string | null;
}

export function UsernameInput({
  value,
  onChange,
  onValidationChange,
  currentUsername,
}: UsernameInputProps) {
  const [validationState, setValidationState] = useState<
    'idle' | 'checking' | 'valid' | 'invalid'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const debouncedUsername = useDebounce(value, 500);

  useEffect(() => {
    async function checkUsername() {
      if (!debouncedUsername) {
        setValidationState('idle');
        setErrorMessage('');
        onValidationChange?.(false);
        return;
      }

      // Skip if username hasn't changed
      if (debouncedUsername === currentUsername) {
        setValidationState('valid');
        setErrorMessage('');
        onValidationChange?.(true);
        return;
      }

      // Validate format first
      const formatValidation = usernameSchema.safeParse(debouncedUsername);
      if (!formatValidation.success) {
        setValidationState('invalid');
        setErrorMessage(formatValidation.error.errors[0].message);
        onValidationChange?.(false);
        return;
      }

      // Check availability
      setValidationState('checking');
      try {
        const response = await fetch(
          `/api/user/check-username?username=${encodeURIComponent(debouncedUsername)}`
        );
        const data = await response.json();

        if (data.available) {
          setValidationState('valid');
          setErrorMessage('');
          onValidationChange?.(true);
        } else {
          setValidationState('invalid');
          setErrorMessage(data.error || 'Username is already taken');
          onValidationChange?.(false);
        }
      } catch (error) {
        setValidationState('invalid');
        setErrorMessage('Failed to check username availability');
        onValidationChange?.(false);
      }
    }

    checkUsername();
  }, [debouncedUsername, currentUsername, onValidationChange]);

  const getIcon = () => {
    switch (validationState) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case 'valid':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="username">
        Username <span className="text-red-500">*</span>
      </Label>
      <div className="relative">
        <Input
          id="username"
          name="username"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g., farmerjohn"
          className={`pr-10 ${
            validationState === 'valid'
              ? 'border-green-600 focus-visible:ring-green-600'
              : validationState === 'invalid'
              ? 'border-red-600 focus-visible:ring-red-600'
              : ''
          }`}
          autoComplete="username"
          required
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {getIcon()}
        </div>
      </div>
      {errorMessage && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
      {validationState === 'valid' && (
        <p className="text-sm text-green-600">Username is available!</p>
      )}
      <p className="text-sm text-muted-foreground">
        3-30 characters. Letters, numbers, underscores, and hyphens only.
      </p>
    </div>
  );
}
