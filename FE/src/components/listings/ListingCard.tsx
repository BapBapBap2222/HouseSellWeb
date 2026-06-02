import { MouseEvent } from 'react';
import { Heart, MapPin, Bed, Bath, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ListingCardProps {
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

export const ListingCard = ({
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
}: ListingCardProps) => {
  return (
    <div 
        onClick={onClick}
        className={cn(
            "group bg-white rounded-2xl overflow-hidden cursor-pointer border transition-all duration-300 ease-in-out",
            isSelected ? "ring-2 ring-primary border-primary shadow-md" : "border-border hover:shadow-lg hover:border-primary/50"
        )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-semibold text-primary">
                {type}
            </span>
        </div>
        <button
          type="button"
          onClick={onToggleFavorite}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-white transition-all"
          aria-label={isSaved ? 'Remove from saved listings' : 'Save listing'}
        >
          <Heart className={cn('w-4 h-4', isSaved && 'text-red-500 fill-red-500')} />
        </button>
      </div>

      <div className="p-4">
        <div className="mb-2 flex flex-col gap-1.5">
            <h3 className="font-semibold text-foreground text-sm leading-snug break-words group-hover:text-primary transition-colors">
            {title}
            </h3>
            <span className="text-primary font-bold text-sm break-words">{price}</span>
        </div>
        
        <div className="flex items-center gap-1 text-muted-foreground text-xs mb-3">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="line-clamp-1">{address}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground border-t border-border pt-3">
          <div className="flex items-center gap-1">
            <Bed className="w-3.5 h-3.5" />
            <span>{beds}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-3.5 h-3.5" />
            <span>{baths}</span>
          </div>
          <div className="flex items-center gap-1">
            <Maximize className="w-3.5 h-3.5" />
            <span>{area}m²</span>
          </div>
        </div>
      </div>
    </div>
  );
};
