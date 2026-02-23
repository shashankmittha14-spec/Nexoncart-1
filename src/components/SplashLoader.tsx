import React, { useEffect, useRef, useState } from 'react';

type SplashLoaderProps = {
  videoSrc?: string;
  minMs?: number;
};

const SplashLoader: React.FC<SplashLoaderProps> = ({ videoSrc = '/mobile-loader.mp4', minMs = 600 }) => {
  const [show, setShow] = useState(true);
  const [isMobile, setIsMobile] = useState(() => {
    // Check mobile on initial mount
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  });
  const startRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Detect mobile on mount and window resize
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShow(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile || !show) {
      return;
    }

    console.log('🎬 SplashLoader: Starting video playback', { videoSrc, isMobile, minMs });
    startRef.current = Date.now();

    const onVideoEnd = () => {
      console.log('🎬 SplashLoader: Video ended');
      const elapsed = Math.max(0, Date.now() - (startRef.current || 0));
      const wait = Math.max(0, minMs - elapsed);
      setTimeout(() => setShow(false), wait);
    };

    const v = videoRef.current;
    if (v) {
      v.muted = true;
      v.playsInline = true;
      v.autoplay = true;
      
      v.onerror = (e) => {
        console.error('🎬 SplashLoader: Video error:', e);
        setTimeout(() => setShow(false), 500);
      };

      // Try to play
      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => console.log('🎬 SplashLoader: Video playing'))
          .catch((err) => {
            console.error('🎬 SplashLoader: Video autoplay failed:', err);
            setTimeout(() => setShow(false), 500);
          });
      }

      v.addEventListener('ended', onVideoEnd);
      v.addEventListener('loadstart', () => console.log('🎬 SplashLoader: Video loadstart'));
      v.addEventListener('canplay', () => console.log('🎬 SplashLoader: Video canplay'));
    }

    // Fallback: hide after minMs + buffer if video doesn't end naturally
    const fallback = setTimeout(() => {
      console.log('🎬 SplashLoader: Fallback timeout - hiding splash');
      setShow(false);
    }, minMs + 5000);

    return () => {
      if (v) {
        v.removeEventListener('ended', onVideoEnd);
      }
      clearTimeout(fallback);
    };
  }, [isMobile, show, minMs, videoSrc]);

  if (!show || !isMobile) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      <div className="w-full h-full flex items-center justify-center relative bg-black">
        {videoSrc ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
            preload="auto"
            crossOrigin="anonymous"
          >
            <source src={videoSrc} type="video/mp4" />
            <source src={videoSrc} type="video/quicktime" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary animate-spin" />
            <p className="text-white text-sm">Loading...</p>
          </div>
        )}
      </div>
      <button
        aria-label="Skip splash"
        className="absolute top-4 right-4 px-3 py-2 rounded-md bg-white/80 text-black text-sm font-medium hover:bg-white transition-all z-[10000]"
        onClick={() => setShow(false)}
      >
        Skip
      </button>
    </div>
  );
};

export default SplashLoader;
