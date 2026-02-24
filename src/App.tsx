import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Shop from "./pages/Shop";
import Payment from "./pages/Payment";
import ExitPass from "./pages/ExitPass";
import Admin from "./pages/Admin";
import Guard from "./pages/Guard";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SplashLoader from '@/components/SplashLoader';
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from '@/components/ThemeToggle';

const queryClient = new QueryClient();

const App = () => {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('nexoncart_profile');
      if (raw) setProfile(JSON.parse(raw));
    } catch {}
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SplashLoader videoSrc="/NexonCartvideo.mp4" minMs={5000} />
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/exit" element={<ExitPass />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/guard" element={<Guard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>

        {/* show language switcher across all pages when a profile exists */}
        <LanguageSwitcher />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
