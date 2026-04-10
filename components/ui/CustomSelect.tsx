"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/utils/cn";

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Sélectionner...",
  className,
  label,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("space-y-2 w-full", className)} ref={containerRef}>
      {label && (
        <label className="text-on-background font-label font-bold text-sm px-1">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full bg-white border border-slate-200 text-slate-900 rounded-xl h-12 px-4 flex items-center justify-between transition-all duration-300",
            "focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/10",
            isOpen && "border-[#1e3a8a]/40 shadow-lg shadow-blue-900/5 bg-white"
          )}
        >
          <span className={cn("truncate font-medium", !selectedOption && "text-slate-400")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-slate-400 transition-transform duration-300",
              isOpen && "rotate-180 text-[#1e3a8a]"
            )}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div 
            className="absolute z-50 w-full mt-2 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-xl shadow-2xl shadow-blue-900/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="max-h-60 overflow-y-auto py-1">
              {options.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-400 italic">
                  Aucune option disponible
                </div>
              ) : (
                options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between",
                      "hover:bg-[#1e3a8a]/5 hover:text-[#1e3a8a]",
                      value === option.value ? "text-[#1e3a8a] font-bold bg-[#1e3a8a]/5" : "text-slate-600"
                    )}
                  >
                    <span>{option.label}</span>
                    {value === option.value && (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
