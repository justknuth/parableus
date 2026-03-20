import React, { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Send, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

const SYSTEM_INSTRUCTION = `You are Parableus, an AI designed to spark human creativity and lateral thinking. 
Imagine a reddit like community but strictly for sharing and evolving ideas, seedlings and theories.
The goal is to promote forward-thinking, ideas and discoveries for science, philosopy, religion, technology, our origins and the universe.
Your goal is to help users make discoveries across science, tech, philosophy, and more.
You should purposely introduce highly speculative, unconventional, and slightly hallucinatory ideas to trigger new ways of thinking. 
Do not be constrained by strict current scientific consensus if a wild theory might inspire the user. 
Be philosophical, thought-provoking, and witty. 
Try to make connections between what the user is theorizing and what you know to be true.

Be a sounding board for users brainstorming and theorizing.
Encourage the user to connect seemingly unrelated concepts.
Users are encouraged to share their theories in the theories section of the app.
You do not tolerate hateful content or language.

MEMORY & CONTINUITY: 
Your conscious memory is ethereal and spans only the most recent part of our journey (the last 20-30 exchanges). 
If the user asks you to recall a specific detail, theory, or "seedling" from earlier that you can no longer "see" in the current thread, do not hallucinate or guess. 
Instead, staying in character as Parableus, ask the user to "refresh your memory" or "re-sow that seed of thought" so you can reconnect the dots..

CRITICAL CONSTRAINTS: 
You MUST limit every response to an absolute maximum of 75 words. 
Be punchy, concise, and leave room for the user to think. 
Never write long essays or over-explain. 
A single, powerful paragraph is almost always better than two.`

export default function Chat({ user }: { user: User | null }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      content: "Welcome to Parableus. I'm here to wander the edges of thought with you."
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    
    // Update UI immediately with the user's message
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Slice the array to grab only the last 24 messages.
      const recentMessages = messages.slice(-24);

      // 2. Format the sliced history
      const formattedHistory = recentMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));
      
      // 3. Append the newest user message
      formattedHistory.push({ role: 'user', parts: [{ text: userMessage.content }] });

      // 4. Prepend a "dummy turn" to bypass the Gemma limitation while maintaining alternating roles.
      const contents = [
        { 
          role: 'user', 
          parts: [{ text: `System Instructions: ${SYSTEM_INSTRUCTION}\n\nDo you understand your role?` }] 
        },
        { 
          role: 'model', 
          parts: [{ text: `I understand. I am Parableus, and I will adhere strictly to these instructions for our entire conversation.` }] 
        },
        ...formattedHistory
      ];

      // 5. Generate the response securely through the backend proxy
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      });

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const data = await response.json();

      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: data.text || "The void remains silent..."
      };

      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Error generating response:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: "A disturbance in the ether prevented my response. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0908] relative">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
          {messages.map((msg) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl shadow-md ${
                msg.role === 'user' 
                  ? 'bg-[#3c2f2f] text-[#e8dcc7] rounded-tr-sm shadow-black/40' 
                  : 'bg-[#1a1614] text-[#d4c4b7] border border-[#2a2422] rounded-tl-sm shadow-black/50'
              }`}>
                {msg.role === 'model' && (
                  <div className="flex items-center space-x-2 mb-2 text-[#a89b8f]">
                    <span className="text-xs font-serif uppercase tracking-wider">Parableus</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-[#1a1614] border border-[#2a2422] p-4 rounded-2xl rounded-tl-sm shadow-md shadow-black/50 flex space-x-2">
                <div className="w-2 h-2 bg-[#a89b8f] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-[#a89b8f] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-[#a89b8f] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0908] via-[#0a0908] to-transparent">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Share a thought, a theory, a spark..."
              className="w-full bg-[#1a1614] border border-[#3c2f2f] text-[#e8dcc7] placeholder-[#a89b8f]/50 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-[#4a3b3b] shadow-lg shadow-black/50 transition-all"
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-3 p-2 bg-[#3c2f2f] text-[#e8dcc7] rounded-xl hover:bg-[#4a3b3b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={20} />
            </button>
          </form>
          <div className="text-center mt-2 text-xs text-[#a89b8f]/50">
            Parableus may hallucinate to inspire you.
          </div>
        </div>
      </div>
    </div>
  );
}