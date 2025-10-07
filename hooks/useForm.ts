'use client';

import { useState, useCallback, ChangeEvent, FormEvent } from 'react';
import { FormState, FormFieldState } from '@/types';

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void> | void;
  validate?: (values: T) => Record<string, string>;
}

interface UseFormReturn<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
  handleChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  handleBlur: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  setFieldValue: (name: keyof T, value: any) => void;
  setFieldError: (name: keyof T, error: string) => void;
  setFieldTouched: (name: keyof T, touched: boolean) => void;
  resetForm: () => void;
  setValues: (values: Partial<T>) => void;
}

/**
 * Custom hook for form handling
 * Provides form state management, validation, and submission
 */
export function useForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);
  const isValid = Object.keys(errors).length === 0;

  const validateForm = useCallback(
    (formValues: T): Record<string, string> => {
      if (!validate) return {};
      return validate(formValues);
    },
    [validate]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const fieldValue =
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

      setValues((prev) => ({
        ...prev,
        [name]: fieldValue,
      }));

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const handleBlur = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));

      // Validate on blur
      const formErrors = validateForm(values);
      if (formErrors[name]) {
        setErrors((prev) => ({ ...prev, [name]: formErrors[name] }));
      }
    },
    [values, validateForm]
  );

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      );
      setTouched(allTouched);

      // Validate
      const formErrors = validateForm(values);
      setErrors(formErrors);

      if (Object.keys(formErrors).length > 0) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateForm, onSubmit]
  );

  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setFieldError = useCallback((name: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [name as string]: error }));
  }, []);

  const setFieldTouched = useCallback((name: keyof T, isTouched: boolean) => {
    setTouched((prev) => ({ ...prev, [name as string]: isTouched }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const setFormValues = useCallback((newValues: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...newValues }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isDirty,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    resetForm,
    setValues: setFormValues,
  };
}
