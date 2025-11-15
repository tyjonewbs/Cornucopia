'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UsernameInput } from './UsernameInput';
import { Loader2 } from 'lucide-react';
import { US_STATES } from '@/lib/constants/us-states';

interface ProfileCompletionFormProps {
  currentUser?: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    profileImage?: string | null;
  };
}

export function ProfileCompletionForm({ currentUser }: ProfileCompletionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [isUsernameValid, setIsUsernameValid] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    city: '',
    state: '',
    zipCode: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isUsernameValid) {
      setError('Please choose a valid username');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/user/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          firstName: formData.firstName || undefined,
          lastName: formData.lastName || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          zipCode: formData.zipCode || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete profile');
      }

      // Success - redirect to home page
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete profile');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {/* Username - Required */}
      <UsernameInput
        value={formData.username}
        onChange={(value) => setFormData({ ...formData, username: value })}
        onValidationChange={setIsUsernameValid}
      />

      {/* First Name - Optional */}
      <div className="space-y-2">
        <Label htmlFor="firstName">First Name</Label>
        <Input
          id="firstName"
          name="firstName"
          type="text"
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          placeholder="John"
          maxLength={100}
        />
        <p className="text-sm text-muted-foreground">
          Optional, but helps personalize your experience
        </p>
      </div>

      {/* Last Name - Optional */}
      <div className="space-y-2">
        <Label htmlFor="lastName">Last Name</Label>
        <Input
          id="lastName"
          name="lastName"
          type="text"
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          placeholder="Doe"
          maxLength={100}
        />
      </div>

      {/* Location Section */}
      <div className="pt-4 border-t">
        <h3 className="text-lg font-semibold mb-4">
          Location <span className="text-sm font-normal text-muted-foreground">(Optional)</span>
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Help us show you local products and send relevant notifications
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="San Francisco"
              maxLength={100}
            />
          </div>

          {/* State */}
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Select
              value={formData.state}
              onValueChange={(value) => setFormData({ ...formData, state: value })}
            >
              <SelectTrigger id="state">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((state) => (
                  <SelectItem key={state.code} value={state.code}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ZIP Code */}
        <div className="space-y-2 mt-4">
          <Label htmlFor="zipCode">ZIP Code</Label>
          <Input
            id="zipCode"
            name="zipCode"
            type="text"
            value={formData.zipCode}
            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
            placeholder="94102"
            maxLength={10}
            pattern="\d{5}(-\d{4})?"
          />
          <p className="text-sm text-muted-foreground">
            Format: 12345 or 12345-6789
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-6">
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || !isUsernameValid || !formData.username}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Completing Profile...
            </>
          ) : (
            'Complete Profile'
          )}
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-2">
          <span className="text-red-500">*</span> Required field
        </p>
      </div>
    </form>
  );
}
