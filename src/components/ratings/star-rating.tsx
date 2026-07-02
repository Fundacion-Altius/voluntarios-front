"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  maxRating?: number;
  size?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  maxRating = 5,
  size = "w-5 h-5",
}) => {
  const [hoverRating, setHoverRating] = useState(value || 0);

  const handleStarClick = (rating: number) => {
    onChange(rating);
  };

  const handleMouseEnter = (rating: number) => {
    setHoverRating(rating);
  };

  const handleMouseLeave = () => {
    setHoverRating(value);
  };

  return (
    <div className="flex items-center space-x-2 ">
      {Array.from({ length: maxRating }).map((_, index) => {
        const rating = index + 1;
        const isFilled = rating <= (hoverRating || value);
        return (
          <button
            key={rating}
            type="button"
            className="focus:outline-none"
            onClick={() => handleStarClick(rating)}
            onMouseEnter={() => handleMouseEnter(rating)}
            onMouseLeave={handleMouseLeave}
            aria-label={`Rate ${rating} stars`}
          >
            <Star
              className={`${size} ${
                isFilled ? "fill-yellow-300 text-yellow-300" : "text-yellow-100"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};
