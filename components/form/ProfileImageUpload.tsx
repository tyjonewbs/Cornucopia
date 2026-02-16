"use client";

import { useCallback, useState } from 'react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { toast } from 'sonner';
import { uploadImages } from '@/lib/supabase-browser';
import { Camera, Loader2 } from 'lucide-react';

interface ProfileImageUploadProps {
  currentImage: string | null;
  onUploadComplete: (url: string) => void;
  userInitial?: string;
}

export function ProfileImageUpload({
  currentImage,
  onUploadComplete,
  userInitial = 'U',
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);

    try {
      const urls = await uploadImages([file], 'profile-images');
      onUploadComplete(urls[0]);
      toast.success('Profile picture updated successfully');
    } catch (error) {
      // Revert preview on error
      setPreviewUrl(currentImage);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to upload profile picture');
      }
    } finally {
      setIsUploading(false);
      if (e.target) {
        e.target.value = ''; // Reset the input
      }
    }
  }, [currentImage, onUploadComplete]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={previewUrl || ''} alt="Profile" />
          <AvatarFallback className="text-2xl">{userInitial}</AvatarFallback>
        </Avatar>
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
      </div>
      
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="profile-image-upload"
        disabled={isUploading}
      />
      <label htmlFor="profile-image-upload">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          className="cursor-pointer"
          asChild
        >
          <span>
            <Camera className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading...' : currentImage ? 'Change Picture' : 'Upload Picture'}
          </span>
        </Button>
      </label>
      <p className="text-xs text-muted-foreground text-center">
        Recommended: Square image, max 5MB
      </p>
    </div>
  );
}
