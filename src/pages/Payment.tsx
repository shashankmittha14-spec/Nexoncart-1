import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Smartphone, Check, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';

const Payment = () => {
  const navigate = useNavigate();
  const { items, getTotalAmount, getTotalItems, sessionId, clearCart } = useCartStore();
  const [paymentStep, setPaymentStep] = useState<'review' | 'processing' | 'success'>('review');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | 'cash'>('upi');
  const [upiId, setUpiId] = useState('');
  const [showUpiAuth, setShowUpiAuth] = useState(false);
  const [upiPin, setUpiPin] = useState('');
  // Card fields (mock)
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  // Netbanking
  const [bank, setBank] = useState('');

  const totalAmount = getTotalAmount();
  const totalItems = getTotalItems();

  useEffect(() => {
    if (items.length === 0 && paymentStep === 'review') {
      navigate('/shop');
    }
  }, [items, navigate, paymentStep]);

  const handlePayment = async () => {
    // Basic validation per method
    if (paymentMethod === 'upi') {
      if (!upiId.trim()) {
        toast.error('Please enter your UPI ID');
        return;
      }
      // if UPI selected, show PIN modal before processing
      if (!showUpiAuth) {
        setShowUpiAuth(true);
        return;
      }
    } else if (paymentMethod === 'card') {
      if (cardNumber.replace(/\s+/g, '').length < 12) {
        toast.error('Enter a valid card number');
        return;
      }
      if (!cardName.trim() || !cardExpiry.trim() || cardCvv.trim().length < 3) {
        toast.error('Complete card details');
        return;
      }
    } else if (paymentMethod === 'netbanking') {
      if (!bank) {
        toast.error('Select your bank');
        return;
      }
    } else if (paymentMethod === 'cash') {
      // no fields required; show confirmation toast
      toast.info('Select Pay to confirm cash-on-delivery at the counter');
    }

    setPaymentStep('processing');

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // persist payment summary for exit pass (masked UPI when applicable)
    try {
      const maskUpi = (id: string) => {
        if (!id) return '';
        const parts = id.split('@');
        if (parts.length !== 2) return id.replace(/.(?=.{2})/g, '*');
        const local = parts[0];
        const provider = parts[1];
        const visible = local.slice(0, 1);
        return `${visible}***@${provider}`;
      };

      const summary: any = { method: paymentMethod };
      if (paymentMethod === 'upi') summary.upi = maskUpi(upiId);
      if (paymentMethod === 'card') summary.card = `****${cardNumber.replace(/\s+/g, '').slice(-4)}`;
      localStorage.setItem('nexoncart_last_payment', JSON.stringify(summary));
    } catch (e) {}

    setPaymentStep('success');
    toast.success('Payment Successful!', {
      description: paymentMethod === 'cash' ? 'Pay at the counter and collect your exit pass' : 'Your exit pass is ready',
    });

    // small delay then navigate to exit
    setTimeout(() => {
      navigate('/exit');
    }, 1500);
  };

  const handleConfirmUpi = async () => {
    if (upiPin.trim().length < 4) {
      toast.error('Enter your UPI PIN');
      return;
    }
    // simulate PIN verification delay
    setShowUpiAuth(false);
    setPaymentStep('processing');
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // save masked UPI payment summary
    try {
      const maskUpi = (id: string) => {
        if (!id) return '';
        const parts = id.split('@');
        if (parts.length !== 2) return id.replace(/.(?=.{2})/g, '*');
        const local = parts[0];
        const provider = parts[1];
        const visible = local.slice(0, 1);
        return `${visible}***@${provider}`;
      };
      const summary = { method: 'upi', upi: maskUpi(upiId) };
      localStorage.setItem('nexoncart_last_payment', JSON.stringify(summary));
    } catch (e) {}

    // complete payment flow
    setPaymentStep('success');
    toast.success('Payment Successful!', {
      description: 'Your exit pass is ready',
    });

    // small delay then navigate to exit
    setTimeout(() => {
      navigate('/exit');
    }, 1500);
  };

  if (paymentStep === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 text-center max-w-sm w-full"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Processing Payment</h2>
          <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
          
          <div className="mt-6 p-4 rounded-xl bg-muted/50">
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="text-2xl font-bold text-gradient-primary">₹{totalAmount.toFixed(0)}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (paymentStep === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 text-center max-w-sm w-full"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-success flex items-center justify-center"
          >
            <Check className="w-10 h-10 text-success-foreground" />
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Payment Successful!</h2>
          <p className="text-muted-foreground mb-6">Redirecting to your exit pass...</p>
          
          <div className="p-4 rounded-xl bg-success-light">
            <p className="text-sm text-success">₹{totalAmount.toFixed(0)} paid successfully</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40">
        <div className="glass-card mx-4 mt-4 px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/shop" className="flex items-center gap-2 text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Back</span>
            </Link>
            <h1 className="font-semibold text-foreground">Payment</h1>
            <div className="w-16" />
          </div>
        </div>
      </header>

      <main className="pt-24 px-4">
        {/* Order Summary */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Order Summary</h2>
          
          <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={item.product.image} 
                    alt={item.product.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  ₹{(item.product.price * item.quantity).toFixed(0)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Subtotal ({totalItems} items)</span>
              <span>₹{totalAmount.toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
              <span>Platform Fee</span>
              <span className="text-success">FREE</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-foreground">Total</span>
              <span className="text-2xl font-bold text-gradient-primary">
                ₹{totalAmount.toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Choose Payment Method</h2>

          <div className="flex gap-2 mb-4">
            <button
              className={`px-3 py-2 rounded-lg ${paymentMethod === 'upi' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              onClick={() => setPaymentMethod('upi')}
            >
              UPI
            </button>
            <button
              className={`px-3 py-2 rounded-lg ${paymentMethod === 'card' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              onClick={() => setPaymentMethod('card')}
            >
              Card
            </button>
            <button
              className={`px-3 py-2 rounded-lg ${paymentMethod === 'netbanking' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              onClick={() => setPaymentMethod('netbanking')}
            >
              NetBanking
            </button>
            <button
              className={`px-3 py-2 rounded-lg ${paymentMethod === 'cash' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              onClick={() => setPaymentMethod('cash')}
            >
              Cash
            </button>
          </div>

          {paymentMethod === 'upi' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Pay via UPI</h3>
                  <p className="text-xs text-muted-foreground">Fast & secure</p>
                </div>
              </div>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="Enter your UPI ID (e.g., name@upi)"
                className="input-premium mb-4"
              />
              <div className="flex flex-wrap gap-2 mb-4">
                {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                  <button
                    key={app}
                    onClick={() => setUpiId(`user@${app.toLowerCase()}`)}
                    className="px-4 py-2 rounded-lg bg-muted text-sm font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {app}
                  </button>
                ))}
              </div>
            </div>
          )}

          {paymentMethod === 'card' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Pay with Card</h3>
                  <p className="text-xs text-muted-foreground">We accept Visa, MasterCard, Rupay</p>
                </div>
              </div>
              <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="Card number" className="input-premium mb-3" />
              <div className="grid grid-cols-2 gap-2 mb-3">
                <input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Name on card" className="input-premium" />
                <input value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM/YY" className="input-premium" />
              </div>
              <input value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="CVV" className="input-premium mb-2" />
              <p className="text-xs text-muted-foreground">Card payments are processed securely.</p>
            </div>
          )}

          {paymentMethod === 'netbanking' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">NetBanking</h3>
                  <p className="text-xs text-muted-foreground">Select your bank</p>
                </div>
              </div>
              <select value={bank} onChange={(e) => setBank(e.target.value)} className="input-premium mb-3">
                <option value="">Choose bank</option>
                <option>HDFC Bank</option>
                <option>State Bank of India</option>
                <option>ICICI Bank</option>
                <option>Axis Bank</option>
              </select>
              <p className="text-xs text-muted-foreground">You'll be redirected to your bank to complete payment.</p>
            </div>
          )}

          {paymentMethod === 'cash' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Cash Payment</h3>
                  <p className="text-xs text-muted-foreground">Pay at the store counter when you exit</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">Select <strong>Pay</strong> to confirm cash payment and get your exit pass. Remember to carry exact change if possible.</div>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="glass-card p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">100% Secure Payment</p>
              <p className="text-xs text-muted-foreground">
                Your payment is protected by Razorpay
              </p>
            </div>
          </div>
        </div>

        {/* Session Info */}
        <div className="text-center mb-6">
          <p className="text-xs text-muted-foreground">
            Session ID: {sessionId?.slice(0, 20)}...
          </p>
        </div>

        {/* Pay Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePayment}
          className="btn-primary w-full py-4 text-lg"
        >
          Pay ₹{totalAmount.toFixed(0)}
        </motion.button>
      </main>

      {/* UPI PIN Modal */}
      {showUpiAuth && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowUpiAuth(false)} className="fixed inset-0 bg-foreground/20 z-50" />
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} className="fixed left-0 right-0 bottom-0 z-50 w-full mx-auto rounded-t-xl md:static md:mx-0 md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px]">
            <div className="glass-card p-6 safe-area-inset">
              <h3 className="text-lg font-semibold text-foreground mb-2">UPI Authentication</h3>
              <p className="text-sm text-muted-foreground mb-4">Confirm payment for {upiId || 'your UPI ID'} by entering your UPI PIN.</p>
              <input type="password" value={upiPin} onChange={(e) => setUpiPin(e.target.value)} placeholder="Enter UPI PIN" className="input-premium mb-4" />
              <div className="flex gap-3">
                <button onClick={() => setShowUpiAuth(false)} className="btn-secondary flex-1 py-2">Cancel</button>
                <button onClick={handleConfirmUpi} className="btn-primary flex-1 py-2">Confirm & Pay</button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default Payment;
