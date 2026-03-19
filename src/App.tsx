import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, logout } from './firebase';
import { MessageSquare, Library, LogOut, LogIn, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import Chat from './components/Chat';
import Categories from './components/Categories';
import Feed from './components/Feed';
import TheoryDetail from './components/TheoryDetail';
import SeedButton from './components/SeedButton';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#0a0908] flex items-center justify-center">
        <div className="animate-pulse text-[#d4c4b7]">Loading Parableus...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#0a0908] text-[#d4c4b7] font-sans flex overflow-hidden">
        {/* Mobile Sidebar Toggle */}
        <button 
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#2a2422] rounded-xl shadow-md shadow-black/50 text-[#d4c4b7]"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Sidebar */}
        <AnimatePresence>
          {(isSidebarOpen || window.innerWidth >= 768) && (
            <motion.div 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#1a1614] border-r border-[#3c2f2f] flex flex-col shadow-xl shadow-black/50"
            >
              <div className="p-6">
                <h1 className="text-2xl font-serif tracking-widest text-[#e8dcc7] mb-8">PARABLEUS</h1>
                
                <nav className="space-y-2">
                  <NavLink to="/" icon={<MessageSquare size={20} />} label="Parableus AI" onClick={() => setIsSidebarOpen(false)} />
                  <NavLink to="/categories" icon={<Library size={20} />} label="Theories" onClick={() => setIsSidebarOpen(false)} />
                </nav>
              </div>

              <div className="mt-auto p-6 border-t border-[#3c2f2f]">
                {user ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=3c2f2f&color=d4c4b7`} alt="Avatar" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                      <span className="text-sm truncate">{user.displayName}</span>
                    </div>
                    <button onClick={logout} className="p-2 hover:bg-[#2a2422] rounded-lg transition-colors" title="Logout">
                      <LogOut size={18} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={signInWithGoogle}
                    className="w-full flex items-center justify-center space-x-2 bg-[#3c2f2f] hover:bg-[#4a3b3b] text-[#e8dcc7] py-2 px-4 rounded-xl transition-colors shadow-md shadow-black/50"
                  >
                    <LogIn size={18} />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
          <Routes>
            <Route path="/" element={<Chat user={user} />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/categories/:category" element={<Feed user={user} />} />
            <Route path="/theory/:theoryId" element={<TheoryDetail user={user} />} />
          </Routes>
          <SeedButton user={user} />
        </main>
      </div>
    </Router>
  );
}

function NavLink({ to, icon, label, onClick }: { to: string, icon: React.ReactNode, label: string, onClick: () => void }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        isActive 
          ? 'bg-[#2a2422] text-[#e8dcc7] shadow-sm shadow-black/30' 
          : 'hover:bg-[#2a2422]/50 text-[#a89b8f]'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}
