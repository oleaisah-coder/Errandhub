import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    role: 'Business Owner',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
    rating: 5,
    text: 'ErrandHub has been a lifesaver for my business! I can focus on growing my company while they handle all my supply runs and document deliveries. The runners are always professional and punctual.',
  },
  {
    id: 2,
    name: 'James Kowalski',
    role: 'Software Engineer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    rating: 5,
    text: 'The live tracking feature gives me peace of mind. I can see exactly where my delivery is and when it will arrive. Highly recommend this service to anyone with a busy schedule!',
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Marketing Manager',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces',
    rating: 5,
    text: 'Fast, reliable, and affordable. Best errand service in the city! I use them for everything from grocery shopping to picking up dry cleaning. They never disappoint.',
  },
  {
    id: 4,
    name: 'Michael Thompson',
    role: 'Doctor',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces',
    rating: 5,
    text: 'Their runners are professional and courteous. Never had a bad experience. As a healthcare worker with irregular hours, having 24/7 availability is a game-changer.',
  },
];

const TestimonialsSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });
  const [activeIndex, setActiveIndex] = useState(0);

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section ref={containerRef} className="py-20 lg:py-32 bg-[#f8fdf8] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#277310]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#d2f2d4]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="container-max mx-auto section-padding relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-[#277310]/10 text-[#277310] text-sm font-medium rounded-full mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 font-['Poppins'] mb-4">
            What Our <span className="text-[#277310]">Customers</span> Say
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Don't just take our word for it. Here's what our satisfied customers 
            have to say about their experience.
          </p>
        </motion.div>

        {/* Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative max-w-4xl mx-auto"
        >
          {/* Cards Container */}
          <div className="relative h-[400px] sm:h-[350px]" style={{ perspective: 1200 }}>
            <AnimatePresence mode="wait">
              {testimonials.map((testimonial, index) => {
                const isActive = index === activeIndex;
                const isPrev = index === (activeIndex - 1 + testimonials.length) % testimonials.length;
                const isNext = index === (activeIndex + 1) % testimonials.length;

                if (!isActive && !isPrev && !isNext) return null;

                return (
                  <motion.div
                    key={testimonial.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: isActive ? 1 : 0.5,
                      scale: isActive ? 1 : 0.85,
                      x: isPrev ? '-60%' : isNext ? '60%' : 0,
                      rotateY: isPrev ? 25 : isNext ? -25 : 0,
                      zIndex: isActive ? 10 : 5,
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div className={`bg-white rounded-3xl p-8 sm:p-10 shadow-xl h-full ${
                      isActive ? 'shadow-2xl' : 'shadow-lg'
                    }`}>
                      {/* Quote Icon */}
                      <div className="absolute top-6 right-6 w-12 h-12 bg-[#277310]/10 rounded-full flex items-center justify-center">
                        <Quote className="w-6 h-6 text-[#277310]" />
                      </div>

                      {/* Rating */}
                      <div className="flex gap-1 mb-6">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 * i }}
                          >
                            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          </motion.div>
                        ))}
                      </div>

                      {/* Text */}
                      <p className="text-lg sm:text-xl text-gray-700 leading-relaxed mb-8">
                        "{testimonial.text}"
                      </p>

                      {/* Author */}
                      <div className="flex items-center gap-4">
                        <img
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-[#277310]/20"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900 font-['Poppins']">
                            {testimonial.name}
                          </h4>
                          <p className="text-sm text-gray-500">{testimonial.role}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevSlide}
              className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-[#277310] hover:bg-[#277310] hover:text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  whileHover={{ scale: 1.2 }}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === activeIndex
                      ? 'bg-[#277310] w-8'
                      : 'bg-[#277310]/30 hover:bg-[#277310]/50'
                  }`}
                />
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextSlide}
              className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-[#277310] hover:bg-[#277310] hover:text-white transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
