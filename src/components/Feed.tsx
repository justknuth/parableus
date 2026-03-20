import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, writeBatch, serverTimestamp, doc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, ArrowUp, Plus, X, GitFork } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthModal from './AuthModal'; // <-- Imported the new component

interface Theory {
  id: string;
  title: string;
  content: string;
  category: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  createdAt: any;
  upvotes: number;
  commentCount: number;
  parentId?: string;
  parentTitle?: string;
  forkCount: number;
}

export default function Feed({ user }: { user: User | null }) {
  const { category } = useParams<{ category: string }>();
  const [theories, setTheories] = useState<Theory[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!category) return;

    const q = query(
      collection(db, 'theories'),
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const theoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Theory[];
      setTheories(theoriesData);
    }, (error) => {
      console.error("Error fetching theories:", error);
    });

    return () => unsubscribe();
  }, [category]);

  const handleCreateTheory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle.trim() || !newContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/theories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          category: category,
          authorId: user.uid,
          authorName: user.displayName || 'Anonymous',
          authorPhoto: user.photoURL || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to post theory');
      }

      setIsCreating(false);
      setNewTitle('');
      setNewContent('');
    } catch (error) {
      console.error("Error creating theory:", error);
      alert("Failed to post theory. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (theoryId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const batch = writeBatch(db);
    const theoryRef = doc(db, 'theories', theoryId);
    const upvoteRef = doc(db, `theories/${theoryId}/upvotes`, user.uid);

    batch.update(theoryRef, { upvotes: increment(1) });
    batch.set(upvoteRef, { createdAt: serverTimestamp() });

    try {
      await batch.commit();
    } catch (error) {
      console.error("Upvote failed:", error);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0908] relative">
      <div className="max-w-4xl mx-auto p-6 md:p-12">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-[#e8dcc7] mb-2">{category}</h1>
            <p className="text-[#a89b8f]">Theories and discoveries</p>
          </div>
          
          <button
            onClick={() => {
              if (user) {
                setIsCreating(true);
              } else {
                setShowAuthModal(true);
              }
            }}
            className="flex items-center space-x-2 bg-[#3c2f2f] hover:bg-[#4a3b3b] text-[#e8dcc7] px-4 py-2 rounded-xl transition-colors shadow-md shadow-black/50"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Share Theory</span>
          </button>
        </header>

        {/* The new AuthModal component */}
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />

        {/* Create Theory Modal */}
        <AnimatePresence>
          {isCreating && (
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
                className="bg-[#1a1614] border border-[#3c2f2f] rounded-2xl p-6 w-full max-w-2xl shadow-2xl shadow-black/80"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-serif text-[#e8dcc7]">New Theory in {category}</h2>
                  <button onClick={() => setIsCreating(false)} className="text-[#a89b8f] hover:text-[#e8dcc7]">
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleCreateTheory} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Title of your theory"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      maxLength={200}
                      className="w-full bg-[#0a0908] border border-[#2a2422] text-[#e8dcc7] rounded-xl p-4 focus:outline-none focus:border-[#4a3b3b] transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="Explain your theory..."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      maxLength={10000}
                      rows={8}
                      className="w-full bg-[#0a0908] border border-[#2a2422] text-[#e8dcc7] rounded-xl p-4 focus:outline-none focus:border-[#4a3b3b] transition-colors resize-none"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-6 py-2 rounded-xl text-[#a89b8f] hover:bg-[#2a2422] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !newTitle.trim() || !newContent.trim()}
                      className="px-6 py-2 bg-[#3c2f2f] hover:bg-[#4a3b3b] text-[#e8dcc7] rounded-xl transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? 'Posting...' : 'Post Theory'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feed */}
        <div className="space-y-6">
          {theories.length === 0 ? (
            <div className="text-center py-20 text-[#a89b8f]">
              <p className="text-xl font-serif mb-2">No theories yet.</p>
              <p>Be the first to share a discovery in {category}.</p>
            </div>
          ) : (
            theories.map((theory) => (
              <Link
                key={theory.id}
                to={`/theory/${theory.id}`}
                className="block bg-[#1a1614] border border-[#2a2422] hover:border-[#3c2f2f] rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:shadow-black/40"
              >
                <div className="flex items-start space-x-4">
                  <button 
                    onClick={(e) => handleUpvote(theory.id, e)}
                    className="flex flex-col items-center space-y-1 text-[#a89b8f] hover:text-[#e8dcc7] transition-colors p-2 -ml-2 rounded-lg hover:bg-[#2a2422]/50"
                  >
                    <ArrowUp size={20} />
                    <span className="font-medium">{theory.upvotes}</span>
                  </button>
                  <div className="flex-1 min-w-0">
                    {theory.parentId && theory.parentTitle && (
                      <div className="flex items-center space-x-1 text-xs text-[#a89b8f] mb-2">
                        <GitFork size={12} />
                        <span>Evolved from: {theory.parentTitle}</span>
                      </div>
                    )}
                    <h2 className="text-xl font-medium text-[#e8dcc7] mb-2 truncate">{theory.title}</h2>
                    <p className="text-[#a89b8f] line-clamp-3 mb-4 leading-relaxed">
                      {theory.content}
                    </p>
                    <div className="flex items-center text-sm text-[#a89b8f]/70 space-x-4">
                      <div className="flex items-center space-x-2">
                        {theory.authorPhoto ? (
                          <img src={theory.authorPhoto} alt={theory.authorName} className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-[#3c2f2f]" />
                        )}
                        <span>{theory.authorName}</span>
                      </div>
                      <span>•</span>
                      <span>{theory.createdAt ? formatDistanceToNow(theory.createdAt.toDate(), { addSuffix: true }) : 'Just now'}</span>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <MessageCircle size={16} />
                        <span>{theory.commentCount} comments</span>
                      </div>
                      {theory.forkCount > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex items-center space-x-1">
                            <GitFork size={16} />
                            <span>{theory.forkCount} evolutions</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}