import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, 
  Shield, 
  Check, 
  X, 
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  ShieldX
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface VerificationResult {
  valid: boolean;
  sessionId?: string;
  transactionId?: string;
  amount?: number;
  items?: number;
  timestamp?: string;
  status?: string;
  message?: string;
}

const Guard = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Initialize scanner once the element is ready
  useEffect(() => {
    if (isInitializing && isScanning) {
      const initScanner = async () => {
        try {
          // Small delay to ensure DOM is updated
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const html5QrCode = new Html5Qrcode('guard-scanner');
          scannerRef.current = html5QrCode;

          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            disableFlip: false,
          };

          // Try to get available cameras first
          let startConfig: any = { facingMode: 'environment' };
          
          try {
            const cameras = await Html5Qrcode.getCameras();
            
            if (cameras && cameras.length > 0) {
              // Try to find rear camera on mobile
              let selectedCamera = cameras[0];
              
              for (const camera of cameras) {
                const label = camera.label.toLowerCase();
                if (label.includes('back') || label.includes('rear') || label.includes('environment')) {
                  selectedCamera = camera;
                  break;
                }
              }
              
              startConfig = { deviceId: { exact: selectedCamera.id } };
            }
          } catch (cameraListError) {
            // If camera enumeration fails, fall back to facingMode
            console.warn('Camera enumeration failed, using facingMode fallback:', cameraListError);
          }

          await html5QrCode.start(
            startConfig,
            config,
            (decodedText) => {
              try {
                const data = JSON.parse(decodedText);
                if (data.sessionId && data.transactionId && data.status === 'paid') {
                  setResult({
                    valid: true,
                    sessionId: data.sessionId,
                    transactionId: data.transactionId,
                    amount: data.amount,
                    items: data.items,
                    timestamp: data.timestamp,
                    status: data.status,
                  });
                } else {
                  setResult({
                    valid: false,
                    message: 'Invalid or unpaid exit pass',
                  });
                }
              } catch {
                setResult({
                  valid: false,
                  message: 'Invalid QR code format',
                });
              }
              stopScanner();
            },
            (errorMessage) => {
              // Handle scan errors silently
              console.debug('Scan error:', errorMessage);
            }
          );

          setIsInitializing(false);
        } catch (err) {
          console.error('Error starting scanner:', err);
          setIsScanning(false);
          setIsInitializing(false);
          
          let errorMessage = 'Unable to access camera. Please check camera permissions and try again.';
          
          if (err instanceof Error) {
            if (err.message.includes('NotAllowedError') || err.message.includes('permission')) {
              errorMessage = 'Camera permission denied. Please enable camera access in your browser settings.';
            } else if (err.message.includes('NotFoundError')) {
              errorMessage = 'No camera found on this device.';
            } else if (err.message.includes('NotReadableError')) {
              errorMessage = 'Camera is already in use by another app. Please close other apps using the camera.';
            }
          }
          
          alert(errorMessage);
        }
      };
      
      initScanner();
    }
  }, [isInitializing, isScanning]);

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const resetScanner = () => {
    setResult(null);
    setIsScanning(true);
    setIsInitializing(true);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40">
        <div className="glass-card mx-4 mt-4 px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <span className="font-semibold text-foreground">Exit Verification</span>
            </div>
            <div className="w-6" />
          </div>
        </div>
      </header>

      <main className="pt-24 px-4 pb-8">
        <div className="max-w-md mx-auto">
          {/* Instructions */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">Guard Portal</h1>
            <p className="text-muted-foreground">Scan customer exit QR codes to verify payment</p>
          </div>

          {/* Scanner */}
          <AnimatePresence mode="wait">
            {!result && (
              <motion.div
                key="scanner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card p-0"
              >
                {isScanning && (
                  <div 
                    id="guard-scanner" 
                    className="rounded-t-xl overflow-hidden bg-black w-full"
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                    }}
                  />
                )}

                {!isScanning && (
                  <div className="p-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setIsScanning(true);
                        setIsInitializing(true);
                      }}
                      className="w-full py-16 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-4 transition-colors hover:border-primary/50 hover:bg-primary/10"
                    >
                      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Camera className="w-10 h-10 text-primary" />
                      </div>
                      <span className="font-semibold text-foreground text-lg">Start Scanning</span>
                      <span className="text-sm text-muted-foreground">Scan customer's exit QR code</span>
                    </motion.button>
                  </div>
                )}

                {isScanning && (
                  <div className="p-4 border-t border-border">
                    <button
                      onClick={stopScanner}
                      className="w-full py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card p-6"
              >
                {result.valid ? (
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className="w-24 h-24 mx-auto mb-6 rounded-full bg-success flex items-center justify-center"
                    >
                      <ShieldCheck className="w-12 h-12 text-success-foreground" />
                    </motion.div>

                    <h2 className="text-2xl font-bold text-success mb-2">✓ Verified</h2>
                    <p className="text-muted-foreground mb-6">Payment confirmed. Allow exit.</p>

                    <div className="bg-success-light rounded-xl p-4 mb-6 text-left">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount Paid</span>
                          <span className="font-semibold text-foreground">₹{result.amount?.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Items</span>
                          <span className="font-semibold text-foreground">{result.items}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Transaction</span>
                          <span className="font-mono text-xs text-foreground">{result.transactionId?.slice(0, 12)}...</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Time</span>
                          <span className="font-semibold text-foreground">
                            {result.timestamp && new Date(result.timestamp).toLocaleTimeString('en-IN', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={resetScanner}
                        className="flex-1 btn-primary flex items-center justify-center gap-2"
                      >
                        <Check className="w-5 h-5" />
                        Approve & Next
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className="w-24 h-24 mx-auto mb-6 rounded-full bg-destructive flex items-center justify-center"
                    >
                      <ShieldX className="w-12 h-12 text-destructive-foreground" />
                    </motion.div>

                    <h2 className="text-2xl font-bold text-destructive mb-2">✗ Invalid</h2>
                    <p className="text-muted-foreground mb-6">{result.message}</p>

                    <div className="bg-destructive/10 rounded-xl p-4 mb-6 flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0" />
                      <p className="text-sm text-foreground text-left">
                        Do not allow exit. Redirect customer to billing counter.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={resetScanner}
                        className="flex-1 btn-secondary flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-5 h-5" />
                        Scan Again
                      </motion.button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Stats */}
          <div className="mt-6 glass-card p-4">
            <h3 className="font-semibold text-foreground mb-3">Today's Stats</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-success">156</p>
                <p className="text-xs text-muted-foreground">Verified</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">3</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">159</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Guard;
