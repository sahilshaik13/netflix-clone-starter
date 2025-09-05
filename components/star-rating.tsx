"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  initialRating?: number
  onRatingChange?: (rating: number) => void
  readOnly?: boolean
  size?: number
}

export function StarRating({ initialRating = 0, onRatingChange, readOnly = false, size = 24 }: StarRatingProps) {
  const [rating, setRating] = useState(initialRating)
  const [hoverRating, setHoverRating] = useState(0)

  const handleStarClick = (selectedRating: number) => {
    if (!readOnly) {
      setRating(selectedRating)
      onRatingChange?.(selectedRating)
    }
  }

  const handleStarHover = (hoveredRating: number) => {
    if (!readOnly) {
      setHoverRating(hoveredRating)
    }
  }

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverRating(0)
    }
  }

  return (
    <div className="flex" onMouseLeave={handleMouseLeave}>
      {[1, 2, 3, 4, 5].map((starValue) => (
        <Star
          key={starValue}
          size={size}
          className={cn(
            "cursor-pointer transition-colors duration-200",
            (hoverRating || rating) >= starValue ? "fill-yellow-400 text-yellow-400" : "fill-gray-400 text-gray-400",
            readOnly && "cursor-default",
          )}
          onClick={() => handleStarClick(starValue)}
          onMouseEnter={() => handleStarHover(starValue)}
        />
      ))}
    </div>
  )
}
