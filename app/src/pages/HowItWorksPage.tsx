import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ClipboardList, Calculator, Bike, ArrowRight, CheckCircle, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/sections/Footer';
import { useAuthStore } from '@/store';

const steps = [
  {
    number: '01',
    icon: ClipboardList,
    title: 'Describe What You Need',
    description: 'Tell us your errand, pickup and drop-off locations, and any special instructions. Be as detailed as you need - our runners are trained to handle complex requests.',
    features: ['Multiple pickup locations', 'Special instructions support', 'Photo attachments'],
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop',
  },
  {
    number: '02',
    icon: Calculator,
    title: 'We Set the Price',
    description: 'Our transparent pricing algorithm calculates the cost based on distance, item value, and urgency. No hidden fees - you know exactly what you\'ll pay before confirming.',
    features: ['Transparent pricing', 'No hidden fees', 'Instant quote'],
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop',
  },
  {
    number: '03',
    icon: Bike,
    title: 'A Runner Will Deliver It',
    description: 'Get real-time updates as your runner completes your errand. Track their location, chat with them directly, and receive your items at your doorstep.',
    features: ['Real-time GPS tracking', 'Direct chat with runner', 'Delivery confirmation'],
    image: 'https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?w=600&h=400&fit=crop&crop=faces',
  },
];

const benefits = [
  { icon: CheckCircle, title: 'Verified Runners', description: 'All runners undergo background checks' },
  { icon: Shield, title: 'Secure Payments', description: 'Your payments are protected' },
  { icon: Clock, title: 'On-Time Delivery', description: '99% of orders delivered on time' },
];

const HowItWorksPage = () => {
  const { user } = useAuthStore();
  const linkTo = user ? '/request-errand' : '/signup';

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="pt-20">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[#d2f2d4]/30 via-white to-[#d2f2d4]/20 py-20">
          <div className="container-max mx-auto section-padding text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="inline-block px-4 py-1.5 bg-[#277310]/10 text-[#277310] text-sm font-medium rounded-full mb-4">
                Simple Process
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 font-['Poppins'] mb-6">
                How <span className="text-[#277310]">ErrandHub</span> Works
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                Getting your errands done has never been easier. Follow these three simple steps 
                and let us handle the rest while you focus on what matters most.
              </p>
                <Link to={linkTo}>
                <Button className="bg-[#277310] hover:bg-[#1e5a10] h-12 px-8">
                  Get Started Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Steps */}
        <section className="py-20">
          <div className="container-max mx-auto section-padding">
            <div className="space-y-24">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.7 }}
                  className={`grid lg:grid-cols-2 gap-12 items-center ${
                    index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  {/* Image */}
                  <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                    <div className="relative">
                      <div className="absolute -top-4 -left-4 w-20 h-20 bg-[#277310] rounded-2xl flex items-center justify-center z-10">
                        <span className="text-3xl font-bold text-white">{step.number}</span>
                      </div>
                      <div className="rounded-3xl overflow-hidden shadow-xl">
                        <img
                          src={step.image}
                          alt={step.title}
                          className="w-full h-[300px] object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-4 -right-4 w-full h-full bg-[#277310]/10 rounded-3xl -z-10" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                    <div className="w-16 h-16 bg-[#277310]/10 rounded-2xl flex items-center justify-center mb-6">
                      <step.icon className="w-8 h-8 text-[#277310]" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 font-['Poppins'] mb-4">
                      {step.title}
                    </h2>
                    <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                      {step.description}
                    </p>
                    <ul className="space-y-3">
                      {step.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-[#277310]/10 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-[#277310]" />
                          </div>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 bg-gray-50">
          <div className="container-max mx-auto section-padding">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 font-['Poppins'] mb-4">
                Why Choose Our Process?
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                We've designed our process to be simple, secure, and efficient.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full text-center">
                    <CardContent className="p-8">
                      <div className="w-16 h-16 bg-[#277310]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <benefit.icon className="w-8 h-8 text-[#277310]" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container-max mx-auto section-padding">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-[#277310] to-[#1e5a10] rounded-3xl p-12 text-center"
            >
              <h2 className="text-3xl font-bold text-white font-['Poppins'] mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-white/80 max-w-xl mx-auto mb-8">
                Join thousands of satisfied customers who trust ErrandHub with their daily errands.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to={linkTo}>
                  <Button className="bg-white text-[#277310] hover:bg-gray-100 h-12 px-8">
                    Create Account
                  </Button>
                </Link>
                <Link to="/services">
                  <Button variant="outline" className="border-white text-white hover:bg-white/10 h-12 px-8">
                    Explore Services
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorksPage;
