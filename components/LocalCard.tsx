"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Edit, Eye } from "lucide-react";

interface LocalCardProps {
  local: {
    id: string;
    name: string;
    description: string | null;
    locationName: string;
    images: string[];
    _count: {
      products: number;
    };
  };
  userId: string;
}

export function LocalCard({ local }: LocalCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-48">
        <img
          src={local.images[0] || "/images/placeholder.jpg"}
          alt={local.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{local.name}</h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {local.description}
        </p>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <span>📍 {local.locationName}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <span>🛍️ {local._count.products} Products</span>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Link href={`/local/${local.id}/edit`} className="flex-1">
            <Button variant="outline" className="w-full">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Link href={`/local/${local.id}`} className="flex-1">
            <Button variant="default" className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
