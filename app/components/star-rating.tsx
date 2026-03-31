import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { Star } from "lucide-react";
import { toast } from "sonner";

function StarIcon({
  filled,
  half,
  className,
}: {
  filled: boolean;
  half?: boolean;
  className?: string;
}) {
  if (half) {
    return (
      <span className={`relative inline-block ${className ?? ""}`}>
        <Star className="size-full text-muted-foreground/30" />
        <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
          <Star className="size-full fill-yellow-400 text-yellow-400" />
        </span>
      </span>
    );
  }

  return (
    <Star
      className={`${filled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"} ${className ?? ""}`}
    />
  );
}

export function StarRatingDisplay({
  averageRating,
  totalRatings,
  size = "sm",
}: {
  averageRating: number;
  totalRatings: number;
  size?: "sm" | "md";
}) {
  if (totalRatings === 0) return null;

  const starSize = size === "sm" ? "size-3.5" : "size-5";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: 5 }, (_, i) => {
          const starValue = i + 1;
          const isFull = averageRating >= starValue;
          const isHalf =
            !isFull && averageRating >= starValue - 0.5;
          return (
            <StarIcon
              key={i}
              filled={isFull}
              half={isHalf}
              className={starSize}
            />
          );
        })}
      </div>
      <span className={`${textSize} text-muted-foreground`}>
        {averageRating.toFixed(1)} ({totalRatings})
      </span>
    </div>
  );
}

export function StarRatingInput({
  courseSlug,
  currentRating,
}: {
  courseSlug: string;
  currentRating: number | null;
}) {
  const fetcher = useFetcher();
  const [hovered, setHovered] = useState<number | null>(null);
  const prevState = useRef(fetcher.state);

  useEffect(() => {
    if (prevState.current === "loading" && fetcher.state === "idle" && fetcher.data?.ok) {
      toast.success("Rating saved!");
    }
    prevState.current = fetcher.state;
  }, [fetcher.state, fetcher.data]);

  const optimisticRating =
    fetcher.formData ? Number(fetcher.formData.get("rating")) : currentRating;
  const displayRating = hovered ?? optimisticRating ?? 0;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Your rating:</span>
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={() => setHovered(null)}
      >
        {Array.from({ length: 5 }, (_, i) => {
          const starValue = i + 1;
          return (
            <button
              key={i}
              type="button"
              className="cursor-pointer p-0.5 transition-transform hover:scale-110"
              onMouseEnter={() => setHovered(starValue)}
              onClick={() => {
                fetcher.submit(
                  { intent: "rate", rating: String(starValue) },
                  { method: "post", action: `/courses/${courseSlug}` }
                );
              }}
            >
              <Star
                className={`size-6 ${
                  starValue <= displayRating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          );
        })}
      </div>
      {optimisticRating && (
        <span className="text-sm font-medium text-muted-foreground">
          {optimisticRating}/5
        </span>
      )}
    </div>
  );
}
