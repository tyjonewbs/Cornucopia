import { Star, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ProducerTrustCardProps {
  standId: string;
  standName: string;
  averageRating: number | null;
  totalReviews: number;
}

export function ProducerTrustCard({
  standId,
  standName,
  averageRating,
  totalReviews,
}: ProducerTrustCardProps) {
  const displayRating = averageRating ?? 0;
  const fullStars = Math.floor(displayRating);
  const hasHalfStar = displayRating % 1 >= 0.5;

  return (
    <div className="bg-white rounded-lg border p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-600 mb-2">Available At</h3>
        <h2 className="text-2xl font-bold text-gray-900">{standName}</h2>
      </div>

      {/* Stand Rating */}
      {totalReviews > 0 && (
        <div className="mb-4 pb-4 border-b">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < fullStars
                      ? 'fill-yellow-400 text-yellow-400'
                      : i === fullStars && hasHalfStar
                      ? 'fill-yellow-400 text-yellow-400 opacity-50'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-lg font-semibold text-gray-900">
              {displayRating.toFixed(1)}
            </span>
            <span className="text-sm text-gray-600">
              ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        </div>
      )}

      {/* Visit Stand CTA */}
      <Link
        href={`/market-stand/${standId}`}
        className="inline-flex items-center justify-center w-full gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground px-4 py-3 rounded-md transition-colors font-medium group"
      >
        <span>Meet the Producer / Visit {standName}'s Story</span>
        <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>

      {totalReviews === 0 && (
        <p className="text-xs text-gray-500 mt-3 text-center italic">
          Be the first to review this stand
        </p>
      )}
    </div>
  );
}
