import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { signInWithGoogle } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-[#1a1614] border border-[#3c2f2f] rounded-2xl p-8 w-full max-w-sm shadow-2xl shadow-black/80 text-center relative"
          >
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 text-[#a89b8f] hover:text-[#e8dcc7] transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-serif text-[#e8dcc7] mb-3">Sign In Required</h2>
            <p className="text-[#a89b8f] mb-8 leading-relaxed">
              You must be signed in to create theories, evolve ideas, and upvote discoveries. Join the conversation!
            </p>
            <div className="space-y-4">
              <button
                onClick={async () => {
                  await signInWithGoogle();
                  onClose();
                }}
                className="w-full flex items-center justify-center space-x-3 bg-[#e8dcc7] text-[#0a0908] hover:bg-[#d4c4b7] px-4 py-3 rounded-xl font-medium transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Sign in with Google</span>
              </button>
              <button
                onClick={onClose}
                className="w-full px-4 py-3 rounded-xl text-[#a89b8f] hover:bg-[#2a2422] transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}