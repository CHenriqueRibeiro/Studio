import React from 'react';
import { Bot, Workflow, Sparkles, RefreshCw, Layers } from 'lucide-react';

interface NavbarProps {
  activeTab?: 'builder' | 'converter';
  onSelectTab?: (tab: 'builder' | 'converter') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab = 'builder',
  onSelectTab
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-slate-950 text-base shadow-xs">
            F
          </div>
          <h1 className="text-base font-bold tracking-tight text-white hidden sm:block">
            Fortics Studio
          </h1>
        </div>

        {/* Global Tabs */}
        {onSelectTab && (
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => onSelectTab('builder')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'builder'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Criador (cURL / IA)</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('converter')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'converter'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Conversor FlowStream (Total.js)</span>
            </button>
          </div>
        )}

      </div>
    </header>
  );
};

