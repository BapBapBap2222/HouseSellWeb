import { motion } from 'framer-motion';
import { MapPin, ChevronRight, Waves, Trees, Car } from 'lucide-react';
import { Link } from 'react-router-dom';

const projects = [
  {
    id: 1,
    name: 'The Global City',
    developer: 'Masterise Homes',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop',
    location: 'District 2, HCMC',
    priceFrom: '12 billion',
    status: 'Open for Sale',
    progress: 65,
    amenities: ['pool', 'garden', 'parking'],
  },
  {
    id: 2,
    name: 'Vinhomes Ocean Park',
    developer: 'Vinhomes',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop',
    location: 'Gia Lam, Hanoi',
    priceFrom: '2.5 billion',
    status: 'Coming Soon',
    progress: 40,
    amenities: ['pool', 'garden'],
  },
  {
    id: 3,
    name: 'Ecopark Grand',
    developer: 'Ecopark',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop',
    location: 'Van Giang, Hung Yen',
    priceFrom: '4.8 billion',
    status: 'Open for Sale',
    progress: 80,
    amenities: ['garden', 'parking'],
  },
];

const amenityIcons: Record<string, React.ReactNode> = {
  pool: <Waves className="w-4 h-4" />,
  garden: <Trees className="w-4 h-4" />,
  parking: <Car className="w-4 h-4" />,
};

export const NewProjects = () => {
  return (
    <section className="section-padding bg-surface">
      <div className="max-w-content mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="section-header">
          <div>
            <h2 className="mb-2">New Launch Projects</h2>
            <p className="text-muted-foreground">
              Latest updates from top real estate developers
            </p>
          </div>
          <Link to="/listings" className="text-accent font-medium flex items-center gap-1 hover:gap-2 transition-all">
            View all projects
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Projects Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.15 }
            }
          }}
        >
          {projects.map((project) => (
            <motion.div
              key={project.id}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 }
              }}
              className="card-elevated card-hover overflow-hidden group"
            >
              <Link to={`/listings?search=${encodeURIComponent(project.name)}`} className="block h-full">
              {/* Image */}
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={project.image}
                  alt={project.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Status Badge */}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    project.status === 'Open for Sale' 
                      ? 'bg-accent text-white' 
                      : 'bg-white/90 text-primary'
                  }`}>
                    {project.status}
                  </span>
                </div>


              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-bold text-lg text-primary mb-2 group-hover:text-accent transition-colors">
                  {project.name}
                </h3>

                <div className="flex items-center gap-1 text-muted-foreground text-sm mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>{project.location}</span>
                </div>

                {/* Price & Progress */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Price from</p>
                    <p className="text-xl font-bold text-accent">{project.priceFrom}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Progress</p>
                    <p className="text-sm font-semibold text-primary">{project.progress}%</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>

                {/* Amenities */}
                <div className="flex items-center gap-3">
                  {project.amenities.map((amenity) => (
                    <div 
                      key={amenity}
                      className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
                      title={amenity}
                    >
                      {amenityIcons[amenity]}
                    </div>
                  ))}
                </div>
              </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
