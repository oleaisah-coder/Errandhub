import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Star, Truck, Users, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/components/store';

const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const { user } = useAuthStore();
  const linkTo = user ? '/request-errand' : '/signup';
  
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [1, 1]); // Keep fully opaque longer
  const scale = useTransform(scrollYProgress, [0, 0.4], [1, 1]); // Keep scale longer


  const stats = [
    { icon: Package, value: '10,000+', label: 'Deliveries' },
    { icon: Users, value: '500+', label: 'Active Runners' },
    { icon: Star, value: '4.9★', label: 'Rating' },
  ];

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#d2f2d4]/30 via-white to-[#d2f2d4]/20"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Orbs */}
        <motion.div
          animate={{
            y: [0, -25, 0],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-20 left-[10%] w-20 h-20 bg-[#277310]/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            y: [0, -15, 0],
            x: [0, -15, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
          className="absolute top-40 right-[15%] w-16 h-16 bg-[#0ea018]/15 rounded-full blur-lg"
        />
        <motion.div
          animate={{
            y: [0, -20, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 4,
          }}
          className="absolute bottom-40 left-[20%] w-24 h-24 bg-[#277310]/5 rounded-full blur-2xl"
        />

        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#277310 1px, transparent 1px), linear-gradient(90deg, #277310 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <motion.div 
        style={{ y, opacity, scale }}
        className="relative z-10 container-max mx-auto section-padding pt-32 pb-20 min-h-screen flex items-center"
      >
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center w-full">
          {/* Content */}
          <div className="order-2 lg:order-1 text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#277310]/10 rounded-full mb-6"
            >
              <span className="w-2 h-2 bg-[#277310] rounded-full animate-pulse" />
              <span className="text-sm font-medium text-[#277310]">
                Now Serving Lagos & Abuja
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 font-['Poppins'] leading-tight mb-6"
            >
              We Run Your{' '}
              <span className="text-[#277310] relative">
                Errands
                <motion.div
                  initial={{ clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' }}
                  animate={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
                  transition={{ duration: 1, delay: 1.2, ease: [0.33, 1, 0.68, 1] }}
                  className="absolute -bottom-0.5 left-0 w-full"
                >
                  <svg
                    viewBox="0 0 200 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-auto drop-shadow-sm"
                  >
                    <path
                      d="M 2,16 C 30,2 120,4 198,14 C 120,10 40,8 2,16 Z"
                      fill="#277310"
                    />
                  </svg>
                </motion.div>
              </span>{' '}
              So You Don't Have To.
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-lg text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0"
            >
              From grocery runs to document delivery, our trusted runners handle 
              your tasks while you focus on what matters most.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
            >
            <Link to={linkTo}>
                <Button
                  size="lg"
                  className="bg-[#277310] hover:bg-[#1e5a10] text-white px-8 py-6 text-base font-medium rounded-xl shadow-lg shadow-[#277310]/25 hover:shadow-xl hover:shadow-[#277310]/30 transition-all duration-300 hover:-translate-y-0.5 w-full sm:w-auto"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>

            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="flex flex-wrap justify-center lg:justify-start gap-6 sm:gap-10"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2 + index * 0.1, duration: 0.5 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-[#277310]/10 rounded-lg flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-[#277310]" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, x: 100, rotateY: -15 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="order-1 lg:order-2 relative"
            style={{ perspective: 1000 }}
          >
            <div className="relative">
              {/* Main Image Container */}
              <motion.div
                whileHover={{ scale: 1.02, rotateY: 5 }}
                transition={{ duration: 0.4 }}
                className="relative z-10 rounded-3xl overflow-hidden shadow-2xl shadow-[#277310]/10"
              >
                <img
                  src="https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?w=800&h=1000&fit=crop&crop=faces"
                  alt="Delivery person with backpack"
                  className="w-full h-[400px] sm:h-[500px] lg:h-[600px] object-cover"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#277310]/20 via-transparent to-transparent" />
              </motion.div>

              {/* Floating Cards */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="absolute -left-4 sm:-left-8 top-1/4 bg-white rounded-2xl shadow-xl p-4 z-20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#277310] rounded-xl flex items-center justify-center">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Fast Delivery</p>
                    <p className="text-xs text-gray-500">Under 60 mins</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4, duration: 0.6 }}
                className="absolute -right-4 sm:-right-8 bottom-1/4 bg-white rounded-2xl shadow-xl p-4 z-20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#0ea018] rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Top Rated</p>
                    <p className="text-xs text-gray-500">4.9/5 stars</p>
                  </div>
                </div>
              </motion.div>

              {/* Decorative Elements */}
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#277310]/10 rounded-full blur-2xl" />
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#0ea018]/10 rounded-full blur-xl" />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
};

export default HeroSection;