import React from "react";
import { GraduationCap, ShieldCheck, LogOut, ChevronDown } from "lucide-react";
import { UniversityId, UNIVERSITIES } from "@/lib/types";

interface HeaderProps {
  currentUniversity: UniversityId;
  onSelectUniversity: (id: UniversityId) => void;
  onLock?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUniversity,
  onSelectUniversity,
  onLock,
}) => {
  const currentConfig = UNIVERSITIES[currentUniversity];

  return (
    <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-zinc-100 tracking-tight">
                Korean University Certificate Portal
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
                v3.0 • Multi-University
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Author: Saemur Rahman • Automated Bulk Acceptance Letter Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active University Selector Dropdown / Badge */}
          <div className="relative flex items-center">
            <select
              value={currentUniversity}
              onChange={(e) => onSelectUniversity(e.target.value as UniversityId)}
              className="appearance-none bg-zinc-900 border border-zinc-700 hover:border-indigo-500 text-zinc-200 text-xs font-medium py-1.5 pl-3 pr-8 rounded-lg cursor-pointer transition focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="hanyang">🎓 Hanyang Univ (한양대)</option>
              <option value="korea">🦅 Korea Univ (고려대)</option>
              <option value="skku">🏛️ Sungkyunkwan (성균관대)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 pointer-events-none" />
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Client-Side Vector Engine</span>
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
