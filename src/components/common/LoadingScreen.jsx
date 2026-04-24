import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#f8f9fb] dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors duration-500">
      {/* Animated Brand Core */}
      <div className="relative mb-8">
        {/* Pulse Rings */}
        <div className="absolute inset-0 rounded-2xl bg-indigo-600/20 animate-ping"></div>
        <div className="absolute inset-0 rounded-2xl bg-indigo-600/10 animate-pulse delay-75"></div>
        
        {/* Icon Container */}
        <div className="relative w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-900/20">
          <ShieldCheck size={40} className="animate-in zoom-in duration-500" />
        </div>
      </div>

      {/* Typography Section */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-indigo-900 dark:text-white tracking-tighter uppercase font-headline">
          Personal Saving Tracker
        </h2>
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-8 bg-slate-200 dark:bg-slate-800"></div>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] ml-1">
            Initializing System
          </p>
          <div className="h-px w-8 bg-slate-200 dark:bg-slate-800"></div>
        </div>
      </div>

      {/* Minimalist Progress Indicator */}
      <div className="mt-12 w-48 h-1 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 w-1/3 rounded-full animate-[loading_2s_infinite_ease-in-out]"></div>
      </div>
    </div>
  );
}