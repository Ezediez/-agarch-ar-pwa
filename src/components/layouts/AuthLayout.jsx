import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col items-center justify-center p-4 overflow-hidden relative">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-5" 
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1516528387618-afa90b13e000?q=80&w=1974&auto=format&fit=crop')" }}
      />
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <Outlet />
      </motion.div>
    </div>
  );
};

export default AuthLayout;