"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageGalleryGridProps {
  images: string[];
  farmName: string;
}

export function ImageGalleryGrid({ images, farmName }: ImageGalleryGridProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState<{ [key: number]: boolean }>({});

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[16/9] bg-muted rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <ImageIcon className="h-16 w-16 mb-4" />
          <span className="text-sm">No images available</span>
        </div>
      </div>
    );
  }

  const heroImage = images[0];
  const thumbnails = images.slice(1, 5);
  const totalImages = images.length;

  const handleImageError = (index: number) => {
    setImageError(prev => ({ ...prev, [index]: true }));
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-2 h-[400px]">
        {/* Hero Image - Takes up 2 columns */}
        <div className="col-span-2 relative rounded-lg overflow-hidden cursor-pointer group" onClick={() => setIsOpen(true)}>
          {!imageError[0] ? (
            <Image
              src={heroImage}
              alt={`${farmName} main image`}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 66vw"
              priority
              onError={() => handleImageError(0)}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Thumbnail Grid - Takes up 1 column */}
        <div className="grid grid-rows-2 gap-2">
          {thumbnails.slice(0, 2).map((image, index) => (
            <div
              key={index}
              className="relative rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => setIsOpen(true)}
            >
              {!imageError[index + 1] ? (
                <Image
                  src={image}
                  alt={`${farmName} image ${index + 2}`}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 33vw"
                  onError={() => handleImageError(index + 1)}
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          
          {/* Last thumbnail with overlay showing total count */}
          {thumbnails.length >= 2 && (
            <div
              className="relative rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => setIsOpen(true)}
            >
              {!imageError[3] && thumbnails[2] ? (
                <>
                  <Image
                    src={thumbnails[2]}
                    alt={`${farmName} image 4`}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 33vw"
                    onError={() => handleImageError(3)}
                  />
                  {totalImages > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center transition-colors group-hover:bg-black/70">
                      <div className="text-white text-center">
                        <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                        <span className="text-sm font-medium">See all {totalImages} photos</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
          )}
          
          {/* If we don't have enough images, show placeholders */}
          {thumbnails.length < 2 && (
            <div className="relative rounded-lg overflow-hidden bg-muted flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Full Image Gallery Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl w-full p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <Carousel className="w-full">
              <CarouselContent>
                {images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-video relative">
                      <Image
                        src={image}
                        alt={`${farmName} image ${index + 1}`}
                        fill
                        className="object-contain"
                        priority={index === 0}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
