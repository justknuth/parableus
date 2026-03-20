import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { doc, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface UpvoteState {
  hasUpvoted: boolean;
  upvotes: number;
}

interface UpvoteContextType {
  upvoteData: Record<string, UpvoteState>;
  syncRealData: (theoryId: string, realUpvotes: number, realHasUpvoted: boolean) => void;
  toggleUpvote: (theoryId: string, userId: string | undefined, onRequireAuth: () => void) => Promise<void>;
  isProcessing: (theoryId: string) => boolean;
}

const UpvoteContext = createContext<UpvoteContextType | undefined>(undefined);

export function UpvoteProvider({ children }: { children: ReactNode }) {
  const [upvoteData, setUpvoteData] = useState<Record<string, UpvoteState>>({});
  const processingLocks = useRef<Set<string>>(new Set());

  const syncRealData = (theoryId: string, realUpvotes: number, realHasUpvoted: boolean) => {
    setUpvoteData(prev => {
      // Don't overwrite if we are currently in the middle of an optimistic click!
      if (processingLocks.current.has(theoryId)) return prev;
      
      if (prev[theoryId]?.upvotes === realUpvotes && prev[theoryId]?.hasUpvoted === realHasUpvoted) {
        return prev;
      }

      return {
        ...prev,
        [theoryId]: { hasUpvoted: realHasUpvoted, upvotes: realUpvotes }
      };
    });
  };

  const toggleUpvote = async (theoryId: string, userId: string | undefined, onRequireAuth: () => void) => {
    if (!userId) {
      onRequireAuth();
      return;
    }

    if (processingLocks.current.has(theoryId)) return;
    processingLocks.current.add(theoryId);

    const currentState = upvoteData[theoryId] || { hasUpvoted: false, upvotes: 0 };
    const isCurrentlyUpvoted = currentState.hasUpvoted;
    const currentCount = currentState.upvotes;

    // 1. INSTANT OPTIMISTIC UI
    setUpvoteData(prev => ({
      ...prev,
      [theoryId]: {
        hasUpvoted: !isCurrentlyUpvoted,
        upvotes: currentCount + (isCurrentlyUpvoted ? -1 : 1)
      }
    }));

    // 2. BACKGROUND DATABASE SYNC
    try {
      const theoryRef = doc(db, 'theories', theoryId);
      const upvoteRef = doc(db, `theories/${theoryId}/upvotes`, userId);
      const batch = writeBatch(db);

      if (isCurrentlyUpvoted) {
        batch.update(theoryRef, { upvotes: increment(-1) });
        batch.delete(upvoteRef);
      } else {
        batch.update(theoryRef, { upvotes: increment(1) });
        batch.set(upvoteRef, { createdAt: serverTimestamp() });
      }

      await batch.commit();
    } catch (error) {
      console.error("Upvote failed:", error);
      // Revert if database fails
      setUpvoteData(prev => ({
        ...prev,
        [theoryId]: currentState
      }));
    } finally {
      processingLocks.current.delete(theoryId);
    }
  };

  return (
    <UpvoteContext.Provider value={{ upvoteData, syncRealData, toggleUpvote, isProcessing: (id) => processingLocks.current.has(id) }}>
      {children}
    </UpvoteContext.Provider>
  );
}

export function useUpvotes() {
  const context = useContext(UpvoteContext);
  if (context === undefined) {
    throw new Error('useUpvotes must be used within an UpvoteProvider');
  }
  return context;
}