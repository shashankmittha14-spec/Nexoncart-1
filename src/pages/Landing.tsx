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
import AIAssistant from '@/components/AIAssistant';
import { useTranslation } from 'react-i18next';
import { mockProducts } from '@/data/mockProducts';

const Landing = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ name?: string; email?: string; phone?: string } | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('nexoncart_profile');
      if (raw) setProfile(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem('nexoncart_profile');
      setProfile(null);
    } catch (e) {
      // ignore
    }
    navigate('/login');
  };
  const features = [
    {
      icon: Scan,
      titleKey: 'features.scan.title',
      descriptionKey: 'features.scan.desc',
    },
    {
      icon: ShoppingCart,
      titleKey: 'features.track.title',
      descriptionKey: 'features.track.desc',
    },
    {
      icon: CreditCard,
      titleKey: 'features.pay.title',
      descriptionKey: 'features.pay.desc',
    },
    {
      icon: LogOut,
      titleKey: 'features.exit.title',
      descriptionKey: 'features.exit.desc',
    },
  ];

  const benefits = [
    { icon: Clock, textKey: 'benefits.b1' },
    { icon: Shield, textKey: 'benefits.b2' },
    { icon: Zap, textKey: 'benefits.b3' },
    { icon: Smartphone, textKey: 'benefits.b4' },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="glass-card relative mx-4 mt-4 px-6 py-4">
          <div className="absolute inset-0 hidden sm:flex items-center justify-center pointer-events-none">
            <span className="text-sm font-medium text-muted-foreground">{t('header.wait')}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">N</span>
              </div>
              <span className="text-xl font-bold text-foreground">NexonCart</span>
            </div>
            <div className="flex items-center gap-3">
              {profile ? (
                <>
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
                        <div className="font-semibold">{profile.name || t('header.customer')}</div>
                        <div className="text-xs text-muted-foreground">{profile.email || profile.phone}</div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                        <div className="p-2">
                        <button
                          onClick={() => navigate('/shop?openBudget=1')}
                          className="w-full btn-primary py-2 mb-2"
                        >
                          {t('header.setBudget')}
                        </button>
                        <button onClick={handleLogout} className="w-full btn-ghost py-2">
                          {t('header.logout')}
                        </button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Link to="/signup">
                  <Button className="btn-primary">{t('header.startShopping')}</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* AI Assistant */}
      {profile && <AIAssistant user={profile} inline dropUp />}

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
              {t('hero.badge')}
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-foreground mb-6 leading-tight">
              {t('hero.title')}
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              {t('hero.subtitle')}
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
                        <div className="text-sm font-semibold text-foreground">{t('scanner.scanning')}</div>
                        <div className="text-xs text-muted-foreground">{t('scanner.live')}</div>
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
                  <h4 className="text-lg font-semibold text-foreground">{t('scanner.itemsInCart')}</h4>
                  <span className="text-sm text-accent font-semibold">5</span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">{t('scanner.totalAmount')}</div>
                  <div className="text-2xl font-bold text-gradient-primary">₹1,245</div>
                </div>

                <div className="h-2 bg-foreground/5 rounded-full mt-3 overflow-hidden">
                  <div className="h-2 bg-emerald-500 w-3/4 rounded-full" />
                </div>

                <div className="text-sm text-muted-foreground mt-2">{t('scanner.budget', { current: '₹1,245', limit: '₹2,000' })}</div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          </motion.div>
          {/* Categories removed from Landing — moved to Shop page */}
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
              {t('how.title')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              {t('how.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
              <motion.div
                key={feature.titleKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 text-center group hover:shadow-glow transition-shadow duration-300"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <feature.icon className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                </div>
                <div className="text-sm font-semibold text-primary mb-2">{t('step', { n: index + 1 })}</div>
                <h3 className="text-xl font-bold text-foreground mb-2">{t(feature.titleKey)}</h3>
                <p className="text-muted-foreground">{t(feature.descriptionKey)}</p>
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
                  key={benefit.textKey}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-accent/10 flex items-center justify-center">
                    <benefit.icon className="w-6 h-6 text-accent" />
                  </div>
                  <p className="text-sm md:text-base font-medium text-foreground">{t(benefit.textKey)}</p>
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
              {t('ctaFull.title')}
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              {t('ctaFull.subtitle')}
            </p>
            <Link to="/signup">
                <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary text-lg px-10 py-4"
              >
                {t('ctaFull.button')}
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
                <span className="text-primary-foreground font-bold text-sm">N</span>
              </div>
              <span className="font-semibold text-foreground">NexonCart</span>
            </div>
            <p className="text-sm text-muted-foreground">{t('footer.copyright')}</p>
            <div className="flex items-center gap-6">
              <Link to="/login?role=admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.admin')}
              </Link>
              <Link to="/login?role=guard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.guard')}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
