'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { LANGUAGES } from '@/lib/translations';
import { Globe, Check, ChevronDown } from 'lucide-react';

export const LanguageSwitcher: React.FC<{ compact?: boolean }> = () => {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-white/10 hover:border-emerald-500/40 text-xs font-semibold text-neutral-200 transition-all shadow-sm group"
        title="Change Language / மொழியை மாற்றவும்"
      >
        <Globe className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
        <span className="font-medium text-white">{currentOption.native}</span>
        <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-neutral-900/95 border border-white/15 shadow-2xl backdrop-blur-xl p-1.5 z-50 animate-fadeIn">
          <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-neutral-400 border-b border-white/5 mb-1">
            Select Language
          </div>
          {LANGUAGES.map((item) => {
            const isSelected = item.code === lang;
            return (
              <button
                key={item.code}
                onClick={() => {
                  setLang(item.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-neutral-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div>
                  <span className="block text-white font-medium">{item.native}</span>
                  <span className="text-[10px] text-neutral-400">{item.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
