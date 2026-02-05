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
  const [upiId, setUpiId] = useState('');

  const totalAmount = getTotalAmount();
  const totalItems = getTotalItems();

  useEffect(() => {
    if (items.length === 0 && paymentStep === 'review') {
      navigate('/shop');
    }
  }, [items, navigate, paymentStep]);

  const handlePayment = async () => {
    if (!upiId.trim()) {
      toast.error('Please enter your UPI ID');
      return;
    }

    setPaymentStep('processing');

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 3000));

    setPaymentStep('success');
    toast.success('Payment Successful!', {
      description: 'Your exit pass is ready',
    });

    // Navigate to exit after short delay
    setTimeout(() => {
      navigate('/exit');
    }, 2000);
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

        {/* UPI Payment */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Pay via UPI</h2>
              <p className="text-sm text-muted-foreground">Fast & secure payment</p>
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
    </div>
  );
};

export default Payment;
