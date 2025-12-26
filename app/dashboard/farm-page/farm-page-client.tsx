"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Pencil, ExternalLink, MapPin, Users, Award, Calendar, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageGalleryGrid } from "@/components/ImageGalleryGrid";
import { ContactOwnerDialog } from "@/components/ContactOwnerDialog";
import { Separator } from "@/components/ui/separator";

interface Farm {
  id: string;
  name: string;
  description: string;
  story: string;
  images: string[];
  farmingPractices: string;
  teamMembers: any;
  certifications: any;
  seasonalSchedule: any;
  events: any;
  operatingHours: any;
  wholesaleInfo: string | null;
  locationName: string;
  locationGuide: string;
  latitude: number;
  longitude: number;
  website: string | null;
  socialMedia: string[];
  createdAt: string;
  products: Array<{
    id: string;
    name: string;
    images: string[];
    tags: string[];
    price: number;
  }>;
  _count: {
    products: number;
  };
}

interface FarmPageClientProps {
  farms: Farm[];
}

export function FarmPageClient({ farms }: FarmPageClientProps) {
  const [selectedFarmId, setSelectedFarmId] = useState<string>(
    farms[0]?.id || ""
  );

  const selectedFarm = farms.find(farm => farm.id === selectedFarmId);

  if (farms.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">No Farm Page Yet</h2>
          <p className="text-muted-foreground mb-6">
            Create your farm profile to tell your story and showcase what makes your farm special.
          </p>
          <Link href="/local/setup">
            <Button size="lg" className="bg-green-700 hover:bg-green-800">
              Create Your Farm Page
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!selectedFarm) {
    return null;
  }

  // Parse team members if it's a JSON object
  const teamMembers = Array.isArray(selectedFarm.teamMembers) 
    ? selectedFarm.teamMembers 
    : [];

  // Parse certifications
  const certifications = Array.isArray(selectedFarm.certifications)
    ? selectedFarm.certifications
    : [];

  // Generate product categories from products
  const productCategories = selectedFarm.products
    .flatMap(p => p.tags)
    .filter((tag, index, self) => self.indexOf(tag) === index)
    .slice(0, 8);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      {/* Image Gallery */}
      <div className="mb-8">
        <ImageGalleryGrid images={selectedFarm.images} farmName={selectedFarm.name} />
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Farm Name and Address */}
          <div>
            <h1 className="text-3xl font-bold mb-3">{selectedFarm.name}</h1>
            <div className="flex items-start gap-2 text-muted-foreground mb-4">
              <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">{selectedFarm.locationName}</p>
                {selectedFarm.locationGuide && (
                  <p className="text-sm">{selectedFarm.locationGuide}</p>
                )}
              </div>
            </div>
            
            {/* Certifications as Badges */}
            {certifications.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {certifications.map((cert: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-2 rounded-lg text-sm text-green-800"
                  >
                    <Award className="h-4 w-4" />
                    <span className="font-medium">{cert.name || cert}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* About Section */}
          <Card>
            <CardHeader>
              <CardTitle>About us:</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed mb-4">
                {selectedFarm.description}
              </p>
              {selectedFarm.story && (
                <>
                  <h3 className="font-semibold mb-2">Our Story</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {selectedFarm.story}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Farming Practices */}
          {selectedFarm.farmingPractices && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-green-600" />
                  Our Farming Practices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {selectedFarm.farmingPractices}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Our Offerings */}
          {productCategories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Our Offerings</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {productCategories.map((category, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-green-600 mt-1">•</span>
                      <span className="text-muted-foreground">{category}</span>
                    </li>
                  ))}
                </ul>
                {selectedFarm._count.products > 0 && (
                  <p className="text-sm text-muted-foreground mt-4">
                    {selectedFarm._count.products} products available
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Team Members */}
          {teamMembers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Meet Our Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {teamMembers.map((member: any, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        {member.role && (
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Link href={`/dashboard/local/setup/edit/${selectedFarm.id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Farm Page
              </Button>
            </Link>
            <Link href={`/local/${selectedFarm.id}`} target="_blank" className="flex-1">
              <Button variant="outline" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                View as Customer
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Contact Button */}
          <Card>
            <CardContent className="p-6">
              <ContactOwnerDialog farmName={selectedFarm.name} website={selectedFarm.website}>
                <Button className="w-full bg-[#8B4513] hover:bg-[#723C0F]">
                  Contact Owner
                </Button>
              </ContactOwnerDialog>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Preview how customers can contact you
              </p>
            </CardContent>
          </Card>

          {/* Wholesale Info */}
          {selectedFarm.wholesaleInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Wholesale Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedFarm.wholesaleInfo}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Events */}
          {selectedFarm.events && Array.isArray(selectedFarm.events) && selectedFarm.events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedFarm.events.slice(0, 3).map((event: any, index: number) => (
                    <div key={index} className="border-l-2 border-green-600 pl-3">
                      <p className="font-medium text-sm">{event.name || event.title}</p>
                      {event.date && (
                        <p className="text-xs text-muted-foreground">{event.date}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview Notice */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-sm text-blue-800">
                <strong>Preview Mode:</strong> This is how your farm page appears to customers.
                Use the edit button to make changes.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
