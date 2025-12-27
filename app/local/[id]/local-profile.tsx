'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import MapView from '@/components/MapView';
import { ProductGrid } from '@/components/ProductGrid';
import { getLocalProducts, type SerializedProduct } from '@/app/actions/local-products';
import { MapPin, Globe, Instagram, Facebook, Video, Award, Users, Leaf, ExternalLink } from 'lucide-react';
import type { Local } from '@prisma/client';

interface LocalProfileProps {
  local: Local;
  isOwner?: boolean;
}

export default function LocalProfile({ local, isOwner = false }: LocalProfileProps) {
  const [products, setProducts] = useState<SerializedProduct[]>([]);

  useEffect(() => {
    getLocalProducts(local.id)
      .then(fetchedProducts => setProducts(fetchedProducts))
      .catch(console.error);
  }, [local.id]);

  // Parse JSON fields safely
  const teamMembers = Array.isArray(local.teamMembers) ? local.teamMembers : [];
  const certifications = Array.isArray(local.certifications) ? local.certifications : [];
  
  // Extract YouTube/Vimeo video ID
  const getVideoEmbedUrl = (url: string | null) => {
    if (!url) return null;
    
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    
    return null;
  };

  const videoEmbedUrl = getVideoEmbedUrl((local as any).videoUrl);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Image */}
      <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] bg-gradient-to-br from-green-600 to-green-800">
        {local.images && local.images.length > 0 ? (
          <img 
            src={local.images[0]} 
            alt={local.name}
            className="w-full h-full object-cover"
          />
        ) : null}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 px-4 md:px-8 lg:px-16 pb-6 md:pb-10">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-3">
              {local.name}
            </h1>
            {(local as any).tagline && (
              <p className="text-lg md:text-xl text-white/90 mb-3 md:mb-4">
                {(local as any).tagline}
              </p>
            )}
            
            {/* Farm Stats Badges */}
            <div className="flex flex-wrap gap-2 md:gap-3 mb-4">
              {(local as any).foundedYear && (
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm">
                  Since {(local as any).foundedYear}
                </div>
              )}
              {(local as any).acreage && (
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm">
                  {(local as any).acreage} acres
                </div>
              )}
              {(local as any).generationNumber && (
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm">
                  {(local as any).generationNumber}
                  {(local as any).generationNumber === 1 ? 'st' : 
                   (local as any).generationNumber === 2 ? 'nd' : 
                   (local as any).generationNumber === 3 ? 'rd' : 'th'} generation
                </div>
              )}
            </div>

            {/* Social Links */}
            {((local as any).instagramHandle || (local as any).facebookPageUrl || local.website) && (
              <div className="flex flex-wrap gap-2 md:gap-3">
                {(local as any).instagramHandle && (
                  <a 
                    href={`https://instagram.com/${(local as any).instagramHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2"
                  >
                    <Instagram className="h-4 w-4" />
                    <span className="text-sm">@{(local as any).instagramHandle}</span>
                  </a>
                )}
                {(local as any).facebookPageUrl && (
                  <a 
                    href={(local as any).facebookPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2"
                  >
                    <Facebook className="h-4 w-4" />
                    <span className="text-sm">Facebook</span>
                  </a>
                )}
                {local.website && (
                  <a 
                    href={local.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="text-sm">Website</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Edit Button for Owner */}
        {isOwner && (
          <Link
            href={`/dashboard/farm-page`}
            className="absolute top-4 right-4 bg-white/90 hover:bg-white text-black px-4 py-2 rounded-lg shadow-lg transition-colors flex items-center gap-2"
          >
            Edit Farm Page
          </Link>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            
            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl">About Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                  {local.description}
                </p>
                
                {(local as any).missionStatement && (
                  <div className="bg-green-50 border-l-4 border-green-600 p-4 my-4">
                    <p className="text-green-900 font-medium text-sm md:text-base italic">
                      "{(local as any).missionStatement}"
                    </p>
                  </div>
                )}
                
                {local.story && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Our Story</h3>
                      <p className="text-gray-700 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                        {local.story}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Video Section */}
            {videoEmbedUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                    <Video className="h-5 w-5 md:h-6 md:w-6" />
                    Farm Tour
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      src={videoEmbedUrl}
                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Farming Practices */}
            {local.farmingPractices && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                    <Leaf className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                    Our Farming Practices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                    {local.farmingPractices}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Photo Gallery */}
            {local.images && local.images.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl md:text-2xl">Photo Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    {local.images.slice(1).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${local.name} ${index + 2}`}
                        className="w-full h-32 md:h-48 object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Team Members */}
            {teamMembers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                    <Users className="h-5 w-5 md:h-6 md:w-6" />
                    Meet Our Team
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {teamMembers.map((member: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg bg-gray-50">
                        <p className="font-semibold text-base">{member.name}</p>
                        {member.role && (
                          <p className="text-sm text-gray-600">{member.role}</p>
                        )}
                        {member.bio && (
                          <p className="text-sm text-gray-700 mt-2">{member.bio}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Products */}
            {products.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl md:text-2xl">Our Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductGrid 
                    initialProducts={products} 
                    userLocation={null}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            
            {/* Certifications */}
            {certifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Award className="h-5 w-5" />
                    Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {certifications.map((cert: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-2 rounded-lg text-sm"
                      >
                        <Award className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">{cert.name || cert}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <MapPin className="h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium text-gray-900">{local.locationName}</p>
                  {local.locationGuide && (
                    <p className="text-sm text-gray-600 mt-1">{local.locationGuide}</p>
                  )}
                </div>
                <div className="h-48 md:h-64 rounded-lg overflow-hidden">
                  <MapView
                    latitude={local.latitude}
                    longitude={local.longitude}
                    locationName={local.name}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Wholesale Info */}
            {local.wholesaleInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Wholesale</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {local.wholesaleInfo}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
