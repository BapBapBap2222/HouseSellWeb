import { MouseEvent } from 'react';
import { Heart, MapPin, Bed, Bath, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ListingRowProps {
  id: number;
  image: string;
  price: string;
  title: string;
  address: string;
  beds: number;
  baths: number;
  area: number;
  type: string;
  isSelected?: boolean;
  isSaved?: boolean;
  onClick?: () => void;
  onToggleFavorite?: (event: MouseEvent<HTMLButtonElement>) => void;
}

export const ListingRow = ({
  image,
  price,
  title,
  address,
  beds,
  baths,
  area,
  type,
  isSelected,
  isSaved = false,
  onClick,
  onToggleFavorite
}: ListingRowProps) => {
  return (
    <div 
        onClick={onClick}
        className={cn(
            "group bg-white rounded-xl overflow-hidden cursor-pointer border transition-all duration-300 ease-in-out flex gap-4 p-4 hover:shadow-md",
            isSelected ? "ring-2 ring-primary border-primary shadow-md" : "border-border hover:border-primary/50"
        )}
    >
      {/* Image - Left Side */}
      <div className="relative w-48 h-32 flex-shrink-0 overflow-hidden rounded-lg">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-foreground">
          {type}
        </div>
        <button
          type="button"
          onClick={onToggleFavorite}
          className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors group/heart"
          aria-label={isSaved ? 'Remove from saved listings' : 'Save listing'}
        >
          <Heart className={cn('w-4 h-4 text-muted-foreground group-hover/heart:text-red-500 group-hover/heart:fill-current transition-colors', isSaved && 'text-red-500 fill-red-500')} />
        </button>
      </div>

      {/* Content - Right Side */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        {/* Header */}
        <div>
          <div className="mb-2 flex flex-col gap-1.5 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <h3 className="font-semibold text-lg text-foreground leading-tight break-words group-hover:text-primary transition-colors">
              {title}
            </h3>
            <span className="text-xl font-bold text-primary break-words lg:flex-shrink-0 lg:whitespace-nowrap">
              {price}
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{address}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {beds > 0 && (
            <div className="flex items-center gap-1.5">
              <Bed className="w-4 h-4" />
              <span className="font-medium">{beds}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Bath className="w-4 h-4" />
            <span className="font-medium">{baths}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Maximize className="w-4 h-4" />
            <span className="font-medium">{area}m²</span>
          </div>
        </div>
      </div>
    </div>
  );
};
