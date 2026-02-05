import { motion } from 'framer-motion';
import { ShoppingCart, Scan, CreditCard, LogOut, Shield, Zap, Clock, Smartphone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';

const Landing = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ name?: string; email?: string; phone?: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('qzero_profile');
      if (raw) setProfile(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem('qzero_profile');
      setProfile(null);
    } catch (e) {
      // ignore
    }
    navigate('/login');
  };
  const features = [
    {
      icon: Scan,
      title: 'Scan Products',
      description: 'Simply scan barcodes with your phone camera',
    },
    {
      icon: ShoppingCart,
      title: 'Track Cart',
      description: 'See real-time prices and total as you shop',
    },
    {
      icon: CreditCard,
      title: 'Pay via UPI',
      description: 'Secure payment with your preferred UPI app',
    },
    {
      icon: LogOut,
      title: 'Quick Exit',
      description: 'Show QR code and walk out - no queues!',
    },
  ];

  const benefits = [
    { icon: Clock, text: 'Save up to 15 minutes per visit' },
    { icon: Shield, text: '100% Secure Payments' },
    { icon: Zap, text: 'Instant Checkout' },
    { icon: Smartphone, text: 'Works on any smartphone' },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="glass-card relative mx-4 mt-4 px-6 py-4">
          <div className="absolute inset-0 hidden sm:flex items-center justify-center pointer-events-none">
            <span className="text-sm font-medium text-muted-foreground">The wait ends here</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">Q</span>
              </div>
              <span className="text-xl font-bold text-foreground">Qzero</span>
            </div>
            <div className="flex items-center gap-3">
              {profile ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2">
                      <Avatar>
                        <AvatarFallback>{(profile.name || profile.email || profile.phone || 'U').charAt(0)}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>
                      <div className="font-semibold">{profile.name || 'Customer'}</div>
                      <div className="text-xs text-muted-foreground">{profile.email || profile.phone}</div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="p-2">
                      <button
                        onClick={() => navigate('/shop?openBudget=1')}
                        className="w-full btn-primary py-2 mb-2"
                      >
                        Set Budget
                      </button>
                      <button onClick={handleLogout} className="w-full btn-ghost py-2">
                        Log out
                      </button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/signup">
                  <Button className="btn-primary">Start Shopping</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Skip the queue, save your time
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-foreground mb-6 leading-tight">
              The Future of{' '}
              <span className="text-gradient-primary">Supermarket</span>
              <br />
              is Here
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Scan products, track your cart in real-time, pay with UPI, and walk out. 
              No billing counters. No waiting. Just shopping.
            </p>

            
          </motion.div>

          {/* Phone Mockup - Barcode Scanner UI */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="max-w-xs mx-auto">
              {/* Phone bezel */}
              <div className="bg-neutral-900 rounded-3xl p-3 shadow-2xl">
                <div className="bg-card rounded-2xl overflow-hidden">
                  {/* Top status bar (green) */}
                  <div className="h-8 bg-emerald-600 flex items-center justify-between px-3 text-white text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-white/80 rounded-full" />
                      <span className="w-2 h-2 bg-white/80 rounded-full" />
                    </div>
                    <div className="text-[10px]">9:41</div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-white/80 rounded-full" />
                      <span className="w-2 h-2 bg-white/80 rounded-full" />
                    </div>
                  </div>

                  <div className="p-4">
                    {/* Scanner viewport */}
                    <div className="h-44 rounded-lg border-2 border-emerald-400/40 flex items-center justify-center bg-gradient-to-b from-emerald-50 to-transparent">
                      <div className="w-40 h-28 rounded-md border-2 border-emerald-400/60" />
                    </div>

                    {/* Scanning status */}
                    <div className="mt-4 bg-card p-3 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-foreground">Scanning barcode...</div>
                        <div className="text-xs text-muted-foreground">Live</div>
                      </div>
                      <div className="w-full h-2 bg-foreground/5 rounded-full mt-3 overflow-hidden">
                        <div className="h-2 bg-emerald-500 w-1/2 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items card below phone */}
              <div className="glass-card mt-5 p-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-foreground">Items in Cart</h4>
                  <span className="text-sm text-accent font-semibold">5</span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Total Amount</div>
                  <div className="text-2xl font-bold text-gradient-primary">₹1,245</div>
                </div>

                <div className="h-2 bg-foreground/5 rounded-full mt-3 overflow-hidden">
                  <div className="h-2 bg-emerald-500 w-3/4 rounded-full" />
                </div>

                <div className="text-sm text-muted-foreground mt-2">Budget: ₹1,245 / ₹2,000</div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How Qzero Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Four simple steps to a queue-free shopping experience
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 text-center group hover:shadow-glow transition-shadow duration-300"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <feature.icon className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                </div>
                <div className="text-sm font-semibold text-primary mb-2">Step {index + 1}</div>
                <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="container max-w-6xl">
          <div className="glass-card p-8 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.text}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-accent/10 flex items-center justify-center">
                    <benefit.icon className="w-6 h-6 text-accent" />
                  </div>
                  <p className="text-sm md:text-base font-medium text-foreground">{benefit.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center glass-card p-8 md:p-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Skip the Queue?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join thousands of smart shoppers who save time every day
            </p>
            <Link to="/signup">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary text-lg px-10 py-4"
              >
                Start your first session with Qzero
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">Q</span>
              </div>
              <span className="font-semibold text-foreground">Qzero</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Qzero. Revolutionizing supermarket checkout.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/login?role=admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Admin
              </Link>
              <Link to="/login?role=guard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Guard Portal
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
