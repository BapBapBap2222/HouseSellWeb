import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VIETNAM_PROVINCES } from '@/data/provinces';
import { VIETNAM_ADMINISTRATIVE_UNITS } from '@/data/vietnamAdministrative';
import { motion } from 'framer-motion';
import { MapPin, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const normalizeLocationValue = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const slugifyLocationValue = (value: string): string =>
  normalizeLocationValue(value).replace(/\s+/g, '-');

const getAdministrativeProvince = (provinceName: string) => {
  const normalizedProvince = normalizeLocationValue(provinceName);
  return VIETNAM_ADMINISTRATIVE_UNITS.find(
    (item) =>
      normalizeLocationValue(item.name) === normalizedProvince ||
      normalizeLocationValue(item.full_name) === normalizedProvince,
  );
};

const Explore = () => {
  return (
    <div className="min-h-screen bg-[#F6F7F9]">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-40 pb-16 px-6">
        <div className="max-w-[1440px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Explore <span className="bg-gradient-to-r from-[#4300FF] via-[#0065F8] via-[#00CAFF] to-[#00FFDE] bg-clip-text text-transparent">Vietnam</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover properties across all provinces and cities in Vietnam
            </p>
          </motion.div>

          {/* Provinces Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05,
                  delayChildren: 0.2
                }
              }
            }}
          >
            {VIETNAM_PROVINCES.map((province) => {
              const administrativeProvince = getAdministrativeProvince(province.name);
              const districts = administrativeProvince?.districts.map((district) => ({
                name: district.full_name || district.name,
                slug: slugifyLocationValue(district.full_name || district.name),
              })) ?? province.locations;

              return (
                <motion.div
                  key={province.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        type: "spring" as const,
                        stiffness: 100,
                        damping: 15
                      }
                    }
                  }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border hover:shadow-lg transition-all duration-300 group"
                >
                  <Link to={`/listings?province=${province.slug}`} className="block">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={province.image}
                        alt={province.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <h3 className="text-2xl font-bold text-white mb-1">{province.name}</h3>
                        <div className="flex items-center gap-1 text-white/80 text-sm">
                          <MapPin className="w-4 h-4" />
                          <span>{province.region} Vietnam</span>
                        </div>
                      </div>
                    </div>
                  </Link>

                  <div className="p-6">
                    <p className="text-sm text-muted-foreground mb-3">Districts:</p>
                    <div className="max-h-36 overflow-y-auto pr-1">
                      <div className="flex flex-wrap gap-2">
                        {districts.map((district) => (
                          <Link
                            key={district.slug}
                            to={`/listings?province=${province.slug}&location=${district.slug}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary rounded-full text-sm font-medium text-foreground hover:bg-primary hover:text-white transition-all duration-200 group/badge"
                          >
                            {district.name}
                            <ChevronRight className="w-3 h-3 opacity-0 -ml-1 group-hover/badge:opacity-100 group-hover/badge:ml-0 transition-all" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Explore;
