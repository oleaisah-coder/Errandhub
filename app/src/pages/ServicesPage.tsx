import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  Utensils, 
  Package, 
  FileText, 
  Shirt, 
  Pill, 
  MoreHorizontal,
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/sections/Footer';
import { useAuthStore } from '@/store';

const services = [
  {
    icon: ShoppingCart,
    title: 'Grocery Shopping',
    description: 'Fresh produce and essentials delivered from your favorite stores. Our runners know where to find the best quality items at the best prices.',
    price: 'From ₦2,000',
    features: ['Same-day delivery', 'Fresh produce guarantee', 'Store selection'],
    color: '#277310',
  },
  {
    icon: Utensils,
    title: 'Food Delivery',
    description: 'Hot meals from your favorite restaurants, delivered fast. We ensure your food arrives fresh and at the right temperature.',
    price: 'From ₦1,500',
    features: ['Hot food guarantee', 'Real-time tracking', 'Multiple restaurants'],
    color: '#0ea018',
  },
  {
    icon: Package,
    title: 'Package Pickup',
    description: 'Safe collection and delivery of parcels and packages. Whether it\'s a document or a large parcel, we\'ve got you covered.',
    price: 'From ₦1,000',
    features: ['Secure handling', 'Signature confirmation', 'Insurance included'],
    color: '#1e5a10',
  },
  {
    icon: FileText,
    title: 'Document Delivery',
    description: 'Important papers handled with care and confidentiality. Perfect for legal documents, contracts, and sensitive materials.',
    price: 'From ₦1,500',
    features: ['Confidential handling', 'Same-day delivery', 'Tracking included'],
    color: '#277310',
  },
  {
    icon: Shirt,
    title: 'Laundry Service',
    description: 'Wash, fold, and dry cleaning pickup and delivery. Schedule regular pickups and never worry about laundry again.',
    price: 'From ₦3,000',
    features: ['Wash & fold', 'Dry cleaning', 'Scheduled pickups'],
    color: '#0ea018',
  },
  {
    icon: Pill,
    title: 'Pharmacy Runs',
    description: 'Prescription and over-the-counter medication delivery. We work with local pharmacies to get you what you need quickly.',
    price: 'From ₦1,500',
    features: ['Prescription pickup', 'OTC medications', 'Discreet packaging'],
    color: '#1e5a10',
  },
  {
    icon: MoreHorizontal,
    title: 'Custom Errands',
    description: 'Any task, anywhere, anytime. Just tell us what you need and we\'ll make it happen. No request is too unusual.',
    price: 'Custom quote',
    features: ['Any task', 'Flexible timing', 'Personalized service'],
    color: '#277310',
  },
];

const pricingTiers = [
  {
    name: 'Standard',
    price: '₦2,000',
    description: 'Perfect for regular errands',
    features: ['2-hour delivery', 'Standard tracking', 'Email support'],
  },
  {
    name: 'Express',
    price: '₦3,500',
    description: 'For urgent deliveries',
    features: ['1-hour delivery', 'Live GPS tracking', 'Priority support', 'Direct runner chat'],
    popular: true,
  },
  {
    name: 'Emergency',
    price: '₦5,000',
    description: 'When every minute counts',
    features: ['30-minute delivery', 'Premium tracking', '24/7 support', 'Dedicated runner'],
  },
];

const ServicesPage = () => {
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
                Our Services
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 font-['Poppins'] mb-6">
                What We <span className="text-[#277310]">Deliver</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                From everyday tasks to special requests, we've got you covered 
                with our wide range of professional errand services.
              </p>
              <Link to={linkTo}>
                <Button className="bg-[#277310] hover:bg-[#1e5a10] h-12 px-8">
                  Request an Errand
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-20">
          <div className="container-max mx-auto section-padding">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                        style={{ backgroundColor: `${service.color}15` }}
                      >
                        <service.icon className="w-7 h-7" style={{ color: service.color }} />
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 font-['Poppins'] mb-2">
                        {service.title}
                      </h3>
                      <p className="text-[#277310] font-semibold mb-4">{service.price}</p>
                      <p className="text-gray-600 mb-6">{service.description}</p>
                      
                      <ul className="space-y-2 mb-6">
                        {service.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-[#277310]" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <Link to={linkTo}>
                        <Button variant="outline" className="w-full">
                          Book Now
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Tiers */}
        <section className="py-20 bg-gray-50">
          <div className="container-max mx-auto section-padding">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 font-['Poppins'] mb-4">
                Delivery Options
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Choose the delivery speed that works best for your needs.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {pricingTiers.map((tier, index) => (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`h-full ${tier.popular ? 'border-2 border-[#277310] relative' : ''}`}>
                    {tier.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-[#277310] text-white text-xs font-medium px-3 py-1 rounded-full">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <CardContent className="p-8 text-center">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{tier.name}</h3>
                      <p className="text-gray-500 text-sm mb-4">{tier.description}</p>
                      <p className="text-4xl font-bold text-[#277310] mb-6">{tier.price}</p>
                      
                      <ul className="space-y-3 mb-8">
                        {tier.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                            <Star className="w-4 h-4 text-[#277310]" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <Link to={linkTo}>
                        <Button 
                          className={tier.popular ? 'bg-[#277310] hover:bg-[#1e5a10] w-full' : 'w-full'}
                          variant={tier.popular ? 'default' : 'outline'}
                        >
                          Choose {tier.name}
                        </Button>
                      </Link>
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
                Need Something Else?
              </h2>
              <p className="text-white/80 max-w-xl mx-auto mb-8">
                Can't find what you're looking for? We handle custom requests too! 
                Just describe what you need and we'll make it happen.
              </p>
              <Link to={linkTo}>
                <Button className="bg-white text-[#277310] hover:bg-gray-100 h-12 px-8">
                  Request Custom Errand
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ServicesPage;
