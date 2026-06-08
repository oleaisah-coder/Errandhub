import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store';
import Navbar from '@/components/Navbar';
import HeroSection from '@/sections/HeroSection';
import HowItWorksSection from '@/sections/HowItWorksSection';
import ServicesSection from '@/sections/ServicesSection';
import BenefitsSection from '@/sections/BenefitsSection';
import TestimonialsSection from '@/sections/TestimonialsSection';
import CTASection from '@/sections/CTASection';
import Footer from '@/sections/Footer';

const LandingPage = () => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      const dash = user.role === 'admin' ? '/admin-dashboard' :
                   user.role === 'runner' ? '/runner-dashboard' : '/dashboard';
      navigate(dash, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

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
