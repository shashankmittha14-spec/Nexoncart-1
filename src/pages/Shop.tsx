import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  AlertTriangle,
  X,
  ChevronUp,
  Wallet,
  ArrowLeft
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import AIAssistant from '@/components/AIAssistant';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useCartStore } from '@/store/cartStore';
import { findProductByBarcode, mockProducts } from '@/data/mockProducts';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import ThemeToggle from '@/components/ThemeToggle';

const Shop = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isScanning, setIsScanning] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const nativeVideoRef = useRef<HTMLVideoElement | null>(null);
  const nativeStreamRef = useRef<MediaStream | null>(null);
  const nativeDetectorRef = useRef<any>(null);
  const nativeIntervalRef = useRef<number | null>(null);
  const [profile, setProfile] = useState<{ name?: string; email?: string; phone?: string } | null>(null);
  const [recentTx, setRecentTx] = useState<Array<{ transactionId: string; amount: number; items: number; timestamp: string }>>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState<{ name?: string; email?: string; phone?: string; address?: string }>({});
  const [manualBarcodeInput, setManualBarcodeInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const FALLBACK_PRODUCT_ID = '18';

  const { 
    items, 
    addItem, 
    removeItem, 
    updateQuantity, 
    budgetLimit,
    setBudgetLimit,
    getTotalAmount,
    getTotalItems,
    isOverBudget,
    setSessionId
  } = useCartStore();

  // Initialize session
  useEffect(() => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(sessionId);
  }, [setSessionId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('nexoncart_profile');
      if (raw) setProfile(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
    try {
      const tx = JSON.parse(localStorage.getItem('nexoncart_transactions') || '[]');
      if (Array.isArray(tx)) setRecentTx(tx.slice(0, 2));
    } catch {}
    try {
      const rawP = localStorage.getItem('nexoncart_profile');
      if (rawP) {
        const p = JSON.parse(rawP);
        setProfileForm({ name: p.name || '', email: p.email || '', phone: p.phone || '', address: p.address || '' });
      }
    } catch {}
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

  // open budget modal if requested via query param (e.g. /shop?openBudget=1)
  const [searchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get('openBudget')) {
      setShowBudgetModal(true);
    }
  }, [searchParams]);

  const startScanner = useCallback(async () => {
    setIsScanning(true);
    setShowManualInput(false);
    
    try {
      // NOTE: Native BarcodeDetector disabled — less reliable on mobile; Html5Qrcode is preferred
      try {
        const BD = (window as any).BarcodeDetector;
        if (BD && false) { // DISABLED for mobile compatibility
          const desired = ['ean_13', 'ean_8', 'upc_e', 'upc_a', 'code_128', 'code_39', 'qr_code'];
          let supported: string[] = desired;
          if (typeof BD.getSupportedFormats === 'function') {
            try {
              const s = await BD.getSupportedFormats();
              if (Array.isArray(s) && s.length) supported = s;
            } catch {}
          }
          const detector = new BD({ formats: supported });
          nativeDetectorRef.current = detector;

          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
          nativeStreamRef.current = stream;

          const video = document.createElement('video');
          video.autoplay = true;
          video.playsInline = true;
          video.srcObject = stream;
          // wait for video to be ready
          await video.play().catch(() => {});
          nativeVideoRef.current = video;

          nativeIntervalRef.current = window.setInterval(async () => {
            try {
              if (!nativeDetectorRef.current || !nativeVideoRef.current) return;
              const barcodes = await nativeDetectorRef.current.detect(nativeVideoRef.current);
              if (barcodes && barcodes.length) {
                const code = barcodes[0].rawValue || (barcodes[0].rawData && String(barcodes[0].rawData)) || '';
                if (code) {
                  console.log('Native BarcodeDetector decoded:', code);
                  handleBarcodeDetected(code);
                  // stop native detector after first hit
                  if (nativeIntervalRef.current) {
                    clearInterval(nativeIntervalRef.current);
                    nativeIntervalRef.current = null;
                  }
                  if (nativeStreamRef.current) {
                    nativeStreamRef.current.getTracks().forEach((t) => t.stop());
                    nativeStreamRef.current = null;
                  }
                  nativeVideoRef.current = null;
                }
              }
            } catch (detErr) {
              console.debug('BarcodeDetector detect error', detErr);
            }
          }, 200);

          console.log('Using native BarcodeDetector');
          return;
        }
      } catch (nativeErr) {
        console.warn('Native BarcodeDetector failed to initialize:', nativeErr);
      }

      // Skip pre-check permission prompts — Html5Qrcode will request camera access when needed
      // This improves mobile compatibility and avoids duplicate permission dialogs

      const html5QrCode = new Html5Qrcode('scanner');

      // Detect mobile viewport to tune scanner options (larger scan box, lower fps)
      const isMobileView = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '') || (typeof window !== 'undefined' && window.innerWidth && window.innerWidth < 720);
      const desktopOptions = {
        fps: 10,
        // do not restrict qrbox — scan whole frame (better for barcodes)
        // qrbox: undefined,
        disableFlip: true,
        aspectRatio: 1.0,
      };
      const mobileOptions = {
        fps: 8,
        disableFlip: true,
        aspectRatio: 1.0,
        qrbox: typeof window !== 'undefined' ? Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.75) : undefined,
      };
      const startOptions = isMobileView ? mobileOptions : desktopOptions;
      scannerRef.current = html5QrCode;

      // Preferred: ask html5-qrcode for cameras (works on most browsers)
      let started = false;
      try {
        const cameras = await Html5Qrcode.getCameras();
        console.log('Html5Qrcode.getCameras ->', cameras);
        if (cameras && cameras.length > 0) {
          // Prefer a back camera if labelled; otherwise prefer the last camera (often rear on phones)
          const backCam = cameras.find((c) => /back|rear|environment/i.test(c.label || '')) || cameras[cameras.length - 1] || cameras[0];
          console.log('Starting scanner on camera:', backCam);
          await html5QrCode.start(
            backCam.id,
            startOptions,
            (decodedText) => {
              console.log('Scanner decoded:', decodedText);
              handleBarcodeDetected(decodedText);
            },
            (errorMessage) => {
              console.debug('Scanner decode error:', errorMessage);
            }
          );

          // If camera label suggests front camera, mirror the video; otherwise ensure no mirror
          try {
            const scannerEl = document.getElementById('scanner');
            const isFront = /front|user/i.test(backCam.label || '');
            if (scannerEl) {
              if (isFront) scannerEl.classList.add('mirror');
              else scannerEl.classList.remove('mirror');
            }
          } catch {}

          started = true;
        }
      } catch (camErr) {
        // continue to try getUserMedia fallback
        console.warn('Html5Qrcode.getCameras failed:', camErr);
      }

      if (!started) {
        // final fallback: attempt to start with facingMode config
        await html5QrCode.start(
          { facingMode: 'environment' },
          startOptions,
          (decodedText) => {
            console.log('Scanner decoded:', decodedText);
            handleBarcodeDetected(decodedText);
          },
          (errorMessage) => {
            console.debug('Scanner decode error:', errorMessage);
          }
        );
        // ensure no mirror when using environment facingMode
        try {
          const scannerEl = document.getElementById('scanner');
          if (scannerEl) scannerEl.classList.remove('mirror');
        } catch {}
      }
      
      console.log('✅ Scanner started successfully');
    } catch (err) {
      console.error('Error starting scanner:', err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Scanner error', {
        description: `${errorMsg}. Please allow camera access and try again.`,
      });
      setIsScanning(false);
      setShowManualInput(true);
    }
  }, []);

  const stopScanner = useCallback(async () => {
    // stop html5-qrcode scanner
    if (scannerRef.current?.isScanning) {
      try { await scannerRef.current.stop(); } catch {};
      scannerRef.current = null;
    }

    // stop native detector if running
    if (nativeIntervalRef.current) {
      clearInterval(nativeIntervalRef.current);
      nativeIntervalRef.current = null;
    }
    if (nativeStreamRef.current) {
      nativeStreamRef.current.getTracks().forEach((t) => t.stop());
      nativeStreamRef.current = null;
    }
    nativeVideoRef.current = null;

    setIsScanning(false);
  }, []);

  const handleBarcodeDetected = useCallback((barcode: string) => {
    const cleaned = String(barcode || '').trim();
    console.log('Handling barcode:', cleaned);
    const product = findProductByBarcode(cleaned);
    let toAdd = product;
    if (!toAdd) {
      // fallback: add the hardcoded Notebook product (presentation mode)
      const fallback = mockProducts.find((p) => p.id === FALLBACK_PRODUCT_ID);
      if (fallback) {
        console.log('Fallback product used for scanned barcode:', fallback.name);
        toAdd = fallback;
      }
    }

    if (toAdd) {
      addItem(toAdd);
      setCartOpen(true);
      toast.success(`Added ${toAdd.name} to cart`, {
        description: `₹${toAdd.price}`,
      });
      setManualBarcodeInput('');
    } else {
      toast.error('Product not found', {
        description: `Barcode ${cleaned} not in system`,
      });
    }
  }, [addItem]);

  const handleManualBarcode = () => {
    if (manualBarcodeInput.trim()) {
      handleBarcodeDetected(manualBarcodeInput.trim());
      setManualBarcodeInput('');
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop();
      }
    };
  }, []);

  const handleSetBudget = () => {
    const limit = parseInt(budgetInput);
    if (limit > 0) {
      setBudgetLimit(limit);
      setShowBudgetModal(false);
      setBudgetInput('');
      toast.success('Budget limit set', {
        description: `You'll be alerted when spending exceeds ₹${limit}`,
      });
    }
  };

  const proceedToPayment = () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    navigate('/payment');
  };

  const totalAmount = getTotalAmount();
  const totalItems = getTotalItems();
  const overBudget = isOverBudget();
  const remaining = (budgetLimit || 0) - totalAmount;
  const utilizationPct = budgetLimit ? Math.min(100, Math.round((totalAmount / budgetLimit) * 100)) : 0;
  const budgetStatus: 'ok' | 'warn' | 'over' = overBudget ? 'over' : utilizationPct >= 80 ? 'warn' : 'ok';

  return (
    <div className="min-h-screen pb-32 shop-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40">
        <div className="glass-card mx-4 mt-4 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">N</span>
              </div>
              <span className="font-semibold text-foreground">NexonCart</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="mr-2">
                <ThemeToggle />
              </div>
              {profile ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center">
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
                          onClick={() => setShowBudgetModal(true)}
                          className="w-full btn-primary py-2 mb-2"
                        >
                          Set Budget
                        </button>
                        <button onClick={() => setShowProfileModal(true)} className="w-full btn-ghost py-2 mb-2">
                          Edit Profile
                        </button>
                        <button onClick={handleLogout} className="w-full btn-ghost py-2">
                          Log out
                        </button>
                      </div>

                      {/* Recent Transactions (last 2) */}
                      <DropdownMenuSeparator />
                      <div className="px-3 py-2">
                        <div className="text-xs text-muted-foreground mb-2">Recent Transactions</div>
                        {recentTx.length === 0 ? (
                          <div className="text-sm text-muted-foreground">No recent transactions</div>
                        ) : (
                          recentTx.map((r) => (
                            <div key={r.transactionId} className="mb-2 text-sm">
                              <div className="flex items-center justify-between">
                                <div className="font-semibold">₹{r.amount.toFixed(0)}</div>
                                <div className="text-xs text-muted-foreground font-mono">{r.transactionId.slice(0, 12)}...</div>
                              </div>
                              <div className="text-xs text-muted-foreground">{new Date(r.timestamp).toLocaleString()}</div>
                            </div>
                          ))
                        )}
                      </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button 
                  onClick={() => setShowBudgetModal(true)}
                  className="flex items-center gap-1 text-sm text-muted-foreground"
                >
                  <Wallet className="w-4 h-4" />
                  {budgetLimit ? `₹${budgetLimit}` : 'Set Limit'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 px-4">
        {/* Budget Warning */}
        <AnimatePresence>
          {budgetLimit != null && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 p-6 rounded-xl shadow-md ${
                  budgetStatus === 'over' ? 'bg-red-50 border border-red-200' : budgetStatus === 'warn' ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'
                }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${
                    budgetStatus === 'over' ? 'bg-red-600/10' : budgetStatus === 'warn' ? 'bg-amber-600/10' : 'bg-emerald-600/10'
                  }`}>
                    <AlertTriangle className={`w-6 h-6 ${budgetStatus === 'over' ? 'text-red-600' : budgetStatus === 'warn' ? 'text-amber-600' : 'text-emerald-600'}`} />
                  </div>
                  <div className="min-w-[180px]">
                    <div className="text-sm text-muted-foreground">Remaining</div>
                    <div className={`text-3xl md:text-4xl font-extrabold ${
                      budgetStatus === 'over' ? 'text-red-600' : budgetStatus === 'warn' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>₹{remaining.toFixed(0)}</div>
                    <div className={`text-sm font-semibold mt-1 ${budgetStatus === 'over' ? 'text-red-600' : budgetStatus === 'warn' ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {budgetStatus === 'over' ? `BUDGET EXCEEDED BY ₹${(totalAmount - (budgetLimit || 0)).toFixed(0)}` : budgetStatus === 'warn' ? `Approaching budget — ₹${remaining.toFixed(0)} remaining` : `Within budget — ₹${remaining.toFixed(0)} remaining`}
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full">
                  <div className={`${budgetStatus === 'over' ? 'bg-red-100' : budgetStatus === 'warn' ? 'bg-amber-100' : 'bg-emerald-100'} w-full h-3 rounded-full overflow-hidden`}>
                    <div className={`${budgetStatus === 'over' ? 'bg-red-600' : budgetStatus === 'warn' ? 'bg-amber-600' : 'bg-emerald-600'} h-3`} style={{ width: `${utilizationPct}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-sm text-muted-foreground">Target Budget: ₹{budgetLimit}</div>
                    <div className={`text-sm font-semibold ${budgetStatus === 'over' ? 'text-red-600' : budgetStatus === 'warn' ? 'text-amber-600' : 'text-emerald-600'}`}>{utilizationPct}%</div>
                  </div>
                </div>
              </div>
              {budgetStatus === 'over' && (
                <div className="mt-3 text-center text-sm text-red-600 font-medium">BUDGET EXCEEDED BY ₹{(totalAmount - (budgetLimit || 0)).toFixed(0)}</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scanner Section */}
        <div className="glass-card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">{t('shop.scanProducts')}</h2>
            {isScanning && (
              <span className="badge-success flex items-center gap-1">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                {t('scanner.live')}
              </span>
            )}
          </div>

          <div 
            id="scanner" 
            className={`rounded-xl overflow-hidden bg-foreground/5 w-full ${
              isScanning ? 'block aspect-square max-w-md mx-auto' : 'hidden'
            }`}
          />

          {!isScanning && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startScanner}
              className="w-full py-12 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-3 transition-colors hover:border-primary/50 hover:bg-primary/10"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <span className="font-medium text-foreground">{t('shop.tapToStart')}</span>
              <span className="text-sm text-muted-foreground">{t('shop.pointCamera')}</span>
            </motion.button>
          )}

          {isScanning && (
            <Button
              onClick={stopScanner}
              variant="outline"
              className="w-full mt-4"
            >
              <X className="w-4 h-4 mr-2" />
              {t('shop.stopScanner')}
            </Button>
          )}

          {/* Presentation fallback: always add the Notebook (id '18') when scanned code isn't in system */}

          {/* Manual Barcode Input */}
          {showManualInput && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg"
            >
              <p className="text-sm text-amber-800 mb-3 font-medium">Camera not available. Use manual barcode entry:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter barcode number..."
                  value={manualBarcodeInput}
                  onChange={(e) => setManualBarcodeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualBarcode()}
                  className="flex-1 px-3 py-2 rounded-lg border border-amber-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  onClick={handleManualBarcode}
                  className="bg-primary hover:bg-primary/90"
                  size="sm"
                >
                  Add
                </Button>
              </div>
              <div className="flex gap-2 mt-2">
                {!isScanning && (
                  <Button
                    onClick={() => setShowManualInput(false)}
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    Close Manual Input
                  </Button>
                )}

                <Button
                  onClick={() => startScanner()}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                >
                  Retry Camera
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Categories (replacing Quick Add) */}
        <section className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">{t('products.title')}</h3>
            <div className="text-sm text-muted-foreground">Explore categories</div>
          </div>

          {(
            [
              'Dairy Products',
              'Fruits and Vegetables',
              'Kitchen Dinning',
              'Stationary',
            ] as string[]
          ).map((cat) => {
            const keyword = cat.toLowerCase();
            const items = mockProducts.filter((p) => {
              const pc = p.category.toLowerCase();
              if (keyword.includes('dairy') && pc.includes('dairy')) return true;
              if (keyword.includes('fruit') && pc.includes('fruit')) return true;
              if (keyword.includes('vegetable') && pc.includes('vegetable')) return true;
              if (keyword.includes('home') && (pc.includes('clean') || pc.includes('home'))) return true;
              if (keyword.includes('kitchen') && (pc.includes('grain') || pc.includes('oil') || pc.includes('bakery') || pc.includes('grains'))) return true;
              if (keyword.includes('station') && (pc.includes('station') || pc.includes('stationary') || pc.includes('office'))) return true;
              if (keyword.includes('sport') && (pc.includes('sport') || pc.includes('fitness'))) return true;
              return false;
            });

            return (
              <div key={cat} className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">{cat.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">{cat}</div>
                      <div className="font-semibold text-foreground">{items.length} items</div>
                    </div>
                  </div>
                  <button className="text-sm text-primary">View All</button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {items.length > 0 ? (
                    items.slice(0, 4).map((it) => (
                      <motion.button
                        key={it.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          addItem(it);
                          toast.success(`Added ${it.name}`, { description: `₹${it.price}` });
                        }}
                        className="p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors text-left"
                      >
                        <img src={it.image} alt={it.name} className="w-full h-28 object-cover rounded-lg mb-2" />
                        <p className="text-sm font-medium text-foreground truncate">{it.name}</p>
                        <p className="text-sm text-primary font-semibold">₹{it.price}</p>
                      </motion.button>
                    ))
                  ) : (
                    <div className="col-span-full text-sm text-muted-foreground p-4">No items in this category yet.</div>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {/* Live Cart Summary */}
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{t('shop.items', { n: totalItems })}</span>
              <span className="badge-success">Live</span>
            </div>
            <div className="space-y-2">
              {items.slice(-3).map((item) => (
                <div key={item.product.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{item.product.name} × {item.quantity}</span>
                  <span className="text-primary font-medium">₹{item.product.price * item.quantity}</span>
                </div>
              ))}
              {items.length > 3 && (
                <p className="text-sm text-muted-foreground">+{items.length - 3} more items</p>
              )}
            </div>
          </motion.div>
        )}
      </main>

      {/* Bottom Cart Bar */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 safe-area-inset"
          >
            <div 
              className="glass-card p-4 cursor-pointer"
              onClick={() => setCartOpen(true)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center relative">
                    <ShoppingCart className="w-6 h-6 text-primary-foreground" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                      {totalItems}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">₹{totalAmount.toFixed(0)}</p>
                    <p className="text-sm text-muted-foreground">{t('shop.items', { n: totalItems })}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    proceedToPayment();
                  }}
                  className="btn-primary px-6 py-3"
                >
                  {t('shop.proceedToPay')}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 bg-foreground/20 z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl max-h-[80vh] overflow-hidden"
            >
              <div className="p-4 border-b border-border">
                <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">{t('shop.yourCart')}</h2>
                  <button onClick={() => setCartOpen(false)}>
                    <ChevronUp className="w-6 h-6 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[50vh] p-4 space-y-3">
                {items.map((item) => (
                  <motion.div
                    key={item.product.id}
                    layout
                    className="flex items-center gap-3 p-3 bg-background rounded-xl"
                  >
                    <img 
                      src={item.product.image} 
                      alt={item.product.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{item.product.name}</p>
                      <p className="text-primary font-semibold">₹{item.product.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="p-2 text-destructive"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))}
              </div>

              <div className="p-4 border-t border-border bg-card safe-area-inset">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-foreground">{t('shop.proceedToPayment')}</span>
                  <span className="text-2xl font-bold text-gradient-primary">
                    ₹{totalAmount.toFixed(0)}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={proceedToPayment}
                  className="btn-primary w-full py-4 text-lg"
                >
                  {t('shop.proceedToPayment')}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Budget Modal */}
      <AnimatePresence>
        {showBudgetModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBudgetModal(false)}
              className="fixed inset-0 bg-foreground/20 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed z-50 left-0 right-0 bottom-0 mx-auto w-full rounded-t-xl md:top-1/2 md:left-1/2 md:right-auto md:bottom-auto md:mx-0 md:w-[90%] md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2"
            >
              <div className="glass-card p-6 md:rounded-xl">
                <h3 className="text-xl font-bold text-foreground mb-2">{t('shop.setBudgetTitle')}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t('shop.setBudgetDesc')}</p>
                <input
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  placeholder={t('shop.enterAmount')}
                  className="input-premium mb-4"
                />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowBudgetModal(false)}
                    className="flex-1"
                  >
                    {t('shop.cancel')}
                  </Button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSetBudget}
                    className="btn-primary flex-1"
                  >
                    {t('shop.setLimit')}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfileModal(false)}
              className="fixed inset-0 bg-foreground/20 z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.98 }}
              className="fixed z-50 left-0 right-0 bottom-0 mx-auto w-full rounded-t-xl md:top-1/2 md:left-1/2 md:right-auto md:bottom-auto md:mx-0 md:w-[90%] md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2"
            >
              <div className="glass-card p-6 md:rounded-xl safe-area-inset">
                <h3 className="text-xl font-bold text-foreground mb-2">Edit Profile</h3>
                <p className="text-sm text-muted-foreground mb-4">Update your customer details saved locally.</p>
                <label className="block mb-2">
                  <span className="text-sm text-muted-foreground">Full Name</span>
                  <input value={profileForm.name} onChange={(e) => setProfileForm((s) => ({ ...s, name: e.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-transparent px-3 py-2" />
                </label>
                <label className="block mb-2">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <input value={profileForm.email} onChange={(e) => setProfileForm((s) => ({ ...s, email: e.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-transparent px-3 py-2" />
                </label>
                <label className="block mb-2">
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <input value={profileForm.phone} onChange={(e) => setProfileForm((s) => ({ ...s, phone: e.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-transparent px-3 py-2" />
                </label>
                <label className="block mb-4">
                  <span className="text-sm text-muted-foreground">Address</span>
                  <input value={profileForm.address} onChange={(e) => setProfileForm((s) => ({ ...s, address: e.target.value }))} className="mt-1 block w-full rounded-lg border border-border bg-transparent px-3 py-2" />
                </label>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowProfileModal(false)} className="flex-1">Cancel</Button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary flex-1" onClick={() => {
                    // save profile locally
                    try {
                      const prof = { name: profileForm.name || '', email: profileForm.email || '', phone: profileForm.phone || '', address: profileForm.address || '' };
                      localStorage.setItem('nexoncart_profile', JSON.stringify(prof));
                      // update users map as well if identifier exists
                      const id = profileForm.email || profileForm.phone || '';
                      const raw = localStorage.getItem('nexoncart_users');
                      const users = raw ? JSON.parse(raw) : {};
                      if (id) {
                        users[id] = { ...(users[id] || {}), name: prof.name, identifier: id };
                        localStorage.setItem('nexoncart_users', JSON.stringify(users));
                      }
                      setProfile(prof);
                      setShowProfileModal(false);
                      } catch (e) {}
                  }}>Save</motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* AI Assistant - Shop page only */}
      {profile && (
        <div className="fixed bottom-6 left-6 z-50">
          <AIAssistant user={profile} inline dropUp />
        </div>
      )}
    </div>
  );
};

export default Shop;
