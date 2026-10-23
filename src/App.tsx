import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar } from './components/layout/Navbar.js';
import { RobotTutorView } from './components/robot/RobotTutorView.js';
import { VisualAssessmentLab } from './components/assessment/VisualAssessmentLab.js';
import { CurriculumLibrary } from './components/curriculum/CurriculumLibrary.js';
import { AdminPortal } from './components/admin/AdminPortal.js';
import { AuthModal } from './components/auth/AuthModal.js';
import { OnboardingExamModal } from './components/onboarding/OnboardingExamModal.js';
import { SubjectType } from './types/index.js';
import { ShieldCheck, GraduationCap } from 'lucide-react';

function AppContent() {
  const { user, role, completeOnboarding } = useAuth();
  const [activeView, setActiveView] = useState<'tutor' | 'assessment' | 'curriculum' | 'analytics'>('tutor');
  const [selectedSubject, setSelectedSubject] = useState<SubjectType>('physics');
  const [selectedNoteId, setSelectedNoteId] = useState<string | undefined>(undefined);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalAdminMode, setAuthModalAdminMode] = useState(false);

  // Transition to Tutor grounded on a specific note
  const handleStudyWithRobot = (subject: SubjectType, noteId: string) => {
    setSelectedSubject(subject);
    setSelectedNoteId(noteId);
    setActiveView('tutor');
  };

  // Check if onboarding exam is mandatory for current student
  const showOnboardingExam = Boolean(
    user && user.role === 'student' && user.onboardingExamCompleted === false
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Navigation Top Bar */}
      <Navbar
        activeView={activeView}
        onNavigate={(view) => {
          if (view === 'analytics' && role !== 'admin') {
            // Require admin login to open admin portal
            setAuthModalAdminMode(true);
            setIsAuthModalOpen(true);
            return;
          }
          setActiveView(view);
        }}
        onOpenAuthModal={(adminMode = false) => {
          setAuthModalAdminMode(adminMode);
          setIsAuthModalOpen(true);
        }}
      />

      {/* Main Workspace Frame */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Active Session Status Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-900 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Signed in as</span>
            <span className="font-semibold text-slate-200">{user?.name || 'Guest Student'}</span>
            {user?.classGrade && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-cyan-300 font-medium flex items-center gap-1 font-mono">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {user.classGrade} ({user.stream})
                </span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span className="font-mono text-cyan-400 uppercase font-medium">{role} role</span>
            {role === 'admin' && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-purple-400 flex items-center gap-1 font-mono font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Admin Portal Unlocked
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span>Aero Engine: Online</span>
            <span aria-hidden="true">·</span>
            <span>Admin Materials Grounded</span>
          </div>
        </div>

        {/* Dynamic View Orchestration */}
        {activeView === 'tutor' && (
          <RobotTutorView
            initialSubject={selectedSubject}
            initialNoteId={selectedNoteId}
            onOpenNoteDetails={(noteId) => {
              setSelectedNoteId(noteId);
              setActiveView('curriculum');
            }}
          />
        )}

        {activeView === 'curriculum' && (
          <CurriculumLibrary onStudyWithRobot={handleStudyWithRobot} />
        )}

        {activeView === 'assessment' && <VisualAssessmentLab />}

        {/* Dedicated Admin Portal for uploading note photos and configuring classes/chapters */}
        {activeView === 'analytics' && <AdminPortal />}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/90 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">LearnMate AI</span>
            <span aria-hidden="true">·</span>
            <span>Eye & Mouth Interactive Robot Tutor · Attendance Tracking · Admin Note Photos</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 font-mono">
            <span>Admin Login: admin / admin</span>
            <span aria-hidden="true">·</span>
            <span>WCAG AA Accessible</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal (Student Login/Register or Admin Gate) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          if (role === 'admin') setActiveView('analytics');
        }}
        defaultAdminMode={authModalAdminMode}
      />

      {/* Mandatory Onboarding Visual Analysis Exam for First-Time Students */}
      <OnboardingExamModal
        isOpen={showOnboardingExam}
        onCompleted={async () => {
          await completeOnboarding(100);
          setActiveView('tutor');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
