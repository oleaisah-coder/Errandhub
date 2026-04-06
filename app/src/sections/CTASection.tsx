import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/components/store';

const CTASection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });
  const { user } = useAuthStore();
  const linkTo = user ? '/request-errand' : '/signup';


  return (
    <section ref={containerRef} className="py-20 lg:py-32 bg-white relative overflow-hidden">
      <div className="container-max mx-auto section-padding relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="relative bg-gradient-to-br from-[#277310] to-[#1e5a10] rounded-3xl overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: '40px 40px',
              }}
            />
          </div>

          {/* Animated Gradient Line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"
          />

          <div className="grid lg:grid-cols-2 gap-8 items-center p-8 sm:p-12 lg:p-16">
            {/* Content */}
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">
                  Start Your First Errand Today
                </span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-['Poppins'] mb-4"
              >
                Ready to Get Started?
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-lg text-white/80 mb-8 max-w-lg mx-auto lg:mx-0"
              >
                Join thousands of satisfied customers who trust ErrandHub with 
                their daily errands. Your first delivery is just a click away.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Link to={linkTo}>
                  <Button
                    size="lg"
                    className="bg-white text-[#277310] hover:bg-gray-100 px-8 py-6 text-base font-medium rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-0.5 w-full sm:w-auto"
                  >
                    Request an Errand
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>

              </motion.div>
            </div>

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.9 }}
              className="hidden lg:block relative"
            >
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?w=600&h=800&fit=crop&crop=faces"
                  alt="Happy delivery person"
                  className="rounded-2xl shadow-2xl w-full h-[400px] object-cover"
                />
                
                {/* Floating Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.8 }}
                  className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">10,000+</p>
                      <p className="text-xs text-gray-500">Happy Customers</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-10 right-10 w-20 h-20 bg-white/5 rounded-full blur-xl" />
          <div className="absolute bottom-10 left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
