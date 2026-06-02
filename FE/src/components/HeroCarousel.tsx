import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import thaodienImg from '@/assets/images/thaodien.jpg';
import nhatrangImg from '@/assets/images/nhatrang.jpg';
import halongImg from '@/assets/images/halong.jpg';
import haiphongImg from '@/assets/images/HaiPhong.jpg';
import phuquocImg from '@/assets/images/phuquoc.jpg';


const SLIDES = [
  {
    id: 1,
    location: "Thao Dien",
    title: "RIVERSIDE LUXURY VILLA",
    description: "Experience the pinnacle of luxury living in this sprawling riverside estate.",
    image: thaodienImg
  },
  {
    id: 2,
    location: "Nha Trang",
    title: "OCEAN VIEW PENTHOUSE",
    description: "Perched high above the bay, this modern penthouse offers breathtaking views.",
    image: nhatrangImg
  },
  {
    id: 3,
    location: "Ha Long Bay",
    title: "HERITAGE BAY RESORT",
    description: "Wake up to the sound of waves in this stunning oceanfront property.",
    image: halongImg
  },
  {
    id: 4,
    location: "Hai Phong",
    title: "GARDEN CITY MANSION",
    description: "Located in the greenest urban area, combining classic elegance with nature.",
    image: haiphongImg
  },
  {
    id: 5,
    location: "Phu Quoc",
    title: "SUNSET BEACH VILLA",
    description: "Escape to the cool island breeze in this charming seaside chalet.",
    image: phuquocImg
  }
];

export const HeroCarousel = memo(({ isAppLoaded = true, onLoadComplete }: { isAppLoaded?: boolean, onLoadComplete?: () => void }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { amount: 0.3 }); // Only run when 30% visible

  // Preload critical images on mount
  useEffect(() => {
    if (!onLoadComplete) return;
    
    // We want to preload the first slide and the first 3 thumbnails to make the initial render smooth.
    const criticalImages = [
      SLIDES[0].image,
      ...[1, 2, 3].map(i => SLIDES[i % SLIDES.length].image)
    ];
    
    let loadedCount = 0;
    let hasLoaded = false;
    
    const handleImageLoad = () => {
      loadedCount++;
      if (loadedCount >= criticalImages.length && !hasLoaded) {
        hasLoaded = true;
        onLoadComplete();
      }
    };

    criticalImages.forEach(src => {
      const img = new Image();
      img.onload = handleImageLoad;
      img.onerror = handleImageLoad; // Continue even if one fails
      img.src = src;
    });
  }, [onLoadComplete]);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  const handleDotClick = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  }, [currentIndex]);

  const getNextSlides = useCallback(() => {
    const slides = [];
    for (let i = 1; i <= 3; i++) {
        slides.push(SLIDES[(currentIndex + i) % SLIDES.length]);
    }
    return slides;
  }, [currentIndex]);

  useEffect(() => {
    if (!isInView || !isAppLoaded) return; // Pause auto-play when not in view or still loading
    
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [nextSlide, isInView, isAppLoaded]);

  return (
    <section ref={containerRef} className="relative h-screen w-full overflow-hidden bg-black text-white">

      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          className="absolute inset-0 z-0"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
            <div className="absolute inset-0 bg-black/20 z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
            <OptimizedImage 
                src={SLIDES[currentIndex].image} 
                alt={SLIDES[currentIndex].title} 
                loading="eager" // Force eager loading for the main hero image
                className="w-full h-full object-cover"
            />
        </motion.div>
      </AnimatePresence>


      <div className="absolute inset-0 z-20 w-full px-4 md:px-10 flex flex-col justify-end pb-20 h-full">
        <div className="max-w-4xl">
             <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={isAppLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight tracking-tight">
                    Turning Dreams <br />
                    Into Address
                </h1>
                
                <p className="text-lg md:text-xl text-white/90 max-w-2xl mb-8 font-normal drop-shadow-md">
                    Discover a place you'll love to live. We verify every listing, so you can find your dream home with confidence.
                </p>

                <div className="flex items-center gap-4">
                     <Button 
                        className="bg-transparent hover:bg-white/20 text-white border border-white/40 rounded-full w-12 h-12 p-0 backdrop-blur-md transition-all"
                        aria-label="Open saved listings"
                        onClick={() => navigate('/listings')}
                    >
                        <Bookmark className="w-5 h-5" />
                    </Button>
                    <Button 
                        className="bg-white text-black hover:bg-white/90 border-none rounded-full h-12 px-8 uppercase tracking-widest text-xs font-bold shadow-lg flex items-center gap-2 group transition-all"
                        onClick={() => navigate('/explore')}
                    >
                        Discover Location
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </motion.div>
        </div>
      </div>


      <div className="absolute bottom-8 right-0 z-30 hidden lg:flex flex-col items-end pr-8">
         <div className="flex gap-4 mb-8">
            <AnimatePresence mode="popLayout">
                {getNextSlides().map((slide, index) => (
                    <motion.div
                        key={slide.id}
                        layoutId={`card-${slide.id}`}
                        initial={{ opacity: 0, x: 100, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -50, scale: 0.8 }}
                        transition={{ duration: 0.6 }}
                        className="relative w-40 h-56 xl:w-48 xl:h-64 rounded-2xl overflow-hidden cursor-pointer group shadow-2xl"
                        onClick={() => {
                            const slideIndex = SLIDES.findIndex(s => s.id === slide.id);
                            handleDotClick(slideIndex);
                        }}
                    >
                        <OptimizedImage 
                            src={slide.image} 
                            alt={slide.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
                        <div className="absolute bottom-4 left-4 right-4">
                             <p className="text-[10px] text-white/70 uppercase tracking-wider mb-1 truncate">
                                {slide.location}
                             </p>
                             <h4 className="text-xs font-bold text-white leading-tight uppercase line-clamp-2">
                                {slide.title}
                             </h4>
                        </div>
                    </motion.div>
                ))}

            </AnimatePresence>
         </div>


         <div className="flex items-center gap-6 w-full justify-end pr-4">
            <div className="flex items-center gap-2 text-white/80 font-mono text-sm">
                <span>0{currentIndex + 1}</span>
                <div className="w-32 h-[2px] bg-white/20 rounded-full overflow-hidden relative">
                    <motion.div 
                        className="absolute inset-0 bg-white"
                        initial={{ width: "0%" }}
                        animate={isAppLoaded ? { width: "100%" } : { width: "0%" }}
                        key={currentIndex}
                        transition={{ duration: 5, ease: "linear" }}
                    />
                </div>
                <span>0{SLIDES.length}</span>
            </div>

            <div className="flex gap-2">
                <button 
                    onClick={prevSlide}
                    className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors backdrop-blur-sm"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                    onClick={nextSlide}
                    className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors backdrop-blur-sm"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
         </div>
      </div>
      

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30 lg:hidden">
            {SLIDES.map((_, idx) => (
                <button
                    key={idx}
                    onClick={() => handleDotClick(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'w-8 bg-white' : 'bg-white/50'}`}
                />
            ))}
      </div>
    </section>
  );
});

