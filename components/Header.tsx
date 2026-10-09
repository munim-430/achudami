import React from "react";
import { GraduationCap, ShieldCheck, LogOut } from "lucide-react";

interface HeaderProps {
  onLock?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLock }) => {
  return (
    <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-zinc-100 tracking-tight">
                Hanyang Certificate Portal
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
                v2.0 • Web Portal
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Author: Saemur Rahman • Automated University Certificate Generation Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Client-Side • Zero Server Overhead</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-300 text-xs">
            <span className="text-zinc-500">Author:</span>
            <span className="font-medium text-white">Saemur Rahman</span>
          </div>

          {onLock && (
            <button
              onClick={onLock}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-900/60 bg-red-950/40 text-red-400 hover:bg-red-900/40 hover:text-red-300 text-xs transition"
              title="Lock portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
