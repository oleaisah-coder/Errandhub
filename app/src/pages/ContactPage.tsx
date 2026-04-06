import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/sections/Footer';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast.success('Message sent successfully! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      content: 'hello@errandhub.com',
      href: 'mailto:hello@errandhub.com',
    },
    {
      icon: Phone,
      title: 'Phone',
      content: '+234 801 234 5678',
      href: 'tel:+2348012345678',
    },
    {
      icon: MapPin,
      title: 'Address',
      content: '123 Business District, Lagos, Nigeria',
      href: '#',
    },
    {
      icon: Clock,
      title: 'Working Hours',
      content: '24/7 - Always Available',
      href: '#',
    },
  ];

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
                Get In Touch
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 font-['Poppins'] mb-4">
                Contact <span className="text-[#277310]">Us</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Have a question or need assistance? We're here to help. 
                Reach out to us and we'll respond as soon as possible.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="py-16 -mt-10">
          <div className="container-max mx-auto section-padding">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={info.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <a href={info.href}>
                    <Card className="h-full hover:shadow-lg transition-shadow border-none shadow-sm bg-white/50 backdrop-blur-sm">
                      <CardContent className="p-6 text-center">
                        <div className="w-14 h-14 bg-[#277310]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                          <info.icon className="w-7 h-7 text-[#277310]" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">{info.title}</h3>
                        <p className="text-gray-600 text-sm">{info.content}</p>
                      </CardContent>
                    </Card>
                  </a>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-16 bg-gray-50/50">
          <div className="container-max mx-auto section-padding">
            <div className="max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-none shadow-xl bg-white shadow-gray-200/50">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 font-['Poppins'] mb-6 text-center">
                      Send Us a Message
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="name">Your Name</Label>
                          <Input
                            id="name"
                            name="name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="h-12 border-gray-100 bg-gray-50/50 focus:bg-white transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="h-12 border-gray-100 bg-gray-50/50 focus:bg-white transition-colors"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          name="subject"
                          placeholder="How can we help?"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          className="h-12 border-gray-100 bg-gray-50/50 focus:bg-white transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          name="message"
                          placeholder="Tell us more about your inquiry..."
                          value={formData.message}
                          onChange={handleChange}
                          required
                          rows={5}
                          className="border-gray-100 bg-gray-50/50 focus:bg-white transition-colors"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-12 bg-[#277310] hover:bg-[#1e5a10] text-white shadow-lg shadow-[#277310]/20"
                      >
                        {isSubmitting ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : (
                          <>
                            <Send className="w-5 h-5 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Interactive Map - OpenStreetMap (No Cost / No Console) */}
        <section className="py-16">
          <div className="container-max mx-auto section-padding">
            <div 
              ref={mapRef}
              className="h-[500px] w-full bg-slate-100 rounded-[2.5rem] shadow-2xl shadow-[#277310]/5 overflow-hidden border-4 border-white"
            >
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                title="Office Location"
                src="https://www.openstreetmap.org/export/embed.html?bbox=3.40,6.41,3.44,6.45&layer=mapnik&marker=6.4281,3.4219"
              />
            </div>
            
            <div className="mt-8 grid md:grid-cols-2 gap-8 items-center bg-white border border-slate-100 p-8 rounded-3xl shadow-lg relative -top-16 z-10 mx-6 sm:mx-12">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-[#277310]/10 rounded-2xl flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-[#277310]" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Main Office</h4>
                  <p className="text-gray-500">123 Business District, Victoria Island</p>
                  <p className="text-gray-500 font-medium">Lagos, Nigeria</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Always Open</h4>
                  <p className="text-gray-500">Available 24 hours a day, 7 days a week</p>
                  <p className="text-[#277310] font-bold">Support Response &lt; 5 mins</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
