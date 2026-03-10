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
      className="block group rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-white"
    >
      {/* Banner header with background image */}
      <div className={`relative ${getBgColor()} aspect-[4/3] flex items-end`}>
        {image && (
          <div className="absolute inset-0 opacity-30">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          </div>
        )}

        {/* Icon badge */}
        <div className="absolute top-2 left-2 z-10 w-9 h-9 md:w-10 md:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
          {getIcon()}
        </div>

        {/* Distance badge */}
        {distance !== null && distance !== undefined && (
          <div className="absolute top-2 right-2 z-10 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2 py-0.5 rounded-full">
            {Math.round(distance * 0.621371)} mi
          </div>
        )}
      </div>

      {/* Card content */}
      <div className="p-3">
        <h3 className="font-bold text-sm md:text-base line-clamp-1">
          {title}
        </h3>
        {subtitle && (
          <p className="text-gray-600 text-xs md:text-sm line-clamp-1 mt-0.5">
            {subtitle}
          </p>
        )}
        {location && (
          <p className="text-gray-500 text-xs line-clamp-1 mt-0.5">
            {location}
          </p>
        )}
        {date && (
          <p className="text-gray-500 text-xs mt-0.5">
            {date}
          </p>
        )}
      </div>
    </Link>
  );
}
