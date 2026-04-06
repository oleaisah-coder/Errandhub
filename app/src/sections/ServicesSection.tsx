import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  ShoppingCart, 
  Utensils, 
  Package, 
  FileText, 
  Shirt, 
  Pill, 
  MoreHorizontal 
} from 'lucide-react';

const services = [
  {
    icon: ShoppingCart,
    title: 'Grocery Shopping',
    description: 'Fresh produce and essentials delivered from your favorite stores.',
    color: '#277310',
  },
  {
    icon: Utensils,
    title: 'Food Delivery',
    description: 'Hot meals from your favorite restaurants, delivered fast.',
    color: '#0ea018',
  },
  {
    icon: Package,
    title: 'Package Pickup',
    description: 'Safe collection and delivery of parcels and packages.',
    color: '#1e5a10',
  },
  {
    icon: FileText,
    title: 'Document Delivery',
    description: 'Important papers handled with care and confidentiality.',
    color: '#277310',
  },
  {
    icon: Shirt,
    title: 'Laundry Service',
    description: 'Wash, fold, and dry cleaning pickup and delivery.',
    color: '#0ea018',
  },
  {
    icon: Pill,
    title: 'Pharmacy Runs',
    description: 'Prescription and over-the-counter medication delivery.',
    color: '#1e5a10',
  },
  {
    icon: MoreHorizontal,
    title: 'Custom Errands',
    description: 'Any task, anywhere, anytime. Just tell us what you need.',
    color: '#277310',
  },
];

const ServicesSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

  return (
    <section ref={containerRef} className="py-20 lg:py-32 bg-[#f8fdf8] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-50">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #27731010 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="container-max mx-auto section-padding relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.2 }}
            className="inline-block px-4 py-1.5 bg-[#277310]/10 text-[#277310] text-sm font-medium rounded-full mb-4"
          >
            What We Offer
          </motion.span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 font-['Poppins'] mb-4">
            Our <span className="text-[#277310]">Services</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From everyday tasks to special requests, we've got you covered 
            with our wide range of errand services.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, rotateY: index % 2 === 0 ? -90 : 90 }}
              animate={isInView ? { opacity: 1, rotateY: 0 } : {}}
              transition={{ 
                duration: 0.7, 
                delay: 0.2 + index * 0.1,
                ease: [0.16, 1, 0.3, 1]
              }}
              whileHover={{ 
                y: -10, 
                scale: 1.02,
                transition: { duration: 0.3 }
              }}
              className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-shadow duration-300"
              style={{ perspective: 1000 }}
            >
              {/* Card Border Gradient */}
              <div 
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(135deg, ${service.color}20, transparent)`,
                }}
              />

              {/* Icon */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="relative w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${service.color}15` }}
              >
                <service.icon 
                  className="w-7 h-7 transition-transform duration-300 group-hover:scale-110" 
                  style={{ color: service.color }} 
                />
              </motion.div>

              {/* Content */}
              <h3 className="relative text-lg font-bold text-gray-900 font-['Poppins'] mb-2">
                {service.title}
              </h3>
              <p className="relative text-sm text-gray-600 leading-relaxed">
                {service.description}
              </p>

              {/* Hover Arrow */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileHover={{ opacity: 1, x: 0 }}
                className="absolute bottom-6 right-6 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: service.color }}
              >
                <svg 
                  className="w-4 h-4 text-white" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12"
        >
          <p className="text-gray-600 mb-4">
            Don't see what you need? We can handle custom requests too!
          </p>
          <motion.a
            href="/request-errand"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 text-[#277310] font-medium hover:underline"
          >
            Request a Custom Errand
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;
