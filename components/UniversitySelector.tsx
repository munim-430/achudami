import React from "react";
import { UniversityId, UNIVERSITIES } from "@/lib/types";
import { GraduationCap, ArrowRight, Check } from "lucide-react";

interface UniversitySelectorProps {
  currentUniversity: UniversityId;
  onSelectUniversity: (id: UniversityId) => void;
}

export const UniversitySelector: React.FC<UniversitySelectorProps> = ({
  currentUniversity,
  onSelectUniversity,
}) => {
  const list = Object.values(UNIVERSITIES);

  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">Select Target University</h2>
          <p className="text-xs text-zinc-500">
            Switch between official acceptance letter vector engines and Excel templates
          </p>
        </div>
        <span className="text-xs font-mono text-zinc-400">
          Selected: <strong className="text-indigo-400">{UNIVERSITIES[currentUniversity].name}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {list.map((u) => {
          const isSelected = u.id === currentUniversity;
          return (
            <button
              key={u.id}
              onClick={() => onSelectUniversity(u.id)}
              className={`relative text-left p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? "bg-zinc-900/90 border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-950/30"
                  : "bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                      isSelected
                        ? "bg-indigo-600 text-white"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {u.badge}
                  </span>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400">
                      <Check className="w-3.5 h-3.5" /> Active
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                  {u.name}
                </h3>
                <p className="text-xs font-medium text-zinc-400 mt-0.5">{u.koreanName}</p>
                <p className="text-[11px] text-zinc-500 mt-2 line-clamp-2">{u.tagline}</p>
              </div>

              <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">Template Engine</span>
                <span className="text-indigo-400 font-mono flex items-center gap-1">
                  Ready <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
