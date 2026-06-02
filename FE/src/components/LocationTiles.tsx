import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const locations = [
  {
    name: 'Ho Chi Minh City',
    provinceSlug: 'ho-chi-minh',
    listings: '5,234',
    image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&auto=format&fit=crop',
  },
  {
    name: 'Hanoi',
    provinceSlug: 'ha-noi',
    listings: '4,128',
    image: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=600&auto=format&fit=crop',
  },
  {
    name: 'Da Nang',
    provinceSlug: 'da-nang',
    listings: '1,856',
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&auto=format&fit=crop',
  },
  {
    name: 'Binh Duong',
    provinceSlug: 'binh-duong',
    listings: '982',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop',
  },
  {
    name: 'Dong Nai',
    provinceSlug: 'dong-nai',
    listings: '756',
    image: 'https://images.unsplash.com/photo-1464082354059-27db6ce50048?w=600&auto=format&fit=crop',
  },
  {
    name: 'Hai Phong',
    provinceSlug: 'hai-phong',
    listings: '634',
    image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&auto=format&fit=crop',
  },
];

export const LocationTiles = () => {
  return (
    <section className="section-padding bg-background">
      <div className="max-w-content mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="section-header">
          <div>
            <h2 className="mb-2">Explore by Location</h2>
            <p className="text-muted-foreground">
              Find properties in your preferred area
            </p>
          </div>
          <Link to="/explore" className="text-accent font-medium flex items-center gap-1 hover:gap-2 transition-all">
            View all locations
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Location Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.08 }
            }
          }}
        >
          {locations.map((location) => (
            <motion.div
              key={location.name}
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1 }
              }}
            >
              <Link
                to={`/listings?province=${location.provinceSlug}`}
                className="group relative aspect-[4/5] rounded-xl overflow-hidden card-hover block"
              >
                <img
                  src={location.image}
                  alt={location.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent" />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-semibold text-base mb-1 group-hover:text-accent transition-colors">
                    {location.name}
                  </h3>
                  <p className="text-sm text-white/80">
                    {location.listings} listings
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
