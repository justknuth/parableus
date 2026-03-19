import { Link } from 'react-router-dom';
import { Atom, Cpu, BookOpen, Globe, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORIES = [
  { id: 'Science', name: 'Science', description: 'Physics, biology, chemistry, and the natural world.', icon: Atom },
  { id: 'Technology', name: 'Technology', description: 'AI, computing, engineering, and the future of tools.', icon: Cpu },
  { id: 'Philosophy', name: 'Philosophy', description: 'Ethics, existence, consciousness, and meaning.', icon: BookOpen },
  { id: 'Universe', name: 'Universe', description: 'Astronomy, cosmology, and the vast unknown.', icon: Globe },
  { id: 'Miscellaneous', name: 'Miscellaneous', description: 'Everything else that sparks curiosity.', icon: Lightbulb },
];

export default function Categories() {
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-[#0a0908]">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-[#e8dcc7] mb-4">Theories</h1>
          <p className="text-lg text-[#a89b8f] max-w-2xl">
            Explore the collective imagination. 10,000,000 everyday people might discover what one scientist cannot.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((category, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={category.id}
            >
              <Link 
                to={`/categories/${category.id}`}
                className="block h-full bg-[#1a1614] border border-[#2a2422] hover:border-[#4a3b3b] rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50 group"
              >
                <div className="w-12 h-12 bg-[#2a2422] rounded-xl flex items-center justify-center text-[#d4c4b7] mb-6 group-hover:bg-[#3c2f2f] transition-colors">
                  <category.icon size={24} />
                </div>
                <h2 className="text-xl font-medium text-[#e8dcc7] mb-2">{category.name}</h2>
                <p className="text-[#a89b8f] leading-relaxed">{category.description}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
