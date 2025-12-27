import Link from "next/link";
import { Award, ExternalLink, Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProducerCardProps {
  local: {
    id: string;
    name: string;
    description: string;
    images: string[];
    certifications: any;
  };
}

export function ProducerCard({ local }: ProducerCardProps) {
  const certifications = Array.isArray(local.certifications) ? local.certifications : [];
  const shortDescription = local.description?.slice(0, 150) + (local.description?.length > 150 ? '...' : '');

  return (
    <Card className="overflow-hidden border-2 border-green-100 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Farm Image */}
          {local.images && local.images.length > 0 && (
            <div className="flex-shrink-0">
              <img
                src={local.images[0]}
                alt={local.name}
                className="w-full md:w-48 h-32 md:h-32 object-cover rounded-lg shadow-md"
              />
            </div>
          )}

          {/* Farm Info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Store className="h-5 w-5 text-green-700" />
                  <h3 className="text-lg font-bold text-gray-900">{local.name}</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {shortDescription}
                </p>
              </div>
            </div>

            {/* Certifications */}
            {certifications.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {certifications.slice(0, 3).map((cert: any, index: number) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-1 bg-green-100 border border-green-300 px-2 py-1 rounded-md text-xs font-medium text-green-800"
                  >
                    <Award className="h-3 w-3" />
                    <span>{cert.name || cert}</span>
                  </div>
                ))}
                {certifications.length > 3 && (
                  <div className="inline-flex items-center px-2 py-1 text-xs text-green-700">
                    +{certifications.length - 3} more
                  </div>
                )}
              </div>
            )}

            {/* Visit Farm Page Button */}
            <div>
              <Link href={`/local/${local.id}`}>
                <Button 
                  variant="default" 
                  className="bg-green-700 hover:bg-green-800 text-white"
                  size="sm"
                >
                  Visit Farm Page
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
