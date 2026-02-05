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

const Shop = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [profile, setProfile] = useState<{ name?: string; email?: string; phone?: string } | null>(null);

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

  // open budget modal if requested via query param (e.g. /shop?openBudget=1)
  const [searchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get('openBudget')) {
      setShowBudgetModal(true);
    }
  }, [searchParams]);

  const startScanner = useCallback(async () => {
    // Make scanner visible before starting so mobile browsers can attach camera stream correctly
    setIsScanning(true);
    try {
      const html5QrCode = new Html5Qrcode('scanner');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
        },
        (decodedText) => {
          // Find product by barcode
          const product = findProductByBarcode(decodedText);
          if (product) {
            addItem(product);
            toast.success(`Added ${product.name} to cart`, {
              description: `₹${product.price}`,
            });
          } else {
            // For demo, add a random product when barcode not found
            const randomProduct = mockProducts[Math.floor(Math.random() * mockProducts.length)];
            addItem(randomProduct);
            toast.success(`Added ${randomProduct.name} to cart`, {
              description: `₹${randomProduct.price}`,
            });
          }
        },
        () => {
          // QR Code scan error - silent
        }
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      toast.error('Could not access camera', {
        description: 'Please allow camera access to scan products',
      });
      // revert UI state
      setIsScanning(false);
    }
  }, [addItem]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

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

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40">
        <div className="glass-card mx-4 mt-4 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">Q</span>
              </div>
              <span className="font-semibold text-foreground">Qzero</span>
            </div>
            <div className="flex items-center gap-2">
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
                      <button onClick={handleLogout} className="w-full btn-ghost py-2">
                        Log out
                      </button>
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
          {overBudget && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 p-4 rounded-xl bg-warning/10 border border-warning/30 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-warning flex items-center justify-center pulse-ring">
                <AlertTriangle className="w-5 h-5 text-warning-foreground" />
              </div>
              <div>
                <p className="font-semibold text-warning">Budget Exceeded!</p>
                <p className="text-sm text-muted-foreground">
                  You're ₹{(totalAmount - (budgetLimit || 0)).toFixed(0)} over your limit
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scanner Section */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Scan Products</h2>
            {isScanning && (
              <span className="badge-success flex items-center gap-1">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                Scanning
              </span>
            )}
          </div>

          <div 
            id="scanner" 
            className={`rounded-xl overflow-hidden bg-foreground/5 ${
              isScanning ? 'aspect-video' : 'hidden'
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
              <span className="font-medium text-foreground">Tap to Start Scanning</span>
              <span className="text-sm text-muted-foreground">Point camera at product barcode</span>
            </motion.button>
          )}

          {isScanning && (
            <Button
              onClick={stopScanner}
              variant="outline"
              className="w-full mt-4"
            >
              <X className="w-4 h-4 mr-2" />
              Stop Scanner
            </Button>
          )}
        </div>

        {/* Quick Add Section (for demo) */}
        <div className="glass-card p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Add (Demo)</h3>
          <div className="grid grid-cols-2 gap-3">
            {mockProducts.slice(0, 4).map((product) => (
              <motion.button
                key={product.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  addItem(product);
                  toast.success(`Added ${product.name}`, {
                    description: `₹${product.price}`,
                  });
                }}
                className="p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors text-left"
              >
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-20 object-cover rounded-lg mb-2"
                />
                <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                <p className="text-sm text-primary font-semibold">₹{product.price}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Live Cart Summary */}
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{totalItems} items</span>
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
                    <p className="text-sm text-muted-foreground">{totalItems} items</p>
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
                  Proceed to Pay
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
                  <h2 className="text-xl font-bold text-foreground">Your Cart</h2>
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
                  <span className="text-lg font-semibold text-foreground">Total</span>
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
                  Proceed to Payment
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
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md"
            >
              <div className="glass-card p-6">
                <h3 className="text-xl font-bold text-foreground mb-2">Set Budget Limit</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  We'll alert you when your cart exceeds this amount
                </p>
                <input
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  placeholder="Enter amount in ₹"
                  className="input-premium mb-4"
                />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowBudgetModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSetBudget}
                    className="btn-primary flex-1"
                  >
                    Set Limit
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Shop;
