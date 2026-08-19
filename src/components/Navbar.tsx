import React from 'react';
import { Bot, Layers, BookOpen, Sun, Moon } from 'lucide-react';

export type AppTabType = 'builder' | 'converter' | 'templates';

interface NavbarProps {
  activeTab?: AppTabType;
  onSelectTab?: (tab: AppTabType) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab = 'builder',
  onSelectTab,
  theme = 'dark',
  onToggleTheme
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#020b18]/90 backdrop-blur-xl border-b border-[#0066FF]/20 text-white shadow-xl transition-all">
      <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between gap-4">

        {/* Clean Fortics Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0052FF] to-[#00D2FF] p-0.5 shadow-md shadow-[#0066FF]/30 flex items-center justify-center">
              <div className="w-full h-full bg-[#020b18] rounded-[10px] flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-[#0066FF]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L13.8 8.2L20.2 6.4L15.6 11L21.8 12.8L15.6 14.6L20.2 19.2L13.8 17.4L12 23.6L10.2 17.4L3.8 19.2L8.4 14.6L2.2 12.8L8.4 11L3.8 6.4L10.2 8.2L12 2Z" />
                </svg>
              </div>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black tracking-tight text-white font-sans">
                fortics
              </span>
              <span className="text-xs font-bold text-[#00D2FF] tracking-wider uppercase">
                Studio
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs & Theme Toggle */}
        <div className="flex items-center gap-3">
          {onSelectTab && (
            <nav className="flex items-center bg-[#061325]/90 p-1 rounded-full border border-[#0066FF]/25 shadow-inner">
              <button
                type="button"
                onClick={() => onSelectTab('builder')}
                className={`px-3.5 sm:px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'builder'
                    ? 'bg-[#0066FF] text-white shadow-lg shadow-[#0066FF]/40'
                    : 'text-slate-300 hover:text-white hover:bg-[#0066FF]/10'
                  }`}
              >
                <Bot className="w-4 h-4" />
                <span>Criador (cURL / IA)</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('converter')}
                className={`px-3.5 sm:px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'converter'
                    ? 'bg-[#0066FF] text-white shadow-lg shadow-[#0066FF]/40'
                    : 'text-slate-300 hover:text-white hover:bg-[#0066FF]/10'
                  }`}
              >
                <Layers className="w-4 h-4" />
                <span>Conversor Total.js</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('templates')}
                className={`px-3.5 sm:px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'templates'
                    ? 'bg-[#0066FF] text-white shadow-lg shadow-[#0066FF]/40'
                    : 'text-slate-300 hover:text-white hover:bg-[#0066FF]/10'
                  }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Guia &amp; Exemplos</span>
              </button>
            </nav>
          )}

          {/* Theme Toggle Button */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2.5 rounded-full bg-[#061325]/90 hover:bg-[#0066FF]/20 border border-[#0066FF]/30 text-slate-200 hover:text-white transition-all cursor-pointer shadow-md flex items-center justify-center"
              title={theme === 'dark' ? 'Mudar para Tema Claro (Branco)' : 'Mudar para Tema Escuro (Dark)'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-300 animate-fadeIn" />
              ) : (
                <Moon className="w-4 h-4 text-[#0066FF] animate-fadeIn" />
              )}
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
