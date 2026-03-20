import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, ArrowUp, MessageCircle, Send, GitFork, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthModal from './AuthModal';
import { useUpvotes } from '../contexts/UpvoteContext';

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

interface Comment {
  id: string;
  theoryId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  createdAt: any;
}

export default function TheoryDetail({ user }: { user: User | null }) {
  const { theoryId } = useParams<{ theoryId: string }>();
  const navigate = useNavigate();
  const [theory, setTheory] = useState<Theory | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isForking, setIsForking] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [forkTitle, setForkTitle] = useState('');
  const [forkContent, setForkContent] = useState('');
  const [isSubmittingFork, setIsSubmittingFork] = useState(false);

  // Global Upvote State
  const { upvoteData, syncRealData, toggleUpvote } = useUpvotes();

  useEffect(() => {
    if (!theoryId) return;

    const theoryRef = doc(db, 'theories', theoryId);
    const unsubscribeTheory = onSnapshot(theoryRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Theory;
        setTheory(data);
      } else {
        setError("Theory not found.");
      }
    }, (err) => {
      console.error("Error fetching theory:", err);
      setError("Failed to load theory.");
    });

    const q = query(collection(db, `theories/${theoryId}/comments`), orderBy('createdAt', 'asc'));
    const unsubscribeComments = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Comment[];
      setComments(commentsData);
    });

    let unsubscribeUpvote = () => {};
    if (user) {
      const upvoteRef = doc(db, `theories/${theoryId}/upvotes`, user.uid);
      unsubscribeUpvote = onSnapshot(upvoteRef, (docSnap) => {
        setTheory(prevTheory => {
          if (prevTheory) {
            syncRealData(theoryId, prevTheory.upvotes, docSnap.exists());
          }
          return prevTheory;
        });
      });
    }

    return () => {
      unsubscribeTheory();
      unsubscribeComments();
      unsubscribeUpvote();
    };
  }, [theoryId, user, syncRealData]);

  useEffect(() => {
    if (theory && !forkTitle) {
      setForkTitle(`Evolution of: ${theory.title}`);
      setForkContent(theory.content);
    }
  }, [theory, forkTitle]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !theory || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/theories/${theory.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          authorId: user.uid,
          authorName: user.displayName || 'Anonymous',
          authorPhoto: user.photoURL || '',
        }),
      });

      if (!response.ok) throw new Error('Failed to post comment');
      setNewComment('');
    } catch (err) {
      console.error("Error posting comment:", err);
      alert("Failed to post comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !theory || !forkTitle.trim() || !forkContent.trim() || isSubmittingFork) return;

    setIsSubmittingFork(true);
    try {
      const response = await fetch('/api/theories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: forkTitle.trim(),
          content: forkContent.trim(),
          category: theory.category,
          authorId: user.uid,
          authorName: user.displayName || 'Anonymous',
          authorPhoto: user.photoURL || '',
          parentId: theory.id,
          parentTitle: theory.title,
        }),
      });

      if (!response.ok) throw new Error('Failed to fork theory');
      const data = await response.json();
      setIsForking(false);
      navigate(`/theory/${data.id}`);
    } catch (err) {
      console.error("Error forking theory:", err);
      alert("Failed to fork theory. Please try again.");
    } finally {
      setIsSubmittingFork(false);
    }
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0908] text-[#e8dcc7]">
        <div className="text-center">
          <p className="text-xl font-serif mb-4">{error}</p>
          <Link to="/categories" className="text-[#a89b8f] hover:text-[#d4c4b7] underline">Return to Categories</Link>
        </div>
      </div>
    );
  }

  if (!theory) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0908]">
        <div className="animate-pulse text-[#d4c4b7]">Loading theory...</div>
      </div>
    );
  }

  // Tap into Global Context
  const currentVoteData = upvoteData[theory.id] || { upvotes: theory.upvotes, hasUpvoted: false };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0908] relative">
      <div className="max-w-3xl mx-auto p-6 md:p-12">
        <div className="flex items-center justify-between mb-8">
          <Link to={`/categories/${theory.category}`} className="inline-flex items-center space-x-2 text-[#a89b8f] hover:text-[#e8dcc7] transition-colors">
            <ArrowLeft size={20} />
            <span>Back to {theory.category}</span>
          </Link>
          
          <button
            onClick={() => {
              if (user) setIsForking(true);
              else setShowAuthModal(true);
            }}
            className="flex items-center space-x-2 bg-[#3c2f2f] hover:bg-[#4a3b3b] text-[#e8dcc7] px-4 py-2 rounded-xl transition-colors shadow-md shadow-black/50"
          >
            <GitFork size={18} />
            <span>Evolve Theory</span>
          </button>
        </div>

        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

        {/* Evolve Theory Modal */}
        <AnimatePresence>
          {isForking && (
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
                className="bg-[#1a1614] border border-[#3c2f2f] rounded-2xl p-6 w-full max-w-2xl shadow-2xl shadow-black/80 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-serif text-[#e8dcc7] flex items-center space-x-2">
                    <GitFork size={24} />
                    <span>Evolve Theory</span>
                  </h2>
                  <button onClick={() => setIsForking(false)} className="text-[#a89b8f] hover:text-[#e8dcc7]">
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleFork} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Title of your evolved theory"
                      value={forkTitle}
                      onChange={(e) => setForkTitle(e.target.value)}
                      maxLength={200}
                      className="w-full bg-[#0a0908] border border-[#2a2422] text-[#e8dcc7] rounded-xl p-4 focus:outline-none focus:border-[#4a3b3b] transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="Evolve the theory..."
                      value={forkContent}
                      onChange={(e) => setForkContent(e.target.value)}
                      maxLength={10000}
                      rows={12}
                      className="w-full bg-[#0a0908] border border-[#2a2422] text-[#e8dcc7] rounded-xl p-4 focus:outline-none focus:border-[#4a3b3b] transition-colors resize-none"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={() => setIsForking(false)} className="px-6 py-2 rounded-xl text-[#a89b8f] hover:bg-[#2a2422] transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSubmittingFork || !forkTitle.trim() || !forkContent.trim()} className="px-6 py-2 bg-[#3c2f2f] hover:bg-[#4a3b3b] text-[#e8dcc7] rounded-xl transition-colors disabled:opacity-50 flex items-center space-x-2">
                      {isSubmittingFork ? <span>Evolving...</span> : <><GitFork size={18} /><span>Evolve Theory</span></>}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Theory Content */}
        <motion.article 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1614] border border-[#2a2422] rounded-3xl p-8 shadow-2xl shadow-black/50 mb-12"
        >
          <div className="flex items-start space-x-6">
            <div className="flex flex-col items-center space-y-2">
              <button 
                onClick={() => toggleUpvote(theory.id, user?.uid, () => setShowAuthModal(true))}
                className={`p-2 rounded-full transition-colors ${currentVoteData.hasUpvoted ? 'bg-[#3c2f2f] text-[#e8dcc7]' : 'text-[#a89b8f] hover:bg-[#2a2422] hover:text-[#e8dcc7]'}`}
              >
                <ArrowUp size={28} />
              </button>
              <span className="text-xl font-medium text-[#e8dcc7]">{currentVoteData.upvotes}</span>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-6 text-sm text-[#a89b8f]">
                {theory.authorPhoto ? (
                  <img src={theory.authorPhoto} alt={theory.authorName} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#3c2f2f]" />
                )}
                <div>
                  <div className="font-medium text-[#e8dcc7]">{theory.authorName}</div>
                  <div>{theory.createdAt ? formatDistanceToNow(theory.createdAt.toDate(), { addSuffix: true }) : 'Just now'}</div>
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-[#e8dcc7] mb-6 leading-tight">
                {theory.title}
              </h1>
              
              {theory.parentId && theory.parentTitle && (
                <Link to={`/theory/${theory.parentId}`} className="inline-flex items-center space-x-2 text-sm text-[#a89b8f] hover:text-[#d4c4b7] bg-[#2a2422]/50 px-3 py-1.5 rounded-lg mb-6 transition-colors border border-[#3c2f2f]/50">
                  <GitFork size={14} />
                  <span>Evolved from: {theory.parentTitle}</span>
                </Link>
              )}
              
              <div className="prose prose-invert prose-stone max-w-none text-[#d4c4b7] leading-relaxed whitespace-pre-wrap">
                {theory.content}
              </div>

              {theory.forkCount > 0 && (
                <div className="mt-8 pt-6 border-t border-[#2a2422] flex items-center space-x-2 text-[#a89b8f]">
                  <GitFork size={18} />
                  <span>This theory has been evolved {theory.forkCount} time{theory.forkCount !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </motion.article>

        {/* Comments Section */}
        <section>
          <h3 className="text-2xl font-serif text-[#e8dcc7] mb-8 flex items-center space-x-3">
            <MessageCircle size={24} />
            <span>Discussion ({theory.commentCount})</span>
          </h3>

          {user ? (
            <form onSubmit={handleComment} className="mb-12 relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add to the theory..."
                className="w-full bg-[#1a1614] border border-[#2a2422] text-[#e8dcc7] placeholder-[#a89b8f]/50 rounded-2xl p-4 pr-16 focus:outline-none focus:border-[#4a3b3b] shadow-inner transition-colors resize-none"
                rows={3}
                maxLength={2000}
                required
              />
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="absolute bottom-4 right-4 p-2 bg-[#3c2f2f] text-[#e8dcc7] rounded-xl hover:bg-[#4a3b3b] disabled:opacity-50 transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
          ) : (
            <div className="bg-[#1a1614] border border-[#2a2422] rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 text-center text-[#a89b8f] mb-12">
              <p>Sign in to join the discussion.</p>
              <button 
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-2 bg-[#3c2f2f] hover:bg-[#4a3b3b] text-[#e8dcc7] rounded-xl transition-colors"
              >
                Sign In
              </button>
            </div>
          )}

          <div className="space-y-6">
            {comments.map((comment) => (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={comment.id} 
                className="flex space-x-4 bg-[#1a1614]/50 p-6 rounded-2xl border border-[#2a2422]/50"
              >
                {comment.authorPhoto ? (
                  <img src={comment.authorPhoto} alt={comment.authorName} className="w-10 h-10 rounded-full flex-shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#3c2f2f] flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline space-x-2 mb-2">
                    <span className="font-medium text-[#e8dcc7]">{comment.authorName}</span>
                    <span className="text-xs text-[#a89b8f]">
                      {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                    </span>
                  </div>
                  <p className="text-[#d4c4b7] whitespace-pre-wrap leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}