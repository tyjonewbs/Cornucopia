"use client";

import { useCallback, useState } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface ImageUploadProps {
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
}

export function ImageUpload({
  onUploadComplete,
  maxFiles = 5,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const files = Array.from(e.target.files).slice(0, maxFiles);
    setIsUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(error);
        }

        const data = await response.json();
        return data.url;
      });

      const urls = await Promise.all(uploadPromises);
      onUploadComplete(urls);
      toast.success(`Successfully uploaded ${urls.length} image${urls.length === 1 ? '' : 's'}`);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to upload images');
      }
    } finally {
      setIsUploading(false);
      if (e.target) {
        e.target.value = ''; // Reset the input
      }
    }
  }, [maxFiles, onUploadComplete]);

  return (
    <div className="flex flex-col items-center gap-4">
      <input
        type="file"
        accept="image/*"
        multiple
        max={maxFiles}
        onChange={handleFileChange}
        className="hidden"
        id="image-upload"
        disabled={isUploading}
      />
      <label htmlFor="image-upload">
        <Button
          type="button"
          variant="outline"
          disabled={isUploading}
          className="cursor-pointer"
          asChild
        >
          <span>
            {isUploading ? 'Uploading...' : `Upload Images (Max ${maxFiles})`}
          </span>
        </Button>
      </label>
    </div>
  );
}
