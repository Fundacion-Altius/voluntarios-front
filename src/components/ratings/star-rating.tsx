"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (newRating: number) => void;
  maxRating?: number;
  size?: string;
  readOnly?: boolean;
}

export function StarRating({
  value,
  onChange,
  maxRating = 5,
  size = "w-5 h-5",
  readOnly = false,
}: StarRatingProps) {
  const handleClick = (rating: number) => {
    if (!readOnly) {
      onChange(rating);
    }
  };

  return (
    <div className="flex items-center">
      {[...Array(maxRating)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <button
            type="button"
            key={ratingValue}
            onClick={() => handleClick(ratingValue)}
            disabled={readOnly}
            className="focus:outline-none"
            aria-label={`Rate ${ratingValue} out of ${maxRating}`}
          >
            <Star
              className={cn(
                size,
                ratingValue <= value ? "text-yellow-400 fill-yellow-400" : "text-gray-300",
                readOnly ? "cursor-default" : "cursor-pointer hover:text-yellow-400"
              )}
              data-testid={ratingValue <= value ? "star-filled" : "star-empty"}
            />
          </button>
        );
      })}
    </div>
  );
}