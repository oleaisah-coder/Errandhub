import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import HeroSection from '@/sections/HeroSection';
import HowItWorksSection from '@/sections/HowItWorksSection';
import ServicesSection from '@/sections/ServicesSection';
import BenefitsSection from '@/sections/BenefitsSection';
import TestimonialsSection from '@/sections/TestimonialsSection';
import CTASection from '@/sections/CTASection';
import Footer from '@/sections/Footer';

const LandingPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-white"
    >
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <ServicesSection />
        <BenefitsSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </motion.div>
  );
};

export default LandingPage;
