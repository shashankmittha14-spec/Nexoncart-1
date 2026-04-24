import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
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
  ArrowLeft,
  Tag,
  ScanBarcode,
  PackagePlus
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
  const { t, i18n } = useTranslation();
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [profile, setProfile] = useState<{ name?: string; email?: string; phone?: string } | null>(null);
  const [recentTx, setRecentTx] = useState<Array<{ transactionId: string; amount: number; items: number; timestamp: string }>>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState<{ name?: string; email?: string; phone?: string; address?: string }>({});
  const [manualBarcodeInput, setManualBarcodeInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<string>(i18n.language || 'en');
  const [aiPosition, setAiPosition] = useState({ x: 0, y: 0 });
  // New product modal state (for unknown barcodes)
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [pendingBarcode, setPendingBarcode] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [lastDetectedFormat, setLastDetectedFormat] = useState('');
  const [scanFeedback, setScanFeedback] = useState<{ barcode: string; name: string; price: number; format: string } | null>(null);
  const lastScannedBarcodeRef = useRef(''); // Track last scanned barcode to prevent duplicates
  const lastScanTimeRef = useRef(0); // Track time of last scan to debounce
  const scanProcessingRef = useRef(false); // Lock to prevent rapid-fire duplicate processing
  const SCAN_DEBOUNCE_MS = 2500; // Minimum time between scanning the same barcode (ms)
  const SCAN_COOLDOWN_MS = 1500; // Cooldown after any scan before next scan is accepted

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

    // Load saved AI Assistant position from localStorage
    try {
      const savedPosition = localStorage.getItem('nexoncart_ai_position');
      if (savedPosition) {
        setAiPosition(JSON.parse(savedPosition));
      }
    } catch (e) {
      // ignore
    }
  }, [setSessionId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('nexoncart_profile');
      if (raw) setProfile(JSON.parse(raw));
    } catch (e) {
      console.debug('Failed to parse nexoncart_profile', e);
    }
    try {
      const tx = JSON.parse(localStorage.getItem('nexoncart_transactions') || '[]');
      if (Array.isArray(tx)) setRecentTx(tx.slice(0, 2));
    } catch (e) {
      console.debug('Failed to parse nexoncart_transactions', e);
    }
    try {
      const rawP = localStorage.getItem('nexoncart_profile');
      if (rawP) {
        const p = JSON.parse(rawP);
        setProfileForm({ name: p.name || '', email: p.email || '', phone: p.phone || '', address: p.address || '' });
      }
    } catch (e) {
      console.debug('Failed to parse nexoncart_profile for form', e);
    }
  }, []);

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };
    if (i18n.on) {
      i18n.on('languageChanged', handleLanguageChange);
    }
    return () => {
      if (i18n.off) {
        i18n.off('languageChanged', handleLanguageChange);
      }
    };
  }, [i18n]);

  const toggleLanguage = () => {
    const nextLang = (currentLanguage || 'en').startsWith('hi') ? 'en' : 'hi';
    i18n.changeLanguage(nextLang);
    try {
      localStorage.setItem('locale', nextLang);
    } catch (e) {
      console.debug('Failed to set locale', e);
    }
  };

  const handleAiDragEnd = (event: unknown, info: { offset: { x: number, y: number } }) => {
    const newPosition = { x: info.offset.x, y: info.offset.y };
    setAiPosition(newPosition);
    // Save to localStorage
    try {
      localStorage.setItem('nexoncart_ai_position', JSON.stringify(newPosition));
    } catch (e) {
      console.debug('Failed to set ai position', e);
    }
  };

  const handleAiCloseChat = () => {
    // Reset position to default after closing
    const defaultPosition = { x: 24, y: -80 };
    setAiPosition(defaultPosition);
    try {
      localStorage.setItem('nexoncart_ai_position', JSON.stringify(defaultPosition));
    } catch (e) {
      console.debug('Failed to set default ai position', e);
    }
  };

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

  const handleBarcodeDetected = useCallback((barcode: string, formatName?: string) => {
    const cleaned = String(barcode || '').trim();
    if (!cleaned) return;

    const now = Date.now();

    // LOCK: If we're still in the cooldown window from the last scan, ignore completely
    if (scanProcessingRef.current) {
      console.debug('🔒 Scan ignored (processing lock active):', cleaned);
      return;
    }

    // Debounce: Ignore if same barcode was scanned recently
    if (cleaned === lastScannedBarcodeRef.current && (now - lastScanTimeRef.current) < SCAN_DEBOUNCE_MS) {
      console.debug('⏱️ Scan ignored (same barcode debounce):', cleaned);
      return;
    }

    // General cooldown: Ignore if any barcode was scanned too recently
    if ((now - lastScanTimeRef.current) < SCAN_COOLDOWN_MS) {
      console.debug('⏱️ Scan ignored (general cooldown):', cleaned);
      return;
    }

    // Acquire processing lock
    scanProcessingRef.current = true;
    lastScannedBarcodeRef.current = cleaned;
    lastScanTimeRef.current = now;

    if (formatName) setLastDetectedFormat(formatName);
    console.log('✅ Barcode accepted for processing:', cleaned, formatName ? `(${formatName})` : '');

    // Look up product by actual barcode
    const product = findProductByBarcode(cleaned);

    if (product) {
      // Known product — add directly
      addItem(product);
      setCartOpen(true);
      setScanFeedback({ barcode: cleaned, name: product.name, price: product.price, format: formatName || 'Unknown' });
      toast.success(`✨ Added ${product.name} to cart!`, {
        description: `₹${product.price}`,
      });
      console.log(`✅ Added ${product.name} (Barcode: ${cleaned})`);
      setManualBarcodeInput('');

      // Auto-clear feedback after 4s
      setTimeout(() => setScanFeedback(null), 4000);
    } else {
      // Unknown barcode — open modal to enter name & price
      setPendingBarcode(cleaned);
      setNewProductName('');
      setNewProductPrice('');
      setShowNewProductModal(true);
      toast.info('🆕 New product detected!', {
        description: `Barcode: ${cleaned}. Enter product details.`,
      });
    }

    // Release processing lock after cooldown
    setTimeout(() => {
      scanProcessingRef.current = false;
      console.debug('🔓 Processing lock released');
    }, SCAN_COOLDOWN_MS);
  }, [addItem]);

  // Confirm adding a new (unknown) product with user-entered price
  const handleConfirmNewProduct = useCallback(() => {
    const price = parseFloat(newProductPrice);
    if (!pendingBarcode || isNaN(price) || price < 0) {
      toast.error('Please enter a valid price');
      return;
    }
    const name = newProductName.trim() || `Product (${pendingBarcode})`;
    const product = {
      id: `scanned_${pendingBarcode}_${Date.now()}`,
      name,
      price,
      barcode: pendingBarcode,
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&h=200&fit=crop',
      category: 'Scanned',
      stock: 99,
    };
    addItem(product);
    setCartOpen(true);
    setScanFeedback({ barcode: pendingBarcode, name, price, format: lastDetectedFormat || 'Manual' });
    toast.success(`✨ Added ${name} to cart!`, { description: `₹${price}` });
    setShowNewProductModal(false);
    setPendingBarcode('');
    setNewProductName('');
    setNewProductPrice('');
    setManualBarcodeInput('');
    setTimeout(() => setScanFeedback(null), 4000);
  }, [pendingBarcode, newProductName, newProductPrice, lastDetectedFormat, addItem]);

  // Trigger scanner start — actual initialization happens in a useEffect after DOM updates
  const startScanner = useCallback(() => {
    setIsScanning(true);
    setIsInitializing(true);
    setShowManualInput(false);
  }, []);

  // Initialize scanner AFTER DOM has rendered the scanner element (fixes camera not opening)
  useEffect(() => {
    if (!isInitializing || !isScanning) return;

    const initScanner = async () => {
      try {
        // Wait for DOM to update — the scanner div needs to be visible before Html5Qrcode can use it
        await new Promise(resolve => setTimeout(resolve, 300));

        const scannerElement = document.getElementById('scanner');
        if (!scannerElement) {
          throw new Error('Scanner element not found in DOM');
        }

        // Explicitly set formats to support 1D barcodes like EAN-13 (used for the Notebook)
        const html5QrCode = new Html5Qrcode('scanner', {
          verbose: false,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.ITF,
          ]
        });

        // Detect mobile viewport to tune scanner options
        const isMobileView = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '') || (typeof window !== 'undefined' && window.innerWidth && window.innerWidth < 720);

        // Use a rectangular qrbox which is ideal for 1D barcodes
        const desktopOptions = {
          fps: 15,
          disableFlip: false, // Allow flipping in case the webcam is mirrored
          qrbox: { width: 400, height: 200 }, // Slightly larger box
        };
        const mobileOptions = {
          fps: 10,
          disableFlip: true,
          qrbox: typeof window !== 'undefined' ? { width: Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.8), height: 150 } : { width: 250, height: 150 },
        };
        const startOptions = isMobileView ? mobileOptions : desktopOptions;
        scannerRef.current = html5QrCode;

        // Map format enum to human-readable names
        const FORMAT_NAMES: Record<number, string> = {
          0: 'QR Code', 1: 'Aztec', 2: 'Codabar', 3: 'Code-39',
          4: 'Code-93', 5: 'Code-128', 6: 'Data Matrix', 7: 'MaxiCode',
          8: 'ITF', 9: 'EAN-13', 10: 'EAN-8', 11: 'PDF-417',
          12: 'RSS-14', 13: 'RSS-Expanded', 14: 'UPC-A', 15: 'UPC-E', 16: 'UPC-EAN',
        };

        // Scanner success callback (used by all start paths)
        const onScanSuccess = (decodedText: string, decodedResult: { result?: { format?: { format?: number; formatName?: string } } }) => {
          const formatId = decodedResult?.result?.format?.format;
          const formatName = (formatId != null && FORMAT_NAMES[formatId]) || decodedResult?.result?.format?.formatName || 'Barcode';
          console.log('📱 Barcode/QR detected:', decodedText, `(${formatName})`);
          handleBarcodeDetected(decodedText, formatName);
        };
        const onScanError = (errorMessage: string) => {
          console.debug('Scanner scanning...', errorMessage);
        };

        // Preferred: ask html5-qrcode for cameras (works on most browsers)
        let started = false;
        try {
          const cameras = await Html5Qrcode.getCameras();
          console.log('Html5Qrcode.getCameras ->', cameras);
          if (cameras && cameras.length > 0) {
            // Prefer a back camera if labelled; otherwise prefer the last camera (often rear on phones)
            const backCam = cameras.find((c) => /back|rear|environment/i.test(c.label || '')) || cameras[cameras.length - 1] || cameras[0];
            console.log('Starting scanner on camera:', backCam);
            await html5QrCode.start(backCam.id, startOptions, onScanSuccess, onScanError);

            // If camera label suggests front camera, mirror the video; otherwise ensure no mirror
            try {
              const isFront = /front|user/i.test(backCam.label || '');
              if (scannerElement) {
                if (isFront) scannerElement.classList.add('mirror');
                else scannerElement.classList.remove('mirror');
              }
            } catch (e) {
              console.debug('Failed to mirror video', e);
            }

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
            onScanSuccess,
            onScanError
          );
          // ensure no mirror when using environment facingMode
          try {
            if (scannerElement) scannerElement.classList.remove('mirror');
          } catch (e) {
            console.debug('Failed to remove mirror', e);
          }
        }
        console.log('✅ Scanner started successfully');
      } catch (err) {
        console.error('❌ Error starting scanner:', err);
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        toast.error('Scanner error', {
          description: `${errorMsg}. Please allow camera access and try again.`,
        });
        setIsScanning(false);
        setShowManualInput(true);
      } finally {
        setIsInitializing(false);
      }
    };

    initScanner();
  }, [isInitializing, isScanning, handleBarcodeDetected]);

  const stopScanner = useCallback(async () => {
    // stop html5-qrcode scanner
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      try {
        scannerRef.current.clear();
      } catch (e) {
        console.debug('Failed to clear scanner', e);
      }
      scannerRef.current = null;
    }

    setIsScanning(false);
  }, []);

  const handleManualBarcode = () => {
    if (manualBarcodeInput.trim()) {
      handleBarcodeDetected(manualBarcodeInput.trim());
      setManualBarcodeInput('');
    }
  };

  useEffect(() => {
    return () => {
      // Use stopScanner for thorough cleanup on unmount
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch (e) {
          console.debug('Failed to stop/clear scanner on unmount', e);
        }
        scannerRef.current = null;
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
                      <button onClick={() => setShowProfileModal(true)} className="w-full btn-ghost py-2 mb-2">
                        Edit Profile
                      </button>
                      <button onClick={toggleLanguage} className="w-full btn-ghost py-2 mb-2 flex items-center justify-center gap-2">
                        <span>🌐</span>
                        {currentLanguage.toUpperCase() === 'HI' ? 'English' : 'हिन्दी'}
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
              className={`mb-6 p-6 rounded-xl shadow-md ${budgetStatus === 'over' ? 'bg-red-50 border border-red-200' : budgetStatus === 'warn' ? 'bg-amber-50 border border-amber-200' : 'bg-cyan-50 border border-cyan-200'
                }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${budgetStatus === 'over' ? 'bg-red-600/10' : budgetStatus === 'warn' ? 'bg-amber-600/10' : 'bg-cyan-600/10'
                    }`}>
                    <AlertTriangle className={`w-6 h-6 ${budgetStatus === 'over' ? 'text-red-600' : budgetStatus === 'warn' ? 'text-amber-600' : 'text-cyan-600'}`} />
                  </div>
                  <div className="min-w-[180px]">
                    <div className="text-sm text-muted-foreground">Remaining</div>
                    <div className={`text-3xl md:text-4xl font-extrabold ${budgetStatus === 'over' ? 'text-red-600' : budgetStatus === 'warn' ? 'text-amber-600' : 'text-cyan-600'
                      }`}>₹{remaining.toFixed(0)}</div>
                    <div className={`text-sm font-semibold mt-1 ${budgetStatus === 'over' ? 'text-red-600' : budgetStatus === 'warn' ? 'text-amber-600' : 'text-cyan-600'}`}>
                      {budgetStatus === 'over' ? `BUDGET EXCEEDED BY ₹${(totalAmount - (budgetLimit || 0)).toFixed(0)}` : budgetStatus === 'warn' ? `Approaching budget — ₹${remaining.toFixed(0)} remaining` : `Within budget — ₹${remaining.toFixed(0)} remaining`}
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full">
                  <div className={`${budgetStatus === 'over' ? 'bg-red-100' : budgetStatus === 'warn' ? 'bg-amber-100' : 'bg-cyan-100'} w-full h-3 rounded-full overflow-hidden`}>
                    <div className={`${budgetStatus === 'over' ? 'bg-red-600' : budgetStatus === 'warn' ? 'bg-amber-600' : 'bg-cyan-600'} h-3`} style={{ width: `${utilizationPct}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-sm text-muted-foreground">Target Budget: ₹{budgetLimit}</div>
                    <div className={`text-sm font-semibold ${budgetStatus === 'over' ? 'text-red-600' : budgetStatus === 'warn' ? 'text-amber-600' : 'text-cyan-600'}`}>{utilizationPct}%</div>
                  </div>
                </div>
              </div>
              {budgetStatus === 'over' && (
                <div className="mt-3 text-center text-sm text-red-600 font-medium">BUDGET EXCEEDED BY ₹{(totalAmount - (budgetLimit || 0)).toFixed(0)}</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Set Budget Button - Always Visible */}
        <div className="mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowBudgetModal(true)}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
          >
            <Wallet className="w-5 h-5" />
            {budgetLimit ? `Budget: ₹${budgetLimit}` : 'Set Budget Limit'}
          </motion.button>
        </div>

        {/* Scanner Section & AI Assistant Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Scanner Section - Left Side */}
          <div className="lg:col-span-2 glass-card p-6">
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
              className={`rounded-xl overflow-hidden bg-foreground/5 w-full ${isScanning ? 'block aspect-square max-w-md mx-auto' : 'hidden'
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

            {/* Scan Feedback Card */}
            <AnimatePresence>
              {scanFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <ScanBarcode className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{scanFeedback.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-bold text-emerald-600">₹{scanFeedback.price}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{scanFeedback.format}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-muted-foreground font-mono">{scanFeedback.barcode}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Manual Barcode Input - Always visible */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-xl"
            >
              <p className="text-sm text-foreground mb-3 font-medium flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                {isScanning ? 'Or enter barcode manually:' : 'Enter barcode to add product:'}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type or paste barcode number..."
                  value={manualBarcodeInput}
                  onChange={(e) => setManualBarcodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualBarcode()}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  onClick={handleManualBarcode}
                  className="bg-primary hover:bg-primary/90"
                  size="sm"
                >
                  Add
                </Button>
              </div>
              {/* Supported formats */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['EAN-13', 'EAN-8', 'UPC-A', 'UPC-E', 'Code-128', 'Code-39', 'QR', 'ITF', 'PDF-417', 'Data Matrix'].map(fmt => (
                  <span key={fmt} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">{fmt}</span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Scans all barcode types • Unknown barcodes prompt for price entry
              </p>
            </motion.div>
          </div>
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
                    } catch (e) {
                      console.debug('Failed to save profile', e);
                    }
                  }}>Save</motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New Product Modal (for unknown barcodes) */}
      <AnimatePresence>
        {showNewProductModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewProductModal(false)}
              className="fixed inset-0 bg-foreground/20 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed z-50 left-0 right-0 bottom-0 mx-auto w-full rounded-t-2xl md:top-1/2 md:left-1/2 md:right-auto md:bottom-auto md:mx-0 md:w-[90%] md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 bg-card border border-border shadow-2xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <PackagePlus className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">New Product Found</h3>
                </div>
                <p className="text-primary-foreground/80 text-sm">
                  This barcode isn't in our system. Add it now!
                </p>
              </div>

              <div className="p-6 safe-area-inset bg-card">
                <div className="mb-5 p-3 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Scanned Barcode</div>
                    <div className="font-mono text-lg font-bold text-foreground tracking-widest">{pendingBarcode}</div>
                  </div>
                  <div className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold uppercase">
                    {lastDetectedFormat || 'Barcode'}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">
                      Product Name <span className="text-muted-foreground font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      placeholder={`Product (${pendingBarcode})`}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">
                      Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-muted-foreground font-bold">₹</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={newProductPrice}
                        onChange={(e) => setNewProductPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-semibold text-lg"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleConfirmNewProduct();
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewProductModal(false);
                      setPendingBarcode('');
                      setNewProductName('');
                      setNewProductPrice('');
                    }}
                    className="flex-1 py-6 rounded-xl border-2"
                  >
                    Cancel
                  </Button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirmNewProduct}
                    className="btn-primary flex-1 py-6 rounded-xl flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add to Cart
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating AI Assistant - Now self-contained with fixed positioning */}
      <AIAssistant user={profile} inline dropUp />
    </div>
  );
};

export default Shop;
