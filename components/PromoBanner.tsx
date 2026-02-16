'use client';

import Link from "next/link";
import Image from "next/image";
import { MapPin, Calendar, Store } from "lucide-react";

type BannerType = 'stand' | 'event' | 'product';

interface PromoBannerProps {
  type: BannerType;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  href: string;
  distance?: number | null;
  location?: string;
  date?: string;
}

export function PromoBanner({
  type,
  title,
  subtitle,
  description,
  image,
  href,
  distance,
  location,
  date,
}: PromoBannerProps) {
  const getIcon = () => {
    switch (type) {
      case 'stand':
        return <Store className="h-5 w-5 text-white" />;
      case 'event':
        return <Calendar className="h-5 w-5 text-white" />;
      case 'product':
        return <MapPin className="h-5 w-5 text-white" />;
      default:
        return null;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'stand':
        return 'bg-gradient-to-r from-[#0B4D2C] to-[#0B4D2C]/80';
      case 'event':
        return 'bg-gradient-to-r from-[#E07A2D] to-[#E07A2D]/80';
      case 'product':
        return 'bg-gradient-to-r from-[#82A952] to-[#82A952]/80';
      default:
        return 'bg-gradient-to-r from-gray-700 to-gray-600';
    }
  };

  return (
    <Link 
      href={href}
      className="block group col-span-2 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
    >
      <div className={`relative ${getBgColor()} h-24 md:h-28 flex items-center`}>
        {/* Background Image (if provided) */}
        {image && (
          <div className="absolute inset-0 opacity-30">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 flex items-center gap-3 md:gap-4 px-4 md:px-6 w-full">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            {getIcon()}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-sm md:text-base line-clamp-1">
              {title}
            </h3>
            {subtitle && (
              <p className="text-white/90 text-xs md:text-sm line-clamp-1">
                {subtitle}
              </p>
            )}
            {description && (
              <p className="text-white/80 text-xs line-clamp-1 mt-0.5 hidden md:block">
                {description}
              </p>
            )}
          </div>

          {/* Right side info */}
          <div className="flex-shrink-0 text-right">
            {distance !== null && distance !== undefined && (
              <div className="text-white/90 text-xs md:text-sm font-medium">
                {Math.round(distance * 0.621371)} mi
              </div>
            )}
            {location && (
              <div className="text-white/70 text-xs hidden md:block">
                {location}
              </div>
            )}
            {date && (
              <div className="text-white/70 text-xs">
                {date}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
