'use client';

import { useState, useEffect } from 'react';
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Edit2, Check, X } from 'lucide-react';
import { UsernameInput } from './UsernameInput';
import { US_STATES } from '@/lib/constants/us-states';
import { toast } from 'sonner';
import { canChangeUsername, getDaysUntilUsernameChange } from '@/lib/dto/user.dto';

interface AccountFormProps {
  user: {
    email: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    profileImage: string | null;
    usernameLastChanged: Date | null;
  };
}

export function AccountForm({ user }: AccountFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isUsernameValid, setIsUsernameValid] = useState(false);
  
  const [formData, setFormData] = useState({
    username: user.username || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    city: user.city || '',
    state: user.state || '',
    zipCode: user.zipCode || '',
  });

  const canEdit = canChangeUsername(user as any);
  const daysRemaining = !canEdit ? getDaysUntilUsernameChange(user as any) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If editing username, validate it
    if (isEditingUsername && formData.username !== user.username) {
      if (!isUsernameValid) {
        toast.error('Please choose a valid username');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/user', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username !== user.username ? formData.username : undefined,
          firstName: formData.firstName || undefined,
          lastName: formData.lastName || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          zipCode: formData.zipCode || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update account');
      }

      toast.success('Account updated successfully');
      setIsEditingUsername(false);
      
      // Refresh the page to get updated data
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>
          Manage your account information and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-6">
        {/* Email - Read Only */}
        <div className="flex flex-col gap-y-2">
          <Label>Email</Label>
          <Input
            name="email"
            type="email"
            disabled
            value={user.email}
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Email cannot be changed
          </p>
        </div>

        {/* Username */}
        <div className="flex flex-col gap-y-2">
          <div className="flex items-center justify-between">
            <Label>Username</Label>
            {user.username && !isEditingUsername && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingUsername(true)}
                disabled={!canEdit}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
          
          {!user.username || isEditingUsername ? (
            <>
              <UsernameInput
                value={formData.username}
                onChange={(value) => setFormData({ ...formData, username: value })}
                onValidationChange={setIsUsernameValid}
                currentUsername={user.username}
              />
              {isEditingUsername && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormData({ ...formData, username: user.username || '' });
                      setIsEditingUsername(false);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <Input
                value={user.username}
                disabled
                className="bg-muted"
              />
              {!canEdit && (
                <p className="text-xs text-amber-600">
                  You can change your username again in {daysRemaining} days
                </p>
              )}
            </>
          )}
        </div>

        {/* First Name */}
        <div className="flex flex-col gap-y-2">
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
        </div>

        {/* Last Name */}
        <div className="flex flex-col gap-y-2">
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
          <h3 className="text-lg font-semibold mb-4">Location</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Help us show you local products and send relevant notifications
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* City */}
            <div className="flex flex-col gap-y-2">
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
            <div className="flex flex-col gap-y-2">
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
          <div className="flex flex-col gap-y-2 mt-4">
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
            <p className="text-xs text-muted-foreground">
              Format: 12345 or 12345-6789
            </p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </CardFooter>
    </form>
  );
}
