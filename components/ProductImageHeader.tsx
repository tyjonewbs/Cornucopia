"use client";

import Image from "next/image";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductImageHeaderProps {
  images: string[];
  productName: string;
}

export function ProductImageHeader({ images, productName }: ProductImageHeaderProps) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const heroImage = images[0];
  const gridImages = images.slice(1, 5); // Get images 1-4 for grid

  const openGallery = (index: number) => {
    setCurrentImageIndex(index);
    setGalleryOpen(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // If only one image, show it full width
  if (images.length === 1) {
    return (
      <>
        <div className="mb-8">
          <div 
            className="relative w-full h-[400px] lg:h-[500px] rounded-lg bg-gray-100 overflow-hidden cursor-pointer group"
            onClick={() => openGallery(0)}
          >
            <Image
              src={heroImage}
              alt={productName}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header Image Section */}
      <div className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3">
          {/* Large Hero Image (Left) */}
          <div 
            className="relative w-full h-[400px] lg:h-[500px] rounded-lg bg-gray-100 overflow-hidden cursor-pointer group"
            onClick={() => openGallery(0)}
          >
            <Image
              src={heroImage}
              alt={productName}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 66vw"
              priority
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all" />
          </div>

          {/* 2x2 Image Grid (Right) */}
          {gridImages.length > 0 && (
            <div className="grid grid-cols-2 grid-rows-2 gap-3 h-[400px] lg:h-[500px]">
              {[...Array(4)].map((_, idx) => {
                const img = gridImages[idx];
                if (!img) {
                  // Empty placeholder
                  return (
                    <div
                      key={idx}
                      className="relative w-full h-full rounded-lg bg-gray-100"
                    />
                  );
                }
                return (
                  <div
                    key={idx}
                    className="relative w-full h-full rounded-lg bg-gray-100 overflow-hidden cursor-pointer group"
                    onClick={() => openGallery(idx + 1)}
                  >
                    <Image
                      src={img}
                      alt={`${productName} ${idx + 2}`}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 1024px) 50vw, 16.5vw"
                    />
                    {idx === 3 && images.length > 5 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          +{images.length - 5} more
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Full Screen Gallery Modal */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-7xl h-[90vh] p-0">
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            {/* Close Button */}
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 z-50 bg-white/90 hover:bg-white"
              onClick={() => setGalleryOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Previous Button */}
            {images.length > 1 && (
              <Button
                variant="outline"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-white/90 hover:bg-white"
                onClick={previousImage}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}

            {/* Current Image */}
            <div className="relative w-full h-full">
              <Image
                src={images[currentImageIndex]}
                alt={`${productName} ${currentImageIndex + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>

            {/* Next Button */}
            {images.length > 1 && (
              <Button
                variant="outline"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-white/90 hover:bg-white"
                onClick={nextImage}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
              {currentImageIndex + 1} / {images.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
