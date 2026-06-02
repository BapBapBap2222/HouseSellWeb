import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import heroImage from '@/assets/images/hero.jpg';
import { cn } from '@/lib/utils';


export const CityHero = () => {

  return (
    <section className="relative min-h-[900px] md:min-h-[1000px] lg:min-h-[calc(100vh)] overflow-hidden">
      {/* Background Image */}
      <motion.div className="absolute inset-0">
        <div className="absolute inset-0 hero-gradient opacity-30 z-10" />
        <img
          src={heroImage}
          alt="City overview"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
      </motion.div>

      {/* Main Content - Bottom Left */}
      <div className="absolute bottom-48 left-4 md:left-10 z-20 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight tracking-tight">
            Turning Dreams <br />
             Into Address
          </h1>
          
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mb-8 font-normal">
            Discover a place you'll love to live. We verify every listing, so you can find your dream home with confidence.
          </p>
        </motion.div>
      </div>

      {/* Scroll Down Indicator */}
      <motion.div 
        className="absolute bottom-4 left-0 w-full z-20 flex flex-col items-center justify-center gap-2 text-white/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{ duration: 0.8, delay: 1, repeat: Infinity, repeatDelay: 1 }}
      >
        <span className="text-xs uppercase tracking-widest font-medium">Scroll Down</span>
        <ArrowDown className="w-4 h-4" />
      </motion.div>
    </section>
  );
};

