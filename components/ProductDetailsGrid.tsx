import { Package, MapPin, Calendar, Star } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface ProductDetailsGridProps {
  category?: string;
  inventory: number;
  locationName: string;
  city?: string | null;
  zipCode?: string | null;
  updatedAt: string;
  averageRating?: number | null;
  totalReviews: number;
  tags?: string[];
}

export function ProductDetailsGrid({
  category,
  inventory,
  locationName,
  city,
  zipCode,
  updatedAt,
  averageRating,
  totalReviews,
  tags,
}: ProductDetailsGridProps) {
  return (
    <div className="bg-muted rounded-lg p-6">
      <h3 className="font-semibold text-lg mb-4">Product Details</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Category */}
        {category && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Package className="w-3.5 h-3.5" />
              Category
            </p>
            <p className="font-medium">{category}</p>
          </div>
        )}

        {/* Inventory */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Package className="w-3.5 h-3.5" />
            Inventory
          </p>
          <p className="font-medium">
            {inventory > 0 ? (
              <span className="text-green-600">{inventory} available</span>
            ) : (
              <span className="text-destructive">Out of stock</span>
            )}
          </p>
        </div>

        {/* Location */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            Location
          </p>
          <p className="font-medium">
            {city && zipCode ? `${city}, ${zipCode}` : locationName}
          </p>
        </div>

        {/* Last Updated */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Last Updated
          </p>
          <p className="font-medium">
            {format(new Date(updatedAt), "MMM d, yyyy")}
          </p>
        </div>

        {/* Rating */}
        {(averageRating !== null && averageRating !== undefined) ? (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Star className="w-3.5 h-3.5" />
              Rating
            </p>
            <p className="font-medium flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              {averageRating.toFixed(1)} ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
            </p>
          </div>
        ) : totalReviews === 0 ? (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Star className="w-3.5 h-3.5" />
              Rating
            </p>
            <p className="font-medium text-muted-foreground">No reviews yet</p>
          </div>
        ) : null}
      </div>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">Tags</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
