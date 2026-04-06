import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ClipboardList, Calculator, Bike } from 'lucide-react';

const steps = [
  {
    icon: ClipboardList,
    title: 'Describe What You Need',
    description: 'Tell us your errand, pickup and drop-off locations, and any special instructions. Be as detailed as you need.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=800&fit=crop',
    color: '#277310',
  },
  {
    icon: Calculator,
    title: 'We Set the Price',
    description: 'Transparent pricing with no hidden fees. Know the cost upfront before confirming your errand.',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=800&fit=crop',
    color: '#0ea018',
  },
  {
    icon: Bike,
    title: 'A Runner Will Deliver It',
    description: 'Get real-time updates as your runner completes your errand efficiently and delivers to your doorstep.',
    image: 'https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?w=600&h=800&fit=crop&crop=faces',
    color: '#1e5a10',
  },
];

const HowItWorksSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

  return (
    <section ref={containerRef} className="py-20 lg:py-32 bg-white relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#d2f2d4]/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#277310]/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

      <div className="container-max mx-auto section-padding relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-24"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.2 }}
            className="inline-block px-4 py-1.5 bg-[#277310]/10 text-[#277310] text-sm font-medium rounded-full mb-4"
          >
            Simple Process
          </motion.span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 font-['Poppins'] mb-4">
            How It <span className="text-[#277310]">Works</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Getting your errands done has never been easier. Follow these simple steps 
            and let us handle the rest.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-16 lg:space-y-24">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.3 + index * 0.2 }}
              className={`grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* Image */}
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? -60 : 60 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.4 + index * 0.2 }}
                className={`relative ${index % 2 === 1 ? 'lg:order-2' : ''}`}
              >
                <div className="relative group">
                  {/* Step Number Badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={isInView ? { scale: 1 } : {}}
                    transition={{ delay: 0.6 + index * 0.2, type: 'spring', stiffness: 200 }}
                    className="absolute -top-4 -left-4 w-16 h-16 bg-[#277310] rounded-2xl flex items-center justify-center z-20 shadow-lg"
                  >
                    <span className="text-2xl font-bold text-white">{index + 1}</span>
                  </motion.div>

                  {/* Image Container */}
                  <div className="relative rounded-3xl overflow-hidden shadow-xl">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-[300px] sm:h-[400px] object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                  </div>

                  {/* Decorative Elements */}
                  <div 
                    className="absolute -bottom-4 -right-4 w-full h-full rounded-3xl -z-10"
                    style={{ backgroundColor: `${step.color}20` }}
                  />
                </div>
              </motion.div>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? 60 : -60 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.5 + index * 0.2 }}
                className={`${index % 2 === 1 ? 'lg:order-1' : ''}`}
              >
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${step.color}15` }}
                >
                  <step.icon className="w-8 h-8" style={{ color: step.color }} />
                </motion.div>

                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 font-['Poppins'] mb-4">
                  {step.title}
                </h3>

                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  {step.description}
                </p>

                {/* Features List */}
                <ul className="space-y-3">
                  {index === 0 && (
                    <>
                      <li className="flex items-center gap-3 text-gray-700">
                        <div className="w-5 h-5 rounded-full bg-[#277310]/20 flex items-center justify-center">
                          <div className="w-2 h-2 bg-[#277310] rounded-full" />
                        </div>
                        Multiple pickup locations supported
                      </li>
                      <li className="flex items-center gap-3 text-gray-700">
                        <div className="w-5 h-5 rounded-full bg-[#277310]/20 flex items-center justify-center">
                          <div className="w-2 h-2 bg-[#277310] rounded-full" />
                        </div>
                        Add special instructions for runners
                      </li>
                    </>
                  )}
                  {index === 1 && (
                    <>
                      <li className="flex items-center gap-3 text-gray-700">
                        <div className="w-5 h-5 rounded-full bg-[#0ea018]/20 flex items-center justify-center">
                          <div className="w-2 h-2 bg-[#0ea018] rounded-full" />
                        </div>
                        Item fee + delivery fee + small service fee
                      </li>
                      <li className="flex items-center gap-3 text-gray-700">
                        <div className="w-5 h-5 rounded-full bg-[#0ea018]/20 flex items-center justify-center">
                          <div className="w-2 h-2 bg-[#0ea018] rounded-full" />
                        </div>
                        No surprises, pay what you see
                      </li>
                    </>
                  )}
                  {index === 2 && (
                    <>
                      <li className="flex items-center gap-3 text-gray-700">
                        <div className="w-5 h-5 rounded-full bg-[#1e5a10]/20 flex items-center justify-center">
                          <div className="w-2 h-2 bg-[#1e5a10] rounded-full" />
                        </div>
                        Real-time GPS tracking
                      </li>
                      <li className="flex items-center gap-3 text-gray-700">
                        <div className="w-5 h-5 rounded-full bg-[#1e5a10]/20 flex items-center justify-center">
                          <div className="w-2 h-2 bg-[#1e5a10] rounded-full" />
                        </div>
                        Direct chat with your runner
                      </li>
                    </>
                  )}
                </ul>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Connector Lines (Desktop Only) */}
        <div className="hidden lg:block absolute left-1/2 top-[280px] bottom-[200px] w-px -translate-x-1/2">
          <motion.div
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : {}}
            transition={{ duration: 1.5, delay: 0.8 }}
            className="w-full h-full bg-gradient-to-b from-[#277310] via-[#0ea018] to-[#1e5a10] origin-top"
          />
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
