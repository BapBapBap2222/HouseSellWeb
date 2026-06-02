import { MouseEvent } from 'react';
import { Heart, MapPin, Bed, Bath, Maximize } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface PropertyCardProps {
  id?: number;
  image: string;
  price: string;
  title: string;
  address: string;
  beds: number;
  baths: number;
  area: number;
  isVerified?: boolean;
  isNew?: boolean;
  isSaved?: boolean;
  className?: string;
  onToggleFavorite?: (event: MouseEvent<HTMLButtonElement>) => void;
}

export const PropertyCard = ({
  id,
  image,
  price,
  title,
  address,
  beds,
  baths,
  area,
  isVerified = false,
  isNew = false,
  isSaved = false,
  className,
  onToggleFavorite
}: PropertyCardProps) => {
  const card = (
    <motion.div
      whileHover={{ y: -4 }}
      className={cn("card-elevated card-hover overflow-hidden group cursor-pointer", className)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
            <span className="badge-new">New</span>
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={onToggleFavorite}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-white transition-all"
          aria-label={isSaved ? 'Remove from saved listings' : 'Save listing'}
        >
          <Heart className={cn('w-5 h-5', isSaved && 'text-red-500 fill-red-500')} />
        </button>

        {/* Price Tag */}
        <div className="absolute bottom-3 left-3 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-bold text-lg">
          {price}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground text-base mb-2 line-clamp-1 group-hover:text-accent transition-colors">
          {title}
        </h3>
        
        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="line-clamp-1">{address}</span>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Bed className="w-4 h-4" />
            <span>{beds} PN</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-4 h-4" />
            <span>{baths} WC</span>
          </div>
          <div className="flex items-center gap-1">
            <Maximize className="w-4 h-4" />
            <span>{area} m²</span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (id) {
    return <Link to={`/property/${id}`} className="block no-underline text-inherit">{card}</Link>;
  }

  return card;
};
