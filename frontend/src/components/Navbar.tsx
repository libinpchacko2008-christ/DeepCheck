import React from 'react';
import { ShieldCheck, Sun, Moon, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { SystemHealth } from '../types';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  health: SystemHealth | null;
  onOpenSampleModal: () => void;
  onScrollToHowItWorks: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  setDarkMode,
  health,
  onOpenSampleModal,
  onScrollToHowItWorks,
}) => {
  const isAvailable = health?.detector_available ?? false;

  return (
    <header className="sticky top-0 z-40 w-full border-b backdrop-blur transition-colors duration-200 border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/85">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-zinc-100">
                Deep<span className="text-indigo-600 dark:text-indigo-400">Check</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                AI Vision
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
              Face Manipulation & Forgery Assessment
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Status pill */}
          <div
            className={`hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              isAvailable
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
            }`}
            title={isAvailable ? 'ViT model loaded & ready' : health?.detector_error || 'Detector offline'}
          >
            {isAvailable ? (
              <CheckCircle className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            <span>{isAvailable ? 'Detector Online (ViT)' : 'Detector Unavailable'}</span>
          </div>

          {/* Sample Demo button */}
          <button
            onClick={onOpenSampleModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/80 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Try a Sample Report</span>
            <span className="sm:hidden">Sample</span>
          </button>

          {/* How It Works link */}
          <button
            onClick={onScrollToHowItWorks}
            className="text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-2 py-1 transition-colors"
          >
            How It Works
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={() => setDarkMode((prev) => !prev)}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
          </button>
        </div>
      </div>
    </header>
  );
};
