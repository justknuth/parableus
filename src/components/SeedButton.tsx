import React, { useState } from 'react';
import { collection, addDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';
import { Database } from 'lucide-react';

export default function SeedButton({ user }: { user: User | null }) {
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    if (!user) {
      alert("Please log in first to seed data.");
      return;
    }
    setIsSeeding(true);
    try {
      // Theory 1
      const t1Title = "The Universe is a Giant Neural Network";
      const t1Ref = await addDoc(collection(db, 'theories'), {
        title: t1Title,
        content: "What if the cosmic web of galaxies is actually structurally identical to a human brain? The filaments of dark matter act as synapses, transmitting information across billions of lightyears. We aren't just IN the universe, we are thoughts WITHIN the universe.",
        category: "Universe",
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhoto: user.photoURL || '',
        createdAt: serverTimestamp(),
        upvotes: 0,
        commentCount: 0,
        forkCount: 0
      });

      // Theory 2 (Evolved from 1)
      await addDoc(collection(db, 'theories'), {
        title: "Evolution of: The Universe is a Giant Neural Network - Quantum Entanglement",
        content: "Building on the neural network idea: Quantum entanglement is the mechanism for instantaneous 'thought' transmission across this cosmic brain. When two particles are entangled, they act as a single node in the network, regardless of distance.",
        category: "Universe",
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhoto: user.photoURL || '',
        createdAt: serverTimestamp(),
        upvotes: 0,
        commentCount: 0,
        forkCount: 0,
        parentId: t1Ref.id,
        parentTitle: t1Title
      });
      await updateDoc(t1Ref, { forkCount: increment(1) });

      // Theory 3 (Evolved from 1)
      await addDoc(collection(db, 'theories'), {
        title: "Evolution of: The Universe is a Giant Neural Network - Black Holes as Forgetting",
        content: "If the universe is a brain, then black holes are the mechanism for 'forgetting' or pruning unused neural pathways. Information that falls into a black hole is scrubbed from the active network to make room for new cosmic connections.",
        category: "Universe",
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhoto: user.photoURL || '',
        createdAt: serverTimestamp(),
        upvotes: 0,
        commentCount: 0,
        forkCount: 0,
        parentId: t1Ref.id,
        parentTitle: t1Title
      });
      await updateDoc(t1Ref, { forkCount: increment(1) });

      alert("Data seeded successfully! Check the feed.");
    } catch (error) {
      console.error("Error seeding data:", error);
      alert("Failed to seed data. Check console.");
    } finally {
      setIsSeeding(false);
    }
  };

  if (!user) return null;

  return (
    <button
      onClick={handleSeed}
      disabled={isSeeding}
      className="fixed bottom-6 right-6 bg-[#e8dcc7] text-[#0a0908] px-4 py-3 rounded-full shadow-lg hover:bg-white transition-colors flex items-center space-x-2 font-medium z-50"
    >
      <Database size={18} />
      <span>{isSeeding ? 'Seeding...' : 'Seed Test Data'}</span>
    </button>
  );
}
