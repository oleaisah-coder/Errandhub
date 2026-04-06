import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check, Clock, Shield, MapPin, Wallet, Headphones } from 'lucide-react';

const benefits = [
  {
    icon: Clock,
    title: 'Save Time',
    description: 'Focus on what matters while we handle your tasks efficiently.',
  },
  {
    icon: Shield,
    title: 'Reliable Runners',
    description: 'Vetted, trained, and trustworthy delivery partners.',
  },
  {
    icon: MapPin,
    title: 'Live Tracking',
    description: 'Know exactly where your delivery is in real-time.',
  },
  {
    icon: Wallet,
    title: 'Affordable Pricing',
    description: 'Competitive rates with no hidden fees or surprises.',
  },
  {
    icon: Headphones,
    title: '24/7 Availability',
    description: 'Errands completed any time, day or night.',
  },
];

const stats = [
  { value: 10000, suffix: '+', label: 'Deliveries' },
  { value: 500, suffix: '+', label: 'Runners' },
  { value: 4.9, suffix: '★', label: 'Rating', isDecimal: true },
  { value: 24, suffix: '/7', label: 'Service' },
];

const BenefitsSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });
  const [counters, setCounters] = useState(stats.map(() => 0));

  useEffect(() => {
    if (isInView) {
      stats.forEach((stat, index) => {
        const duration = 2000;
        const steps = 60;
        const increment = stat.value / steps;
        let current = 0;
        
        const timer = setInterval(() => {
          current += increment;
          if (current >= stat.value) {
            current = stat.value;
            clearInterval(timer);
          }
          setCounters(prev => {
            const newCounters = [...prev];
            newCounters[index] = stat.isDecimal ? parseFloat(current.toFixed(1)) : Math.floor(current);
            return newCounters;
          });
        }, duration / steps);
      });
    }
  }, [isInView]);

  return (
    <section ref={containerRef} className="py-20 lg:py-32 bg-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-[#d2f2d4]/20 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />

      <div className="container-max mx-auto section-padding relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative group">
              {/* Main Image */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=1000&fit=crop"
                  alt="Happy customer with grocery bag"
                  className="w-full h-[400px] sm:h-[500px] object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#277310]/20 via-transparent to-transparent" />
              </div>

              {/* Floating Card */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-6 max-w-[200px]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-[#277310] border-2 border-white flex items-center justify-center"
                      >
                        <span className="text-xs text-white font-medium">{i}</span>
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">+500</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  Active runners ready to help
                </p>
              </motion.div>

              {/* Decorative */}
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-[#277310]/10 rounded-full blur-2xl" />
            </div>
          </motion.div>

          {/* Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-1.5 bg-[#277310]/10 text-[#277310] text-sm font-medium rounded-full mb-4">
                Why Choose Us
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 font-['Poppins'] mb-6">
                Why Choose <span className="text-[#277310]">ErrandHub?</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                We combine technology with a human touch to deliver an errand 
                service that truly understands your needs.
              </p>
            </motion.div>

            {/* Benefits List */}
            <div className="space-y-4 mb-10">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, x: 40 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  whileHover={{ x: 10 }}
                  className="flex items-start gap-4 group cursor-default"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-10 h-10 rounded-xl bg-[#277310]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#277310] transition-colors duration-300"
                  >
                    <Check className="w-5 h-5 text-[#277310] group-hover:text-white transition-colors duration-300" />
                  </motion.div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 font-['Poppins'] mb-1">
                      {benefit.title}
                    </h4>
                    <p className="text-gray-600 text-sm">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="grid grid-cols-4 gap-4"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 bg-[#f8fdf8] rounded-xl"
                >
                  <p className="text-2xl sm:text-3xl font-bold text-[#277310] font-['Poppins']">
                    {stat.isDecimal ? counters[index].toFixed(1) : counters[index].toLocaleString()}{stat.suffix}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
