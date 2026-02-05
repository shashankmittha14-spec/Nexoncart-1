import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { Check, Home, Download, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';

const ExitPass = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const { getTotalAmount, getTotalItems, sessionId, clearCart } = useCartStore();
  
  const totalAmount = getTotalAmount();
  const totalItems = getTotalItems();
  const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    const generateQR = async () => {
      const qrData = JSON.stringify({
        sessionId,
        transactionId,
        amount: totalAmount,
        items: totalItems,
        timestamp: new Date().toISOString(),
        status: 'paid',
      });

      const url = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1a1a2e',
          light: '#ffffff',
        },
      });
      setQrCodeUrl(url);
    };

    generateQR();
  }, [sessionId, transactionId, totalAmount, totalItems]);

  const handleNewSession = () => {
    clearCart();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Success Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-success flex items-center justify-center"
          >
            <Check className="w-10 h-10 text-success-foreground" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Payment Complete!</h1>
          <p className="text-muted-foreground">Show this QR code at the exit gate</p>
        </div>

        {/* QR Code Card */}
        <div className="glass-card p-6 mb-6">
          <div className="bg-card rounded-2xl p-6 text-center">
            {qrCodeUrl ? (
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                src={qrCodeUrl}
                alt="Exit QR Code"
                className="w-64 h-64 mx-auto mb-4 rounded-xl"
              />
            ) : (
              <div className="w-64 h-64 mx-auto mb-4 rounded-xl shimmer" />
            )}
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success-light text-success text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Valid for exit
            </div>
          </div>

          {/* Transaction Details */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="font-semibold text-foreground">₹{totalAmount.toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Items</span>
              <span className="font-semibold text-foreground">{totalItems}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Transaction ID</span>
              <span className="font-mono text-xs text-foreground">{transactionId.slice(0, 15)}...</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Time</span>
              <span className="font-semibold text-foreground">
                {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 btn-secondary flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Save
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 btn-secondary flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            Share
          </motion.button>
        </div>

        {/* Instructions */}
        <div className="glass-card p-4 mb-6">
          <h3 className="font-semibold text-foreground mb-3">How to Exit</h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex-shrink-0 flex items-center justify-center text-xs font-bold">1</span>
              <span>Walk to the Qzero exit gate</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex-shrink-0 flex items-center justify-center text-xs font-bold">2</span>
              <span>Show this QR code to the guard</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex-shrink-0 flex items-center justify-center text-xs font-bold">3</span>
              <span>Wait for verification and exit</span>
            </li>
          </ol>
        </div>

        {/* Home Button */}
        <Link to="/" onClick={handleNewSession}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-xl border-2 border-primary text-primary font-semibold flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
};

export default ExitPass;
