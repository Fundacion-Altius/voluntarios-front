"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (newRating: number) => void;
  maxRating?: number;
  size?: string;
  readOnly?: boolean;
  /** Accessible name for the radiogroup (public forms). */
  "aria-label"?: string;
}

export function StarRating({
  value,
  onChange,
  maxRating = 5,
  size = "w-5 h-5",
  readOnly = false,
  "aria-label": ariaLabel,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const displayRating = hoverRating || value;

  const handleClick = (rating: number) => {
    if (!readOnly) {
      onChange(rating);
    }
  };

  return (
    <div
      className="flex items-center"
      role="radiogroup"
      aria-label={ariaLabel}
      onMouseLeave={() => {
        if (!readOnly) setHoverRating(0);
      }}
    >
      {[...Array(maxRating)].map((_, index) => {
        const ratingValue = index + 1;
        const filled = ratingValue <= displayRating;
        return (
          <button
            type="button"
            key={ratingValue}
            role="radio"
            aria-checked={value === ratingValue}
            onClick={() => handleClick(ratingValue)}
            onMouseEnter={() => {
              if (!readOnly) setHoverRating(ratingValue);
            }}
            disabled={readOnly}
            className="focus:outline-none"
            aria-label={`Rate ${ratingValue} out of ${maxRating}`}
          >
            <Star
              className={cn(
                size,
                filled ? "text-yellow-400 fill-yellow-400" : "text-gray-300",
                readOnly ? "cursor-default" : "cursor-pointer",
                !readOnly && "transition-colors"
              )}
              data-testid={filled ? "star-filled" : "star-empty"}
            />
          </button>
        );
      })}
    </div>
  );
}
