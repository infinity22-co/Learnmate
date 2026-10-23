import React from 'react';
import { useAuth } from '../../context/AuthContext.js';

interface NavbarProps {
  activeView: 'tutor' | 'assessment' | 'curriculum' | 'analytics';
  onNavigate: (view: 'tutor' | 'assessment' | 'curriculum' | 'analytics') => void;
  onOpenAuthModal: (adminMode?: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeView, onNavigate, onOpenAuthModal }) => {
  const { user, role } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Single text element Brand Wordmark */}
        <button
          onClick={() => onNavigate('tutor')}
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0 hover:text-cyan-300 transition-colors cursor-pointer"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
          <span className="font-sans font-bold">LearnMate AI</span>
        </button>

        {/* Zone 2: Single-Line Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
          <button
            onClick={() => onNavigate('tutor')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-100 ${
              activeView === 'tutor' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Aero Classroom
          </button>

          <button
            onClick={() => onNavigate('curriculum')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-100 ${
              activeView === 'curriculum' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Chapter Notes
          </button>

          <button
            onClick={() => onNavigate('assessment')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-100 ${
              activeView === 'assessment' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Visual Lab
          </button>

          {role === 'admin' ? (
            <button
              onClick={() => onNavigate('analytics')}
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-100 ${
                activeView === 'analytics' ? 'text-purple-400 font-semibold' : ''
              }`}
            >
              Admin Portal
            </button>
          ) : (
            <button
              onClick={() => onNavigate('analytics')}
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-100 ${
                activeView === 'analytics' ? 'text-cyan-400 font-semibold' : ''
              }`}
            >
              My Performance
            </button>
          )}
        </nav>

        {/* Zone 3: 1 Primary Action (Admin Portal Gate & User Profile) */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Admin Portal Gateway Button */}
          {role !== 'admin' ? (
            <button
              onClick={() => onOpenAuthModal(true)}
              className="px-3 py-1.5 text-xs font-semibold text-purple-300 bg-purple-950/40 hover:bg-purple-900/40 border border-purple-800/60 rounded-xl transition-colors whitespace-nowrap shrink-0"
              title="Admin Portal login (username: admin, password: admin)"
            >
              Admin Portal
            </button>
          ) : (
            <span className="px-2.5 py-1 text-xs font-mono font-bold text-purple-300 bg-purple-950/80 border border-purple-700/60 rounded-xl">
              Admin Mode
            </span>
          )}

          {/* Account Profile or Student Registration */}
          {user ? (
            <button
              onClick={() => onOpenAuthModal(false)}
              className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors whitespace-nowrap shrink-0 font-medium max-w-[140px] truncate"
            >
              {user.name}
            </button>
          ) : (
            <button
              onClick={() => onOpenAuthModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              Student Register
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
